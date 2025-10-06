# NotePlanning Backend

A Node.js backend application built with Fastify, Prisma, PostgreSQL, and Clean Architecture principles.

## 🚀 Features

- **Clean Architecture**: Well-organized code structure with clear separation of concerns
- **Fastify Framework**: High-performance web framework for Node.js
- **Prisma ORM**: Type-safe database access with PostgreSQL
- **Zod Validation**: Runtime type validation for all API inputs
- **JWT Authentication**: Secure authentication with JSON Web Tokens
- **Swagger Documentation**: Auto-generated API documentation
- **Soft Delete**: Records are deactivated instead of being physically deleted
- **Audit Fields**: Automatic tracking of created/updated timestamps
- **Pagination**: Built-in pagination support for all list endpoints
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Logging**: Structured logging with Pino
- **TypeScript**: Full TypeScript support with strict type checking

## 📋 Requirements

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd noteplanning-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

Edit the `.env` file with your configuration:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/noteplanning_db"
JWT_SECRET="your-super-secret-jwt-key-here"
PORT=3000
NODE_ENV=development
```

4. Set up the database:
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed the database (optional)
npm run db:seed
```

## 🚀 Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## 📚 API Documentation

Once the server is running, you can access the interactive API documentation at:
- **Swagger UI**: `http://localhost:3000/docs`
- **Health Check**: `http://localhost:3000/health`

## 🏗️ Architecture

The application follows Clean Architecture principles with the following structure:

```
src/
├── config/          # Configuration files
├── controllers/     # HTTP request/response handlers
├── services/        # Business logic layer
├── repositories/    # Data access layer
├── validators/      # Zod validation schemas
├── routes/          # API route definitions
├── middleware/      # Express middleware
├── errors/          # Custom error classes
└── server.ts        # Application entry point
```

### Key Components

- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic and use cases
- **Repositories**: Handle database operations
- **Validators**: Define and validate input schemas
- **Routes**: Define API endpoints and their configurations

## 📊 Database Models

### Customer
- User management with roles (FREE, MEMBER, ADMIN)
- Email-based authentication
- Soft delete support

### Video
- Video content management
- Publishing status control
- Customer association

### Membership
- Subscription management
- Plan types and expiration dates
- Customer association

### Admin
- Administrative user management
- Role-based access control

## 🔐 Authentication

The API uses JWT-based authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📝 API Endpoints

### Customers
- `GET /api/customers` - List customers
- `GET /api/customers/:id` - Get customer by ID
- `GET /api/customers/email/:email` - Get customer by email
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer (soft delete)
- `POST /api/customers/login` - Authenticate customer

### Videos
- `GET /api/videos` - List videos
- `GET /api/videos/published` - List published videos
- `GET /api/videos/:id` - Get video by ID
- `POST /api/videos` - Create video
- `PUT /api/videos/:id` - Update video
- `DELETE /api/videos/:id` - Delete video (soft delete)
- `PATCH /api/videos/:id/publish` - Toggle publish status

### Memberships
- `GET /api/memberships` - List memberships
- `GET /api/memberships/active` - List active memberships
- `GET /api/memberships/:id` - Get membership by ID
- `POST /api/memberships` - Create membership
- `PUT /api/memberships/:id` - Update membership
- `DELETE /api/memberships/:id` - Delete membership (soft delete)
- `PATCH /api/memberships/:id/extend` - Extend membership

### Admins
- `GET /api/admins` - List admins
- `GET /api/admins/:id` - Get admin by ID
- `POST /api/admins` - Create admin
- `PUT /api/admins/:id` - Update admin
- `DELETE /api/admins/:id` - Delete admin (soft delete)
- `POST /api/admins/login` - Authenticate admin

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start development server with hot reload

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Run database migrations
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database with sample data

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting

# Build
npm run build            # Build for production
npm start                # Start production server
```

## 🚀 Deployment

1. Build the application:
```bash
npm run build
```

2. Set production environment variables
3. Start the server:
```bash
npm start
```

## 📄 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue in the repository.
