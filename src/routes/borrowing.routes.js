const router = require("express").Router();
const borrowingController = require("../controllers/borrowing.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// Public GET routes
router.get("/", borrowingController.getAllBorrowings);
router.get("/overdue", borrowingController.getOverdueBorrowings);

// Protected POST routes
router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "USER"),
  borrowingController.borrowBook
);

router.post(
  "/:id/return",
  authMiddleware,
  roleMiddleware("ADMIN", "USER"),
  borrowingController.returnBook
);

module.exports = router;
