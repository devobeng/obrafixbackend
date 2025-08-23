# Admin Content Management API Documentation

This document outlines the API endpoints for managing banners, promotions, referral campaigns, and push notifications in the home services platform.

## Base URL

```
/api/admin/content
```

## Authentication

All endpoints require authentication with admin role:

- Header: `Authorization: Bearer <token>`
- Role: `admin`

---

## Banner Management

### Create Banner

**POST** `/banners`

Create a new banner for the platform.

**Request Body:**

```json
{
  "title": "Summer Sale",
  "description": "Get 20% off on all cleaning services",
  "imageUrl": "https://example.com/banner.jpg",
  "linkUrl": "https://example.com/summer-sale",
  "type": "promotion",
  "targetAudience": "customers",
  "targetRoles": ["customer"],
  "startDate": "2024-06-01T00:00:00.000Z",
  "endDate": "2024-08-31T23:59:59.000Z",
  "isActive": true,
  "priority": 5,
  "displayOrder": 1
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "_id": "banner_id",
    "title": "Summer Sale",
    "description": "Get 20% off on all cleaning services",
    "imageUrl": "https://example.com/banner.jpg",
    "linkUrl": "https://example.com/summer-sale",
    "type": "promotion",
    "targetAudience": "customers",
    "targetRoles": ["customer"],
    "startDate": "2024-06-01T00:00:00.000Z",
    "endDate": "2024-08-31T23:59:59.000Z",
    "isActive": true,
    "priority": 5,
    "displayOrder": 1,
    "clickCount": 0,
    "viewCount": 0,
    "createdBy": "admin_id",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get Banners

**GET** `/banners`

Retrieve banners with optional filtering and pagination.

**Query Parameters:**

- `type` (optional): Filter by banner type (`banner`, `promotion`, `announcement`)
- `targetAudience` (optional): Filter by target audience (`all`, `customers`, `providers`, `specific`)
- `isActive` (optional): Filter by active status (`true`, `false`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "_id": "banner_id",
      "title": "Summer Sale",
      "description": "Get 20% off on all cleaning services",
      "type": "promotion",
      "targetAudience": "customers",
      "isActive": true,
      "clickCount": 150,
      "viewCount": 1200,
      "createdBy": {
        "_id": "admin_id",
        "firstName": "John",
        "lastName": "Admin"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "total": 25,
    "totalPages": 3
  }
}
```

### Get Banner Statistics

**GET** `/banners/stats`

Get comprehensive banner performance statistics.

**Response:**

```json
{
  "status": "success",
  "data": {
    "totalBanners": 25,
    "activeBanners": 18,
    "totalViews": 15000,
    "totalClicks": 1200,
    "averageClickRate": 8.0,
    "topPerformingBanners": [
      {
        "_id": "banner_id",
        "title": "Summer Sale",
        "clickCount": 450,
        "viewCount": 3000,
        "createdBy": {
          "_id": "admin_id",
          "firstName": "John",
          "lastName": "Admin"
        }
      }
    ]
  }
}
```

### Update Banner

**PATCH** `/banners/:id`

Update an existing banner.

**Request Body:** (All fields optional)

```json
{
  "title": "Updated Summer Sale",
  "isActive": false,
  "priority": 3
}
```

### Delete Banner

**DELETE** `/banners/:id`

Delete a banner permanently.

---

## Promotion Management

### Create Promotion

**POST** `/promotions`

Create a new promotion for the platform.

**Request Body:**

```json
{
  "title": "First Booking Discount",
  "description": "Get 15% off on your first booking",
  "type": "discount",
  "discountType": "percentage",
  "discountValue": 15,
  "minimumAmount": 50,
  "maximumDiscount": 100,
  "code": "FIRST15",
  "isActive": true,
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.000Z",
  "targetAudience": "customers",
  "targetRoles": ["customer"],
  "applicableServices": ["cleaning", "plumbing"],
  "applicableCategories": ["home_services"],
  "usageLimit": 1000,
  "userUsageLimit": 1,
  "conditions": ["New customers only", "Minimum booking amount applies"],
  "terms": [
    "Cannot be combined with other offers",
    "Valid for first booking only"
  ]
}
```

