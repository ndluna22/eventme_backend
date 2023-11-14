"use strict";

/** Shared config for application; can be required many places. */

require("dotenv").config();
require("colors");

const SECRET_KEY = process.env.SECRET_KEY || "secret-dev";
const API_KEY = process.env.API_KEY || "ZfzFxryl6jaIL6U2T4IKqseWjEDtVwC2";

const PORT = +process.env.PORT || 3001;

// function getDatabaseUri() {
//   return process.env.NODE_ENV === "test"
//     ? "psql:///event_test"
//     : process.env.DATABASE_URL || "psql:///event_app";
// }

//connects to database
function getDatabaseUri() {
  return process.env.NODE_ENV === "test"
    ? "event_test"
    : process.env.DATABASE_URL || "event_app";
}

// Speed up bcrypt during tests, since the algorithm safety isn't being tested
//
// WJB: Evaluate in 2021 if this should be increased to 13 for non-test use
const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 12;

console.log("event_app Config:".green);
console.log("SECRET_KEY:".yellow, SECRET_KEY);
console.log("PORT:".yellow, PORT.toString());
console.log("BCRYPT_WORK_FACTOR".yellow, BCRYPT_WORK_FACTOR);
console.log("Database:".yellow, getDatabaseUri());
console.log("---");

module.exports = {
  SECRET_KEY,
  PORT,
  BCRYPT_WORK_FACTOR,
  getDatabaseUri,
  SECRET_KEY,
  API_KEY,
};
