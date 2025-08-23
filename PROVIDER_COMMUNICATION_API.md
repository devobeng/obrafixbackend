# Provider Communication & Support API Documentation

## Overview

The Provider Communication & Support API provides comprehensive functionality for providers to communicate with customers, manage notifications, create support tickets, report problematic customers, and access help resources. The system includes real-time chat, notification management, support ticket system, and a comprehensive help center.

## Base URL

```
/api/provider-communication
```

## Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### ==================== CHAT MANAGEMENT ====================

#### 1. Get Provider Chat Statistics

**GET** `/chat/stats`

Get comprehensive chat statistics for the authenticated provider.

**Headers:**

- Authorization: Bearer <token>
- Role: provider

**Response:**

```json
{
  "success": true,
  "data": {
    "totalConversations": 45,
    "activeConversations": 12,
    "unreadMessages": 8,
    "averageResponseTime": 15.5,
    "responseRate": 85.2,
    "recentMessages": [
      {
        "id": "message_id",
        "senderId": {
          "id": "user_id",
          "firstName": "John",
          "lastName": "Doe",
          "profileImage": "https://example.com/image.jpg"
        },
        "message": "Hello, when will you arrive?",
        "messageType": "text",
        "timestamp": "2024-01-15T10:00:00Z",
        "isRead": false
      }
    ]
  }
}
```

#### 2. Get Provider Conversations

**GET** `/chat/conversations?page=1&limit=20&status=active&search=plumbing`

Get provider conversations with customers, with filtering and pagination.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): "active" | "completed" | "all" (default: "all")
- `search` (optional): Search by customer name or service

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "bookingId": "booking_id",
      "customer": {
        "id": "user_id",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "profileImage": "https://example.com/image.jpg",
        "phone": "+233123456789"
      },
      "service": {
        "id": "service_id",
        "title": "Plumbing Repair",
        "category": "Plumbing"
      },
      "status": "accepted",
      "scheduledDate": "2024-01-15T14:00:00Z",
      "lastMessage": {
        "id": "message_id",
        "message": "I'll be there in 10 minutes",
        "messageType": "text",
        "sender": {
          "id": "provider_id",
          "firstName": "Mike",
          "lastName": "Smith"
        },
        "timestamp": "2024-01-15T13:50:00Z",
        "isRead": true
      },
      "unreadCount": 0,
      "updatedAt": "2024-01-15T13:50:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### 3. Send Quick Response

**POST** `/chat/booking/:bookingId/quick-response`

Send a pre-written quick response to a customer.

**Request Body:**

```json
{
  "templateType": "on_way",
  "customMessage": "Custom message (optional)"
}
```

**Template Types:**

- `greeting`: "Hello! I'm on my way to provide your service. I'll be there shortly."
- `on_way`: "I'm on my way to your location. I'll arrive in about 10-15 minutes."
- `arrived`: "I've arrived at your location. Please let me know where you'd like me to start."
- `completed`: "The service has been completed. Thank you for choosing our service!"
- `custom`: Custom message

**Response:**

```json
{
  "success": true,
  "message": "Quick response sent successfully",
  "data": {
    "id": "message_id",
    "bookingId": "booking_id",
    "senderId": "provider_id",
    "message": "I'm on my way to your location. I'll arrive in about 10-15 minutes.",
    "messageType": "text",
    "timestamp": "2024-01-15T13:50:00Z"
  }
}
```

#### 4. Get Chat History

**GET** `/chat/booking/:bookingId/history?limit=50&before=2024-01-15T10:00:00Z`

Get chat history for a specific booking.

**Query Parameters:**

- `limit` (optional): Number of messages to retrieve (default: 50)
- `before` (optional): Get messages before this timestamp

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "message_id",
      "bookingId": "booking_id",
      "senderId": {
        "id": "user_id",
        "firstName": "John",
        "lastName": "Doe"
      },
      "message": "Hello, when will you arrive?",
      "messageType": "text",
      "timestamp": "2024-01-15T10:00:00Z",
      "isRead": true
    }
  ]
}
```

#### 5. Send Message

**POST** `/chat/booking/:bookingId/message`

Send a new message to a customer.

**Request Body:**

```json
{
  "message": "I'll be there in 10 minutes",
  "messageType": "text",
  "metadata": {
    "location": {
      "latitude": 5.56,
      "longitude": -0.2057
    }
  }
}
```

**Message Types:**

- `text`: Text message
- `image`: Image message
- `file`: File message
- `location`: Location message

#### 6. Mark Messages as Read

**POST** `/chat/messages/read`

Mark messages as read.

**Request Body:**

```json
{
  "messageIds": ["message_id_1", "message_id_2"]
}
```

#### 7. Get Unread Message Count

**GET** `/chat/unread-count?bookingId=booking_id`

Get unread message count for the provider.

**Query Parameters:**

- `bookingId` (optional): Specific booking ID

**Response:**

```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

#### 8. Send Typing Indicator

**POST** `/chat/booking/:bookingId/typing`

Send typing indicator to customer.

