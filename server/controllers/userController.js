import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";


// API Controller Function to Get User Bookings
export const getUserBookings = async (req, res) => {
    try {
        const user = req.auth().userId;

        const bookings = await Booking.find({user}).populate({
            path: "show",
            populate: {path: "movie"}
        }).sort({ createdAt: -1 })
        res.json({success: true, bookings})
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}

// API Controller Function to Update Favorite Movie in Clerk User Matadata
export const updateFavourite = async (req, res) => {
  try {
    const { movieId } = req.body
    const userId = req.auth().userId

    if (!movieId || typeof movieId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid movieId"
      })
    }

    // Get user from Clerk
    const user = await clerkClient.users.getUser(userId)

    const favourites = Array.isArray(user.privateMetadata.favourites)
      ? user.privateMetadata.favourites
      : []

    let updatedFavourites

    if (favourites.includes(movieId)) {
      updatedFavourites = favourites.filter(id => id !== movieId)
    } else {
      updatedFavourites = [...favourites, movieId]
    }

    // Update Clerk metadata
    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: {
        ...user.privateMetadata,
        favourites: updatedFavourites
      }
    })

    res.json({
      success: true,
      message: favourites.includes(movieId)
        ? "Removed from favourites"
        : "Added to favourites"
    })

  } catch (error) {
    console.error(error)
    res.json({ success: false, message: "Server error" })
  }
}

export const getFavourites = async (req, res) => {
  try {
    const user = await clerkClient.users.getUser(req.auth().userId)

    const favourites = Array.isArray(user.privateMetadata.favourites)
      ? user.privateMetadata.favourites
      : []

    // Get movies from database
    const movies = await Movie.find({_id: { $in: favourites }})
    res.json({ success: true, movies })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: error.message })
  }
}
