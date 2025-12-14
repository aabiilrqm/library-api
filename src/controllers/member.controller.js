const prisma = require("../config/database");
const { success, error } = require("../utils/response");

exports.getAllMembers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = "name",
      order = "asc",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = {};

    if (search) {
      filter.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) filter.status = status;

    // Get total count
    const total = await prisma.member.count({ where: filter });

    // Get members
    const members = await prisma.member.findMany({
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

    return success(res, "Members retrieved successfully", {
      members,
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
    console.error("GET ALL MEMBERS ERROR:", err);
    return error(res, "Internal server error", 500);
  }
};

exports.getMemberById = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await prisma.member.findUnique({
      where: { id: parseInt(id) },
      include: {
        borrowings: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                isbn: true,
              },
            },
          },
          orderBy: {
            borrowedAt: "desc",
          },
        },
      },
    });

    if (!member) {
      return error(res, "Member not found", 404);
    }

    return success(res, "Member retrieved successfully", { member });
  } catch (err) {
    console.error("GET MEMBER BY ID ERROR:", err);
    return error(res, "Internal server error", 500);
  }
};

exports.createMember = async (req, res) => {
  try {
    const { code, name, email, phone, address, status } = req.body;

    // Check if code already exists
    const existingMember = await prisma.member.findUnique({
      where: { code },
    });

    if (existingMember) {
      return error(res, "Member with this code already exists", 409);
    }

    // Check if email already exists
    if (email) {
      const existingEmail = await prisma.member.findUnique({
        where: { email },
      });

      if (existingEmail) {
        return error(res, "Email already registered to another member", 409);
      }
    }

    const member = await prisma.member.create({
      data: {
        code,
        name,
        email,
        phone,
        address,
        status: status || "ACTIVE",
      },
    });

    return success(res, "Member created successfully", { member }, 201);
  } catch (err) {
    console.error("CREATE MEMBER ERROR:", err);
    return error(res, "Internal server error", 500);
  }
};

exports.updateMember = async (req, res) => {
  try {
    const { id } = req.params;
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
        return error(res, "Code already exists for another member", 409);
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
    return error(res, "Internal server error", 500);
  }
};

exports.deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if member exists
    const existingMember = await prisma.member.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { borrowings: true },
        },
      },
    });

    if (!existingMember) {
      return error(res, "Member not found", 404);
    }

    // Check if member has active borrowings
    if (existingMember._count.borrowings > 0) {
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
