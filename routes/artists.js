"use strict";

/** Routes for artists. */

const jsonschema = require("jsonschema");
const express = require("express");
const axios = require("axios");

// const { BadRequestError } = require("../expressError");
// const Artists = require("../models/artist");

// const artistSearchSchema = require("../schemas/artistSearch.json");
const API_URL = "https://app.ticketmaster.com/discovery/v2";
const { API_KEY } = require("../config");
const router = new express.Router();

/** GET /  =>
 *   { artists: [ { id, name, images, categoryId, category, genreId, genre }, ...] }
 *
 *
 *
 *
 * Authorization required: none
 */

// GET => Route to get all artists
router.get("/", async (req, res, next) => {
  try {
    const searchTerm = req.query.term; // Get the 'term' query parameter from the URL
    const artistName = req.query.name; // Get the 'name' query parameter from the URL

    const response = await axios.get(`${API_URL}/attractions.json`, {
      params: {
        countryCode: "US",
        apikey: API_KEY,
        size: 200,
      },
    });

    if (!response.data) {
      throw new Error("Invalid API response");
    }

    let artists = Array.isArray(response.data)
      ? response.data
      : response.data._embedded?.attractions || [];

    // Filter artists that contain the search term in their names
    if (searchTerm) {
      artists = artists.filter((artist) =>
        artist.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter artists by name
    if (artistName) {
      artists = artists.filter(
        (artist) => artist.name.toLowerCase() === artistName.toLowerCase()
      );
    }

    if (artists.length === 0) {
      return res.json({
        message: "No artists found for the provided search term.",
      });
    }

    const artistData = artists.map((artist) => {
      return {
        name: artist.name,
        id: artist.id,
        images:
          artist.images && artist.images.length > 0
            ? artist.images[0].url
            : null,
        categoryId: artist.classifications
          ? artist.classifications[0]?.segment?.id
          : null,
        category: artist.classifications
          ? artist.classifications[0]?.segment?.name
          : null,
        genreId: artist.classifications
          ? artist.classifications[0]?.genre?.id
          : null,
        genre: artist.classifications
          ? artist.classifications[0]?.genre?.name
          : null,
        url: artist.externalLinks
          ? artist.externalLinks?.homepage?.[0]?.url || null
          : null,
        youtube: artist.externalLinks
          ? artist.externalLinks?.youtube?.[0]?.url || null
          : null,
        twitter: artist.externalLinks
          ? artist.externalLinks?.twitter?.[0]?.url || null
          : null,
        musicbrainz: artist.externalLinks
          ? artist.externalLinks?.musicbrainz?.[0]?.id || null
          : null,
        wiki: artist.externalLinks
          ? artist.externalLinks?.wiki?.[0]?.url || null
          : null,
        spotify: artist.externalLinks
          ? artist.externalLinks?.spotify?.[0]?.url || null
          : null,
        facebook: artist.externalLinks
          ? artist.externalLinks?.facebook?.[0]?.url || null
          : null,
        instagram: artist.externalLinks
          ? artist.externalLinks?.instagram?.[0]?.url || null
          : null,
        // Add other attributes you need here
      };
    });

    res.json({ artists: artistData });
  } catch (error) {
    next(error);
  }
});

//GET ARTIST BY ID

router.get("/:id", async function (req, res, next) {
  try {
    const id = req.params.id; // Get the 'id' parameter from the URL

    const response = await axios.get(`${API_URL}/attractions/${id}.json`, {
      params: {
        countryCode: "US",
        apikey: API_KEY,
        size: 100,
      },
    });

    if (response.status !== 200) {
      return res.status(response.status).json({ error: "API request failed" });
    }

    const artist = response.data; // Assuming the entire response is the artist object

    if (!artist || !artist.name) {
      return res.status(404).json({ error: "Artist not found" });
    }

    const artistData = {
      name: artist.name,
      id: artist.id,
      images: artist.images[1].url,
      url: artist.externalLinks?.homepage?.[0]?.url || null,
      categoryId: artist.classifications[0].segment.id,
      category: artist.classifications[0].segment.name,
      genreId: artist.classifications[0].genre.id,
      genre: artist.classifications[0].genre.name,
    };

    return res.json({ artist: artistData });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
