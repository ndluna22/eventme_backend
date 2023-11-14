"use strict";

/** Routes for venues. */

const jsonschema = require("jsonschema");
const express = require("express");
const axios = require("axios");
const { BadRequestError } = require("../expressError");
// const venueSearchSchema = require("../schemas/venueSearch.json");

const API_URL = "https://app.ticketmaster.com/discovery/v2";
const { API_KEY } = require("../config");

const router = new express.Router();

/** GET /  =>
 *   { suggest: [ { id, name}, ...] }
 *
 *
 *
 * Authorization required: none
 */

//SUGGEST EVENTS

//GET suggestions
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

router.get("/", async function (req, res, next) {
  try {
    const response = await axios.get(`${API_URL}/events.json`, {
      params: {
        countryCode: "US",
        apikey: API_KEY,
        size: 100,
      },
    });

    if (
      !response.data ||
      !response.data._embedded ||
      !response.data._embedded.events
    ) {
      throw new Error("Invalid API response");
    }

    const events = response.data._embedded.events;

    const eventData = events.map((event) => {
      // Extract attraction names
      const attractionNames = event._embedded.attractions.map(
        (attraction) => attraction.name
      );
      const attractionIds = event._embedded.attractions.map(
        (attraction) => attraction.id
      );
      const attractionUrls = event._embedded.attractions.map((attraction) =>
        attraction.externalLinks && attraction.externalLinks.homepage
          ? attraction.externalLinks.homepage[0].url
          : null
      );
      const attractionImages = event._embedded.attractions.map(
        (attraction) => attraction.images[0].url
      );
      return {
        name: event.name,
        id: event.id,
        url: event.url,
        images: event.images[0].url,
        startDate: event.dates.start.localDate,
        startTime: event.dates.start.localTime,
        categoryId: event.classifications[0].segment.id,
        category: event.classifications[0].segment.name,
        artists: attractionNames, // Store attraction names as an array
        artistsIds: attractionIds,
        artistUrls: attractionUrls,
        artistImages: attractionImages,
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

    shuffleArray(eventData);
    res.json({ suggest: eventData });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
