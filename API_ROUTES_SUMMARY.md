# Complete API Routes Summary

This document provides a comprehensive overview of all available API endpoints in the Home Services platform.

## Base URL

```
http://localhost:3001/api
```

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 1. Authentication Routes (`/api/auth`)

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh access token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `POST /auth/verify-email` - Verify email address

## 2. User Management (`/api/users`)

- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `DELETE /users/profile` - Delete user account
- `GET /users/:id` - Get user by ID (admin only)
- `PUT /users/:id` - Update user by ID (admin only)
- `DELETE /users/:id` - Delete user by ID (admin only)

## 3. Service Management (`/api/services`)

- `GET /services` - Get all services (with filters)
- `POST /services` - Create new service (providers only)
- `GET /services/:id` - Get service by ID
- `PUT /services/:id` - Update service (owner only)
- `DELETE /services/:id` - Delete service (owner only)
- `GET /services/:id/reviews` - Get service reviews

## 4. Service Categories (`/api/categories`)

- `GET /categories` - Get all categories
- `POST /categories` - Create category (admin only)
- `GET /categories/:id` - Get category by ID
- `PUT /categories/:id` - Update category (admin only)
- `DELETE /categories/:id` - Delete category (admin only)

## 5. Service Reviews (`/api/reviews`)

- `GET /reviews` - Get all reviews (with filters)
- `POST /reviews` - Create review (authenticated users)
- `GET /reviews/:id` - Get review by ID
- `PUT /reviews/:id` - Update review (owner only)
- `DELETE /reviews/:id` - Delete review (owner/admin only)

## 6. Provider Management (`/api/provider`)

- `GET /provider/services` - Get provider's services
- `GET /provider/bookings` - Get provider's bookings
- `GET /provider/earnings` - Get provider's earnings
- `POST /provider/verification` - Submit verification documents
- `PUT /provider/availability` - Update availability

## 7. Admin Routes (`/api/admin`)

- `GET /admin/dashboard` - Admin dashboard data
- `GET /admin/users` - Get all users
- `GET /admin/providers` - Get all providers
- `GET /admin/bookings` - Get all bookings
- `GET /admin/services` - Get all services
- `PUT /admin/users/:id/verify` - Verify user account
- `PUT /admin/providers/:id/verify` - Verify provider account
- `GET /admin/analytics` - Platform analytics

## 8. Booking Management (`/api/bookings`)

- `GET /bookings` - Get user's bookings
- `POST /bookings` - Create new booking
- `GET /bookings/:id` - Get booking by ID
- `PUT /bookings/:id` - Update booking
- `DELETE /bookings/:id` - Cancel booking
- `POST /bookings/:id/accept` - Accept booking (provider)
- `POST /bookings/:id/reject` - Reject booking (provider)
- `POST /bookings/:id/complete` - Mark booking as complete

## 9. Payment Management (`/api/payments`)

- `POST /payments/initiate` - Initiate payment
- `POST /payments/verify` - Verify payment
- `GET /payments/history` - Get payment history
- `POST /payments/refund` - Request refund
- `GET /payments/:id` - Get payment details

## 10. Wallet Management (`/api/wallet`)

- `GET /wallet/balance` - Get wallet balance
- `GET /wallet/transactions` - Get transaction history
- `POST /wallet/fund` - Fund wallet
- `POST /wallet/transfer` - Transfer funds

## 11. Withdrawal Management (`/api/withdrawals`)

- `GET /withdrawals` - Get withdrawal requests
- `POST /withdrawals` - Request withdrawal
- `GET /withdrawals/:id` - Get withdrawal details
- `PUT /withdrawals/:id/cancel` - Cancel withdrawal request

## 12. Chat System (`/api/chat`)

- `POST /chat/messages` - Send message
- `GET /chat/messages/:bookingId` - Get chat history
- `POST /chat/messages/read` - Mark messages as read
- `GET /chat/conversations` - Get recent conversations
- `GET /chat/unread-count` - Get unread count
- `POST /chat/typing` - Send typing indicator
- `POST /chat/location` - Share location
- `GET /chat/online-status/:bookingId` - Get online status

## 13. Notification System (`/api/notifications`)

- `GET /notifications` - Get user notifications
- `PATCH /notifications/:id/read` - Mark notification as read
- `PATCH /notifications/read-all` - Mark all notifications as read
- `DELETE /notifications/:id` - Delete notification

## 14. Search Functionality (`/api/search`)

- `GET /search/services` - Search services
- `GET /search/providers` - Search providers
- `GET /search` - Global search

## 15. File Upload (`/api/upload`)

- `POST /upload/profile-image` - Upload profile image
- `POST /upload/service-images` - Upload service images
- `POST /upload/documents` - Upload verification documents
- `POST /upload/chat-files` - Upload chat files

## 16. Support System (`/api/support`)

- `GET /support/faq` - Get FAQ
- `POST /support/ticket` - Create support ticket
- `GET /support/tickets` - Get user tickets
- `GET /support/ticket/:id` - Get ticket details
- `POST /support/ticket/:id/reply` - Add reply to ticket

## 17. Location Services (`/api/location`)

- `GET /location/nearby-services` - Get nearby services
- `GET /location/nearby-providers` - Get nearby providers
- `POST /location/update-location` - Update user location
- `GET /location/popular` - Get popular locations
- `GET /location/geocode` - Geocode address

## WebSocket Events

The platform also supports real-time communication through WebSocket connections:

### Client Events (Send to Server)

- `send_message` - Send chat message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `mark_read` - Mark messages as read
- `location_update` - Share location
- `join_room` - Join chat room
- `leave_room` - Leave chat room

### Server Events (Receive from Server)

- `new_message` - New message received
- `typing_start` - User started typing
- `typing_stop` - User stopped typing
- `messages_read` - Messages marked as read
- `location_updated` - Location shared by user
- `job_status_updated` - Job status changed
- `notification` - New notification received

## Rate Limiting

All API endpoints are subject to rate limiting:

- **Default**: 100 requests per 15 minutes per IP address
- **Authentication endpoints**: 5 requests per 15 minutes per IP address
- **File uploads**: 10 requests per 15 minutes per IP address

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Testing

Run the API tests with:

```bash
npm test
```

## Documentation

- `README_CHAT_API.md` - Detailed chat API documentation
- `IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- `examples/chat-client-example.js` - Client usage examples
