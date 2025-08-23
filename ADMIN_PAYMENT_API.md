# Admin Payment Management API Documentation

This document provides comprehensive API documentation for the admin payment management system, including payout management, revenue tracking, commission management, and analytics.

## Base URL

```
/api/admin/payments
```

## Authentication

All endpoints require authentication with admin role:

- Header: `Authorization: Bearer <token>`
- Role: `admin`

---

## 📊 Payout Management

### Get Withdrawal Requests

Retrieve all withdrawal requests with filtering and pagination.

**Endpoint:** `GET /withdrawals`

**Query Parameters:**

- `status` (optional): Filter by status - `pending`, `approved`, `rejected`
- `providerId` (optional): Filter by specific provider
- `dateFrom` (optional): Start date filter (ISO string)
- `dateTo` (optional): End date filter (ISO string)
- `paymentMethod` (optional): Filter by payment method
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**

```json
{
  "status": "success",
  "data": {
    "withdrawals": [
      {
        "_id": "withdrawal_id",
        "providerId": {
          "_id": "provider_id",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "phone": "+1234567890"
        },
        "amount": 500.0,
        "paymentMethod": "bank_transfer",
        "status": "pending",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "totalPages": 3
  }
}
```

### Get Payout Statistics

Get comprehensive payout statistics.

**Endpoint:** `GET /withdrawals/stats`

**Response:**

```json
{
  "status": "success",
  "data": {
    "totalPayouts": 150,
    "pendingPayouts": 25,
    "approvedPayouts": 120,
    "rejectedPayouts": 5,
    "totalAmount": 75000.0,
    "averagePayoutAmount": 500.0,
    "payoutMethods": [
      {
        "method": "bank_transfer",
        "count": 100,
        "totalAmount": 50000.0
      },
      {
        "method": "mobile_money",
        "count": 50,
        "totalAmount": 25000.0
      }
    ]
  }
}
```

### Approve Withdrawal Request

Approve a pending withdrawal request.

