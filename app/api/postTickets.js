import { createClient } from "../../lib/supabase/client";

/**
 * Posts a ticket listing to the Supabase tickets table
 * @param {Object} ticketData - The ticket data to insert
 * @param {string} ticketData.event_id - The event ID
 * @param {string} ticketData.section - The section
 * @param {string|null} ticketData.row - The row (optional)
 * @param {string} ticketData.seat - The seat number
 * @param {string|number} ticketData.price - The price per ticket
 * @param {number} ticketData.quantity - Number of tickets to create (default: 1)
 * @returns {Promise<Array>} Array of inserted ticket objects
 */
export async function postTickets(ticketData) {
  const supabase = createClient();
  
  // Get the current user for seller_id
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  const { event_id, section, row, seat, price, quantity = 1 } = ticketData;

  // Validate required fields
  if (!event_id || !section || !seat || !price) {
    throw new Error("Missing required fields: event_id, section, seat, and price are required");
  }

  // Prepare ticket data
  const baseTicket = {
    event_id,
    seller_id: user.id,
    section,
    row: row || null,
    seat,
    price: price.toString(), // Ensure price is a string
    status: "available",
  };

  // If quantity > 1, create multiple tickets
  // Note: For multiple tickets, we'll increment the seat number
  const ticketsToInsert = [];
  const seatNumber = parseInt(seat);
  const isSeatNumeric = !isNaN(seatNumber);

  for (let i = 0; i < quantity; i++) {
    const ticket = {
      ...baseTicket,
      seat: isSeatNumeric ? (seatNumber + i).toString() : seat,
    };
    ticketsToInsert.push(ticket);
  }

  // Insert tickets into the database
  const { data, error } = await supabase
    .from("tickets")
    .insert(ticketsToInsert)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

