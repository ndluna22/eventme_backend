"use strict";

/** Routes for events. */

const jsonschema = require("jsonschema");
const express = require("express");
const axios = require("axios");
const { BadRequestError } = require("../expressError");

// const venueSearchSchema = require("../schemas/venueSearch.json");
const API_URL = "https://app.ticketmaster.com/discovery/v2";
const { API_KEY } = require("../config");
const router = new express.Router();

const MAX_REQUESTS = 1000;
const RATE_LIMIT_RESET_TIME = 1453180594367;
const REQUESTS_PER_SECOND = 5;

let remainingRequests = MAX_REQUESTS;
let lastRequestTime = Date.now();

async function fetchEventsPage(page, artistId = null) {
  try {
    // Check if you have remaining requests
    if (remainingRequests <= 0) {
      // Implement logic to wait until the rate limit resets
      const currentTime = Date.now();
      const timeDiff = RATE_LIMIT_RESET_TIME - currentTime;
      await new Promise((resolve) => setTimeout(resolve, timeDiff));

      // Reset the remaining requests and update the last request time
      remainingRequests = MAX_REQUESTS;
      lastRequestTime = Date.now();
    }

    // Make the API request
    const params = {
      countryCode: "US",
      apikey: API_KEY,
      size: 200,
      page: page,
      attractionId: artistId,
    };

    const response = await axios.get(`${API_URL}/events.json`, { params });

    // Update last request time based on the API response
    lastRequestTime = Date.now();

    // Update remaining requests based on the API response
    remainingRequests = parseInt(response.headers["rate-limit-available"]);

    const embedded = response.data._embedded;

    if (!embedded || !embedded.events) {
      console.error("Invalid API response:", response.data);
      throw new Error("Invalid API response");
    }

    return embedded.events;
  } catch (err) {
    throw err;
  }
}

async function fetchAllEvents(artistId = null, desiredItemCount = 1000) {
  try {
    let allEvents = [];
    let currentPage = 0;

    while (allEvents.length < desiredItemCount && currentPage < 5) {
      const eventsPage = await fetchEventsPage(currentPage, artistId);

      if (eventsPage.length === 0) {
        break; // No more events
      }

      // Filter events that have the specified artistId if provided
      const artistEvents = artistId
        ? eventsPage.filter((event) =>
            event._embedded.attractions.some(
              (attraction) => attraction.id === artistId
            )
          )
        : eventsPage;

      allEvents = allEvents.concat(artistEvents);
      currentPage++;
    }

    return allEvents.slice(0, desiredItemCount); // Return only the desired number of items
  } catch (err) {
    throw err;
  }
}

async function checkRateLimit(req, res, next) {
  try {
    // Check if you have remaining requests
    if (remainingRequests <= 0) {
      // Implement logic to wait until the rate limit resets
      const currentTime = Date.now();
      const timeDiff = RATE_LIMIT_RESET_TIME - currentTime;
      await new Promise((resolve) => setTimeout(resolve, timeDiff));

      // Reset the remaining requests and update the last request time
      remainingRequests = MAX_REQUESTS;
      lastRequestTime = Date.now();
    }

    // Continue to the next middleware or route handler
    next();
  } catch (err) {
    next(err);
  }
}
/** GET /  =>
 *   { events: [ { id, name, url}, ...] }
 *

 *
 * Authorization required: none
 */

