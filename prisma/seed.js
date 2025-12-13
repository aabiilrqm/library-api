// prisma/seed.js (sederhana untuk testing)
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");
  await prisma.user.deleteMany();
  console.log("🗑️  Cleared existing users");

  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@library.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("👑 Admin user created:", admin.email);


  const user = await prisma.user.create({
    data: {
      name: "Regular User",
      email: "user@library.com",
      password: hashedPassword, 
      role: "USER",
    },
  });
  console.log("👤 Regular user created:", user.email);

  console.log("✅ Seed completed!");
  console.log("\nTest credentials:");
  console.log("Admin: admin@library.com / admin123");
  console.log("User: user@library.com / admin123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
