import React from "react";
import { getEvents } from "../api/getEvents";
export default async function GET_EVENTS() {
  const events = await getEvents();
  console.log(events);
  return (
    <div>
      {events.map((event) => (
        <div key={event.id}>
          <h1>{event.name}</h1>
          <h1>@ {event.location}</h1>
          <p>{event.amount}</p>
          <p> {event.date}</p>
          <p> {event.time}</p>
        </div>
      ))}
    </div>
  );
}
