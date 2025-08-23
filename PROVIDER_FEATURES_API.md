# Provider Dashboard API Documentation

## Overview

The Provider Dashboard API provides comprehensive functionality for service providers to manage their services, handle job requests, and provide real-time updates on job status.

## Base URL

```
/api/provider-dashboard
```

## Authentication

All endpoints require authentication with a valid JWT token and the user must have the "provider" role.

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## Service Management

### 1. Create Service

**POST** `/services`

Create a new service offering.

**Request Body:**

```json
{
  "title": "Professional House Cleaning",
  "description": "Comprehensive house cleaning service including dusting, vacuuming, and sanitizing",
  "category": "cleaning",
  "subcategory": "house_cleaning",
  "pricing": {
    "type": "hourly",
    "amount": 25.0,
    "currency": "GHS",
    "unit": "per hour"
  },
  "location": {
    "city": "Accra",
    "state": "Greater Accra",
    "country": "Ghana",
    "coordinates": {
      "latitude": 5.56,
      "longitude": -0.2057
    },
    "serviceRadius": 15
  },
  "availability": {
    "isAvailable": true,
    "workingDays": [
      {
        "day": "monday",
        "startTime": "08:00",
        "endTime": "18:00",
        "isAvailable": true
      },
      {
        "day": "tuesday",
        "startTime": "08:00",
        "endTime": "18:00",
        "isAvailable": true
      }
    ],
    "emergencyService": true,
    "noticeRequired": 24
  },
  "providerPreferences": {
    "maxDistance": 20,
    "preferredWorkingHours": {
      "startTime": "08:00",
      "endTime": "18:00"
    },
    "emergencyServiceAvailable": true,
    "weekendService": false,
    "holidayService": false
  },
  "scheduling": {
    "advanceBookingRequired": 24,
    "maxBookingsPerDay": 8,
    "cancellationPolicy": "moderate",
    "cancellationNotice": 4
  },
  "coverage": {
    "cities": ["Accra", "Tema"],
    "neighborhoods": ["East Legon", "Cantonments"],
    "postalCodes": ["00233"],
    "customAreas": ["Airport Residential Area"]
  },
  "tags": ["cleaning", "housekeeping", "professional"],
  "requirements": ["Access to water and electricity", "Pets should be secured"],
  "estimatedDuration": "2-4 hours",
  "warranty": "24-hour satisfaction guarantee"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Service created successfully",
  "data": {
    "service": {
      "_id": "service_id_here",
      "title": "Professional House Cleaning",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 2. Get Provider Services

**GET** `/services`

Retrieve all services for the authenticated provider.

**Query Parameters:**

- `status` (optional): Filter by service status (`active`, `inactive`, `suspended`)
- `category` (optional): Filter by service category
- `isAvailable` (optional): Filter by availability status

**Response:**

```json
{
  "success": true,
  "message": "Provider services retrieved successfully",
  "data": {
    "services": [
      {
        "_id": "service_id_1",
        "title": "Professional House Cleaning",
        "category": "cleaning",
        "status": "active",
        "pricing": {
          "type": "hourly",
          "amount": 25.0,
          "currency": "GHS"
        },
        "availability": {
          "isAvailable": true
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "count": 1
  }
}
```

### 3. Update Service

**PUT** `/services/:serviceId`

Update an existing service.

**Request Body:** (Same as create service, but all fields are optional)

**Response:**

```json
{
  "success": true,
  "message": "Service updated successfully",
  "data": {
    "service": {
      "_id": "service_id_here",
      "title": "Updated Service Title",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

---

## Job Requests Management

### 1. Get Job Requests

**GET** `/job-requests`

Retrieve job requests for the authenticated provider.

**Query Parameters:**

- `status` (optional): Filter by request status (`pending`, `accepted`, `rejected`, `expired`)
- `date` (optional): Filter by date (YYYY-MM-DD format)

**Response:**

```json
{
  "success": true,
  "message": "Job requests retrieved successfully",
  "data": {
    "requests": [
      {
        "_id": "request_id_1",
        "status": "pending",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "bookingId": {
          "_id": "booking_id_1",
          "userId": {
            "firstName": "John",
            "lastName": "Doe",
            "phone": "+233123456789",
            "email": "john@example.com",
            "address": {
              "street": "123 Main St",
              "city": "Accra"
            }
          },
          "serviceId": {
            "title": "House Cleaning",
            "category": "cleaning",
            "pricing": {
              "amount": 50.0,
              "currency": "GHS"
            }
          },
          "bookingDetails": {
            "scheduledDate": "2024-01-16T14:00:00.000Z",
            "description": "Need house cleaning service"
          }
        }
      }
    ],
    "count": 1
  }
}
```

### 2. Accept Job Request

**POST** `/job-requests/:requestId/accept`

Accept a pending job request.

**Request Body:**

```json
{
  "estimatedStartTime": "2024-01-16T14:00:00.000Z",
  "estimatedDuration": 3.5,
  "note": "I'll arrive 15 minutes early to assess the work area"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Job request accepted successfully",
  "data": {
    "request": {
      "_id": "request_id_1",
      "status": "accepted",
      "responseTime": "2024-01-15T11:00:00.000Z",
      "estimatedStartTime": "2024-01-16T14:00:00.000Z",
      "estimatedDuration": 3.5
    }
  }
}
```

### 3. Reject Job Request

**POST** `/job-requests/:requestId/reject`

Reject a pending job request.

**Request Body:**

```json
{
  "note": "I'm fully booked for that date and time. Please try another provider."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Job request rejected successfully",
  "data": {
    "request": {
      "_id": "request_id_1",
      "status": "rejected",
      "responseTime": "2024-01-15T11:00:00.000Z",
      "responseNote": "I'm fully booked for that date and time. Please try another provider."
    }
  }
}
```

---

## Real-time Job Status Updates

### 1. Update Job Status

**PUT** `/bookings/:bookingId/status`

Update the status of an active job.

**Request Body:**

```json
{
  "status": "on_the_way",
  "estimatedArrival": "2024-01-16T13:45:00.000Z"
}
```

**Available Status Values:**

- `on_the_way`: Provider is traveling to the job location
- `in_progress`: Service is currently being performed
- `completed`: Service has been completed
- `paused`: Service has been temporarily paused
- `resumed`: Service has resumed after being paused

**Status-Specific Fields:**

- `on_the_way`: `estimatedArrival` (required)
- `in_progress`: `estimatedCompletion` (optional)
- `completed`: `completionNotes` (optional)
- `paused`: `pauseReason` (required)

**Response:**

```json
{
  "success": true,
  "message": "Job status updated successfully",
  "data": {
    "booking": {
      "_id": "booking_id_1",
      "jobStatus": {
        "currentStatus": "on_the_way",
        "onTheWayAt": "2024-01-16T13:30:00.000Z",
        "estimatedArrival": "2024-01-16T13:45:00.000Z",
        "lastUpdated": "2024-01-16T13:30:00.000Z"
      }
    }
  }
}
```

---

## Provider Dashboard Statistics

### 1. Get Dashboard Stats

**GET** `/dashboard/stats`

Retrieve comprehensive statistics for the provider dashboard.

**Response:**

```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "stats": {
      "totalServices": 5,
      "activeServices": 4,
      "totalBookings": 25,
      "pendingRequests": 3,
      "completedJobs": 20,
      "totalEarnings": 1250.0
    }
  }
}
```

---

## Job Scheduling & Automation

The system automatically handles:

### Cron Jobs

- **Expired Job Requests**: Check every 5 minutes for requests older than 24 hours
- **Job Reminders**: Send reminders every hour for jobs scheduled within the next hour
- **Overdue Job Checks**: Check every 30 minutes for jobs that are 2+ hours overdue
- **Expired Booking Cleanup**: Daily cleanup of expired/cancelled bookings
- **Provider Availability**: Update provider online status every 15 minutes

### Automated Notifications

- Job request acceptance/rejection notifications
- Job status update notifications
- Reminder notifications for upcoming jobs
- Overdue job alerts
- Expired request notifications

---

## Error Responses

### Validation Error (400)

```json
{
  "success": false,
  "message": "Missing required service fields",
  "error": "VALIDATION_ERROR"
}
```

### Authentication Error (401)

```json
{
  "success": false,
  "message": "Access token is required",
  "error": "AUTHENTICATION_ERROR"
}
```

### Authorization Error (403)

```json
{
  "success": false,
  "message": "Insufficient permissions",
  "error": "AUTHORIZATION_ERROR"
}
```

### Not Found Error (404)

```json
{
  "success": false,
  "message": "Service not found or access denied",
  "error": "NOT_FOUND_ERROR"
}
```

---

## Rate Limiting

- **Standard endpoints**: 100 requests per 15 minutes
- **Job status updates**: 200 requests per 15 minutes
- **Service creation/updates**: 50 requests per 15 minutes

---

## WebSocket Events (Real-time Updates)

The system also supports real-time updates via WebSocket connections:

### Provider Events

- `job_request_received`: New job request notification
- `job_status_updated`: Job status change notification
- `booking_cancelled`: Booking cancellation notification

### Client Events

- `provider_status_changed`: Provider online/offline status
- `job_progress_update`: Real-time job progress updates

---

## Best Practices

1. **Service Management**

   - Keep service availability updated regularly
   - Set realistic pricing and service radius
   - Provide detailed service descriptions

2. **Job Requests**

   - Respond to requests within 2 hours
   - Provide accurate time estimates
   - Communicate clearly with customers

3. **Status Updates**

   - Update job status promptly
   - Provide estimated arrival/completion times
   - Use appropriate status for each situation

4. **Customer Communication**
   - Send notifications for all status changes
   - Provide clear explanations for delays
   - Maintain professional communication

---

## Support

For technical support or questions about the Provider Dashboard API, please contact the development team or refer to the main API documentation.
