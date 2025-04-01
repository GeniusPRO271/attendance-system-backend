# Education Management System

A modern, full-stack education management system built with cutting-edge technologies and best practices.

## 🚀 Tech Stack

### Backend
- **Runtime**: Bun.js - Ultra-fast JavaScript runtime
- **Framework**: Hono.js - Lightweight, fast, and modern web framework
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with bcrypt for password hashing
- **API Validation**: Zod for runtime type checking and validation
- **Task Scheduling**: node-cron for automated tasks
- **QR Code Generation**: qrcode for generating QR codes
- **TypeScript**: For type safety and better developer experience

### Development Tools
- Docker for containerization
- TypeScript for type safety
- Modern development practices and tools

## 💡 Features

- Secure authentication system
- QR code generation capabilities
- Automated task scheduling
- Type-safe database operations
- RESTful API architecture
- Containerized deployment ready

## 🛠️ Getting Started

### Prerequisites
- Bun.js
- PostgreSQL
- Docker (optional)

### Installation

1. Clone the repository
```bash
git clone https://github.com/GeniusPRO271/attendance-system-backend
```

2. Install dependencies
```bash
bun install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations
```bash
bun run migration
```

5. Start the development server
```bash
bun run dev
```

## 🔧 Available Scripts

- `bun run dev` - Start development server with hot reload
- `bun run start` - Start production server
- `bun run generate` - Generate database migrations
- `bun run migration` - Run database migrations
- `bun run studio` - Launch Drizzle Studio for database management

## 🐳 Docker Support

Build and run the application using Docker:

```bash
docker build -t education-system .
docker run -p 3000:3000 education-system
```

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Input validation with Zod
- Type-safe database operations
- Environment variable protection

## 👤 Author

GeniusPRO
- GitHub: [GitHub Profile](https://github.com/GeniusPRO271)
- LinkedIn: [LinkedIn Profile](https://www.linkedin.com/in/benjamin-toro-25266b259/)

---
Made with ❤️ using modern web technologies
