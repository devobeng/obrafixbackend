# Provider Earnings & Payments API Documentation

## Overview

The Provider Earnings & Payments API provides comprehensive functionality for providers to manage their earnings, track payments, view income reports, and process withdrawals. The system includes commission calculations, wallet management, and detailed financial reporting.

## Base URL

```
/api/provider-earnings
```

## Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Earnings Dashboard

**GET** `/dashboard`

Get comprehensive earnings dashboard data including daily, weekly, and monthly reports.

**Headers:**

- Authorization: Bearer <token>
- Role: provider

**Response:**

```json
{
  "success": true,
  "data": {
    "dailyReport": {
      "period": "daily",
      "totalEarnings": 1500,
      "netEarnings": 1275,
      "platformFees": 225,
      "commissionRate": 0.15,
      "totalJobs": 3,
      "averagePerJob": 500,
      "currency": "GHS",
      "breakdown": {
        "2024-01-15": 500,
        "2024-01-16": 1000
      }
    },
    "weeklyReport": {
      "period": "weekly",
      "totalEarnings": 3500,
      "netEarnings": 2975,
      "platformFees": 525,
      "commissionRate": 0.15,
      "totalJobs": 7,
      "averagePerJob": 500,
      "currency": "GHS",
      "breakdown": {
        "2024-01-14": 2000,
        "2024-01-15": 1500
      }
    },
    "monthlyReport": {
      "period": "monthly",
      "totalEarnings": 12000,
      "netEarnings": 10200,
      "platformFees": 1800,
      "commissionRate": 0.15,
      "totalJobs": 24,
      "averagePerJob": 500,
      "currency": "GHS",
      "breakdown": {
        "2024-01": 12000
      }
    },
    "walletSummary": {
      "wallet": {
        "id": "wallet_id",
        "balance": 2500,
        "currency": "GHS",
        "isActive": true,
        "lastTransactionAt": "2024-01-16T10:30:00Z"
      },
      "stats": {
        "totalBalance": 2500,
        "totalTransactions": 30,
        "totalCredits": 15000,
        "totalDebits": 5000,
        "totalWithdrawals": 7500,
        "totalFees": 1800
      },
      "recentTransactions": [...],
      "pendingWithdrawals": 2,
      "pendingAmount": 1000
    },
    "performanceMetrics": {
      "period": "month",
      "totalJobs": 24,
      "totalRevenue": 12000,
      "averageJobValue": 500,
      "averageRating": 4.8,
      "completionRate": 100
    }
  }
}
```

### 2. Earnings Report

**GET** `/report?period=daily&startDate=2024-01-01&endDate=2024-01-31`

Get earnings report for a specific period.

**Query Parameters:**

- `period` (required): "daily" | "weekly" | "monthly" | "yearly"
- `startDate` (optional): Start date in ISO format
- `endDate` (optional): End date in ISO format

**Response:**

```json
{
  "success": true,
  "data": {
    "period": "monthly",
    "totalEarnings": 12000,
    "netEarnings": 10200,
    "platformFees": 1800,
    "commissionRate": 0.15,
    "totalJobs": 24,
    "averagePerJob": 500,
    "currency": "GHS",
    "breakdown": {
      "2024-01": 12000
    }
  }
}
```

### 3. Earnings Breakdown

**GET** `/breakdown?startDate=2024-01-01&endDate=2024-01-31&groupBy=day`

Get detailed earnings breakdown grouped by day, week, or month.

**Query Parameters:**

- `startDate` (required): Start date in ISO format
- `endDate` (required): End date in ISO format
- `groupBy` (optional): "day" | "week" | "month" (default: "day")

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": {
        "year": 2024,
        "month": 1,
        "day": 15
      },
      "totalEarnings": 500,
      "netEarnings": 425,
      "platformFees": 75,
      "jobCount": 1,
      "transactions": [...]
    }
  ]
}
```

### 4. Wallet Summary

**GET** `/wallet-summary`

Get provider's wallet summary including balance, stats, and recent transactions.

**Response:**

```json
{
  "success": true,
  "data": {
    "wallet": {
      "id": "wallet_id",
      "balance": 2500,
      "currency": "GHS",
      "isActive": true,
      "lastTransactionAt": "2024-01-16T10:30:00Z"
    },
    "stats": {
      "totalBalance": 2500,
      "totalTransactions": 30,
      "totalCredits": 15000,
      "totalDebits": 5000,
      "totalWithdrawals": 7500,
      "totalFees": 1800
    },
    "recentTransactions": [
      {
        "id": "tx_id",
        "type": "credit",
        "amount": 425,
        "description": "Payment for completed job - Booking #123",
        "status": "completed",
        "createdAt": "2024-01-16T10:30:00Z",
        "metadata": {
          "bookingId": "booking_123",
          "platformFee": 75,
          "commissionRate": 0.15,
          "grossAmount": 500,
          "netAmount": 425
        }
      }
    ],
    "pendingWithdrawals": 2,
    "pendingAmount": 1000
  }
}
```

### 5. Payment History

**GET** `/payment-history?page=1&limit=50&type=credit&startDate=2024-01-01`

Get provider's payment history with filtering options.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `type` (optional): Transaction type filter
- `status` (optional): Transaction status filter
- `startDate` (optional): Start date filter
- `endDate` (optional): End date filter

**Response:**

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "tx_id",
        "type": "credit",
        "amount": 425,
        "description": "Payment for completed job - Booking #123",
        "status": "completed",
        "createdAt": "2024-01-16T10:30:00Z",
        "metadata": {
          "bookingId": {
            "id": "booking_123",
            "title": "House Cleaning Service",
            "totalAmount": 500
          },
          "platformFee": 75,
          "commissionRate": 0.15,
          "grossAmount": 500,
          "netAmount": 425
        }
      }
    ],
    "total": 30
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 30,
    "totalPages": 1
  }
}
```

