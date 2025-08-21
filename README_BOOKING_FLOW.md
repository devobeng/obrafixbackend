# Home Services - Booking Flow Implementation

This document outlines the complete booking flow implementation for the Home Services platform, including user booking management, provider job requests, and admin oversight.

## 🏗️ Architecture Overview

The booking system follows the MVC pattern with:

- **Models**: `Booking`, `BookingRequest`, `BookingPayment`
- **Services**: `BookingService`, `PaymentService`, `NotificationService`
- **Controllers**: `BookingController`, `PaymentController`
- **Routes**: RESTful API endpoints with role-based access control

## 📋 Core Features

### 1. User Booking Flow

- **Service Selection**: Browse and select services from providers
- **Date & Time Selection**: Pick preferred scheduling
- **Service Details**: Add photos, description, requirements
- **Price Estimation**: View base price + additional fees
- **Booking Confirmation**: Review and confirm booking details

### 2. Provider Job Requests

- **Notification System**: Receive real-time booking requests
- **Accept/Reject**: Respond to job requests with notes
- **Job Status Updates**: Track progress (On the way → In Progress → Completed)
- **Communication**: Direct messaging with customers

### 3. Admin Booking Management

- **Live Monitoring**: Track all active bookings
- **Dispute Resolution**: Handle customer-provider conflicts
- **Cancellation Management**: Process refunds and handle cancellations
- **Analytics**: Comprehensive booking and payment statistics

## 🗄️ Data Models

### Booking Model

```typescript
interface IBooking {
  serviceId: string;
  userId: string;
  providerId: string;
  status:
    | "pending"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "disputed";
  bookingDetails: {
    scheduledDate: Date;
    scheduledTime: string;
    duration: number;
    location: { address; city; state; coordinates? };
    requirements: string;
    photos: Array<{ url; alt? }>;
    specialInstructions?: string;
  };
  pricing: {
    basePrice: number;
    additionalFees?: number;
    totalAmount: number;
    currency: string;
    paymentMethod: "mobile_money" | "bank_transfer" | "cash";
  };
  jobStatus: {
    currentStatus:
      | "pending"
      | "accepted"
      | "on_way"
      | "in_progress"
      | "completed";
    statusHistory: Array<{ status; timestamp; note; updatedBy }>;
    estimatedStartTime?: Date;
    actualStartTime?: Date;
    actualEndTime?: Date;
  };
  communication: {
    messages: Array<{ senderId; senderType; message; timestamp; isRead }>;
    lastMessageAt: Date;
  };
  payment: {
    status: "pending" | "authorized" | "paid" | "refunded" | "failed";
    transactionId?: string;
    paidAt?: Date;
    refundedAt?: Date;
    refundReason?: string;
  };
  cancellation?: {
    cancelledBy: "user" | "provider" | "admin";
    reason: string;
    cancelledAt: Date;
    refundAmount?: number;
  };
  dispute?: {
    isDisputed: boolean;
    disputeReason?: string;
    disputedAt?: Date;
    resolvedAt?: Date;
    resolution?: string;
    escalatedToAdmin: boolean;
  };
  rating?: {
    userRating?: number;
    userComment?: string;
    providerRating?: number;
    providerComment?: string;
    ratedAt?: Date;
  };
}
```

### Payment Model

```typescript
interface IBookingPayment {
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethod: "mobile_money" | "bank_transfer" | "cash";
  status: "pending" | "authorized" | "paid" | "refunded" | "failed";
  transactionId?: string;
  paymentDetails: {
    mobileMoneyProvider?: "mtn" | "vodafone" | "airtelTigo";
    phoneNumber?: string;
    bankAccount?: string;
    bankName?: string;
  };
  paidAt?: Date;
  refundedAt?: Date;
  refundReason?: string;
}
```

## 🚀 API Endpoints

### Booking Routes (`/api/bookings`)

#### User Routes (Authenticated)

- `POST /` - Create new booking
- `GET /user` - Get user's bookings with filters
- `GET /user/:id` - Get specific booking details
- `POST /:id/messages` - Add message to booking
- `PUT /:id/messages/read` - Mark messages as read
- `POST /:id/cancel` - Cancel booking
- `POST /:id/dispute` - Create dispute
- `GET /user/stats` - Get user booking statistics

#### Provider Routes (Authenticated + Provider Role)

- `GET /provider` - Get provider's bookings with filters
- `GET /provider/:id` - Get specific booking details
- `PUT /provider/:id/status` - Update job status
- `POST /provider/:id/messages` - Add message to booking
- `PUT /provider/:id/messages/read` - Mark messages as read
- `POST /provider/:id/cancel` - Cancel booking
- `POST /provider/:id/dispute` - Create dispute
- `GET /provider/stats` - Get provider booking statistics

#### Admin Routes (Authenticated + Admin Role)

- `GET /admin/all` - Get all bookings with filters
- `GET /admin/stats` - Get admin booking statistics
- `PUT /admin/:id/status` - Update job status
- `POST /admin/:id/dispute/resolve` - Resolve dispute
- `POST /admin/:id/refund` - Process refund

#### General Routes (Both Users & Providers)

- `GET /:id` - Get booking by ID
- `PUT /:id/status` - Update job status

### Payment Routes (`/api/payments`)

#### Public Routes

- `GET /verify/:transactionId` - Verify payment status

#### Protected Routes (Authenticated)

