const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // Clear existing data (dalam urutan yang benar untuk foreign keys)
  console.log("Clearing existing data...");
  await prisma.borrowing.deleteMany({});
  await prisma.book.deleteMany({});
  await prisma.member.deleteMany({});
  await prisma.user.deleteMany({});

  // Create users
  console.log("Creating users...");
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const userPassword = await bcrypt.hash("User123!", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@library.com",
      password: adminPassword,
      name: "Library Admin",
      role: "ADMIN", // String, bukan ENUM
    },
  });

  const users = [];
  for (let i = 1; i <= 3; i++) {
    const password = await bcrypt.hash(`User${i}123!`, 10);
    const user = await prisma.user.create({
      data: {
        email: `user${i}@library.com`,
        password: password,
        name: `Regular User ${i}`,
        role: "USER", // String, bukan ENUM
      },
    });
    users.push(user);
  }

  // Create books
  console.log("Creating books...");
  const books = [
    {
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      isbn: "9780743273565",
      category: "Fiction",
      description: "A classic novel of the Jazz Age",
      quantity: 5,
      available: 5,
      publishedAt: new Date("1925-04-10"),
    },
    {
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      isbn: "9780061120084",
      category: "Fiction",
      description: "A novel about racial injustice",
      quantity: 3,
      available: 3,
      publishedAt: new Date("1960-07-11"),
    },
    {
      title: "1984",
      author: "George Orwell",
      isbn: "9780451524935",
      category: "Science Fiction",
      description: "Dystopian social science fiction",
      quantity: 4,
      available: 4,
      publishedAt: new Date("1949-06-08"),
    },
    {
      title: "Pride and Prejudice",
      author: "Jane Austen",
      isbn: "9780141439518",
      category: "Romance",
      description: "A romantic novel of manners",
      quantity: 2,
      available: 2,
      publishedAt: new Date("1813-01-28"),
    },
    {
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      isbn: "9780547928227",
      category: "Fantasy",
      description: "Fantasy novel and children's book",
      quantity: 6,
      available: 6,
      publishedAt: new Date("1937-09-21"),
    },
  ];

  const createdBooks = [];
  for (const book of books) {
    const createdBook = await prisma.book.create({ data: book });
    createdBooks.push(createdBook);
  }

  // Create members
  console.log("Creating members...");
  const members = [
    {
      code: "M001",
      name: "John Doe",
      email: "john@example.com",
      phone: "081234567890",
      address: "123 Main Street",
      status: "ACTIVE", // String, bukan ENUM
    },
    {
      code: "M002",
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "081298765432",
      address: "456 Oak Avenue",
      status: "ACTIVE",
    },
    {
      code: "M003",
      name: "Bob Johnson",
      email: "bob@example.com",
      phone: "081277788899",
      address: "789 Pine Road",
      status: "ACTIVE",
    },
    {
      code: "M004",
      name: "Alice Brown",
      email: "alice@example.com",
      phone: "081266655544",
      address: "321 Elm Street",
      status: "INACTIVE",
    },
    {
      code: "M005",
      name: "Charlie Wilson",
      email: "charlie@example.com",
      phone: "081233344455",
      address: "654 Maple Drive",
      status: "ACTIVE",
    },
  ];

  const createdMembers = [];
  for (const member of members) {
    const createdMember = await prisma.member.create({ data: member });
    createdMembers.push(createdMember);
  }

  // Create borrowings
  console.log("Creating borrowings...");
  const borrowings = [
    {
      bookId: createdBooks[0].id,
      memberId: createdMembers[0].id,
      userId: admin.id, // Tambah userId
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: "BORROWED", // String, bukan ENUM
    },
    {
      bookId: createdBooks[1].id,
      memberId: createdMembers[1].id,
      userId: users[0].id, // Tambah userId
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      status: "BORROWED",
    },
    {
      bookId: createdBooks[2].id,
      memberId: createdMembers[2].id,
      userId: users[1].id, // Tambah userId
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (overdue)
      status: "OVERDUE",
    },
    {
      bookId: createdBooks[3].id,
      memberId: createdMembers[0].id,
      userId: users[2].id, // Tambah userId
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      returnedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: "RETURNED",
    },
    {
      bookId: createdBooks[4].id,
      memberId: createdMembers[3].id,
      userId: admin.id, // Tambah userId
      dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      status: "LOST",
    },
  ];

  for (const borrowing of borrowings) {
    await prisma.borrowing.create({ data: borrowing });
  }

  console.log("Database seeding completed successfully!");
  console.log("\nTest Credentials:");
  console.log("Admin: email=admin@library.com, password=Admin123!");
  console.log("User 1: email=user1@library.com, password=User1123!");
  console.log("User 2: email=user2@library.com, password=User2123!");
  console.log("User 3: email=user3@library.com, password=User3123!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