### Get Promotions

**GET** `/promotions`

Retrieve promotions with optional filtering and pagination.

**Query Parameters:**

- `type` (optional): Filter by promotion type (`discount`, `cashback`, `free_service`, `bonus`, `referral`)
- `targetAudience` (optional): Filter by target audience
- `isActive` (optional): Filter by active status
- `page` (optional): Page number
- `limit` (optional): Items per page

### Get Promotion Statistics

**GET** `/promotions/stats`

Get comprehensive promotion performance statistics.

**Response:**

```json
{
  "status": "success",
  "data": {
    "totalPromotions": 15,
    "activePromotions": 12,
    "totalUsage": 850,
    "totalDiscount": 12500,
    "averageUsage": 56.67,
    "topPromotions": [
      {
        "_id": "promotion_id",
        "title": "First Booking Discount",
        "usageCount": 250,
        "createdBy": {
          "_id": "admin_id",
          "firstName": "John",
          "lastName": "Admin"
        }
      }
    ]
  }
}
```

---

## Referral Campaign Management

### Create Referral Campaign

**POST** `/referral-campaigns`

Create a new referral campaign.

**Request Body:**

```json
{
  "title": "Refer Friends & Earn",
  "description": "Refer friends and earn rewards for both of you",
  "type": "both",
  "referrerReward": {
    "type": "fixed",
    "value": 50,
    "description": "Get $50 for each successful referral"
  },
  "refereeReward": {
    "type": "percentage",
    "value": 10,
    "description": "Get 10% off on first booking"
  },
  "isActive": true,
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.000Z",
  "targetAudience": "all",
  "minimumReferrals": 1,
  "maximumReferrals": 10,
  "referralCodeLength": 8,
  "terms": ["Valid for new users only", "Rewards credited after first booking"],
  "conditions": [
    "Referral must complete first booking",
    "Both parties must be active users"
  ]
}
```

### Get Referral Campaigns

**GET** `/referral-campaigns`

Retrieve referral campaigns with optional filtering and pagination.

### Get Referral Statistics

**GET** `/referral-campaigns/stats`

Get comprehensive referral campaign statistics.

**Response:**

```json
{
  "status": "success",
  "data": {
    "totalCampaigns": 8,
    "activeCampaigns": 6,
    "totalReferrals": 150,
    "totalRewards": 2500,
    "averageReferralsPerCampaign": 18.75,
    "topCampaigns": [
      {
        "_id": "campaign_id",
        "title": "Refer Friends & Earn",
        "createdBy": {
          "_id": "admin_id",
          "firstName": "John",
          "lastName": "Admin"
        }
      }
    ]
  }
}
```

---

## Push Notification Management

### Create Push Notification

**POST** `/notifications`

Create a new push notification.

**Request Body:**

```json
{
  "title": "New Service Available",
  "message": "We've added plumbing services to your area!",
  "type": "info",
  "targetAudience": "customers",
  "targetRoles": ["customer"],
  "targetCategories": ["plumbing"],
  "data": {
    "serviceType": "plumbing",
    "action": "view_services"
  },
  "imageUrl": "https://example.com/notification.jpg",
  "actionUrl": "https://app.example.com/services/plumbing",
  "actionText": "View Services",
  "priority": "normal",
  "scheduledFor": "2024-01-15T14:00:00.000Z",
  "isActive": true
}
```

### Get Push Notifications

**GET** `/notifications`

Retrieve push notifications with optional filtering and pagination.

**Query Parameters:**

- `type` (optional): Filter by notification type (`info`, `success`, `warning`, `error`, `promotion`)
- `targetAudience` (optional): Filter by target audience
- `priority` (optional): Filter by priority (`low`, `normal`, `high`)
- `isSent` (optional): Filter by sent status
- `isActive` (optional): Filter by active status
- `page` (optional): Page number
- `limit` (optional): Items per page

