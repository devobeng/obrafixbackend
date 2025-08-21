# Chat API Documentation

This document describes the in-app chat functionality for the Home Services platform, allowing users and vendors to communicate about their bookings.

## Overview

The chat system provides real-time communication between users and service providers through:

- Text messages
- Image sharing
- File sharing
- Location sharing
- Typing indicators
- Read receipts
- Online status tracking

## Authentication

All chat endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### 1. Send Message

**POST** `/api/chat/messages`

Send a new message in a booking conversation.

**Request Body:**

```json
{
  "bookingId": "507f1f77bcf86cd799439011",
  "message": "Hello, when will you arrive?",
  "messageType": "text",
  "metadata": {
    "fileUrl": "https://example.com/file.jpg",
    "fileName": "photo.jpg",
    "fileSize": 1024000
  }
}
```

**Message Types:**

- `text` - Plain text message (default)
- `image` - Image file
- `file` - Any file type
- `location` - GPS coordinates

**Response:**

```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "bookingId": "507f1f77bcf86cd799439011",
    "senderId": "507f1f77bcf86cd799439013",
    "message": "Hello, when will you arrive?",
    "messageType": "text",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "isRead": false
  }
}
```

### 2. Get Chat History

**GET** `/api/chat/messages/:bookingId`

Retrieve chat history for a specific booking.

**Query Parameters:**

- `limit` - Number of messages to return (default: 50, max: 100)
- `before` - ISO date string to get messages before this timestamp

**Response:**

```json
{
  "success": true,
  "message": "Chat history retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "bookingId": "507f1f77bcf86cd799439011",
      "senderId": {
        "_id": "507f1f77bcf86cd799439013",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "profileImage": "https://example.com/avatar.jpg"
      },
      "message": "Hello, when will you arrive?",
      "messageType": "text",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "isRead": true,
      "readAt": "2024-01-15T10:31:00.000Z"
    }
  ]
}
```

### 3. Mark Messages as Read

**POST** `/api/chat/messages/read`

Mark specific messages as read.

**Request Body:**

```json
{
  "messageIds": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Messages marked as read successfully"
}
```

### 4. Get Recent Conversations

**GET** `/api/chat/conversations`

Get a list of recent conversations for the authenticated user.

**Response:**

```json
{
  "success": true,
  "message": "Recent conversations retrieved successfully",
  "data": [
    {
      "bookingId": "507f1f77bcf86cd799439011",
      "booking": {
        "id": "507f1f77bcf86cd799439011",
        "status": "confirmed",
        "service": {
          "title": "House Cleaning",
          "category": "cleaning"
        },
        "customer": {
          "firstName": "John",
          "lastName": "Doe"
        },
        "provider": {
          "firstName": "Jane",
          "lastName": "Smith"
        },
        "scheduledDate": "2024-01-16T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      },
      "lastMessage": {
        "id": "507f1f77bcf86cd799439012",
        "message": "Hello, when will you arrive?",
        "messageType": "text",
        "sender": {
          "firstName": "John",
          "lastName": "Doe"
        },
        "timestamp": "2024-01-15T10:30:00.000Z"
      },
      "unreadCount": 2
    }
  ]
}
```

### 5. Get Unread Count

**GET** `/api/chat/unread-count`

Get the total number of unread messages for the authenticated user.

**Query Parameters:**

- `bookingId` - Optional: Get unread count for a specific booking

**Response:**

```json
{
  "success": true,
  "message": "Unread count retrieved successfully",
  "data": {
    "unreadCount": 5
  }
}
```

### 6. Send Typing Indicator

**POST** `/api/chat/typing`

Send typing indicator to other participants in the chat.

**Request Body:**

```json
{
  "bookingId": "507f1f77bcf86cd799439011",
  "isTyping": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Typing indicator sent successfully"
}
```

### 7. Send Location Update

**POST** `/api/chat/location`

Share location coordinates with other participants.

**Request Body:**

```json
{
  "bookingId": "507f1f77bcf86cd799439011",
  "location": {
    "latitude": 5.56,
    "longitude": -0.2057,
    "address": "Accra, Ghana"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Location update sent successfully"
}
```

### 8. Get Online Status

**GET** `/api/chat/online-status/:bookingId`

Get the online status of participants in a booking.

**Response:**

```json
{
  "success": true,
  "message": "Online status retrieved successfully",
  "data": {
    "507f1f77bcf86cd799439013": true,
    "507f1f77bcf86cd799439014": false
  }
}
```

## WebSocket Events

The chat system also supports real-time communication through WebSocket connections.

### Client Events (Send to Server)

- `send_message` - Send a new message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `mark_read` - Mark messages as read
- `location_update` - Share location

### Server Events (Receive from Server)

- `new_message` - New message received
- `typing_start` - User started typing
- `typing_stop` - User stopped typing
- `messages_read` - Messages marked as read
- `location_updated` - Location shared by user
- `job_status_updated` - Job status changed

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

**Common HTTP Status Codes:**

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

Chat endpoints are subject to rate limiting:

- Maximum 100 requests per 15 minutes per IP address
- Message size limit: 1000 characters
- File size limit: 10MB (configurable)

## Security Features

- JWT authentication required for all endpoints
- Users can only access chats for their own bookings
- Message validation and sanitization
- File type restrictions for uploads
- Location coordinate validation

## File Upload

For image and file messages, the system supports:

- Image formats: JPG, PNG, GIF, WebP
- File formats: PDF, DOC, DOCX, TXT
- Maximum file size: 10MB
- Secure file storage with signed URLs

## Location Sharing

Location messages include:

- GPS coordinates (latitude/longitude)
- Optional address text
- Real-time location updates
- Privacy controls for location sharing

## Testing

Run the chat tests with:

```bash
npm test -- --testPathPattern=chat.test.ts
```

## Dependencies

- Express.js - Web framework
- Socket.IO - Real-time communication
- MongoDB/Mongoose - Database
- JWT - Authentication
- Zod - Request validation
- Multer - File uploads (for future implementation)

## Future Enhancements

- Push notifications for offline users
- Message encryption
- File compression and optimization
- Chat search functionality
- Message reactions and replies
- Voice and video messages
- Chat moderation tools