**Endpoint:** `POST /withdrawals/:id/approve`

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
    "_id": "withdrawal_id",
    "status": "approved",
    "approvedAt": "2024-01-15T11:00:00Z",
    "adminNotes": "Approved after verification"
  }
}
```

### Reject Withdrawal Request

Reject a pending withdrawal request.

**Endpoint:** `POST /withdrawals/:id/reject`

**Request Body:**

```json
{
  "reason": "Insufficient documentation",
  "adminNotes": "Please provide additional verification documents"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Withdrawal request rejected successfully",
  "data": {
    "_id": "withdrawal_id",
    "status": "rejected",
    "rejectedAt": "2024-01-15T11:00:00Z",
    "rejectionReason": "Insufficient documentation",
    "adminNotes": "Please provide additional verification documents"
  }
}
```

---

## 💰 Revenue & Commission Management

### Get Revenue Statistics

Get comprehensive revenue statistics for different periods.

**Endpoint:** `GET /revenue/stats`

**Query Parameters:**

- `period` (optional): Time period - `day`, `week`, `month`, `year` (default: `month`)

**Response:**

```json
{
  "status": "success",
  "data": {
    "totalRevenue": 150000.0,
    "platformFees": 15000.0,
    "netRevenue": 135000.0,
    "commissionRevenue": 15000.0,
    "refunds": 5000.0,
    "netRevenueAfterRefunds": 130000.0,
    "revenueByPeriod": [
      {
        "period": "2024-01-15",
        "revenue": 5000.0,
        "transactions": 50
      }
    ]
  }
}
```

### Get Commission Statistics

Get detailed commission statistics and top earning providers.

**Endpoint:** `GET /commission/stats`

**Response:**

```json
{
  "status": "success",
  "data": {
    "totalCommissions": 15000.0,
    "averageCommissionRate": 10.5,
    "commissionsByCategory": [
      {
        "categoryId": "category_id",
        "categoryName": "Cleaning Services",
        "commissionRate": 12.0,
        "totalCommissions": 8000.0,
        "transactionCount": 200
      }
    ],
    "topEarningProviders": [
      {
        "providerId": "provider_id",
        "providerName": "John Doe",
        "totalEarnings": 5000.0,
        "commissionPaid": 500.0,
        "transactionCount": 25
      }
    ]
  }
}
```

---

## 📈 Payment Analytics

### Get Payment Analytics

Get comprehensive payment analytics and trends.

**Endpoint:** `GET /analytics/payments`

**Query Parameters:**

- `period` (optional): Time period - `day`, `week`, `month`, `year` (default: `month`)

**Response:**

```json
{
  "status": "success",
  "data": {
    "paymentMethods": [
      {
        "method": "credit_card",
        "count": 500,
        "totalAmount": 75000.0,
        "percentage": 50
      },
      {
        "method": "mobile_money",
        "count": 300,
        "totalAmount": 45000.0,
        "percentage": 30
      }
    ],
    "paymentStatus": [
      {
        "status": "completed",
        "count": 800,
        "totalAmount": 120000.0,
        "percentage": 80
      },
      {
        "status": "pending",
        "count": 200,
        "totalAmount": 30000.0,
        "percentage": 20
      }
    ],
    "dailyPayments": [
      {
        "date": "2024-01-15",
        "count": 50,
        "totalAmount": 7500.0
      }
    ],
    "monthlyTrends": [
      {
        "month": "2024-01",
        "revenue": 150000.0,
        "transactions": 1000,
        "averageAmount": 150.0
      }
    ]
  }
}
```

---

## 🔌 Integration Management

### Get Payment Integration Status

Get the status of payment integrations.

**Endpoint:** `GET /integrations/status`

**Response:**

```json
{
  "status": "success",
  "data": {
    "stripe": {
      "enabled": true,
      "status": "active"
    },
    "paystack": {
      "enabled": true,
      "status": "active"
    },
    "mobileMoney": {
      "enabled": false,
      "status": "inactive"
    }
  }
}
```

### Update Payment Integration Settings

Update payment integration configuration.

**Endpoint:** `PATCH /integrations/settings`

**Request Body:**

```json
{
  "settings": {
    "stripe": {
      "enabled": true,
      "apiKey": "sk_test_..."
    },
    "paystack": {
      "enabled": true,
      "secretKey": "sk_test_..."
    },
    "mobileMoney": {
      "enabled": true,
      "provider": "mpesa"
    }
  }
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Payment integration settings updated successfully"
}
```

---

## 📊 Reports & Analytics

### Get Daily Revenue Report

Get detailed daily revenue report.

**Endpoint:** `GET /reports/revenue/daily`

**Query Parameters:**

- `date` (optional): Specific date (ISO string, default: today)

**Response:**

```json
{
  "status": "success",
  "data": {
    "date": "2024-01-15",
    "totalRevenue": 5000.0,
    "platformFees": 500.0,
    "netRevenue": 4500.0,
    "transactions": 50
  }
}
```

### Get Weekly Revenue Report

Get weekly revenue report.

**Endpoint:** `GET /reports/revenue/weekly`

**Query Parameters:**

- `period` (optional): Time period - `day`, `week`, `month`, `year`

**Response:**

```json
{
  "status": "success",
  "data": {
    "totalRevenue": 35000.0,
    "platformFees": 3500.0,
    "netRevenue": 31500.0,
    "transactions": 350
  }
}
```

### Get Monthly Revenue Report

Get monthly revenue report.

**Endpoint:** `GET /reports/revenue/monthly`

**Query Parameters:**

- `period` (optional): Time period - `day`, `week`, `month`, `year`

**Response:**

```json
{
  "status": "success",
  "data": {
    "totalRevenue": 150000.0,
    "platformFees": 15000.0,
    "netRevenue": 135000.0,
    "transactions": 1500
  }
}
```

### Get Top Services Report

Get report of top performing services.

**Endpoint:** `GET /reports/services/top`

**Query Parameters:**

- `period` (optional): Time period - `day`, `week`, `month`, `year`
- `limit` (optional): Number of services to return (default: 10)

**Response:**

```json
{
  "status": "success",
  "data": {
    "period": "month",
    "topServices": [
      {
        "serviceId": "service_id",
        "serviceName": "House Cleaning",
        "totalRevenue": 15000.0,
        "totalBookings": 150,
        "averageRating": 4.5
      }
    ]
  }
}
```

### Get Top Vendors Report

Get report of top earning vendors.

**Endpoint:** `GET /reports/vendors/top`

**Query Parameters:**

- `period` (optional): Time period - `day`, `week`, `month`, `year`
- `limit` (optional): Number of vendors to return (default: 10)

**Response:**

```json
{
  "status": "success",
  "data": {
    "period": "month",
    "topVendors": [
      {
        "providerId": "provider_id",
        "providerName": "John Doe",
        "totalEarnings": 5000.0,
        "commissionPaid": 500.0,
        "transactionCount": 25
      }
    ]
  }
}
```

### Get Customer Activity Report

Get comprehensive customer activity analytics.

**Endpoint:** `GET /reports/customers/activity`

**Query Parameters:**

- `period` (optional): Time period - `day`, `week`, `month`, `year`

**Response:**

```json
{
  "status": "success",
  "data": {
    "period": "month",
    "totalCustomers": 1250,
    "activeCustomers": 850,
    "newCustomers": 120,
    "repeatCustomers": 730,
    "averageBookingsPerCustomer": 2.5,
    "customerRetentionRate": 68.5,
    "topCustomerSegments": [
      {
        "segment": "Premium",
        "count": 250,
        "revenue": 45000.0
      },
      {
        "segment": "Regular",
        "count": 600,
        "revenue": 35000.0
      }
    ]
  }
}
```

### Get Usage Analytics

Get comprehensive platform usage analytics.

**Endpoint:** `GET /reports/usage/analytics`

**Query Parameters:**

- `period` (optional): Time period - `day`, `week`, `month`, `year`

**Response:**

```json
{
  "status": "success",
  "data": {
    "period": "month",
    "totalBookings": 2500,
    "completedBookings": 2300,
    "cancelledBookings": 150,
    "disputedBookings": 50,
    "averageBookingValue": 85.5,
    "peakBookingHours": [
      {
        "hour": "09:00",
        "bookings": 180
      },
      {
        "hour": "10:00",
        "bookings": 220
      }
    ],
    "popularServiceCategories": [
      {
        "category": "Cleaning",
        "bookings": 800,
        "revenue": 68000.0
      },
      {
        "category": "Repairs",
        "bookings": 600,
        "revenue": 72000.0
      }
    ],
    "platformUsage": {
      "mobileApp": 65,
      "webApp": 30,
      "phone": 5
    }
  }
}
```

---

## 🔧 Error Responses

### Validation Error

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "reason",
      "message": "Rejection reason is required"
    }
  ]
}
```

