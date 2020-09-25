process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const ExpressError = require("../expressError");
const db = require("../db")
const Book = require("../models/book");
const jsonschema = require("jsonschema");
const bookSchema = require("../schemas/bookSchema.json");

const testBookOne = {
  book: {
    isbn: '00asdfasdf22',
    amazon_url: 'https://jsonschema.net/home',
    author: 'Tolstoy',
    language: 'English',
    pages: 344,
    publisher: 'Princeton Review',
    title: 'Russian Literature',
    year: 1944
  }
}

const testBookOneUpdated = {
  book: {
    isbn: '00asdfasdf22',
    amazon_url: 'https://jsonschema.net/home',
    author: 'Tolstoy',
    language: 'English',
    pages: 200,
    publisher: 'Princeton Review',
    title: 'Russian Literature',
    year: 1945
  }
}

const testBookTwo = {
  book: {
    isbn: '233joi02000',
    amazon_url: 'https://jsonschema.net/home',
    author: 'Dr. Seuss',
    language: 'English',
    pages: 10,
    publisher: 'Odeon',
    title: 'Childrens Bokk',
    year: 1990
  }
}

const testBookThree = {
  book: {
    isbn: 'asdfasf119999',
    amazon_url: 'https://jsonschema.net/home',
    author: 'Charles Darwin',
    language: 'English',
    pages: 432,
    publisher: 'Gideon',
    title: 'Origin of Species',
    year: 1630
  }
}

const notValidBook = {
  book: {
    isbn: 'asdfasdf8888',
    amazon_url: 'https://jsonschema.net/home',
    author: 'Robert Platt',
    language: 'English',
    pages: "432",
    publisher: 'Gideon',
    title: 1901,
    year: 1988
  }
}


beforeAll(async function(){
    const firstBook = await Book.create(testBookOne.book);
    const secondBook = await Book.create(testBookTwo.book);
})

// afterEach(async function(){
//     await Book.remove(testBookOne.book.isbn);
//     await Book.remove(testBookTwo.book.isbn);
// })

afterAll(async function() {
    await Book.remove(testBookOne.book.isbn);
    await Book.remove(testBookTwo.book.isbn);
    await db.end()
})

describe("GET /books", () => {
    test("GET all books in database", async () => {
        const res = await request(app).get('/books');
        expect(res.statusCode).toBe(200);
        expect(res.body.books.length).toEqual(2);
        expect(res.body.books[0]).toEqual(expect.objectContaining({author: expect.any(String), year: expect.any(Number), pages: expect.any(Number)  }))
    })
})

describe("GET /books/:id", () => {
    test("GET one book in database", async () => {
        const res = await request(app).get('/books/00asdfasdf22');
        expect(res.statusCode).toBe(200);
        expect(res.body.book).toEqual(expect.objectContaining({author: expect.any(String), year: expect.any(Number), pages: expect.any(Number)  }))
        expect(res.body.book.author).toEqual("Tolstoy");
        expect(res.body.book.pages).toEqual(344);
    })
    test("GET a book that doesnt exist", async () => {
        const res = await request(app).get('/books/0000000');
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toEqual({ message: "There is no book with an isbn '0000000", status: 404 });
    })
})

describe("POST /", () => {
    test("POST one book to database", async () => {
        const res = await request(app).post('/books').send(testBookThree);
        expect(res.statusCode).toBe(201);
        expect(res.body.book).toEqual(expect.objectContaining({author: expect.any(String), year: expect.any(Number), pages: expect.any(Number)  }))
        expect(res.body.book.author).toEqual("Charles Darwin");
        expect(res.body.book.pages).toEqual(432);
        await request(app).delete('/books/asdfasf119999');
    })
    test("POST a book to database with invalid json", async () => {
        const res = await request(app).post('/books').send(notValidBook);
        expect(res.statusCode).toBe(400);
        expect(res.body.error.message.length).toEqual(2)
        expect(res.body.error.message).toContain('instance.book.pages is not of a type(s) integer')
        expect(res.body.error.message).toContain('instance.book.title is not of a type(s) string')
        await request(app).delete('/books/asdfasdf8888');
    })
})

describe("PUT /books/:id", () => {
    test("PUT one book in database", async () => {
        const res = await request(app).put('/books/00asdfasdf22').send(testBookOneUpdated);
        expect(res.statusCode).toBe(200);
        expect(res.body.book).toEqual(expect.objectContaining({author: expect.any(String), year: expect.any(Number), pages: expect.any(Number)  }))
        expect(res.body.book.author).toEqual("Tolstoy");
        expect(res.body.book.pages).toEqual(200);
        expect(res.body.book.year).toEqual(1945);
        await request(app).put('/books/00asdfasdf22').send(testBookOne);
    })
    test("PUT a book that without sending info", async () => {
        const res = await request(app).put('/books/0000000');
        expect(res.statusCode).toBe(400);
        expect(res.body.error.message).toContain("instance requires property \"book\"");
    })
    test("PUT a book that doesnt exist", async () => {
        const res = await request(app).put('/books/0000000').send(testBookOne);
        expect(res.statusCode).toBe(404);
        expect(res.body.error.message).toContain("There is no book with an isbn '0000000");
    })
})

describe("DELETE /books/:id", () => {
    test("DELETE one book in database", async () => {
        await request(app).post('/books').send(testBookThree);
        const res = await request(app).delete('/books/asdfasf119999');
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toEqual("Book deleted");
    })
    test("GET a book that doesnt exist", async () => {
        const res = await request(app).delete('/books/0000000');
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toEqual({ message: "There is no book with an isbn '0000000", status: 404 });
    })
})