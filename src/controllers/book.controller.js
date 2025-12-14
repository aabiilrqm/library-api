const prisma = require("../config/database");
const { success, error } = require("../utils/response");

exports.getAllBooks = async (req, res) => {
  try {
    console.log("📚 GET /api/books called");
    const books = await prisma.book.findMany({ orderBy: { id: "desc" } });
    console.log(`📚 Found ${books.length} books`);
    return success(res, "Books retrieved successfully", { books });
  } catch (err) {
    console.error("GET BOOKS ERROR:", err);
    return error(res, "Internal server error", 500);
  }
};

exports.getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await prisma.book.findUnique({ where: { id: parseInt(id) } });
    if (!book) return error(res, "Book not found", 404);
    return success(res, "Book retrieved successfully", { book });
  } catch (err) {
    console.error("GET BOOK ERROR:", err);
    return error(res, "Internal server error", 500);
  }
};

exports.createBook = async (req, res) => {
  try {
    console.log("📚 POST /api/books called");
    const { title, author, isbn, category, description, quantity } = req.body;

    // Validation
    if (!title || !author || !isbn || !category) {
      return error(res, "Title, author, ISBN, and category are required", 400);
    }

    // Check if ISBN already exists
    const existingBook = await prisma.book.findUnique({
      where: { isbn },
    });

    if (existingBook) {
      return error(res, "Book with this ISBN already exists", 409);
    }

    const book = await prisma.book.create({
      data: {
        title,
        author,
        isbn,
        category,
        description: description || null,
        quantity: quantity || 1,
        available: quantity || 1,
      },
    });

    console.log(`📚 Book created with ID: ${book.id}`);

    return success(res, "Book created successfully", { book }, 201);
  } catch (err) {
    console.error("CREATE BOOK ERROR:", err);
    if (err.code === "P2002") return error(res, "Duplicate ISBN", 409);
    return error(res, "Internal server error", 500);
  }
};

exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📚 PUT /api/books/${id} called`);

    const { title, author, isbn, category, description, quantity } = req.body;

    // Check if book exists
    const existingBook = await prisma.book.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingBook) {
      return error(res, "Book not found", 404);
    }

    // Check if new ISBN conflicts with another book
    if (isbn && isbn !== existingBook.isbn) {
      const bookWithISBN = await prisma.book.findUnique({
        where: { isbn },
      });

      if (bookWithISBN) {
        return error(res, "ISBN already exists for another book", 409);
      }
    }

    // Calculate new available quantity
    const currentlyBorrowed = existingBook.quantity - existingBook.available;
    const newQuantity = quantity || existingBook.quantity;
    const newAvailable = Math.max(0, newQuantity - currentlyBorrowed);

    const book = await prisma.book.update({
      where: { id: parseInt(id) },
      data: {
        title: title || existingBook.title,
        author: author || existingBook.author,
        isbn: isbn || existingBook.isbn,
        category: category || existingBook.category,
        description: description || existingBook.description,
        quantity: newQuantity,
        available: newAvailable,
      },
    });

    return success(res, "Book updated successfully", { book });
  } catch (err) {
    console.error("UPDATE BOOK ERROR:", err);
    if (err.code === "P2002") return error(res, "Duplicate ISBN", 409);
    return error(res, "Internal server error", 500);
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📚 DELETE /api/books/${id} called`);

    // Check if book exists
    const existingBook = await prisma.book.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingBook) {
      return error(res, "Book not found", 404);
    }

    // Check if book is currently borrowed
    if (existingBook.available < existingBook.quantity) {
      return error(res, "Cannot delete book that is currently borrowed", 400);
    }

    await prisma.book.delete({
      where: { id: parseInt(id) },
    });

    return success(res, "Book deleted successfully", null, 204);
  } catch (err) {
    console.error("DELETE BOOK ERROR:", err);
    return error(res, "Internal server error", 500);
  }
};