router.get("/", checkRateLimit, async (req, res, next) => {
  try {
    const searchTerm = req.query.term; // Get the 'term' query parameter from the URL
    const desiredItemCount = 500; // Set the desired number of items

    // Fetch all events, including pagination
    const events = await fetchAllEvents(null, desiredItemCount);

    // Filter events based on the search term
    const filteredEvents = searchTerm
      ? events.filter((event) =>
          event.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : events;

    if (filteredEvents.length === 0) {
      return res.json({
        message: "No events found for the provided search term.",
      });
    }

    const eventData = filteredEvents.map((event) => {
      return {
        name: event.name,
        id: event.id,
        url: event.url,
        images:
          event.images && event.images.length > 0 ? event.images[0].url : null,
        startDate:
          event.dates && event.dates.start ? event.dates.start.localDate : null,
        startTime:
          event.dates && event.dates.start ? event.dates.start.localTime : null,
        categoryId: event.classifications
          ? event.classifications[0]?.segment?.id
          : null,
        category: event.classifications
          ? event.classifications[0]?.segment?.name
          : null,
        genreId: event.classifications
          ? event.classifications[0]?.genre?.id
          : null,
        genre: event.classifications
          ? event.classifications[0]?.genre?.name
          : null,
        artistId: event.attractions ? event.attractions[0]?.id : null,
        artistName: event.attractions ? event.attractions[0]?.name : null,
        artistUrl: event.attractions ? event.attractions[0]?.id : null,
        artistImage: event.attractions
          ? event.attractions[0]?.images[0]?.url
          : null,
        venueName: event._embedded.venues
          ? event._embedded.venues[0].name
          : null,
        venueId: event._embedded.venues ? event._embedded.venues[0].id : null,
        address: event._embedded.venues
          ? event._embedded.venues[0].address?.line1
          : null,
        city: event._embedded.venues
          ? event._embedded.venues[0].city?.name
          : null,
        state: event._embedded.venues
          ? event._embedded.venues[0].state?.name
          : null,
        country: event._embedded.venues
          ? event._embedded.venues[0].country?.name
          : null,
        zipCode: event._embedded.venues
          ? event._embedded.venues[0].postalCode
          : null,
        // Add other attributes you need here
      };
    });

    res.json({ events: eventData });
  } catch (error) {
    next(error);
  }
});

/** GET /  =>  BY ID
 *   { events: [ { id, name, genre, venueId, venueName }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/:id", checkRateLimit, async function (req, res, next) {
  try {
    const id = req.params.id; // Get the 'id' parameter from the URL

    // const response = await axios.get(`${API_URL}/events/${id}.json`, {
    //   params: {
    //     apikey: API_KEY,
    //     size: 200,
    //   },
    // });

    // if (response.status !== 200) {
    //   return res.status(response.status).json({ error: "API request failed" });
    // }

    // if (!response.data || !response.data.name) {
    //   return res.status(404).json({ error: "Event not found" });
    // }

    // const event = response.data;
    const events = await fetchAllEvents(null, 1000);

    // Assuming you want the first event in the array
    const event = events[0];

    const eventData = {}; // Initialize an empty object to store event data

    // Extract event data
    eventData.name = event.name;
    eventData.id = event.id;

    // Extract event data
    eventData.name = event.name;
    eventData.id = event.id;
    eventData.images = event.images[0].url;
    eventData.startDate = event.dates.start.localDate;
    eventData.startTime = event.dates.start.localTime;
    eventData.categoryId = event.classifications[0].segment.id;
    eventData.category = event.classifications[0].segment.name;
    eventData.genreId = event.classifications[0].genre.id;
    eventData.genre = event.classifications[0].genre.name;

    // Extract artist data
    //In the frontend, when you search by event id, to get the artist info ,you use event.artists for example
    if (event._embedded.attractions && event._embedded.attractions.length > 0) {
      eventData.artists = event._embedded.attractions.map((attraction) => ({
        name: attraction.name,
        id: attraction.id,
        images: attraction.images[0].url,
        // add more properties as needed
      }));
    }

    // Extract venue and location data
    if (event._embedded.venues && event._embedded.venues.length > 0) {
      const venue = event._embedded.venues[0];
      eventData.venueName = venue.name;
      eventData.venueId = venue.id;
      eventData.address = venue.address.line1;
      eventData.city = venue.city.name;
      eventData.state = venue.state.name;
      eventData.country = venue.country.name;
      eventData.zipCode = venue.postalCode;
    }

    // Add more venue attributes here

    return res.json({ event: eventData });
  } catch (err) {
    return next(err);
  }
});

//GET EVENTS BY ARTIST ID

router.get(
  "/events-by-artist/:artistId",
  checkRateLimit,
  async function (req, res, next) {
    try {
      const artistId = req.params.artistId; // Get the 'venueId' parameter from the URL

      const events = await fetchAllEvents(null, 5000); // Pass artistId if needed
      res.header("Cache-Control", "no-store");
      // Filter events that have the artist with the specified artistId
      const artistEvents = events.filter((event) =>
        event._embedded.attractions.some(
          (attraction) => attraction.id === artistId
        )
      );

      const eventData = artistEvents.map((event) => {
        return {
          name: event.name,
          id: event.id,
          url: event.url,
          images: event.images[0].url,
          startDate: event.dates.start.localDate,
          startTime: event.dates.start.localTime,
          categoryId: event.classifications[0].segment.id,
          category: event.classifications[0].segment.name,
          genreId: event.classifications[0].genre.id,
          genre: event.classifications[0].genre.name,
          venueName: event._embedded.venues[0].name,
          venueId: event._embedded.venues[0].id,
          address: event._embedded.venues[0].address.line1,
          city: event._embedded.venues[0].city.name,
          state: event._embedded.venues[0].state.name,
          country: event._embedded.venues[0].country.name,
          zipCode: event._embedded.venues[0].postalCode,
        };
      });
      if (eventData.length === 0) {
        // No events were found for the artist
        res.json({ message: "No events found for this artist." });
      } else {
        // Events were found, send the eventData
        res.json({ events: eventData });
      }
    } catch (err) {
      return next(err);
    }
  }
);

//GET EVENTS BY VENUE ID

router.get(
  "/events-by-venue/:venueId",
  checkRateLimit,
  async function (req, res, next) {
    try {
      const venueId = req.params.venueId; // Get the 'venueId' parameter from the URL

      const events = await fetchAllEvents(null, 1000); // Pass artistId if needed

      // Filter events that have the venue with the specified venueId
      const venueEvents = events.filter((event) =>
        event._embedded.venues.some((venue) => venue.id === venueId)
      );

      const eventData = venueEvents.map((event) => {
        return {
          name: event.name,
          id: event.id,
          url: event.url,
          images: event.images[0].url,
          startDate: event.dates.start.localDate,
          startTime: event.dates.start.localTime,
          categoryId: event.classifications[0].segment.id,
          category: event.classifications[0].segment.name,
          genreId: event.classifications[0].genre.id,
          genre: event.classifications[0].genre.name,
          venueName: event._embedded.venues[0].name,
          venueId: event._embedded.venues[0].id,
          address: event._embedded.venues[0].address.line1,
          city: event._embedded.venues[0].city.name,
          state: event._embedded.venues[0].state.name,
          country: event._embedded.venues[0].country.name,
          zipCode: event._embedded.venues[0].postalCode,
        };
      });

      res.json({ events: eventData });
    } catch (err) {
      return next(err);
    }
  }
);

//GET EVENTS BY VENUE ID
router.get(
  "/events-by-category/:categoryName",
  checkRateLimit, // Apply rate limit check
  async function (req, res, next) {
    try {
      const categoryNameParam = req.params.categoryName;
      const events = await fetchAllEvents(null, 1000); // Pass artistId if needed

      // Filter events that have the specified category name
      const categoryEvents = events.filter((event) =>
        event.classifications.some(
          (classification) => classification.segment.name === categoryNameParam
        )
      );

      const eventData = categoryEvents.map((event) => {
        return {
          name: event.name,
          id: event.id,
          url: event.url,
          images: event.images[0].url,
          startDate: event.dates.start.localDate,
          startTime: event.dates.start.localTime,
          categoryId: event.classifications[0].segment.id,
          category: event.classifications[0].segment.name,
          genreId: event.classifications[0].genre.id,
          genre: event.classifications[0].genre.name,
          venueName: event._embedded.venues[0].name,
          venueId: event._embedded.venues[0].id,
          address: event._embedded.venues[0].address.line1,
          city: event._embedded.venues[0].city.name,
          state: event._embedded.venues[0].state.name,
          country: event._embedded.venues[0].country.name,
          zipCode: event._embedded.venues[0].postalCode,
        };
      });

      res.json({ events: eventData });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
