"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Review {
  static async getUserReviews(username) {
    const checkUser = await db.query(
      `SELECT username
       FROM users
       WHERE username = $1`,
      [username]
    );

    const user = checkUser.rows[0];
    if (!user) throw new NotFoundError(`No user: ${username}`);

    const result = await db.query(
      `SELECT user_id, artist_id, comment, created_at
       FROM reviews
       WHERE user_id = $1
       ORDER BY created_At`,
      [username]
    );
    return result.rows;
  }

  static async getReviewsByArtistId(artistId) {
    const result = await db.query(
      `SELECT id, user_id, artist_id, comment, created_at 
       FROM reviews 
       WHERE artist_id = $1`,
      [artistId]
    );
    return result.rows;
  }

  static async addReview(username, artistId, data) {
    const checkUser = await db.query(
      `SELECT username
         FROM users
         WHERE username = $1`,
      [username]
    );

    const user = checkUser.rows[0];
    if (!user) throw new NotFoundError(`No user: ${username}`);
    // Check if the user has already reviewed the artist
    const checkReview = await db.query(
      `SELECT id
   FROM reviews
   WHERE user_id = $1 AND artist_id = $2`,
      [user.username, artistId]
    );

    if (checkReview.rows.length > 0) {
      // User has already reviewed this artist, handle accordingly
      return { alreadyReviewed: true };
    }

    const query = `
    INSERT INTO reviews (user_id, artist_id, comment,  created_at)
    VALUES ($1, $2, $3, $4)
  `;

    const values = [user.username, artistId, data.comment, data.created_at];

    try {
      await db.query(query, values);
    } catch (error) {
      throw new NotFoundError("Error adding review");
    }
  }

  static async deleteReview(username, artistId) {
    const checkUser = await db.query(
      `SELECT username
       FROM users
       WHERE username = $1`,
      [username]
    );

    const user = checkUser.rows[0];
    if (!user) throw new NotFoundError(`No user :${username}`);

    const query = `
      DELETE FROM reviews
      WHERE user_id = $1 AND artist_id = $2
    `;

    const values = [user.username, artistId];

    try {
      await db.query(query, values);
      return { deleted: true };
    } catch (error) {
      throw new NotFoundError("Error removing review");
    }
  }

  static async editReview(username, artist_id, data) {
    // check if user exists
    const checkUser = await db.query(
      `SELECT id, username
       FROM users
       WHERE username = $1`,
      [username]
    );
    const user = checkUser.rows[0];
    if (!user) throw new NotFoundError(`No username :${username}`);

    //  SET clause for the SQL query
    const { setCols, values } = sqlForPartialUpdate(data, {
      comment: "comment",
    });

    const querySql = `UPDATE reviews 
                      SET ${setCols} 
                      WHERE id = $1
                      RETURNING id,
                                user_id,
                                artist_id,
                                comment,
                                created_at`;
    const result = await db.query(querySql, [artist_id, ...values]);

    const review = result.rows[0];

    if (!review)
      throw new NotFoundError(`No review found for ReviewId: ${artist_id}`);

    return review;
  }
}
module.exports = Review;
