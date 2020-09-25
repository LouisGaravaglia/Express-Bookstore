process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const ExpressError = require("../expressError");
const db = require("../db")

afterAll(async function() {
    await db.end()
})

describe("GET /books", () => {
    test("GET all books in database", async () => {
        const res = await request(app).get('/books');
        expect(res.statusCode).toBe(200);
        expect(res.body.books.length).toEqual(2);
    })
})