### Not Found Error

```json
{
  "status": "error",
  "message": "Withdrawal request not found"
}
```

### Unauthorized Error

```json
{
  "status": "error",
  "message": "Access denied. Admin role required."
}
```

### Server Error

```json
{
  "status": "error",
  "message": "Internal server error"
}
```

---

## 📝 Notes

1. **Authentication**: All endpoints require valid JWT token with admin role
2. **Pagination**: List endpoints support pagination with `page` and `limit` parameters
3. **Filtering**: Most endpoints support various filtering options via query parameters
4. **Date Formats**: All dates should be in ISO 8601 format
5. **Amounts**: All monetary amounts are in the platform's base currency
6. **Rate Limiting**: Endpoints are subject to rate limiting (100 requests per 15 minutes)
7. **Webhooks**: Payment integrations may trigger webhooks for real-time updates
8. **Audit Trail**: All admin actions are logged for audit purposes

---

## 🚀 Integration Examples

### Approve Multiple Withdrawals

```bash
# Get pending withdrawals
curl -X GET "http://localhost:3001/api/admin/payments/withdrawals?status=pending" \
  -H "Authorization: Bearer <admin_token>"

# Approve a withdrawal
curl -X POST "http://localhost:3001/api/admin/payments/withdrawals/withdrawal_id/approve" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"adminNotes": "Approved after verification"}'
```

### Generate Revenue Report

```bash
# Get monthly revenue stats
curl -X GET "http://localhost:3001/api/admin/payments/revenue/stats?period=month" \
  -H "Authorization: Bearer <admin_token>"

# Get top services report
curl -X GET "http://localhost:3001/api/admin/payments/reports/services/top?period=month&limit=5" \
  -H "Authorization: Bearer <admin_token>"
```

### Update Payment Integrations

```bash
# Update Stripe settings
curl -X PATCH "http://localhost:3001/api/admin/payments/integrations/settings" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "stripe": {
        "enabled": true,
        "apiKey": "sk_test_..."
      }
    }
  }'
```
