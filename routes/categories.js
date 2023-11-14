"use strict";

/** Routes for categories. */

const jsonschema = require("jsonschema");
const express = require("express");
const axios = require("axios");
const API_URL = "https://app.ticketmaster.com/discovery/v2";
const { API_KEY } = require("../config");
// const { BadRequestError } = require("../expressError");
// const venueSearchSchema = require("../schemas/venueSearch.json");

const router = new express.Router();

/** GET /  =>
 *   { categories: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Authorization required: none
 */

// Route to get all venues
router.get("/", async function (req, res, next) {
  try {
    const searchTerm = req.query.term; // Get the 'term' query parameter from the URL

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
    const classifications = response.data._embedded.classifications;

    // Map the classification segments to get their IDs and names
    const classificationData = classifications
      .filter((classification) => classification.segment) // Filter out entries without 'segment'
      .map((classification) => {
        const segment = classification.segment;
        return {
          id: segment.id,
          name: segment.name,
        };
      });

    res.json({ classifications: classificationData });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
