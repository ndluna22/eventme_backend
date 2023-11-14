"use strict";

/** Routes for genres. */

const jsonschema = require("jsonschema");
const express = require("express");
const axios = require("axios");
// const { BadRequestError } = require("../expressError");
// const venueSearchSchema = require("../schemas/venueSearch.json");

const API_URL = "https://app.ticketmaster.com/discovery/v2";
const { API_KEY } = require("../config");

const router = new express.Router();

/** GET /  =>
 *   { genres: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *

 * Authorization required: none
 */

// Route to get all genres
router.get("/", async function (req, res, next) {
  try {
    const response = await axios.get(`${API_URL}/classifications.json`, {
      params: {
        countryCode: "US",
        apikey: API_KEY,
      },
    });

    if (
      !response.data ||
      !response.data._embedded ||
      !Array.isArray(response.data._embedded.classifications)
    ) {
      throw new Error("Invalid API response");
    }

    // Access the classifications array
    const genres = response.data._embedded.classifications;

    // Map the classification segments to get their IDs and names
    const genreData = genres
      .map((genre) => {
        const segment = genre.segment;
        if (segment && segment._embedded && segment._embedded.genres) {
          const genres = segment._embedded.genres;
          const genreData = genres.map((genre) => {
            return {
              id: genre.id,
              name: genre.name,
            };
          });
          return genreData;
        }
        return null;
      })
      .filter((data) => data !== null); // Filter out entries without genres

    res.json({ genres: genreData });
  } catch (err) {
    return next(err);
  }
});

//Search

module.exports = router;
