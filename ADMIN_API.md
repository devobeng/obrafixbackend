# Admin API Documentation

This document outlines the comprehensive admin API endpoints for the Home Services platform, including service & category management and booking management features.

## Base URL

```
/api/admin
```

## Authentication

All admin endpoints require authentication with admin role:

- **Header**: `Authorization: Bearer <jwt_token>`
- **Role**: `admin`

---

## 1. Service & Category Management

### 1.1 Create Service Category

**POST** `/categories`

Create a new service category with commission rate settings.

**Request Body:**

```json
{
  "name": "Plumbing Services",
  "description": "Professional plumbing and pipe repair services",
  "icon": "faucet",
  "parentCategory": "507f1f77bcf86cd799439011", // Optional
  "commissionRate": 15.5,
  "isActive": true,
  "sortOrder": 1
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Service category created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Plumbing Services",
    "description": "Professional plumbing and pipe repair services",
    "icon": "faucet",
    "commissionRate": 15.5,
    "isActive": true,
    "sortOrder": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 1.2 Update Service Category

**PUT** `/categories/:id`

Update an existing service category.

**Request Body:**

```json
{
  "name": "Advanced Plumbing Services",
  "description": "Updated description",
  "commissionRate": 18.0,
  "isActive": true
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Service category updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Advanced Plumbing Services",
    "description": "Updated description",
    "commissionRate": 18.0,
    "isActive": true,
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### 1.3 Delete Service Category

**DELETE** `/categories/:id`

Delete a service category (only if no services or subcategories exist).

**Response:**

```json
{
  "status": "success",
  "message": "Service category deleted successfully"
}
```

### 1.4 Set Commission Rate

**PATCH** `/categories/:id/commission-rate`

Set commission rate for a specific service category.

**Request Body:**

```json
{
  "commissionRate": 20.0
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Commission rate updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Plumbing Services",
    "commissionRate": 20.0,
    "updatedAt": "2024-01-15T11:30:00.000Z"
  }
}
```

### 1.5 Get Category Statistics

**GET** `/categories/stats`

Get comprehensive statistics about service categories.

**Response:**

```json
{
  "status": "success",
  "data": {
    "totalCategories": 25,
    "activeCategories": 22,
    "categoriesWithServices": 20,
    "averageCommissionRate": 12.5,
    "topCategories": [
      {
        "categoryId": "507f1f77bcf86cd799439012",
        "name": "Plumbing Services",
        "serviceCount": 45,
        "totalRevenue": 125000
      }
    ]
  }
}
```

---

## 2. Booking Management

### 2.1 Get Live Booking Statistics

**GET** `/bookings/live-stats`

Get real-time statistics about all bookings.

**Response:**

```json
{
  "status": "success",
  "data": {
    "totalBookings": 1500,
    "activeBookings": 45,
    "pendingBookings": 12,
    "disputedBookings": 3,
    "cancelledBookings": 25,
    "completedBookings": 1415,
    "totalRevenue": 250000,
    "averageBookingValue": 166.67,
    "recentDisputes": [
      {
        "bookingId": "507f1f77bcf86cd799439013",
        "customerName": "John Doe",
        "providerName": "Jane Smith",
        "serviceTitle": "House Cleaning",
        "disputeReason": "Service not completed as agreed",
        "createdAt": "2024-01-15T09:00:00.000Z"
      }
    ]
  }
}
```

### 2.2 Monitor Live Bookings

**GET** `/bookings/live`

Monitor live bookings with real-time updates and filtering.

**Query Parameters:**

- `status` (optional): Filter by booking status
- `dateFrom` (optional): Start date filter
- `dateTo` (optional): End date filter
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**

```json
{
  "status": "success",
  "data": {
    "bookings": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "serviceId": {
          "_id": "507f1f77bcf86cd799439014",
          "title": "House Cleaning",
          "category": "Cleaning",
          "basePrice": 150
        },
        "userId": {
          "_id": "507f1f77bcf86cd799439015",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "phone": "+233123456789"
        },
        "providerId": {
          "_id": "507f1f77bcf86cd799439016",
          "firstName": "Jane",
          "lastName": "Smith",
          "email": "jane@example.com",
          "phone": "+233987654321"
        },
        "status": "in_progress",
        "bookingDetails": {
          "scheduledDate": "2024-01-15T14:00:00.000Z",
          "scheduledTime": "14:00",
          "duration": 3,
          "location": {
            "address": "123 Main St",
            "city": "Accra",
            "state": "Greater Accra"
          }
        },
        "pricing": {
          "totalAmount": 180,
          "currency": "GHS"
        }
      }
    ],
    "total": 45,
    "page": 1,
    "totalPages": 3
  }
}
```

### 2.3 Handle Booking Cancellation

**POST** `/bookings/:id/cancel`

Cancel a booking and process refunds if applicable.

**Request Body:**

```json
{
  "reason": "Provider unavailable",
  "refundAmount": 180,
  "adminNotes": "Provider called in sick",
  "notifyParties": true
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Booking cancelled successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "status": "cancelled",
    "cancellation": {
      "cancelledBy": "admin",
      "reason": "Provider unavailable",
      "cancelledAt": "2024-01-15T12:00:00.000Z",
      "refundAmount": 180
    },
    "payment": {
      "status": "refunded",
      "refundedAt": "2024-01-15T12:00:00.000Z",
      "refundReason": "Provider unavailable"
    }
  }
}
```

### 2.4 Process Booking Refund

**POST** `/bookings/:id/refund`

Process a refund for a specific booking.

**Request Body:**

```json
{
  "amount": 90,
  "reason": "Partial refund due to incomplete service",
  "adminNotes": "Service was only 50% completed",
  "notifyParties": true
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Refund processed successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "payment": {
      "status": "refunded",
      "refundedAt": "2024-01-15T12:30:00.000Z",
      "refundReason": "Partial refund due to incomplete service"
    }
  }
}
```

### 2.5 Escalate Dispute

**POST** `/bookings/:id/dispute/escalate`

Escalate a dispute to higher authority for review.

**Request Body:**

```json
{
  "escalatedTo": "senior_admin",
  "reason": "Complex dispute requiring senior review",
  "adminNotes": "Multiple conflicting statements from both parties",
  "priority": "high"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Dispute escalated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "dispute": {
      "isDisputed": true,
      "escalatedTo": "senior_admin",
      "escalationReason": "Complex dispute requiring senior review",
      "escalationDate": "2024-01-15T13:00:00.000Z",
      "priority": "high",
      "adminNotes": "Multiple conflicting statements from both parties"
    }
  }
}
```

### 2.6 Resolve Dispute

**POST** `/bookings/:id/dispute/resolve`

Resolve a dispute with final decision and actions.

**Request Body:**

```json
{
  "resolution": "customer_favored",
  "adminNotes": "Provider failed to deliver service as agreed",
  "refundAmount": 180,
  "penaltyAmount": 50
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Dispute resolved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "dispute": {
      "isDisputed": true,
      "resolution": "customer_favored",
      "resolvedAt": "2024-01-15T14:00:00.000Z",
      "adminNotes": "Provider failed to deliver service as agreed",
      "refundAmount": 180,
      "penaltyAmount": 50
    },
    "payment": {
      "status": "refunded",
      "refundedAt": "2024-01-15T14:00:00.000Z",
      "refundReason": "Dispute resolution: customer_favored"
    }
  }
}
```

### 2.7 Get Dispute Statistics

**GET** `/disputes/stats`

Get comprehensive statistics about disputes and their resolution.

**Response:**

```json
{
  "status": "success",
  "data": {
    "totalDisputes": 25,
    "resolvedDisputes": 20,
    "pendingDisputes": 5,
    "escalatedDisputes": 3,
    "averageResolutionTime": 2.5,
    "disputeReasons": [
      {
        "reason": "Service not completed",
        "count": 10,
        "percentage": 40
      },
      {
        "reason": "Poor quality service",
        "count": 8,
        "percentage": 32
      }
    ],
    "resolutionOutcomes": [
      {
        "resolution": "customer_favored",
        "count": 12,
        "percentage": 60
      },
      {
        "resolution": "partial_refund",
        "count": 5,
        "percentage": 25
      }
    ]
  }
}
```

---

## 3. User Management

### 3.1 Get All Users

**GET** `/users`

Get all users with pagination and filtering.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `role` (optional): Filter by user role
- `status` (optional): Filter by account status
- `search` (optional): Search by name, email, or phone
- `sortBy` (optional): Sort field (default: createdAt)
- `sortOrder` (optional): Sort order (default: desc)

**Response:**

```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439015",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+233123456789",
        "role": "user",
        "accountStatus": "active",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPages": 15
    }
  }
}
```

### 3.2 Update User Status

**PATCH** `/users/:id/status`

Update user account status.

**Request Body:**

```json
{
  "status": "suspended",
  "reason": "Violation of terms of service"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "User status updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "accountStatus": "suspended",
    "suspendedReason": "Violation of terms of service",
    "suspendedAt": "2024-01-15T15:00:00.000Z"
  }
}
```

### 3.3 Verify Provider Documents

**PATCH** `/users/:id/verify`

Verify or reject provider verification documents.

**Request Body:**

```json
{
  "isVerified": true,
  "reason": "Documents verified successfully"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Provider verification approved",
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "isVerified": true,
    "providerProfile": {
      "idVerification": {
        "isVerified": true,
        "verifiedAt": "2024-01-15T15:30:00.000Z"
      }
    }
  }
}
```

---

## 4. Service Management

### 4.1 Get All Services

**GET** `/services`

Get all services with pagination and filtering.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by service status
- `category` (optional): Filter by category ID
- `search` (optional): Search by title or description
- `sortBy` (optional): Sort field (default: createdAt)
- `sortOrder` (optional): Sort order (default: desc)

**Response:**

```json
{
  "status": "success",
  "data": {
    "services": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "title": "House Cleaning",
        "description": "Professional house cleaning services",
        "category": "507f1f77bcf86cd799439012",
        "basePrice": 150,
        "status": "active",
        "provider": "507f1f77bcf86cd799439016",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 500,
      "totalPages": 50
    }
  }
}
```

### 4.2 Update Service Status

**PATCH** `/services/:id/status`

Update service status.

**Request Body:**

```json
{
  "status": "suspended",
  "reason": "Service under review"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Service status updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "status": "suspended",
    "suspendedReason": "Service under review",
    "suspendedAt": "2024-01-15T16:00:00.000Z"
  }
}
```

---

## 5. Payment Management

### 5.1 Get All Withdrawal Requests

**GET** `/withdrawals`

Get all withdrawal requests with pagination and filtering.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by withdrawal status
- `dateFrom` (optional): Start date filter
- `dateTo` (optional): End date filter
- `sortBy` (optional): Sort field (default: createdAt)
- `sortOrder` (optional): Sort order (default: desc)

**Response:**

```json
{
  "status": "success",
  "data": {
    "withdrawals": [
      {
        "_id": "507f1f77bcf86cd799439017",
        "provider": "507f1f77bcf86cd799439016",
        "amount": 500,
        "paymentMethod": "mobile_money",
        "status": "pending",
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### 5.2 Approve Withdrawal Request

**PATCH** `/withdrawals/:id/approve`

Approve a withdrawal request.

**Request Body:**

```json
{
  "adminNotes": "Approved after verification"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Withdrawal request approved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    "status": "approved",
    "approvedAt": "2024-01-15T16:30:00.000Z",
    "adminNotes": "Approved after verification"
  }
}
```

### 5.3 Reject Withdrawal Request

**PATCH** `/withdrawals/:id/reject`

Reject a withdrawal request.

**Request Body:**

```json
{
  "reason": "Insufficient balance",
  "adminNotes": "Account balance is lower than requested amount"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Withdrawal request rejected successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    "status": "rejected",
    "rejectedAt": "2024-01-15T17:00:00.000Z",
    "rejectionReason": "Insufficient balance",
    "adminNotes": "Account balance is lower than requested amount"
  }
}
```

---

## 6. Analytics and Reports

### 6.1 Get Dashboard Overview

**GET** `/dashboard`

Get comprehensive dashboard overview with key metrics.

**Response:**

```json
{
  "status": "success",
  "data": {
    "totalUsers": 1500,
    "totalProviders": 250,
    "totalBookings": 5000,
    "totalRevenue": 750000,
    "activeBookings": 45,
    "pendingDisputes": 5,
    "recentActivity": [
      {
        "type": "new_booking",
        "message": "New booking created",
        "timestamp": "2024-01-15T17:30:00.000Z"
      }
    ]
  }
}
```

### 6.2 Get Revenue Report

**GET** `/reports/revenue`

Get detailed revenue report with filtering.

**Query Parameters:**

- `period` (optional): Report period (daily, weekly, monthly, yearly)
- `startDate` (optional): Start date for custom range
- `endDate` (optional): End date for custom range

**Response:**

```json
{
  "status": "success",
  "data": {
    "totalRevenue": 750000,
    "totalBookings": 5000,
    "averageBookingValue": 150,
    "revenueByPeriod": [
      {
        "period": "2024-01",
        "revenue": 250000,
        "bookings": 1500
      }
    ],
    "revenueByCategory": [
      {
        "category": "Cleaning",
        "revenue": 300000,
        "percentage": 40
      }
    ]
  }
}
```

### 6.3 Generate Analytics

**POST** `/analytics/generate`

Generate custom analytics reports.

**Request Body:**

```json
{
  "type": "revenue",
  "filters": {
    "category": "507f1f77bcf86cd799439012",
    "location": "Accra"
  },
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "report": {
      "totalRevenue": 250000,
      "totalBookings": 1500,
      "averageRating": 4.5,
      "topProviders": [
        {
          "providerId": "507f1f77bcf86cd799439016",
          "name": "Jane Smith",
          "revenue": 25000,
          "bookings": 150
        }
      ]
    },
    "generatedAt": "2024-01-15T18:00:00.000Z"
  }
}
```

---

## 7. System Settings

### 7.1 Get System Settings

**GET** `/settings`

Get current system settings.

**Response:**

```json
{
  "status": "success",
  "data": {
    "platformFee": 0.05,
    "minimumWithdrawal": 50,
    "maximumWithdrawal": 10000,
    "autoApprovalThreshold": 1000,
    "currency": "GHS",
    "timezone": "Africa/Accra",
    "defaultCommissionRate": 10,
    "disputeResolutionTime": 7,
    "maxCancellationTime": 24,
    "updatedAt": "2024-01-15T18:30:00.000Z"
  }
}
```

### 7.2 Update System Settings

**PUT** `/settings`

Update system settings.

**Request Body:**

```json
{
  "settings": {
    "platformFee": 0.06,
    "minimumWithdrawal": 100,
    "defaultCommissionRate": 12,
    "disputeResolutionTime": 5
  }
}
```

**Response:**

```json
{
  "status": "success",
  "message": "System settings updated successfully",
  "data": {
    "platformFee": 0.06,
    "minimumWithdrawal": 100,
    "defaultCommissionRate": 12,
    "disputeResolutionTime": 5,
    "updatedAt": "2024-01-15T19:00:00.000Z"
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "status": "error",
  "message": "Validation error message",
  "errors": [
    {
      "field": "commissionRate",
      "message": "Commission rate must be between 0 and 100"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "status": "error",
  "message": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "status": "error",
  "message": "Admin access required"
}
```

### 404 Not Found

```json
{
  "status": "error",
  "message": "Resource not found"
}
```

### 409 Conflict

```json
{
  "status": "error",
  "message": "Category with this name already exists"
}
```

### 500 Internal Server Error

```json
{
  "status": "error",
  "message": "Internal server error"
}
```

---

## Rate Limiting

- **Standard endpoints**: 100 requests per minute
- **Analytics endpoints**: 20 requests per minute
- **Bulk operations**: 10 requests per minute

---

## Webhook Notifications

The admin API automatically sends webhook notifications for:

- Booking cancellations
- Dispute escalations
- Dispute resolutions
- Withdrawal approvals/rejections
- User status changes

Webhook endpoints can be configured in the system settings.
