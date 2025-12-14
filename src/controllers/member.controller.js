const prisma = require("../config/database");
const { success, error } = require("../utils/response");

exports.getAllMembers = async (req, res) => {
  try {
    console.log("👥 GET /api/members called");
    const members = await prisma.member.findMany({ orderBy: { id: "desc" } });
    console.log(`👥 Found ${members.length} members`);
    return success(res, "Members retrieved successfully", { members });
  } catch (err) {
    console.error("GET MEMBERS ERROR:", err);
    return error(res, "Internal server error", 500);
  }
};

exports.getMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await prisma.member.findUnique({
      where: { id: parseInt(id) },
    });
    if (!member) return error(res, "Member not found", 404);
    return success(res, "Member retrieved successfully", { member });
  } catch (err) {
    console.error("GET MEMBER ERROR:", err);
    return error(res, "Internal server error", 500);
  }
};

exports.createMember = async (req, res) => {
  try {
    console.log("👥 POST /api/members called");
    const { code, name, email, phone, address, status } = req.body;

    if (!code || !name) return error(res, "Code and name are required", 400);

    const existingMember = await prisma.member.findUnique({ where: { code } });
    if (existingMember) return error(res, "Member code already exists", 409);

    if (email) {
      const existingEmail = await prisma.member.findUnique({
        where: { email },
      });
      if (existingEmail) return error(res, "Email already exists", 409);
    }

    const member = await prisma.member.create({
      data: {
        code,
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        status: status || "ACTIVE",
      },
    });

    return success(res, "Member created successfully", { member }, 201);
  } catch (err) {
    console.error("CREATE MEMBER ERROR:", err);
    if (err.code === "P2002") return error(res, "Duplicate value", 409);
    return error(res, "Internal server error", 500);
  }
};

exports.updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`👥 PUT /api/members/${id} called`);

    const { code, name, email, phone, address, status } = req.body;

    // Check if member exists
    const existingMember = await prisma.member.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingMember) {
      return error(res, "Member not found", 404);
    }

    // Check if new code conflicts with another member
    if (code && code !== existingMember.code) {
      const memberWithCode = await prisma.member.findUnique({
        where: { code },
      });

      if (memberWithCode) {
        return error(res, "Member code already exists", 409);
      }
    }

    // Check if new email conflicts with another member
    if (email && email !== existingMember.email) {
      const memberWithEmail = await prisma.member.findUnique({
        where: { email },
      });

      if (memberWithEmail) {
        return error(res, "Email already registered to another member", 409);
      }
    }

    const member = await prisma.member.update({
      where: { id: parseInt(id) },
      data: {
        code: code || existingMember.code,
        name: name || existingMember.name,
        email: email || existingMember.email,
        phone: phone || existingMember.phone,
        address: address || existingMember.address,
        status: status || existingMember.status,
      },
    });

    return success(res, "Member updated successfully", { member });
  } catch (err) {
    console.error("UPDATE MEMBER ERROR:", err);
    if (err.code === "P2002") return error(res, "Duplicate value", 409);
    return error(res, "Internal server error", 500);
  }
};

exports.deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`👥 DELETE /api/members/${id} called`);

    // Check if member exists
    const existingMember = await prisma.member.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingMember) {
      return error(res, "Member not found", 404);
    }

    // Check if member has active borrowings
    const activeBorrowings = await prisma.borrowing.count({
      where: {
        memberId: parseInt(id),
        status: { in: ["BORROWED", "OVERDUE"] },
      },
    });

    if (activeBorrowings > 0) {
      return error(res, "Cannot delete member with active borrowings", 400);
    }

    await prisma.member.delete({
      where: { id: parseInt(id) },
    });

    return success(res, "Member deleted successfully", null, 204);
  } catch (err) {
    console.error("DELETE MEMBER ERROR:", err);
    return error(res, "Internal server error", 500);
  }
};
