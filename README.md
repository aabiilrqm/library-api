# Library Management System REST API

A complete REST API for managing library operations built with Node.js, Express.js, and Prisma ORM.

## Features

- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control
- 📚 **Book Management** - CRUD operations for books with availability tracking
- 👥 **Member Management** - Member registration and management
- 📖 **Borrowing System** - Track book borrowings and returns
- 🔍 **Advanced Search** - Search, filter, and pagination
- 🛡️ **Security** - Input validation, rate limiting, CORS, security headers
- 📊 **Reporting** - Overdue books, borrowing history, statistics

## Tech Stack

- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Database**: SQLite (development), PostgreSQL (production)
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Validation**: Joi
- **Deployment**: AWS EC2 with PM2

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd library-api