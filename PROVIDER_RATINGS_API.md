# Provider Ratings & Reviews API Documentation

## Overview

The Provider Ratings & Reviews API provides comprehensive functionality for providers to view, manage, and analyze their customer reviews and ratings. The system includes detailed analytics, improvement recommendations, and tools for providers to respond to reviews and improve their service quality.

## Base URL

```
/api/provider-ratings
```

## Authentication

Provider endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Provider Endpoints

### 1. Get Rating Statistics

**GET** `/stats`

Get comprehensive rating statistics for the authenticated provider.

**Headers:**

- Authorization: Bearer <token>
- Role: provider

**Response:**

```json
{
  "success": true,
  "data": {
    "overallRating": 4.2,
    "totalReviews": 45,
    "ratingDistribution": {
      "5": 20,
      "4": 15,
      "3": 8,
      "2": 1,
      "1": 1
    },
    "categoryRatings": {
      "jobRating": 4.3,
      "communicationRating": 4.1,
      "punctualityRating": 4.5,
      "qualityRating": 4.2
    },
    "recentReviews": [...],
    "verifiedReviews": 40,
    "responseRate": 85.5,
    "averageResponseTime": 12.3
  }
}
```

### 2. Get Reviews

**GET** `/reviews?page=1&limit=10&rating=5&sortBy=date&verifiedOnly=false`

Get provider reviews with filtering and pagination options.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `rating` (optional): Filter by rating (1-5)
- `sortBy` (optional): "date" | "rating" | "helpful" (default: "date")
- `verifiedOnly` (optional): Show only verified reviews (default: false)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "review_id",
      "userId": {
        "id": "user_id",
        "firstName": "John",
        "lastName": "Doe",
        "profileImage": "https://example.com/image.jpg"
      },
      "bookingId": {
        "id": "booking_id",
        "serviceId": "service_id",
        "scheduledDate": "2024-01-15T10:00:00Z",
        "totalAmount": 500
      },
      "jobRating": 5,
      "communicationRating": 4,
      "punctualityRating": 5,
      "qualityRating": 4,
      "overallRating": 4.5,
      "comment": "Excellent service! Very professional and punctual.",
      "images": ["https://example.com/review1.jpg"],
      "isVerified": true,
      "isPublic": true,
      "helpfulCount": 3,
      "reportCount": 0,
      "providerResponse": {
        "comment": "Thank you for your kind words! We're glad you're satisfied.",
        "createdAt": "2024-01-16T09:00:00Z"
      },
      "createdAt": "2024-01-15T18:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 3. Get Review Analytics

**GET** `/analytics`

Get detailed analytics for provider improvement.

**Response:**

```json
{
  "success": true,
  "data": {
    "monthlyTrends": [
      {
        "month": "2024-01",
        "averageRating": 4.2,
        "reviewCount": 12
      },
      {
        "month": "2024-02",
        "averageRating": 4.5,
        "reviewCount": 15
      }
    ],
    "categoryPerformance": [
      {
        "category": "Job Quality",
        "averageRating": 4.3,
        "reviewCount": 45
      },
      {
        "category": "Communication",
        "averageRating": 4.1,
        "reviewCount": 45
      },
      {
        "category": "Punctuality",
        "averageRating": 4.5,
        "reviewCount": 45
      },
      {
        "category": "Quality",
        "averageRating": 4.2,
        "reviewCount": 45
      }
    ],
    "improvementAreas": [
      {
        "category": "Communication",
        "currentRating": 4.1,
        "targetRating": 4.5,
        "gap": 0.4
      }
    ]
  }
}
```

### 4. Get Ranking Metrics

**GET** `/ranking`

Get provider ranking and comparison metrics.

**Response:**

```json
{
  "success": true,
  "data": {
    "currentRank": 15,
    "totalProviders": 150,
    "percentile": 90.0,
    "topPerformers": [
      {
        "rank": 1,
        "providerId": "provider_1",
        "averageRating": 4.8,
        "totalReviews": 120
      }
    ],
    "providerStats": {
      "overallRating": 4.2,
      "totalReviews": 45,
      "categoryRatings": {...}
    }
  }
}
```

### 5. Get Review Insights

**GET** `/insights`

Get AI-generated insights and recommendations for improvement.

**Response:**

```json
{
  "success": true,
  "data": {
    "insights": {
      "strengths": [
        "Great punctuality record",
        "High response rate to reviews"
      ],
      "areasForImprovement": [
        "Communication: Current rating 4.1/5, Target: 4.5/5"
      ],
      "recommendations": [
        "Focus on improving communication as it has the largest gap",
        "Respond to reviews within 24 hours to show excellent customer service"
      ]
    },
    "analytics": {...},
    "stats": {...}
  }
}
```

### 6. Respond to Review

**POST** `/reviews/:reviewId/respond`

Add a response to a customer review.

**Request Body:**

```json
{
  "response": "Thank you for your feedback! We're glad you're satisfied with our service."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Response added successfully",
  "data": {
    "id": "review_id",
    "providerResponse": {
      "comment": "Thank you for your feedback! We're glad you're satisfied with our service.",
      "createdAt": "2024-01-16T10:00:00Z"
    }
  }
}
```

### 7. Update Review Response

**PUT** `/reviews/:reviewId/response`

Update an existing response to a review.

**Request Body:**

```json
{
  "response": "Updated response message"
}
```

### 8. Get Service-Specific Reviews

