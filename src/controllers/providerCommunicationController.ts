import { Request, Response } from "express";
import { ProviderCommunicationService } from "../services/ProviderCommunicationService";
import { asyncHandler } from "../middleware/errorHandler";

export class ProviderCommunicationController {
  private communicationService: ProviderCommunicationService;

  constructor(communicationService: ProviderCommunicationService) {
    this.communicationService = communicationService;
  }

  // ==================== CHAT MANAGEMENT ====================

  // Get provider chat statistics
  getChatStats = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const stats = await this.communicationService.getProviderChatStats(
      providerId
    );

    res.json({
      success: true,
      data: stats,
    });
  });

  // Get provider conversations
  getConversations = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { page = "1", limit = "20", status = "all", search } = req.query;

    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as "active" | "completed" | "all",
      search: search as string,
    };

    const result = await this.communicationService.getProviderConversations(
      providerId,
      options
    );

    res.json({
      success: true,
      data: result.conversations,
      pagination: result.pagination,
    });
  });

  // Send quick response
  sendQuickResponse = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { bookingId } = req.params;
    const { templateType, customMessage } = req.body;

    if (!templateType) {
      return res
        .status(400)
        .json({ success: false, message: "Template type is required" });
    }

    const message = await this.communicationService.sendQuickResponse(
      bookingId,
      providerId,
      templateType,
      customMessage
    );

    res.json({
      success: true,
      message: "Quick response sent successfully",
      data: message,
    });
  });

  // ==================== NOTIFICATION MANAGEMENT ====================

  // Get provider notification statistics
  getNotificationStats = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const stats = await this.communicationService.getProviderNotificationStats(
      providerId
    );

    res.json({
      success: true,
      data: stats,
    });
  });

  // Get provider notifications by category
  getNotificationsByCategory = asyncHandler(
    async (req: Request, res: Response) => {
      const providerId = req.user?.id;
      if (!providerId) {
        return res
          .status(401)
          .json({ success: false, message: "User not authenticated" });
      }

      const { category } = req.params;
      const { page = "1", limit = "20", unreadOnly = "false" } = req.query;

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        unreadOnly: unreadOnly === "true",
      };

      const result =
        await this.communicationService.getProviderNotificationsByCategory(
          providerId,
          category,
          options
        );

      res.json({
        success: true,
        data: result.notifications,
        pagination: result.pagination,
      });
    }
  );

  // Update notification preferences
  updateNotificationPreferences = asyncHandler(
    async (req: Request, res: Response) => {
      const providerId = req.user?.id;
      if (!providerId) {
        return res
          .status(401)
          .json({ success: false, message: "User not authenticated" });
      }

      const preferences = req.body;

      await this.communicationService.updateNotificationPreferences(
        providerId,
        preferences
      );

      res.json({
        success: true,
        message: "Notification preferences updated successfully",
      });
    }
  );

  // ==================== SUPPORT SYSTEM ====================

  // Create support ticket
  createSupportTicket = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { category, subject, description, priority, attachments } = req.body;

    if (!category || !subject || !description || !priority) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const ticket = await this.communicationService.createSupportTicket(
      providerId,
      {
        category,
        subject,
        description,
        priority,
        attachments,
      }
    );

    res.json({
      success: true,
      message: "Support ticket created successfully",
      data: ticket,
    });
  });

  // Get provider support tickets
  getSupportTickets = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { page = "1", limit = "20", status = "all" } = req.query;

    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as "open" | "in_progress" | "resolved" | "closed" | "all",
    };

    const result = await this.communicationService.getProviderSupportTickets(
      providerId,
      options
    );

    res.json({
      success: true,
      data: result.tickets,
      pagination: result.pagination,
    });
  });

  // ==================== CUSTOMER REPORTING ====================

  // Report customer
  reportCustomer = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { customerId, bookingId, reason, description, evidence, severity } =
      req.body;

    if (!customerId || !reason || !description || !severity) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const report = await this.communicationService.reportCustomer(providerId, {
      customerId,
      bookingId,
      reason,
      description,
      evidence,
      severity,
    });

    res.json({
      success: true,
      message: "Customer report submitted successfully",
      data: report,
    });
  });

  // Get provider customer reports
  getCustomerReports = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { page = "1", limit = "20", status = "all" } = req.query;

    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as
        | "pending"
        | "investigating"
        | "resolved"
        | "dismissed"
        | "all",
    };

    const result = await this.communicationService.getProviderCustomerReports(
      providerId,
      options
    );

    res.json({
      success: true,
      data: result.reports,
      pagination: result.pagination,
    });
  });

  // ==================== HELP CENTER ====================

  // Get help center categories
  getHelpCenterCategories = asyncHandler(
    async (req: Request, res: Response) => {
      const categories =
        await this.communicationService.getHelpCenterCategories();

      res.json({
        success: true,
        data: categories,
      });
    }
  );

  // Get help center article
  getHelpCenterArticle = asyncHandler(async (req: Request, res: Response) => {
    const { articleId } = req.params;

    const article = await this.communicationService.getHelpCenterArticle(
      articleId
    );

    res.json({
      success: true,
      data: article,
    });
  });

  // Search help center
  searchHelpCenter = asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Search query is required" });
    }

    const results = await this.communicationService.searchHelpCenter(query);

    res.json({
      success: true,
      data: results,
    });
  });

  // ==================== CHAT INTEGRATION ====================

  // Get chat history for a booking
  getChatHistory = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { bookingId } = req.params;
    const { limit = "50", before } = req.query;

    // Import ChatService to use its methods
    const { ChatService } = await import("../services/ChatService");
    const { SocketServer } = await import("../socket/socketServer");

    // You'll need to get the socket server instance
    const socketServer = new SocketServer(null as any); // This should be injected properly
    const chatService = new ChatService(socketServer);

    const messages = await chatService.getChatHistory(
      bookingId,
      providerId,
      parseInt(limit as string),
      before ? new Date(before as string) : undefined
    );

    res.json({
      success: true,
      data: messages,
    });
  });

  // Send message
  sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { bookingId } = req.params;
    const { message, messageType = "text", metadata } = req.body;

    if (!message) {
      return res
        .status(400)
        .json({ success: false, message: "Message is required" });
    }

    // Import ChatService to use its methods
    const { ChatService } = await import("../services/ChatService");
    const { SocketServer } = await import("../socket/socketServer");

    // You'll need to get the socket server instance
    const socketServer = new SocketServer(null as any); // This should be injected properly
    const chatService = new ChatService(socketServer);

    const sentMessage = await chatService.sendMessage(
      bookingId,
      providerId,
      message,
      messageType,
      metadata
    );

    res.json({
      success: true,
      message: "Message sent successfully",
      data: sentMessage,
    });
  });

  // Mark messages as read
  markMessagesAsRead = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { messageIds } = req.body;

    if (!messageIds || !Array.isArray(messageIds)) {
      return res
        .status(400)
        .json({ success: false, message: "Message IDs array is required" });
    }

    // Import ChatService to use its methods
    const { ChatService } = await import("../services/ChatService");
    const { SocketServer } = await import("../socket/socketServer");

    // You'll need to get the socket server instance
    const socketServer = new SocketServer(null as any); // This should be injected properly
    const chatService = new ChatService(socketServer);

    await chatService.markMessagesAsRead(messageIds, providerId);

    res.json({
      success: true,
      message: "Messages marked as read",
    });
  });

  // Get unread message count
  getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { bookingId } = req.query;

    // Import ChatService to use its methods
    const { ChatService } = await import("../services/ChatService");
    const { SocketServer } = await import("../socket/socketServer");

    // You'll need to get the socket server instance
    const socketServer = new SocketServer(null as any); // This should be injected properly
    const chatService = new ChatService(socketServer);

    const count = await chatService.getUnreadCount(
      providerId,
      bookingId as string
    );

    res.json({
      success: true,
      data: { unreadCount: count },
    });
  });

  // Send typing indicator
  sendTypingIndicator = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { bookingId } = req.params;
    const { isTyping } = req.body;

    // Import ChatService to use its methods
    const { ChatService } = await import("../services/ChatService");
    const { SocketServer } = await import("../socket/socketServer");

    // You'll need to get the socket server instance
    const socketServer = new SocketServer(null as any); // This should be injected properly
    const chatService = new ChatService(socketServer);

    await chatService.sendTypingIndicator(bookingId, providerId, isTyping);

    res.json({
      success: true,
      message: "Typing indicator sent",
    });
  });

  // Send location update
  sendLocationUpdate = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { bookingId } = req.params;
    const { location } = req.body;

    if (!location || !location.latitude || !location.longitude) {
      return res
        .status(400)
        .json({ success: false, message: "Valid location is required" });
    }

    // Import ChatService to use its methods
    const { ChatService } = await import("../services/ChatService");
    const { SocketServer } = await import("../socket/socketServer");

    // You'll need to get the socket server instance
    const socketServer = new SocketServer(null as any); // This should be injected properly
    const chatService = new ChatService(socketServer);

    await chatService.sendLocationUpdate(bookingId, providerId, location);

    res.json({
      success: true,
      message: "Location update sent",
    });
  });

  // Get online status
  getOnlineStatus = asyncHandler(async (req: Request, res: Response) => {
    const { bookingId } = req.params;

    // Import ChatService to use its methods
    const { ChatService } = await import("../services/ChatService");
    const { SocketServer } = await import("../socket/socketServer");

    // You'll need to get the socket server instance
    const socketServer = new SocketServer(null as any); // This should be injected properly
    const chatService = new ChatService(socketServer);

    const onlineStatus = await chatService.getOnlineStatus(bookingId);

    res.json({
      success: true,
      data: onlineStatus,
    });
  });
}
