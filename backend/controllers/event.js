const { google } = require("googleapis");
const Event = require("../models/Events");
const User = require("../models/Users");
const { createOAuthClient, ensureValidDateTime } = require("../utils");
const Mapping = require("../models/Mappings");
exports.googleCalendarWebhook = async (req, res) => {
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

    const oauth2Client = createOAuthClient(user.accessToken);
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

    const bulkUpdates = googleEvents
      .filter((event) => dbEventIds.has(event.id))
      .map((event) => ({
        updateOne: {
          filter: { eventId: event.id },
          update: {
            $set: {
              title: event.summary,
              startDate: (event.start.dateTime || event.start.date).split(
                "T"
              )[0],
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

    const eventsToDelete = [...dbEventIds].filter(
      (id) => !googleEventIds.has(id)
    );
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
};

exports.createEvent = async (req, res) => {
  const { userId, eventName, eventDate, eventTime } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const mapping = await Mapping.findOne({
      userId: user._id,
      is_active: true,
    });

    const oauth2Client = createOAuthClient(user.accessToken);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const startDateTime = ensureValidDateTime(eventDate, eventTime);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    const event = {
      summary: eventName,
      start: { dateTime: startDateTime.toISOString() },
      end: { dateTime: endDateTime.toISOString() },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    const newEvent = {
      userId,
      mappingId:mapping._id,
      eventId: response.data.id,
      title: eventName,
      startDate: eventDate,
      startTime: eventTime,
      endDate: eventDate,
      endTime: endDateTime.toISOString().split("T")[1].slice(0, 5),
    };

    await Event.create(newEvent);

    res
      .status(200)
      .json({ message: "Event created successfully", event: newEvent });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Error creating event", error });
  }
};

exports.fetchEvents = async (req, res) => {
  const { userId } = req.body;

  try {
    const events = await Event.find({ userId, delete: false }).sort({
      startDate: -1,
      startTime: -1,
    });
    res.status(200).json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Failed to fetch events", error });
  }
};
