const router = require("express").Router();
const memberController = require("../controllers/member.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// Public GET routes
router.get("/", memberController.getAllMembers);
router.get("/:id", memberController.getMemberById);

// Protected routes
router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "USER"),
  memberController.createMember
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "USER"),
  memberController.updateMember
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  memberController.deleteMember
);

module.exports = router;
