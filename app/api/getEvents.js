import { createClient } from "../../lib/supabase/client";

export async function getEvents() {
  const supabase = createClient();
  const { data, error } = await supabase.from("events").select("*");
  if (error) {
    throw new Error(error.message);
  }

  // Construct Supabase storage URLs for each event
  // Pattern: {event-id}.jpg from bucket "event-image"
  if (data && Array.isArray(data)) {
    return data.map((event) => {
      if (event.id) {
        // Try .jpg first, then .jpeg as fallback
        const { data: { publicUrl: jpgUrl } } = supabase.storage
          .from("event-image")
          .getPublicUrl(`${event.id}.jpg`);
        
        const { data: { publicUrl: jpegUrl } } = supabase.storage
          .from("event-image")
          .getPublicUrl(`${event.id}.jpeg`);
        
        // Use .jpeg if it exists, otherwise try .jpg
        // Note: We'll use .jpeg as default since that's what you uploaded
        const imageUrl = jpegUrl || jpgUrl;
        
        return {
          ...event,
          imageUrl: imageUrl,
        };
      }
      return event;
    });
  }

  return data;
}