"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Favorite {
  static async getUserFavorites(username) {
    const checkUser = await db.query(
      `SELECT username
       FROM users
       WHERE username = $1`,
      [username]
    );

    const user = checkUser.rows[0];
    if (!user) throw new NotFoundError(`No user: ${username}`);

    const result = await db.query(
      `SELECT artist_id, artist_name, artist_image, artist_url
       FROM favorites
       WHERE user_id = $1
       ORDER BY artist_id`,
      [username]
    );
    return result.rows;
  }

  static async addFavorite(username, artistId, data) {
    const checkUser = await db.query(
      `SELECT username
         FROM users
         WHERE username = $1`,
      [username]
    );

    const user = checkUser.rows[0];
    if (!user) throw new NotFoundError(`No user: ${username}`);
    // Check if the user has already favorited the artist
    const checkFavorite = await db.query(
      `SELECT id
   FROM favorites
   WHERE user_id = $1 AND artist_id = $2`,
      [user.username, artistId]
    );

    if (checkFavorite.rows.length > 0) {
      // User has already favorited this artist, handle accordingly
      return { alreadyFavorited: true };
    }
    const query = `
    INSERT INTO favorites (user_id, artist_id, artist_name, artist_image, artist_url)
    VALUES ($1, $2, $3, $4, $5)
  `;

    const values = [
      user.username,
      artistId,
      data.artist_name,
      data.artist_image,
      data.artist_url,
    ];

    try {
      await db.query(query, values);
    } catch (error) {
      throw new NotFoundError("Error adding favorite artist");
    }
  }

  static async deleteFavorite(username, artistId) {
    const checkUser = await db.query(
      `SELECT username
       FROM users
       WHERE username = $1`,
      [username]
    );

    const user = checkUser.rows[0];
    if (!user) throw new NotFoundError(`No user :${username}`);

    const query = `
      DELETE FROM favorites
      WHERE user_id = $1 AND artist_id = $2
    `;

    const values = [user.username, artistId];

    try {
      await db.query(query, values);
      return { deleted: true };
    } catch (error) {
      throw new NotFoundError("Error removing favorite artist");
    }
  }
}
module.exports = Favorite;
