const prisma = require("../config/database");
const { success, error } = require("../utils/response");

exports.getAllBooks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      author,
      sortBy = "title",
      order = "asc",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = {};

    if (search) {
      filter.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) filter.category = { contains: category, mode: "insensitive" };
    if (author) filter.author = { contains: author, mode: "insensitive" };

    // Get total count
    const total = await prisma.book.count({ where: filter });

    // Get books
    const books = await prisma.book.findMany({
      where: filter,
      skip,
      take: limitNum,
      orderBy: { [sortBy]: order.toLowerCase() },
      include: {
        _count: {
          select: { borrowings: true },
        },
      },
    });

    return success(res, "Books retrieved successfully", {
      books,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
    });
  } catch (err) {
    console.error("GET ALL BOOKS ERROR:", err);
    return error(res, "Internal server error", 500);
  }
};

exports.getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await prisma.book.findUnique({
      where: { id: parseInt(id) },
      include: {
        borrowings: {
          include: {
            member: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
          where: {
            status: { in: ["BORROWED", "OVERDUE"] },
          },
        },
      },
    });

    if (!book) {
      return error(res, "Book not found", 404);
    }

    return success(res, "Book retrieved successfully", { book });
  } catch (err) {
    console.error("GET BOOK BY ID ERROR:", err);
    return error(res, "Internal server error", 500);
  }
};

exports.createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      category,
      description,
      quantity,
      publishedAt,
    } = req.body;

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
        description,
        quantity: quantity || 1,
        available: quantity || 1,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
      },
    });

    return success(res, "Book created successfully", { book }, 201);
  } catch (err) {
    console.error("CREATE BOOK ERROR:", err);
    return error(res, "Internal server error", 500);
  }
};

exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      author,
      isbn,
      category,
      description,
      quantity,
      publishedAt,
    } = req.body;

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
    const newAvailable = Math.max(
      0,
      (quantity || existingBook.quantity) - currentlyBorrowed
    );

    const book = await prisma.book.update({
      where: { id: parseInt(id) },
      data: {
        title,
        author,
        isbn,
        category,
        description,
        quantity: quantity || existingBook.quantity,
        available: newAvailable,
        publishedAt: publishedAt
          ? new Date(publishedAt)
          : existingBook.publishedAt,
      },
    });

    return success(res, "Book updated successfully", { book });
  } catch (err) {
    console.error("UPDATE BOOK ERROR:", err);
    return error(res, "Internal server error", 500);
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

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
