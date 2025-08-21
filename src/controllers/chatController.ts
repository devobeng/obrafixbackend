import { Request, Response } from "express";
import { ChatService } from "../services/ChatService";
import { SocketServer } from "../socket/socketServer";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";
import { IAuthRequest } from "../types";

export class ChatController {
  private chatService: ChatService;

  constructor(socketServer: SocketServer) {
    this.chatService = new ChatService(socketServer);
  }

  // Send a message
  sendMessage = catchAsync(async (req: IAuthRequest, res: Response) => {
    const { bookingId, message, messageType = "text", metadata } = req.body;
    const senderId = req.user!.id;

    if (!bookingId || !message) {
      throw new AppError("Booking ID and message are required", 400);
    }

    const chatMessage = await this.chatService.sendMessage(
      bookingId,
      senderId,
      message,
      messageType,
      metadata
    );

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: chatMessage,
    });
  });

  // Get chat history for a booking
  getChatHistory = catchAsync(async (req: IAuthRequest, res: Response) => {
    const { bookingId } = req.params;
    const { limit = "50", before } = req.query;
    const userId = req.user!.id;

    const messages = await this.chatService.getChatHistory(
      bookingId,
      userId,
      parseInt(limit as string),
      before ? new Date(before as string) : undefined
    );

    res.status(200).json({
      success: true,
      message: "Chat history retrieved successfully",
      data: messages,
    });
  });

  // Mark messages as read
  markMessagesAsRead = catchAsync(async (req: IAuthRequest, res: Response) => {
    const { messageIds } = req.body;
    const userId = req.user!.id;

    if (!messageIds || !Array.isArray(messageIds)) {
      throw new AppError("Message IDs array is required", 400);
    }

    await this.chatService.markMessagesAsRead(messageIds, userId);

    res.status(200).json({
      success: true,
      message: "Messages marked as read successfully",
    });
  });

  // Get unread message count
  getUnreadCount = catchAsync(async (req: IAuthRequest, res: Response) => {
    const { bookingId } = req.query;
    const userId = req.user!.id;

    const count = await this.chatService.getUnreadCount(
      userId,
      bookingId as string
    );

    res.status(200).json({
      success: true,
      message: "Unread count retrieved successfully",
      data: { unreadCount: count },
    });
  });

  // Get recent conversations
  getRecentConversations = catchAsync(
    async (req: IAuthRequest, res: Response) => {
      const userId = req.user!.id;

      const conversations = await this.chatService.getRecentConversations(
        userId
      );

      res.status(200).json({
        success: true,
        message: "Recent conversations retrieved successfully",
        data: conversations,
      });
    }
  );

  // Send typing indicator
  sendTypingIndicator = catchAsync(async (req: IAuthRequest, res: Response) => {
    const { bookingId, isTyping } = req.body;
    const userId = req.user!.id;

    if (!bookingId) {
      throw new AppError("Booking ID is required", 400);
    }

    await this.chatService.sendTypingIndicator(bookingId, userId, isTyping);

    res.status(200).json({
      success: true,
      message: "Typing indicator sent successfully",
    });
  });

  // Send location update
  sendLocationUpdate = catchAsync(async (req: IAuthRequest, res: Response) => {
    const { bookingId, location } = req.body;
    const userId = req.user!.id;

    if (!bookingId || !location) {
      throw new AppError("Booking ID and location are required", 400);
    }

    if (!location.latitude || !location.longitude) {
      throw new AppError("Latitude and longitude are required", 400);
    }

    await this.chatService.sendLocationUpdate(bookingId, userId, location);

    res.status(200).json({
      success: true,
      message: "Location update sent successfully",
    });
  });

  // Get online status of users in a booking
  getOnlineStatus = catchAsync(async (req: IAuthRequest, res: Response) => {
    const { bookingId } = req.params;
    const userId = req.user!.id;

    // Verify user has access to this booking
    const { Booking } = await import("../models/Booking");
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (
      booking.userId.toString() !== userId &&
      booking.providerId.toString() !== userId
    ) {
      throw new AppError("Access denied", 403);
    }

    const onlineStatus = await this.chatService.getOnlineStatus(bookingId);

    res.status(200).json({
      success: true,
      message: "Online status retrieved successfully",
      data: onlineStatus,
    });
  });
}