### 6. Withdrawal History

**GET** `/withdrawal-history?page=1&limit=50`

Get provider's withdrawal request history.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:**

```json
{
  "success": true,
  "data": {
    "withdrawals": [
      {
        "id": "withdrawal_id",
        "amount": 1000,
        "currency": "GHS",
        "withdrawalMethod": "bank_transfer",
        "status": "completed",
        "platformFee": 50,
        "netAmount": 950,
        "reference": "WDR_ABC123",
        "createdAt": "2024-01-15T09:00:00Z",
        "withdrawalDetails": {
          "bankDetails": {
            "accountNumber": "1234567890",
            "accountName": "John Doe",
            "bankName": "Ghana Commercial Bank"
          }
        }
      }
    ],
    "total": 5
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 5,
    "totalPages": 1
  }
}
```

### 7. Performance Metrics

**GET** `/performance-metrics?period=month`

Get provider's performance metrics for a specific period.

**Query Parameters:**

- `period` (optional): "week" | "month" | "year" (default: "month")

**Response:**

```json
{
  "success": true,
  "data": {
    "period": "month",
    "totalJobs": 24,
    "totalRevenue": 12000,
    "averageJobValue": 500,
    "averageRating": 4.8,
    "completionRate": 100
  }
}
```

### 8. Calculate Estimated Earnings

**POST** `/calculate-estimated`

Calculate estimated earnings for a job amount (including commission).

**Request Body:**

```json
{
  "amount": 500
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "grossAmount": 500,
    "commission": 75,
    "netAmount": 425,
    "rate": 0.15
  }
}
```

## Admin Endpoints

### 9. Get Commission Configuration

**GET** `/commission-config`

Get current commission configuration (admin only).

**Headers:**

- Authorization: Bearer <token>
- Role: admin

**Response:**

```json
{
  "success": true,
  "data": {
    "rate": 0.15,
    "minimumAmount": 0,
    "tieredRates": [
      {
        "minAmount": 0,
        "maxAmount": 1000,
        "rate": 0.2
      },
      {
        "minAmount": 1000,
        "maxAmount": 5000,
        "rate": 0.15
      },
      {
        "minAmount": 5000,
        "rate": 0.1
      }
    ]
  }
}
```

### 10. Update Commission Configuration

**PUT** `/commission-config`

Update commission configuration (admin only).

**Request Body:**

```json
{
  "rate": 0.12,
  "tieredRates": [
    {
      "minAmount": 0,
      "maxAmount": 1000,
      "rate": 0.18
    },
    {
      "minAmount": 1000,
      "rate": 0.12
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Commission configuration updated successfully",
  "data": {
    "rate": 0.12,
    "minimumAmount": 0,
    "tieredRates": [...]
  }
}
```

### 11. Process Job Payment

**POST** `/process-job-payment`

Process payment to provider after job completion (admin only).

**Request Body:**

```json
{
  "providerId": "provider_id",
  "bookingId": "booking_id",
  "amount": 500,
  "jobDetails": {
    "serviceType": "cleaning",
    "duration": "2 hours",
    "location": "Accra, Ghana"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Job payment processed successfully",
  "data": {
    "id": "transaction_id",
    "type": "credit",
    "amount": 425,
    "description": "Payment for completed job - Booking #123",
    "status": "completed",
    "metadata": {
      "bookingId": "booking_id",
      "platformFee": 75,
      "commissionRate": 0.15,
      "grossAmount": 500,
      "netAmount": 425
    }
  }
}
```

## Commission Structure

The platform uses a tiered commission structure:

- **0 - 1,000 GHS**: 20% commission
- **1,000 - 5,000 GHS**: 15% commission
- **5,000+ GHS**: 10% commission

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

## Integration with Existing Systems

The Provider Earnings API integrates with:

1. **Wallet System**: Uses existing wallet functionality for balance management
2. **Withdrawal System**: Leverages existing withdrawal request processing
3. **Booking System**: Processes payments when jobs are completed
4. **User Management**: Validates provider roles and permissions

## Usage Examples

### Frontend Integration

```javascript
// Get earnings dashboard
const response = await fetch("/api/provider-earnings/dashboard", {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

// Calculate estimated earnings
const estimatedEarnings = await fetch(
  "/api/provider-earnings/calculate-estimated",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount: 500 }),
  }
);
```

### Webhook Integration

When a job is completed, the system automatically:

1. Calculates commission based on the job amount
2. Processes payment to provider's wallet
3. Creates transaction records
4. Updates earnings reports
5. Sends notifications to provider
