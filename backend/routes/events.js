const express = require("express");
const router = express.Router();
const {
  googleCalendarWebhook,
  createEvent,
  fetchEvents,
} = require("../controllers/event");

router.post("/google-calendar-webhook", googleCalendarWebhook);
router.post("/create-event", createEvent);
router.post("/fetch-events", fetchEvents);

module.exports = router;
