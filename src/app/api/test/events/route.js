// app/api/events/route.js
import { getEvents } from "../../getEvents";

export async function GET() {
  try {
    const data = await getEvents();
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
