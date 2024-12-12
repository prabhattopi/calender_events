/* eslint-disable react/prop-types */
const EventTable = ({ events }) => {
  return (
    <div className="table-container">
      <table className="responsive-table">
        <thead>
          <tr>
            <th>Event Name</th>
            <th>Start Date & Time</th>
            <th>End Date & Time</th>
          </tr>
        </thead>
        <tbody>
          {events?.map((event, index) => (
            <tr
              key={event._id}
              className={index % 2 === 0 ? "even-row" : "odd-row"}
            >
              <td data-tooltip={event.title}>{event.title}</td>
              <td>
                {new Date(`${event.startDate}T${event.startTime}`).toLocaleString()}
              </td>
              <td>
                {new Date(`${event.endDate}T${event.endTime}`).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EventTable;

