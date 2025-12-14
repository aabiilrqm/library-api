const prisma = require("../config/database");
const { success, error } = require("../utils/response");

exports.borrowBook = async (req, res) => {
  try {
    const { bookId, memberId, dueDate } = req.body;

    // Check if book exists and is available
    const book = await prisma.book.findUnique({
      where: { id: parseInt(bookId) },
    });

    if (!book) {
      return error(res, "Book not found", 404);
    }

    if (book.available <= 0) {
      return error(res, "Book is not available for borrowing", 400);
    }

    // Check if member exists and is active
    const member = await prisma.member.findUnique({
      where: { id: parseInt(memberId) },
    });

    if (!member) {
      return error(res, "Member not found", 404);
    }

    if (member.status !== "ACTIVE") {
      return error(res, "Member is not active", 400);
    }

    // Check if member already has this book borrowed
    const existingBorrowing = await prisma.borrowing.findFirst({
      where: {
        bookId: parseInt(bookId),
        memberId: parseInt(memberId),
        status: { in: ["BORROWED", "OVERDUE"] },
      },
    });

    if (existingBorrowing) {
      return error(res, "Member already has this book borrowed", 400);
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create borrowing record
      const borrowing = await tx.borrowing.create({
        data: {
          bookId: parseInt(bookId),
          memberId: parseInt(memberId),
          dueDate: new Date(dueDate),
          status: "BORROWED",
        },
        include: {
          book: {
            select: {
              title: true,
              author: true,
              isbn: true,
            },
          },
          member: {
            select: {
              code: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Update book availability
      await tx.book.update({
        where: { id: parseInt(bookId) },
        data: {
          available: { decrement: 1 },
        },
      });

      return borrowing;
    });

    return success(
      res,
      "Book borrowed successfully",
      { borrowing: result },
      201
    );
  } catch (err) {
    console.error("BORROW BOOK ERROR:", err);
    return error(res, "Internal server error", 500);
  }
};

exports.returnBook = async (req, res) => {
  try {
    const { id } = req.params;

    // Find borrowing record
    const borrowing = await prisma.borrowing.findUnique({
      where: { id: parseInt(id) },
      include: {
        book: true,
      },
    });

    if (!borrowing) {
      return error(res, "Borrowing record not found", 404);
    }

    if (borrowing.status === "RETURNED") {
      return error(res, "Book already returned", 400);
    }

    // Update borrowing record
    const updatedBorrowing = await prisma.$transaction(async (tx) => {
      const borrowingUpdate = await tx.borrowing.update({
        where: { id: parseInt(id) },
        data: {
          returnedAt: new Date(),
          status: "RETURNED",
        },
        include: {
          book: {
            select: {
              title: true,
              author: true,
            },
          },
          member: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      });

      // Update book availability
      await tx.book.update({
        where: { id: borrowing.bookId },
        data: {
          available: { increment: 1 },
        },
      });

      return borrowingUpdate;
    });

    return success(res, "Book returned successfully", {
      borrowing: updatedBorrowing,
    });
  } catch (err) {
    console.error("RETURN BOOK ERROR:", err);
    return error(res, "Internal server error", 500);
  }
};

exports.getAllBorrowings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      bookId,
      memberId,
      overdue,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = {};

    if (status) filter.status = status;
    if (bookId) filter.bookId = parseInt(bookId);
    if (memberId) filter.memberId = parseInt(memberId);

    if (overdue === "true") {
      filter.AND = [{ status: "BORROWED" }, { dueDate: { lt: new Date() } }];
    }

    // Get total count
    const total = await prisma.borrowing.count({ where: filter });

    // Get borrowings
    const borrowings = await prisma.borrowing.findMany({
      where: filter,
      skip,
      take: limitNum,
      orderBy: { borrowedAt: "desc" },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
          },
        },
        member: {
          select: {
            id: true,
            code: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return success(res, "Borrowings retrieved successfully", {
      borrowings,
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
    console.error("GET ALL BORROWINGS ERROR:", err);
    return error(res, "Internal server error", 500);
  }
};

exports.getOverdueBorrowings = async (req, res) => {
  try {
    const overdueBorrowings = await prisma.borrowing.findMany({
      where: {
        status: "BORROWED",
        dueDate: { lt: new Date() },
      },
      include: {
        book: {
          select: {
            title: true,
            author: true,
            isbn: true,
          },
        },
        member: {
          select: {
            code: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    return success(res, "Overdue borrowings retrieved", { overdueBorrowings });
  } catch (err) {
    console.error("GET OVERDUE BORROWINGS ERROR:", err);
    return error(res, "Internal server error", 500);
  }
};

exports.updateOverdueStatus = async () => {
  try {
    const now = new Date();

    const result = await prisma.borrowing.updateMany({
      where: {
        status: "BORROWED",
        dueDate: { lt: now },
      },
      data: {
        status: "OVERDUE",
      },
    });

    console.log(`Updated ${result.count} borrowings to OVERDUE status`);
  } catch (err) {
    console.error("UPDATE OVERDUE STATUS ERROR:", err);
  }
};