**Request Body:**

```json
{
  "isTyping": true
}
```

#### 9. Send Location Update

**POST** `/chat/booking/:bookingId/location`

Send location update to customer.

**Request Body:**

```json
{
  "location": {
    "latitude": 5.56,
    "longitude": -0.2057,
    "address": "Accra, Ghana"
  }
}
```

#### 10. Get Online Status

**GET** `/chat/booking/:bookingId/online-status`

Get online status of users in a booking.

**Response:**

```json
{
  "success": true,
  "data": {
    "user_id": true,
    "provider_id": true
  }
}
```

### ==================== NOTIFICATION MANAGEMENT ====================

#### 11. Get Provider Notification Statistics

**GET** `/notifications/stats`

Get comprehensive notification statistics for the provider.

**Response:**

```json
{
  "success": true,
  "data": {
    "totalNotifications": 150,
    "unreadNotifications": 25,
    "byCategory": {
      "booking": 80,
      "payment": 45,
      "review": 15,
      "system": 10
    },
    "byType": {
      "new_booking_request": 30,
      "payment_received": 25,
      "review_received": 10,
      "job_status_update": 20
    },
    "recentNotifications": [
      {
        "id": "notification_id",
        "title": "New Booking Request",
        "message": "You have a new booking request for Plumbing Repair",
        "type": "new_booking_request",
        "category": "booking",
        "isRead": false,
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

#### 12. Get Notifications by Category

**GET** `/notifications/category/:category?page=1&limit=20&unreadOnly=false`

Get notifications filtered by category.

**Path Parameters:**

- `category`: Category name (booking, payment, review, system, support)

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `unreadOnly` (optional): Show only unread notifications (default: false)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "notification_id",
      "title": "Payment Received",
      "message": "Payment of GHS 500 has been received for your service",
      "type": "payment_received",
      "category": "payment",
      "priority": "high",
      "isRead": false,
      "data": {
        "bookingId": "booking_id",
        "amount": 500
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### 13. Update Notification Preferences

**PUT** `/notifications/preferences`

Update notification preferences for the provider.

**Request Body:**

```json
{
  "newBookings": true,
  "messages": true,
  "payments": true,
  "reviews": true,
  "system": false,
  "email": true,
  "push": true,
  "sms": false
}
```

**Response:**

```json
{
  "success": true,
  "message": "Notification preferences updated successfully"
}
```

### ==================== SUPPORT SYSTEM ====================

#### 14. Create Support Ticket

**POST** `/support/tickets`

Create a new support ticket.

**Request Body:**

```json
{
  "category": "payment",
  "subject": "Payment Issue",
  "description": "I haven't received payment for my last job",
  "priority": "high",
  "attachments": ["https://example.com/screenshot.jpg"]
}
```

**Categories:**

- `technical`: Technical issues
- `billing`: Billing and payment issues
- `account`: Account-related issues
- `service`: Service-related issues
- `payment`: Payment problems
- `withdrawal`: Withdrawal issues
- `general`: General inquiries
- `other`: Other issues

**Priorities:**

- `low`: Low priority
- `medium`: Medium priority
- `high`: High priority
- `urgent`: Urgent priority

**Response:**

```json
{
  "success": true,
  "message": "Support ticket created successfully",
  "data": {
    "id": "ticket_id",
    "providerId": "provider_id",
    "category": "payment",
    "subject": "Payment Issue",
    "description": "I haven't received payment for my last job",
    "priority": "high",
    "status": "open",
    "attachments": ["https://example.com/screenshot.jpg"],
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### 15. Get Support Tickets

**GET** `/support/tickets?page=1&limit=20&status=open`

Get provider's support tickets.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): "open" | "in_progress" | "resolved" | "closed" | "all" (default: "all")

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "ticket_id",
      "providerId": "provider_id",
      "category": "payment",
      "subject": "Payment Issue",
      "description": "I haven't received payment for my last job",
      "priority": "high",
      "status": "open",
      "attachments": ["https://example.com/screenshot.jpg"],
      "adminResponse": "We're investigating this issue",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### ==================== CUSTOMER REPORTING ====================

#### 16. Report Customer

**POST** `/support/report-customer`

Report a problematic customer.

**Request Body:**

```json
{
  "customerId": "customer_id",
  "bookingId": "booking_id",
  "reason": "fraud",
  "description": "Customer refused to pay after service completion",
  "evidence": [
    "https://example.com/evidence1.jpg",
    "https://example.com/evidence2.jpg"
  ],
  "severity": "high"
}
```

**Reasons:**

- `fraud`: Fraudulent behavior
- `abuse`: Platform abuse
- `harassment`: Harassment or threats
- `inappropriate_behavior`: Inappropriate behavior
- `no_show`: Customer no-show
- `cancellation_abuse`: Excessive cancellations
- `payment_issues`: Payment problems
- `safety_concerns`: Safety concerns
- `other`: Other issues

**Severity Levels:**

- `low`: Low severity
- `medium`: Medium severity
- `high`: High severity
- `critical`: Critical severity

**Response:**

```json
{
  "success": true,
  "message": "Customer report submitted successfully",
  "data": {
    "id": "report_id",
    "providerId": "provider_id",
    "customerId": "customer_id",
    "bookingId": "booking_id",
    "reason": "fraud",
    "description": "Customer refused to pay after service completion",
    "evidence": ["https://example.com/evidence1.jpg"],
    "severity": "high",
    "status": "pending",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### 17. Get Customer Reports

**GET** `/support/customer-reports?page=1&limit=20&status=pending`

Get provider's customer reports.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): "pending" | "investigating" | "resolved" | "dismissed" | "all" (default: "all")

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "report_id",
      "providerId": "provider_id",
      "customerId": {
        "id": "customer_id",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "bookingId": {
        "id": "booking_id",
        "serviceId": {
          "id": "service_id",
          "title": "Plumbing Repair"
        },
        "scheduledDate": "2024-01-15T14:00:00Z",
        "totalAmount": 500
      },
      "reason": "fraud",
      "description": "Customer refused to pay after service completion",
      "evidence": ["https://example.com/evidence1.jpg"],
      "severity": "high",
      "status": "pending",
      "adminNotes": "Under investigation",
      "resolution": "Customer account suspended",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### ==================== HELP CENTER ====================

#### 18. Get Help Center Categories

**GET** `/help/categories`

Get help center categories and articles.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "getting-started",
      "title": "Getting Started",
      "description": "Learn how to get started as a provider",
      "icon": "🚀",
      "articles": [
        {
          "id": "how-to-signup",
          "title": "How to Sign Up as a Provider",
          "description": "Step-by-step guide to becoming a provider"
        },
        {
          "id": "profile-setup",
          "title": "Setting Up Your Profile",
          "description": "How to create an attractive provider profile"
        }
      ]
    },
    {
      "id": "bookings",
      "title": "Managing Bookings",
      "description": "Everything about managing your bookings",
      "icon": "📅",
      "articles": [
        {
          "id": "accepting-bookings",
          "title": "Accepting and Managing Bookings",
          "description": "How to handle incoming booking requests"
        }
      ]
    }
  ]
}
```

#### 19. Get Help Center Article

**GET** `/help/article/:articleId`

Get a specific help center article.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "how-to-signup",
    "title": "How to Sign Up as a Provider",
    "content": "<h2>Getting Started as a Provider</h2><p>Follow these steps...</p>",
    "category": "getting-started",
    "tags": ["signup", "registration", "verification"]
  }
}
```

#### 20. Search Help Center

**GET** `/help/search?query=payment`

Search help center articles.

**Query Parameters:**

- `query`: Search query

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "payment-process",
      "title": "How Payments Work",
      "category": "payments",
      "excerpt": "Understanding the payment process..."
    }
  ]
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information (optional)"
}
```