**GET** `/service/:serviceId?page=1&limit=10&rating=5`

Get reviews for a specific service offered by the provider.

**Response:**

```json
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

### 9. Get Rating Distribution

**GET** `/distribution`

Get rating distribution chart data.

**Response:**

```json
{
  "success": true,
  "data": [
    { "_id": 5, "count": 20 },
    { "_id": 4, "count": 15 },
    { "_id": 3, "count": 8 },
    { "_id": 2, "count": 1 },
    { "_id": 1, "count": 1 }
  ]
}
```

### 10. Get Monthly Trends

**GET** `/trends`

Get monthly rating trends for the last 12 months.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "month": "2024-01",
      "averageRating": 4.2,
      "reviewCount": 12
    }
  ]
}
```

### 11. Get Category Performance

**GET** `/performance`

Get performance comparison across different rating categories.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "category": "Job Quality",
      "averageRating": 4.3,
      "reviewCount": 45
    }
  ]
}
```

### 12. Get Improvement Areas

**GET** `/improvement-areas`

Get specific areas that need improvement.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "category": "Communication",
      "currentRating": 4.1,
      "targetRating": 4.5,
      "gap": 0.4
    }
  ]
}
```

## Public Endpoints (No Authentication Required)

### 13. Get Public Provider Rating Stats

**GET** `/public/:providerId/stats`

Get public rating statistics for a specific provider.

**Response:**

```json
{
  "success": true,
  "data": {
    "overallRating": 4.2,
    "totalReviews": 45,
    "ratingDistribution": {...},
    "categoryRatings": {...},
    "verifiedReviews": 40,
    "responseRate": 85.5,
    "averageResponseTime": 12.3
  }
}
```

### 14. Get Public Provider Reviews

**GET** `/public/:providerId/reviews?page=1&limit=10&rating=5&sortBy=date&verifiedOnly=false`

Get public reviews for a specific provider.

**Response:**

```json
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

### 15. Get Review by ID

**GET** `/reviews/:reviewId`

Get detailed information about a specific review.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "review_id",
    "userId": {...},
    "vendorId": {...},
    "bookingId": {...},
    "jobRating": 5,
    "communicationRating": 4,
    "punctualityRating": 5,
    "qualityRating": 4,
    "overallRating": 4.5,
    "comment": "Excellent service!",
    "images": [...],
    "isVerified": true,
    "isPublic": true,
    "helpfulCount": 3,
    "reportCount": 0,
    "providerResponse": {...},
    "createdAt": "2024-01-15T18:00:00Z"
  }
}
```

## Review Interaction Endpoints

### 16. Mark Review as Helpful

**POST** `/reviews/:reviewId/helpful`

Mark a review as helpful (toggle functionality).

**Response:**

```json
{
  "success": true,
  "message": "Marked as helpful",
  "data": { "isHelpful": true }
}
```

### 17. Report Inappropriate Review

**POST** `/reviews/:reviewId/report`

Report an inappropriate review.

**Request Body:**

```json
{
  "reason": "This review contains inappropriate content"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Review reported successfully"
}
```

## Rating Categories

The system tracks ratings across four main categories:

1. **Job Quality**: Overall quality of work performed
2. **Communication**: Provider's communication skills
3. **Punctuality**: Provider's timeliness and reliability
4. **Quality**: General service quality and professionalism

## Review Features

### Provider Response System

- Providers can respond to customer reviews
- Responses are visible to all users
- One response per review
- Responses can be updated

### Review Verification

- Reviews can be marked as verified (completed bookings)
- Verified reviews are highlighted
- Filter option for verified reviews only

### Review Moderation

- Users can report inappropriate reviews
- Helpful voting system
- Review visibility controls

## Analytics Features

### Performance Tracking

- Monthly rating trends
- Category-wise performance analysis
- Improvement area identification
- Ranking and percentile calculations

### Insights & Recommendations

- AI-generated improvement suggestions
- Strength identification
- Actionable recommendations
- Performance benchmarking

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
// Get provider rating statistics
const response = await fetch("/api/provider-ratings/stats", {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

// Get reviews with filtering
const reviews = await fetch(
  "/api/provider-ratings/reviews?rating=5&sortBy=date",
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }
);

// Respond to a review
const respondToReview = await fetch(
  "/api/provider-ratings/reviews/review_id/respond",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      response: "Thank you for your feedback!",
    }),
  }
);

// Get public provider reviews (for customers)
const publicReviews = await fetch(
  "/api/provider-ratings/public/provider_id/reviews"
);
```

### Dashboard Integration

```javascript
// Get comprehensive analytics for dashboard
const [stats, analytics, insights, ranking] = await Promise.all([
  fetch("/api/provider-ratings/stats"),
  fetch("/api/provider-ratings/analytics"),
  fetch("/api/provider-ratings/insights"),
  fetch("/api/provider-ratings/ranking"),
]);
```

## Integration with Existing Systems

The Provider Ratings & Reviews API integrates with:

1. **Booking System**: Reviews are linked to completed bookings
2. **User Management**: User profiles and verification
3. **Service Management**: Service-specific review filtering
4. **Notification System**: Review notifications and alerts
5. **Admin Dashboard**: Review moderation and management

## Performance Considerations

- **Pagination**: All list endpoints support pagination
- **Caching**: Frequently accessed data is cached
- **Indexing**: Optimized database indexes for fast queries
- **Aggregation**: Efficient MongoDB aggregation for analytics
