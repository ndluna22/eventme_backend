"use strict";

const request = require("supertest");

const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testEventIds,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** GET /events */

describe("GET /events", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get(`/events`);
    expect(resp.body).toEqual({
      events: [
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

  test("works: filtering", async function () {
    const resp = await request(app).get(`/events`).query({ hasEquity: true });
    expect(resp.body).toEqual({
      events: [
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
      ],
    });
  });

  test("works: filtering on 2 filters", async function () {
    const resp = await request(app)
      .get(`/events`)
      .query({ minSalary: 2, title: "3" });
    expect(resp.body).toEqual({
      events: [
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
      .get(`/events`)
      .query({ minSalary: 2, nope: "nope" });
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /events/:id */

describe("GET /events/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/events/${testEventIds[0]}`);
    expect(resp.body).toEqual({
      event: {
        id: testEventIds[0],
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

  test("not found for no such event", async function () {
    const resp = await request(app).get(`/events/0`);
    expect(resp.statusCode).toEqual(404);
  });
});
