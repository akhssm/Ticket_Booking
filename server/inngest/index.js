import { Inngest } from "inngest";
import User from "../models/User.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie_ticket_booking" });

// Sync user creation from Clerk
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url,} = event.data;

    // Safety check
    if (!email_addresses || email_addresses.length === 0) {
      throw new Error("No email address found for user");
    }

    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
      image: image_url,
    };

    // Prevent duplicate users
    const existingUser = await User.findById(id);
    if (!existingUser) {
      await User.create(userData);
    }

    return { success: true };
  }
);

//Sync user deletion from Clerk
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { id } = event.data;

    await User.findByIdAndDelete(id);

    return { success: true };
  }
);

//Sync user updates from Clerk
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-with-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const {
      id,
      first_name,
      last_name,
      email_addresses,
      image_url,
    } = event.data;

    if (!email_addresses || email_addresses.length === 0) {
      throw new Error("No email address found for user");
    }

    const userData = {
      email: email_addresses[0].email_address,
      name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
      image: image_url,
    };

    await User.findByIdAndUpdate(id, userData, { new: true });

    return { success: true };
  }
);

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
];