Common HTTP status codes:

- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource not found)
- `500`: Internal Server Error

## Usage Examples

### Frontend Integration

```javascript
// Get chat statistics
const chatStats = await fetch("/api/provider-communication/chat/stats", {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

// Send quick response
const quickResponse = await fetch(
  "/api/provider-communication/chat/booking/booking_id/quick-response",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      templateType: "on_way",
    }),
  }
);

// Create support ticket
const supportTicket = await fetch(
  "/api/provider-communication/support/tickets",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      category: "payment",
      subject: "Payment Issue",
      description: "I haven't received payment",
      priority: "high",
    }),
  }
);

// Report customer
const customerReport = await fetch(
  "/api/provider-communication/support/report-customer",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customerId: "customer_id",
      reason: "fraud",
      description: "Customer refused to pay",
      severity: "high",
    }),
  }
);
```

### Real-time Chat Integration

```javascript
// Connect to WebSocket for real-time chat
const socket = io("ws://localhost:3001");

// Join booking room
socket.emit("join_booking", { bookingId: "booking_id" });

// Listen for new messages
socket.on("new_message", (message) => {
  console.log("New message:", message);
});

// Send typing indicator
socket.emit("typing", { bookingId: "booking_id", isTyping: true });

// Send location update
socket.emit("location_update", {
  bookingId: "booking_id",
  location: { latitude: 5.56, longitude: -0.2057 },
});
```

## Integration with Existing Systems

The Provider Communication & Support API integrates with:

1. **Chat System**: Real-time messaging with customers
2. **Notification System**: Push notifications and alerts
3. **Booking System**: Booking-related communications
4. **Payment System**: Payment notifications and issues
5. **Admin Dashboard**: Support ticket management
6. **User Management**: User verification and profiles

## Performance Considerations

- **Real-time Chat**: WebSocket connections for instant messaging
- **Pagination**: All list endpoints support pagination
- **Caching**: Frequently accessed help center content
- **Rate Limiting**: API rate limiting for abuse prevention
- **File Upload**: Support for image and file attachments

## Security Features

- **Authentication**: JWT token-based authentication
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive input validation
- **File Validation**: Secure file upload validation
- **Rate Limiting**: API rate limiting protection