### Send Push Notification

**POST** `/notifications/:id/send`

Send a specific push notification immediately.

**Response:**

```json
{
  "status": "success",
  "message": "Push notification sent successfully"
}
```

### Get Notification Statistics

**GET** `/notifications/stats`

Get comprehensive notification statistics.

**Response:**

```json
{
  "status": "success",
  "data": {
    "totalNotifications": 45,
    "sentNotifications": 38,
    "pendingNotifications": 7,
    "averageDeliveryRate": 84.44,
    "notificationsByType": {
      "info": 20,
      "promotion": 15,
      "success": 5,
      "warning": 3,
      "error": 2
    },
    "notificationsByPriority": {
      "normal": 30,
      "high": 10,
      "low": 5
    }
  }
}
```

---

## Analytics

### Get Content Analytics

**GET** `/analytics`

Get comprehensive analytics for all content types.

**Query Parameters:**

- `startDate` (optional): Start date for analytics
- `endDate` (optional): End date for analytics
- `targetAudience` (optional): Filter by target audience
- `type` (optional): Filter by content type

**Response:**

```json
{
  "status": "success",
  "data": {
    "bannerStats": {
      "totalBanners": 25,
      "activeBanners": 18,
      "totalViews": 15000,
      "totalClicks": 1200,
      "averageClickRate": 8.0,
      "topPerformingBanners": []
    },
    "promotionStats": {
      "totalPromotions": 15,
      "activePromotions": 12,
      "totalUsage": 850,
      "totalDiscount": 12500,
      "averageUsage": 56.67,
      "topPromotions": []
    },
    "referralStats": {
      "totalCampaigns": 8,
      "activeCampaigns": 6,
      "totalReferrals": 150,
      "totalRewards": 2500,
      "averageReferralsPerCampaign": 18.75,
      "topCampaigns": []
    },
    "notificationStats": {
      "totalNotifications": 45,
      "sentNotifications": 38,
      "pendingNotifications": 7,
      "averageDeliveryRate": 84.44,
      "notificationsByType": {},
      "notificationsByPriority": {}
    },
    "overallEngagement": {
      "totalViews": 15000,
      "totalClicks": 1200,
      "totalUsage": 850,
      "totalReferrals": 150
    }
  }
}
```

---

## Bulk Operations

### Bulk Update Banner Status

**PATCH** `/banners/bulk-status`

Update the status of multiple banners at once.

**Request Body:**

```json
{
  "bannerIds": ["banner_id_1", "banner_id_2", "banner_id_3"],
  "isActive": false
}
```

### Bulk Update Promotion Status

**PATCH** `/promotions/bulk-status`

Update the status of multiple promotions at once.

**Request Body:**

```json
{
  "promotionIds": ["promotion_id_1", "promotion_id_2"],
  "isActive": true
}
```

### Bulk Send Notifications

**POST** `/notifications/bulk-send`

Send multiple notifications at once.

**Request Body:**

```json
{
  "notificationIds": [
    "notification_id_1",
    "notification_id_2",
    "notification_id_3"
  ]
}
```

---

## Error Responses

### Validation Error

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

### Not Found Error

```json
{
  "status": "error",
  "message": "Banner not found"
}
```

### Unauthorized Error

```json
{
  "status": "error",
  "message": "Access denied. Admin role required."
}
```

---

## Rate Limiting

All endpoints are subject to rate limiting:

- 100 requests per 15 minutes per IP address
- Rate limit headers are included in responses

## Notes

1. **Date Formats**: All dates should be in ISO 8601 format (UTC)
2. **File Uploads**: Image URLs should be valid URLs pointing to uploaded images
3. **Targeting**: Use specific targeting for better engagement
4. **Scheduling**: Notifications can be scheduled for future delivery
5. **Analytics**: Statistics are calculated in real-time
6. **Bulk Operations**: Use bulk operations for efficiency when managing multiple items