- `POST /:bookingId/process` - Process payment
- `POST /:bookingId/confirm-cash` - Confirm cash payment
- `POST /:bookingId/refund` - Process refund
- `GET /:bookingId` - Get payment by booking ID

#### Admin Routes (Authenticated + Admin Role)

- `GET /admin/stats` - Get payment statistics

## 💳 Payment Processing

### Supported Payment Methods

1. **Mobile Money**

   - MTN Mobile Money
   - Vodafone Cash
   - AirtelTigo Money

2. **Bank Transfer**

   - Direct bank account transfers
   - Real-time processing simulation

3. **Cash Payment**
   - On-site payment confirmation
   - Manual verification workflow

### Payment Flow

1. **Initiation**: User selects payment method during booking
2. **Processing**: Payment service handles transaction
3. **Confirmation**: Payment status updated in real-time
4. **Notification**: Both parties notified of payment status

## 🔔 Notification System

### Notification Types

- **Booking**: New requests, confirmations, cancellations
- **Payment**: Payment confirmations, refunds
- **Status Updates**: Job progress notifications
- **Messages**: New communication alerts
- **System**: Disputes, admin actions

### Notification Channels

- **In-App**: Real-time notifications
- **Email**: Transaction confirmations
- **SMS**: Urgent updates (future implementation)
- **Push**: Mobile app notifications (future implementation)

## 📊 Business Logic

### Job Status Transitions

```
pending → accepted → on_way → in_progress → completed
    ↓         ↓         ↓          ↓
cancelled  cancelled  cancelled  cancelled
```

### Booking Lifecycle

1. **Created**: User submits booking request
2. **Pending**: Provider receives notification
3. **Confirmed**: Provider accepts booking
4. **In Progress**: Service delivery begins
5. **Completed**: Service finished, rating available
6. **Cancelled**: Booking terminated (with refund if applicable)
7. **Disputed**: Conflict resolution process

### Commission Structure

- **Service Categories**: Different commission rates per category
- **Provider Payouts**: Automatic calculation and processing
- **Admin Revenue**: Platform fee collection

## 🔒 Security & Validation

### Authentication

- JWT-based authentication for all protected routes
- Role-based access control (User, Provider, Admin)
- Session management and token refresh

### Data Validation

- Zod schema validation for all inputs
- Sanitization of user inputs
- Rate limiting on API endpoints

### Business Rules

- Status transition validation
- Payment amount verification
- Access control based on booking ownership

## 📈 Analytics & Reporting

### User Analytics

- Booking history and patterns
- Service preferences
- Payment behavior

### Provider Analytics

- Job completion rates
- Customer satisfaction scores
- Revenue tracking

### Admin Analytics

- Platform-wide booking statistics
- Revenue and commission tracking
- Dispute resolution metrics

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- MongoDB 5+
- Redis (for caching, optional)

### Installation

```bash
cd backend
npm install
```

### Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/homeservices

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development
```

### Running the Application

```bash
# Development
npm run dev

# Production
npm run build
npm start

# Testing
npm test
```

## 🧪 Testing

### Test Coverage

- Unit tests for services
- Integration tests for controllers
- API endpoint testing
- Database operation validation

### Running Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 🔮 Future Enhancements

### Planned Features

- **Real-time Chat**: WebSocket-based messaging
- **Payment Gateway Integration**: Stripe, PayPal, etc.
- **SMS Notifications**: Twilio integration
- **Push Notifications**: Firebase Cloud Messaging
- **Advanced Analytics**: Machine learning insights
- **Multi-language Support**: Internationalization

### Scalability Considerations

- **Microservices**: Service decomposition
- **Message Queues**: Redis/RabbitMQ for notifications
- **Caching**: Redis for frequently accessed data
- **Load Balancing**: Horizontal scaling
- **Database Sharding**: Geographic distribution

## 📝 API Documentation

### Request/Response Examples

#### Create Booking

```http
POST /api/bookings
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "serviceId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "providerId": "64f1a2b3c4d5e6f7g8h9i0j2",
  "bookingDetails": {
    "scheduledDate": "2024-01-15T10:00:00.000Z",
    "scheduledTime": "10:00 AM",
    "duration": 2,
    "location": {
      "address": "123 Main Street",
      "city": "Accra",
      "state": "Greater Accra"
    },
    "requirements": "Deep cleaning for 3-bedroom apartment",
    "photos": [
      {
        "url": "https://example.com/photo1.jpg",
        "alt": "Living room before cleaning"
      }
    ]
  },
  "pricing": {
    "basePrice": 150,
    "additionalFees": 25,
    "paymentMethod": "mobile_money"
  }
}
```

#### Update Job Status

```http
PUT /api/bookings/64f1a2b3c4d5e6f7g8h9i0j1/status
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "status": "in_progress",
  "note": "Started cleaning the living room area"
}
```

## 🤝 Contributing

### Development Guidelines

- Follow TypeScript best practices
- Maintain consistent code formatting
- Write comprehensive tests
- Document all new features
- Follow Git commit conventions

### Code Review Process

1. Create feature branch
2. Implement changes with tests
3. Submit pull request
4. Code review and approval
5. Merge to main branch

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Getting Help

- **Documentation**: Check this README and API docs
- **Issues**: Report bugs via GitHub issues
- **Discussions**: Join community discussions
- **Email**: Contact development team

### Common Issues

- **Authentication Errors**: Check JWT token validity
- **Database Connection**: Verify MongoDB connection string
- **Validation Errors**: Review request payload format
- **Permission Denied**: Check user role and permissions

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Maintainer**: Home Services Development Team
