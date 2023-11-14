"use strict";

/** Express app for events. */

const express = require("express");
const cors = require("cors");

const { NotFoundError } = require("./expressError");

const { authenticateJWT } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const venuesRoutes = require("./routes/venues");
const usersRoutes = require("./routes/users");
const eventsRoutes = require("./routes/events");
const suggestRoutes = require("./routes/suggest");
const artistsRoutes = require("./routes/artists");
const categoryRoutes = require("./routes/categories");
const genreRoutes = require("./routes/genres");

const morgan = require("morgan");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));
app.use(authenticateJWT);

// app.use("/auth", authRoutes);
// app.use("/companies", companiesRoutes);
// app.use("/users", usersRoutes);
// app.use("/jobs", jobsRoutes);

app.use("/auth", authRoutes);
app.use("/venues", venuesRoutes);
app.use("/users", usersRoutes); //-->users/reviews --> users/favorites
app.use("/events", eventsRoutes);
app.use("/suggest", suggestRoutes);
app.use("/artists", artistsRoutes);
app.use("/categories", categoryRoutes);
app.use("/genres", genreRoutes);

/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
  return next(new NotFoundError());
});

/** Generic error handler; anything unhandled goes here. */
app.use(function (err, req, res, next) {
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  const status = err.status || 500;
  const message = err.message;

  return res.status(status).json({
    error: { message, status },
  });
});

module.exports = app;
