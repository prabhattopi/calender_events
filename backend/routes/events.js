const express = require("express");
const { google } = require("googleapis");
const router = express.Router();
const Event = require("../models/Events");
const User = require('../models/Users');





/**
 * Webhook endpoint to handle notifications from Google Calendar.
 */
router.post("/google-calendar-webhook", async (req, res) => {
  const resourceState = req.headers["x-goog-resource-state"];
  const channelId = req.headers["x-goog-channel-id"];

  if (resourceState === "sync") {
    return res.status(200).send();
  }

  try {
    const userId = channelId.split("-")[1];
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: user.accessToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const eventsResponse = await calendar.events.list({
      calendarId: "primary",
      singleEvents: true,
      orderBy: "startTime",
    });

    const googleEvents = eventsResponse.data.items || [];
    const googleEventIds = new Set(googleEvents.map((event) => event.id));

    const dbEvents = await Event.find({ userId, delete: false });
    const dbEventIds = new Set(dbEvents.map((event) => event.eventId));

    // Bulk update for matching events
    const bulkUpdates = googleEvents
      .filter((event) => dbEventIds.has(event.id))
      .map((event) => ({
        updateOne: {
          filter: { eventId: event.id },
          update: {
            $set: {
              title: event.summary,
              startDate: (event.start.dateTime || event.start.date).split("T")[0],
              startTime: event.start.dateTime
                ? event.start.dateTime.split("T")[1].slice(0, 5)
                : null,
              endDate: (event.end.dateTime || event.end.date).split("T")[0],
              endTime: event.end.dateTime
                ? event.end.dateTime.split("T")[1].slice(0, 5)
                : null,
            },
          },
        },
      }));

    if (bulkUpdates.length) {
      await Event.bulkWrite(bulkUpdates);
    }

    // Mark events as deleted if not in Google Calendar
    const eventsToDelete = [...dbEventIds].filter((id) => !googleEventIds.has(id));
    if (eventsToDelete.length) {
      await Event.updateMany(
        { eventId: { $in: eventsToDelete } },
        { $set: { delete: true } }
      );
    }

    console.log(`Database synchronized with ${googleEvents.length} events.`);
    res.status(200).send();
  } catch (error) {
    console.error("Error handling webhook notification:", error);
    res.status(500).send("Error processing notification");
  }
});


/**
 * Creates a new event in Google Calendar and saves the event details in the database.
 *
 * @param {Object} req - The request object containing the event details.
 * @param {string} req.body.userId - The ID of the user creating the event.
 * @param {string} req.body.eventName - The name of the event.
 * @param {string} req.body.eventDate - The date of the event in YYYY-MM-DD format.
 * @param {string} req.body.eventTime - The start time of the event in HH:mm format.
 * @param {Object} res - The response object to send back the result.
 *
 * @returns {Promise<void>} Resolves with a JSON response indicating success or failure.
 *
 * @throws Will throw an error if the user is not found, if the date or time format is invalid,
 * or if there is an error creating the event in Google Calendar or saving it to the database.
 */
router.post("/create-event", async (req, res) => {
  const { userId, eventName, eventDate, eventTime } = req.body;

  try {
    const tokenDoc = await User.findById(userId);
    if (!tokenDoc) return res.status(404).json({ message: "User not found" });

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: tokenDoc.accessToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Ensure proper time formatting
    const startDateTime = new Date(`${eventDate}T${eventTime}`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Add 1 hour to the start time

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return res.status(400).json({ message: "Invalid date or time format" });
    }

    const event = {
      summary: eventName,
      start: {
        dateTime: startDateTime.toISOString(),
      },
      end: {
        dateTime: endDateTime.toISOString(),
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    // Save event details in the database
    const newEvent = {
      userId,
      eventId: response.data.id, // Use Google Calendar's event ID
      title: eventName,
      startDate: eventDate,
      startTime: eventTime,
      endDate: eventDate,
      endTime: endDateTime.toISOString().split("T")[1].slice(0, 5), // Extract HH:mm format
    };

    await Event.create(newEvent); // Save event to your database

    res.status(200).json({ message: "Event created successfully", event: newEvent });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Error creating event", error });
  }
});

/**
 * Fetches events for a specific user from both Google Calendar and the database.
 * Updates the database with any changes made in Google Calendar.
 * Marks events in the database as deleted if they are not present in Google Calendar.
 *
 * @param {Object} req - The request object containing the user's ID.
 * @param {string} req.body.userId - The ID of the user for whom events are to be fetched.
 * @param {Object} res - The response object to send back the fetched events.
 *
 * @returns {Promise<void>} Resolves with a JSON response containing the fetched events.
 *
 * @throws Will throw an error if the user is not found or if there is an error fetching events.
 */


router.post("/fetch-events", async (req, res) => {
  const { userId } = req.body;

  try {
    const events = await Event.find({ userId, delete:false}).sort({
      startDate: -1,
      startTime: -1,
    });
    res.status(200).json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Failed to fetch events", error });
  }
});

module.exports = router;
