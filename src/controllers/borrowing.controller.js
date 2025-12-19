const prisma = require("../config/database");
const { success, error } = require("../utils/response");

exports.getAllBorrowings = async (req, res) => {
  try {
    console.log("📖 GET /api/borrowings called");
    const borrowings = await prisma.borrowing.findMany({
      orderBy: { borrowedAt: "desc" },
      include: {
        book: { select: { title: true, author: true } },
        member: { select: { name: true, code: true } },
      },
    });
    console.log(`📖 Found ${borrowings.length} borrowings`);
    return success(res, "Borrowings retrieved successfully", { borrowings });
  } catch (err) {
    console.error("GET BORROWINGS ERROR:", err);
    return error(res, "Internal server error", 500);
  }
};


exports.getOverdueBorrowings = async (req, res) => {
  try {
    console.log("⚠️ GET /api/borrowings/overdue called");
    const overdue = await prisma.borrowing.findMany({
      where: { status: "OVERDUE" },
      include: {
        book: { select: { title: true, author: true } },
        member: { select: { name: true, code: true, email: true } },
      },
    });
    console.log(`⚠️ Found ${overdue.length} overdue borrowings`);
    return success(res, "Overdue borrowings retrieved", { overdue });
  } catch (err) {
    console.error("GET OVERDUE ERROR:", err);
    return error(res, "Internal server error", 500);
  }
};

exports.borrowBook = async (req, res) => {
  try {
    console.log("📖 POST /api/borrowings (borrow book) called");
    const { bookId, memberId, dueDate } = req.body;
    const userId = req.user?.id; // From auth middleware

    console.log("Request data:", { bookId, memberId, dueDate, userId });

    // Validation
    if (!bookId || !memberId || !dueDate) {
      return error(res, "bookId, memberId, and dueDate are required", 400);
    }

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

    // Check if member already has this book borrowed (not returned)
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

    // Create borrowing record
    const borrowing = await prisma.$transaction(async (tx) => {
      // Create borrowing
      const newBorrowing = await tx.borrowing.create({
        data: {
          bookId: parseInt(bookId),
          memberId: parseInt(memberId),
          userId: userId || null,
          dueDate: new Date(dueDate),
          status: "BORROWED",
        },
        include: {
          book: { select: { title: true, author: true } },
          member: { select: { name: true, code: true } },
        },
      });

      // Update book availability
      await tx.book.update({
        where: { id: parseInt(bookId) },
        data: { available: { decrement: 1 } },
      });

      return newBorrowing;
    });

    console.log(`📖 Book borrowed successfully. Borrowing ID: ${borrowing.id}`);

    return success(res, "Book borrowed successfully", { borrowing }, 201);
  } catch (err) {
    console.error("BORROW BOOK ERROR:", err);
    return error(res, "Internal server error", 500);
  }
};

exports.returnBook = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📖 POST /api/borrowings/${id}/return called`);

    // Find borrowing record
    const borrowing = await prisma.borrowing.findUnique({
      where: { id: parseInt(id) },
      include: { book: true },
    });

    if (!borrowing) {
      return error(res, "Borrowing record not found", 404);
    }

    if (borrowing.status === "RETURNED") {
      return error(res, "Book already returned", 400);
    }

    // Update borrowing and book availability
    const updatedBorrowing = await prisma.$transaction(async (tx) => {
      // Update borrowing
      const borrowingUpdate = await tx.borrowing.update({
        where: { id: parseInt(id) },
        data: {
          returnedAt: new Date(),
          status: "RETURNED",
        },
        include: {
          book: { select: { title: true, author: true } },
          member: { select: { name: true, code: true } },
        },
      });

      // Return book to available stock
      await tx.book.update({
        where: { id: borrowing.bookId },
        data: { available: { increment: 1 } },
      });

      return borrowingUpdate;
    });

    console.log(`📖 Book returned successfully. Borrowing ID: ${id}`);

    return success(res, "Book returned successfully", {
      borrowing: updatedBorrowing,
    });
  } catch (err) {
    console.error("RETURN BOOK ERROR:", err);
    return error(res, "Internal server error", 500);
  }
};
