// book.routes.js
const router = require("express").Router();
const bookController = require("../controllers/book.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const {
  getBooksSchema,
  createBookSchema,
  updateBookSchema,
} = require("../validators/book.validator");

// Public routes
router.get("/", validate(getBooksSchema), bookController.getAllBooks);
router.get("/:id", bookController.getBookById);

// Protected routes
router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate(createBookSchema),
  bookController.createBook
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validate(updateBookSchema),
  bookController.updateBook
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  bookController.deleteBook
);

module.exports = router;
