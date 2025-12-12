import { createClient } from "../../lib/supabase/client";

export async function getEvents() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });   // sort by soonest date

  if (error) {
    throw new Error(error.message);
  }

  if (data && Array.isArray(data)) {
    return data.map((event) => {
      if (event.id) {
        const {
          data: { publicUrl: jpgUrl },
        } = supabase.storage
          .from("event-image")
          .getPublicUrl(`${event.id}.jpg`);

        const {
          data: { publicUrl: jpegUrl },
        } = supabase.storage
          .from("event-image")
          .getPublicUrl(`${event.id}.jpeg`);

        const imageUrl = jpegUrl || jpgUrl;

        return {
          ...event,
          imageUrl,
        };
      }
      return event;
    });
  }

  return data;
}
