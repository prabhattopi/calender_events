/* eslint-disable react/prop-types */
import { useState } from "react";
import "./EventForm.css"; // External CSS for styling

const EventForm = ({ onSubmit, onClose, loading }) => {
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const validationErrors = {};
    if (!eventName.trim()) validationErrors.eventName = "Event name is required";
    if (!eventDate) validationErrors.eventDate = "Event date is required";
    if (!eventTime) validationErrors.eventTime = "Event time is required";

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return; // Stop submission if validation fails
    onSubmit({ eventName, eventDate, eventTime });
  };

  return (
    <div className="modern-overlay">
      <div className="modern-popup">
        <button className="modern-close-btn" onClick={onClose}>
          ×
        </button>
        <h2>Create Event</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="eventName">Event Name</label>
            <input
              id="eventName"
              type="text"
              placeholder="Enter event name"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />
            {errors.eventName && <p className="error-text">{errors.eventName}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="eventDate">Event Date</label>
            <input
              id="eventDate"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
            {errors.eventDate && <p className="error-text">{errors.eventDate}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="eventTime">Event Time</label>
            <input
              id="eventTime"
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
            />
            {errors.eventTime && <p className="error-text">{errors.eventTime}</p>}
          </div>
          <button type="submit" className="modern-submit-btn">
            {loading ? "Processing..." : "Create Event"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
