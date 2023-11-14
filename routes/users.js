"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureCorrectUserOrAdmin, ensureAdmin } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const Review = require("../models/review");
const Favorite = require("../models/favorite");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();

/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: admin
 **/

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});

/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: admin
 **/

router.get("/", ensureAdmin, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin, jobs }
 *   where jobs is { id, title, companyHandle, companyName, state }
 *
 * Authorization required: admin or same user-as-:username
 **/

router.get(
  "/:username",
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const user = await User.get(req.params.username);
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  }
);

/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: admin or same-user-as-:username
 **/

router.patch(
  "/:username",
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, userUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      const user = await User.update(req.params.username, req.body);
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  }
);

/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: admin or same-user-as-:username
 **/

router.delete(
  "/:username",
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      await User.remove(req.params.username);
      return res.json({ deleted: req.params.username });
    } catch (err) {
      return next(err);
    }
  }
);

////REVIEWS////

/** POST /[username]/reviews/[id]  { state } => { application }
 *
 * Returns {"reviewed": artistId}
 *
 * Authorization required: admin or same-user-as-:username
 * */

//get reviews

router.post(
  "/:username/reviews/:artistId",
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const { username, artistId } = req.params;
      const data = req.body; // Assuming data is sent in the request body
      await Review.addReview(username, artistId, data);
      res.json({ message: "added: true, review: " });
    } catch (err) {
      return next(err);
    }
  }
);

//get all reviews

router.get(
  "/:username/reviews",
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const { username } = req.params;
      console.log("Fetching reviews for user:", username);

      const userReviews = await Review.getUserReviews(username);
      console.log("User reviews:", userReviews);

      res.json({ reviews: userReviews });
    } catch (err) {
      console.error("Error in reviews route:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//GET REVIEWS BY ARTIST ID

router.get("/reviews-by-artist/:artistId", async function (req, res, next) {
  try {
    const artistId = req.params.artistId;

    // Fetch reviews for the specified artistId
    const artistReviews = await Review.getReviewsByArtistId(artistId);

    if (artistReviews.length === 0) {
      res.json({ message: "No reviews found for this artist." });
    } else {
      res.json({ reviews: artistReviews });
    }
  } catch (err) {
    console.error("Error in reviews-by-artist route:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

//UPDATE REVIEWS

router.patch(
  "/:username/reviews/:reviewId",
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const { username, reviewId } = req.params;
      const data = req.body; // Assuming your data is in the request body

      const updatedReview = await Review.editReview(username, reviewId, data);

      res.json({
        review: updatedReview,
        message: "Review updated successfully",
      });
    } catch (err) {
      return next(err);
    }
  }
);
//delete reviews

router.delete(
  "/:username/reviews/:artistId",
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const { username, artistId } = req.params;
      await Review.deleteReview(username, artistId);
      res.json({ message: "Review removed successfully" });
    } catch (err) {
      return next(err);
    }
  }
);

////FAVORITES////

/** POST /[username]/favorites/[id]  { state } => { application }
 *
 * Returns {"favorites": artistId}
 *
 * Authorization required: admin or same-user-as-:username
 * */

router.post(
  "/:username/favorites/:artistId",
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const { username, artistId } = req.params;
      const data = req.body; // Assuming data is sent in the request body
      await Favorite.addFavorite(username, artistId, data);
      res.json({ message: "Favorite added successfully" });
    } catch (err) {
      return next(err);
    }
  }
);

//get all favorites

router.get(
  "/:username/favorites",
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const { username } = req.params;
      console.log("Fetching favorites for user:", username);

      const userFavorites = await Favorite.getUserFavorites(username);
      console.log("User favorites:", userFavorites);

      res.json({ favorites: userFavorites });
    } catch (err) {
      console.error("Error in favorites route:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//delete favorites

router.delete(
  "/:username/favorites/:artistId",
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const { username, artistId } = req.params;
      await Favorite.deleteFavorite(username, artistId);
      res.json({ message: "Favorite removed successfully" });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
