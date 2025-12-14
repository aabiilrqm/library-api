const router = require('express').Router();
const bookController = require('../controllers/book.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Public GET routes
router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);

// Protected routes (Admin only)
router.post(
  '/',
  authMiddleware,
  roleMiddleware('ADMIN'),
  bookController.createBook
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware('ADMIN'),
  bookController.updateBook
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('ADMIN'),
  bookController.deleteBook
);

module.exports = router;