"use strict";

/** Routes for venues. */

const jsonschema = require("jsonschema");
const express = require("express");
const axios = require("axios");
// const { BadRequestError } = require("../expressError");
// const venueSearchSchema = require("../schemas/venueSearch.json");

const API_URL = "https://app.ticketmaster.com/discovery/v2";
const { API_KEY } = require("../config");
const router = new express.Router();

/** GET /  =>
 *   { venues: [ { id, name, images, address, city, state, country}, ...] }
 *

 * Authorization required: none
 */

// Route to get all venues
router.get("/", async (req, res, next) => {
  try {
    const searchTerm = req.query.term; // Get the 'term' query parameter from the URL

    const response = await axios.get(`${API_URL}/venues.json`, {
      params: {
        countryCode: "US",
        apikey: API_KEY,
        size: 200,
      },
    });

    if (!response.data) {
      throw new Error("Invalid API response");
    }

    let venues = Array.isArray(response.data)
      ? response.data
      : response.data._embedded?.venues || [];

    // Filter venues that contain the search term in their names
    if (searchTerm) {
      venues = venues.filter((venue) =>
        venue.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (venues.length === 0) {
      return res.json({
        message: "No venues found for the provided search term.",
      });
    }

    const venueData = venues.map((venue) => {
      return {
        name: venue.name,
        id: venue.id,
        images:
          venue.images && venue.images.length > 0 ? venue.images[0].url : null,
        address: venue.address ? venue.address.line1 : null,
        city: venue.city ? venue.city.name : null,
        state: venue.state ? venue.state.name : null,
        country: venue.country ? venue.country.name : null,
        zipCode: venue.postalCode,
        longitude: venue.location ? venue.location.longitude : null,
        latitude: venue.location ? venue.location.latitude : null,
        // Add other attributes you need here
      };
    });

    res.json({ venues: venueData });
  } catch (error) {
    next(error);
  }
});

//GET VENUE BY ID

router.get("/:id", async function (req, res, next) {
  try {
    const id = req.params.id; // Get the 'id' parameter from the URL

    const response = await axios.get(`${API_URL}/venues/${id}.json`, {
      params: {
        apikey: API_KEY,
        size: 100,
      },
    });

    if (response.status !== 200) {
      return res.status(response.status).json({ error: "API request failed" });
    }

    if (!response.data || !response.data.name) {
      return res.status(404).json({ error: "Venue not found" });
    }

    const venue = response.data;

    let venueData = {
      name: venue.name,
      id: venue.id,
      address: venue.address.line1,
      city: venue.city.name,
      state: venue.state.name,
      country: venue.country.name,
      zipCode: venue.postalCode,
      longitude: venue.location.longitude,
      latitude: venue.location.latitude,
      // Add more venue attributes here
    };

    // Check if images is defined and has at least one image
    if (venue.images && venue.images.length > 0) {
      // Use the first image's URL
      venueData.images = venue.images[0].url;
    }

    return res.json({ venue: venueData });
  } catch (err) {
    return next(err);
  }
});
//Search

module.exports = router;
