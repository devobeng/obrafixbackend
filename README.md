# Home Services Backend API

A production-ready, scalable Express.js backend application built with TypeScript, following the MVC (Model-View-Controller) architecture pattern.

## 🏗️ Architecture Overview

This application follows the **MVC (Model-View-Controller)** pattern for better separation of concerns, maintainability, and scalability:

- **Models**: Data layer with Mongoose schemas and database interactions
- **Views**: API responses (JSON format)
- **Controllers**: Business logic and request handling
- **Services**: Core business operations and data processing
- **Validators**: Input validation using Zod schemas
- **Middleware**: Authentication, authorization, and error handling
- **Routes**: API endpoint definitions

## ✨ Features

- **🔐 Authentication & Authorization**: JWT-based authentication with role-based access control
- **📊 Database**: MongoDB with Mongoose ODM
- **✅ Validation**: Zod schema validation for all inputs
- **🛡️ Security**: Helmet, CORS, rate limiting, and input sanitization
- **📝 Logging**: Structured error logging and monitoring
- **🧪 Testing**: Jest testing framework with Supertest
- **📦 Scalable**: Modular architecture for easy scaling
- **🌍 Production Ready**: Environment-based configuration and error handling

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone and install dependencies:**

   ```bash
   cd backend
   npm install
   ```

2. **Environment setup:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server:**

   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## 📁 Project Structure

```
src/
├── config/           # Configuration files
│   └── database.ts   # Database connection
├── controllers/      # Request handlers (MVC Controller)
│   ├── authController.ts
│   ├── userController.ts
│   └── serviceController.ts
├── middleware/       # Express middleware
│   ├── auth.ts       # Authentication & authorization
│   └── errorHandler.ts # Error handling
├── models/          # Database models (MVC Model)
│   ├── User.ts      # User schema and model
│   └── Service.ts   # Service schema and model
├── routes/          # API route definitions
│   ├── auth.ts      # Authentication routes
│   ├── user.ts      # User management routes
│   └── service.ts   # Service management routes
├── services/        # Business logic layer
│   ├── AuthService.ts
│   ├── UserService.ts
│   └── ServiceService.ts
├── types/           # TypeScript type definitions
│   └── index.ts
├── utils/           # Utility functions
│   └── AppError.ts  # Custom error class
├── validators/      # Input validation schemas
│   ├── userValidator.ts
│   └── serviceValidator.ts
└── index.ts         # Application entry point
```

## 🔐 Authentication & Authorization

### JWT Tokens

- **Access Token**: Short-lived (7 days) for API access
- **Refresh Token**: Long-lived (30 days) for token renewal

### User Roles

- **user**: Basic user access
- **provider**: Service provider access
- **admin**: Administrative access

### Protected Routes

```typescript
// Require authentication
router.get("/profile", authenticate(), userController.getProfile);

// Require specific role
router.post(
  "/services",
  authenticate(),
  requireRole("provider"),
  serviceController.createService
);

// Admin only
router.get(
  "/users",
  authenticate(),
  requireRole("admin"),
  userController.getAllUsers
);
```

## 📡 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - User logout

### Users

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user (admin only)
- `PATCH /api/users/:id/role` - Update user role (admin only)
- `PATCH /api/users/:id/verify` - Verify user (admin only)
- `GET /api/users/search` - Search users (admin only)
- `GET /api/users/stats/overview` - User statistics (admin only)

### Services

- `GET /api/services` - Get all services (public)
- `GET /api/services/:id` - Get service by ID (public)
- `POST /api/services` - Create new service (provider/admin)
- `PUT /api/services/:id` - Update service (provider/admin)
- `DELETE /api/services/:id` - Delete service (provider/admin)
- `PATCH /api/services/:id/status` - Update service status (provider/admin)
- `GET /api/services/provider/:providerId` - Get services by provider (public)
- `GET /api/services/category/:category` - Get services by category (public)
- `GET /api/services/search` - Search services (public)

## 🗄️ Database Schema

### User Model

```typescript
{
  email: string(unique, required);
  password: string(hashed, required);
  firstName: string(required);
  lastName: string(required);
  phone: string(optional);
  role: "user" | "provider" | "admin";
  isVerified: boolean;
  profileImage: string(optional);
  address: {
    street, city, state, zipCode, country;
  }
  timestamps: true;
}
```

### Service Model

```typescript
{
  title: string (required)
  description: string (required)
  category: enum (cleaning, plumbing, electrical, etc.)
  price: number (required)
  currency: "GHS" | "USD" | "EUR"
  provider: ObjectId (ref: User)
  location: { city, state, country, coordinates }
  images: [{ url, alt }]
  availability: { isAvailable, schedule }
  rating: { average, count }
  status: "active" | "inactive" | "suspended"
  tags: [string]
  requirements: [string]
  estimatedDuration: string
  warranty: string
  timestamps: true
}
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **Test Setup**: Mocked database and environment

## 🔧 Configuration

### Environment Variables

```bash
# Server
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/homeservices
MONGODB_URI_PROD=mongodb+srv://username:password@cluster.mongodb.net/homeservices

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=30d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3000

# Security
BCRYPT_ROUNDS=12
```

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set strong JWT secrets
4. Configure CORS origin for production domain
5. Set appropriate rate limiting values

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

## 📊 Monitoring & Logging

### Error Handling

- Centralized error handling middleware
- Structured error responses
- Development vs production error details
- Request logging for debugging

### Health Checks

- `/health` endpoint for monitoring
- Database connection status
- Server uptime information

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API abuse prevention
- **Input Validation**: Zod schema validation
- **Password Hashing**: bcrypt with configurable rounds
- **JWT Security**: Secure token handling
- **Role-Based Access**: Granular permission control

## 🤝 Contributing

1. Follow the MVC architecture pattern
2. Add proper validation for all inputs
3. Include error handling for all operations
4. Write tests for new functionality
5. Update documentation as needed

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:

1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information

---

**Built with ❤️ using Express.js, TypeScript, and MongoDB**
