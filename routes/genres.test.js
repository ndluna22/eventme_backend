"use strict";

const request = require("supertest");

const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testGenreIds,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** GET /genres */

describe("GET /genres", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get(`/genres`);
    expect(resp.body).toEqual({
      genres: [
        {
          id: expect.any(Number),
          title: "J1",
          salary: 1,
          equity: "0.1",
          companyHandle: "c1",
          companyName: "C1",
        },
        {
          id: expect.any(Number),
          title: "J2",
          salary: 2,
          equity: "0.2",
          companyHandle: "c1",
          companyName: "C1",
        },
        {
          id: expect.any(Number),
          title: "J3",
          salary: 3,
          equity: null,
          companyHandle: "c1",
          companyName: "C1",
        },
      ],
    });
  });

  test("bad request on invalid filter key", async function () {
    const resp = await request(app)
      .get(`/genres`)
      .query({ minSalary: 2, nope: "nope" });
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /genres/:id */

describe("GET /genres/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/genres/${testGenreIds[0]}`);
    expect(resp.body).toEqual({
      genre: {
        id: testGenreIds[0],
        title: "J1",
        salary: 1,
        equity: "0.1",
        company: {
          handle: "c1",
          name: "C1",
          description: "Desc1",
          numEmployees: 1,
          logoUrl: "http://c1.img",
        },
      },
    });
  });

  test("not found for no such genre", async function () {
    const resp = await request(app).get(`/genres/0`);
    expect(resp.statusCode).toEqual(404);
  });
});
