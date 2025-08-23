import { Router } from "express";
import { ProviderCommunicationController } from "../controllers/providerCommunicationController";
import { ProviderCommunicationService } from "../services/ProviderCommunicationService";
import { ChatService } from "../services/ChatService";
import { NotificationService } from "../services/NotificationService";
import { SocketServer } from "../socket/socketServer";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/auth";

const router = Router();

// Initialize services (you'll need to inject these properly in your main app)
const socketServer = new SocketServer(null as any); // This should be injected properly
const chatService = new ChatService(socketServer);
const notificationService = new NotificationService();
const communicationService = new ProviderCommunicationService(
  chatService,
  notificationService,
  socketServer
);

const communicationController = new ProviderCommunicationController(
  communicationService
);

// ==================== CHAT MANAGEMENT ====================

// Get provider chat statistics
router.get(
  "/chat/stats",
  authenticate(),
  requireRole(["provider"]),
  communicationController.getChatStats
);

// Get provider conversations
router.get(
  "/chat/conversations",
  authenticate(),
  requireRole(["provider"]),
  communicationController.getConversations
);

// Send quick response
router.post(
  "/chat/booking/:bookingId/quick-response",
  authenticate(),
  requireRole(["provider"]),
  communicationController.sendQuickResponse
);

// Get chat history for a booking
router.get(
  "/chat/booking/:bookingId/history",
  authenticate(),
  requireRole(["provider"]),
  communicationController.getChatHistory
);

// Send message
router.post(
  "/chat/booking/:bookingId/message",
  authenticate(),
  requireRole(["provider"]),
  communicationController.sendMessage
);

// Mark messages as read
router.post(
  "/chat/messages/read",
  authenticate(),
  requireRole(["provider"]),
  communicationController.markMessagesAsRead
);

// Get unread message count
router.get(
  "/chat/unread-count",
  authenticate(),
  requireRole(["provider"]),
  communicationController.getUnreadCount
);

// Send typing indicator
router.post(
  "/chat/booking/:bookingId/typing",
  authenticate(),
  requireRole(["provider"]),
  communicationController.sendTypingIndicator
);

// Send location update
router.post(
  "/chat/booking/:bookingId/location",
  authenticate(),
  requireRole(["provider"]),
  communicationController.sendLocationUpdate
);

// Get online status
router.get(
  "/chat/booking/:bookingId/online-status",
  authenticate(),
  requireRole(["provider"]),
  communicationController.getOnlineStatus
);

// ==================== NOTIFICATION MANAGEMENT ====================

// Get provider notification statistics
router.get(
  "/notifications/stats",
  authenticate(),
  requireRole(["provider"]),
  communicationController.getNotificationStats
);

// Get provider notifications by category
router.get(
  "/notifications/category/:category",
  authenticate(),
  requireRole(["provider"]),
  communicationController.getNotificationsByCategory
);

// Update notification preferences
router.put(
  "/notifications/preferences",
  authenticate(),
  requireRole(["provider"]),
  communicationController.updateNotificationPreferences
);

// ==================== SUPPORT SYSTEM ====================

// Create support ticket
router.post(
  "/support/tickets",
  authenticate(),
  requireRole(["provider"]),
  communicationController.createSupportTicket
);

// Get provider support tickets
router.get(
  "/support/tickets",
  authenticate(),
  requireRole(["provider"]),
  communicationController.getSupportTickets
);

// ==================== CUSTOMER REPORTING ====================

// Report customer
router.post(
  "/support/report-customer",
  authenticate(),
  requireRole(["provider"]),
  communicationController.reportCustomer
);

// Get provider customer reports
router.get(
  "/support/customer-reports",
  authenticate(),
  requireRole(["provider"]),
  communicationController.getCustomerReports
);

// ==================== HELP CENTER ====================

// Get help center categories
router.get(
  "/help/categories",
  authenticate(),
  requireRole(["provider"]),
  communicationController.getHelpCenterCategories
);

// Get help center article
router.get(
  "/help/article/:articleId",
  authenticate(),
  requireRole(["provider"]),
  communicationController.getHelpCenterArticle
);

// Search help center
router.get(
  "/help/search",
  authenticate(),
  requireRole(["provider"]),
  communicationController.searchHelpCenter
);

export default router;
