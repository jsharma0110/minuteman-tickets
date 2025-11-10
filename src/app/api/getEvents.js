import { createClient } from "../../../lib/supabase/client";

export async function getEvents() {
  const supabase = createClient();
  const { data, error } = await supabase.from("events").select("*");
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
