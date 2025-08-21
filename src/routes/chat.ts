import express from "express";
import { ChatController } from "../controllers/chatController";
import { SocketServer } from "../socket/socketServer";
import { authenticate } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import { chatValidators } from "../validators/chatValidator";

// Factory function to create chat routes with socket server
export const createChatRoutes = (socketServer: SocketServer) => {
  const router = express.Router();
  const chatController = new ChatController(socketServer);

  // Apply authentication middleware to all chat routes
  router.use(authenticate);

  // Chat message routes
  router.post(
    "/messages",
    validateRequest(chatValidators.sendMessage),
    chatController.sendMessage
  );

  router.get(
    "/messages/:bookingId",
    validateRequest(chatValidators.getChatHistory),
    chatController.getChatHistory
  );

  router.post(
    "/messages/read",
    validateRequest(chatValidators.markMessagesAsRead),
    chatController.markMessagesAsRead
  );

  // Conversation routes
  router.get("/conversations", chatController.getRecentConversations);

  router.get("/unread-count", chatController.getUnreadCount);

  // Real-time features
  router.post(
    "/typing",
    validateRequest(chatValidators.sendTypingIndicator),
    chatController.sendTypingIndicator
  );

  router.post(
    "/location",
    validateRequest(chatValidators.sendLocationUpdate),
    chatController.sendLocationUpdate
  );

  router.get("/online-status/:bookingId", chatController.getOnlineStatus);

  return router;
};

// Default export for backward compatibility
export default createChatRoutes;
