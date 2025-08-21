import { IChatMessage } from "../models/ChatMessage";
import { ChatMessage } from "../models/ChatMessage";
import { Booking } from "../models/Booking";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import { SocketServer } from "../socket/socketServer";

export class ChatService {
  private socketServer: SocketServer;

  constructor(socketServer: SocketServer) {
    this.socketServer = socketServer;
  }

  // Send a message
  async sendMessage(
    bookingId: string,
    senderId: string,
    message: string,
    messageType: "text" | "image" | "file" | "location" = "text",
    metadata?: any
  ): Promise<IChatMessage> {
    try {
      // Verify booking exists and user is part of it
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      if (
        booking.userId.toString() !== senderId &&
        booking.providerId.toString() !== senderId
      ) {
        throw new AppError("Access denied", 403);
      }

      // Create chat message
      const chatMessage = new ChatMessage({
        bookingId,
        senderId,
        message,
        messageType,
        metadata,
        timestamp: new Date(),
      });

      await chatMessage.save();

      // Emit real-time message
      this.socketServer.emitToBooking(bookingId, "new_message", {
        id: chatMessage._id,
        bookingId,
        senderId,
        message,
        messageType,
        timestamp: chatMessage.timestamp,
        metadata,
      });

      return chatMessage;
    } catch (error) {
      throw new AppError("Failed to send message", 500);
    }
  }

  // Get chat history for a booking
  async getChatHistory(
    bookingId: string,
    userId: string,
    limit: number = 50,
    before?: Date
  ): Promise<IChatMessage[]> {
    try {
      // Verify user has access to this booking
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

      // Get chat history
      const messages = await ChatMessage.getChatHistory(
        bookingId,
        limit,
        before
      );

      // Mark messages as read for the requesting user
      const unreadMessages = messages.filter(
        (msg) => !msg.isRead && msg.senderId.toString() !== userId
      );

      if (unreadMessages.length > 0) {
        await ChatMessage.updateMany(
          { _id: { $in: unreadMessages.map((msg) => msg._id) } },
          { isRead: true, readAt: new Date() }
        );
      }

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      throw new AppError("Failed to get chat history", 500);
    }
  }

  // Mark messages as read
  async markMessagesAsRead(
    messageIds: string[],
    userId: string
  ): Promise<void> {
    try {
      // Verify user owns these messages or is the recipient
      const messages = await ChatMessage.find({
        _id: { $in: messageIds },
        $or: [{ senderId: userId }, { recipientId: userId }],
      });

      if (messages.length !== messageIds.length) {
        throw new AppError("Some messages not found or access denied", 403);
      }

      // Mark as read
      await ChatMessage.updateMany(
        { _id: { $in: messageIds } },
        { isRead: true, readAt: new Date() }
      );

      // Emit read receipts
      const bookingIds = [
        ...new Set(messages.map((msg) => msg.bookingId.toString())),
      ];
      bookingIds.forEach((bookingId) => {
        this.socketServer.emitToBooking(bookingId, "messages_read", {
          userId,
          messageIds,
          timestamp: new Date(),
        });
      });
    } catch (error) {
      throw new AppError("Failed to mark messages as read", 500);
    }
  }

  // Get unread message count for a user
  async getUnreadCount(userId: string, bookingId?: string): Promise<number> {
    try {
      return await ChatMessage.getUnreadCount(userId, bookingId);
    } catch (error) {
      throw new AppError("Failed to get unread count", 500);
    }
  }

  // Get recent conversations for a user
  async getRecentConversations(userId: string): Promise<any[]> {
    try {
      // Get all bookings for the user
      const bookings = await Booking.find({
        $or: [{ userId }, { providerId: userId }],
      })
        .populate("userId", "firstName lastName email profileImage")
        .populate("providerId", "firstName lastName email profileImage")
        .populate("serviceId", "title category")
        .sort({ updatedAt: -1 });

      // Get last message for each booking
      const conversations = await Promise.all(
        bookings.map(async (booking: any) => {
          const lastMessage = await ChatMessage.findOne({
            bookingId: booking._id,
          })
            .sort({ timestamp: -1 })
            .populate("senderId", "firstName lastName email profileImage");

          const unreadCount = await ChatMessage.getUnreadCount(
            userId,
            booking._id.toString()
          );

          return {
            bookingId: booking._id,
            booking: {
              id: booking._id,
              status: booking.status,
              service: booking.serviceId,
              customer: booking.userId,
              provider: booking.providerId,
              scheduledDate: booking.scheduledDate,
              updatedAt: booking.updatedAt,
            },
            lastMessage: lastMessage
              ? {
                  id: lastMessage._id,
                  message: lastMessage.message,
                  messageType: lastMessage.messageType,
                  sender: lastMessage.senderId,
                  timestamp: lastMessage.timestamp,
                }
              : null,
            unreadCount,
          };
        })
      );

      return conversations.filter((conv) => conv.lastMessage);
    } catch (error) {
      throw new AppError("Failed to get recent conversations", 500);
    }
  }

  // Send typing indicator
  async sendTypingIndicator(
    bookingId: string,
    userId: string,
    isTyping: boolean
  ): Promise<void> {
    try {
      // Verify user has access to this booking
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

      // Emit typing indicator
      this.socketServer.emitToBooking(
        bookingId,
        isTyping ? "typing_start" : "typing_stop",
        {
          userId,
          timestamp: new Date(),
        }
      );
    } catch (error) {
      throw new AppError("Failed to send typing indicator", 500);
    }
  }

  // Send location update
  async sendLocationUpdate(
    bookingId: string,
    userId: string,
    location: { latitude: number; longitude: number; address?: string }
  ): Promise<void> {
    try {
      // Verify user has access to this booking
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

      // Emit location update
      this.socketServer.emitToBooking(bookingId, "location_updated", {
        userId,
        location,
        timestamp: new Date(),
      });
    } catch (error) {
      throw new AppError("Failed to send location update", 500);
    }
  }

  // Get online status of users in a booking
  async getOnlineStatus(
    bookingId: string
  ): Promise<{ [key: string]: boolean }> {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      const userId = booking.userId.toString();
      const providerId = booking.providerId.toString();

      return {
        [userId]: this.socketServer.isUserOnline(userId),
        [providerId]: this.socketServer.isUserOnline(providerId),
      };
    } catch (error) {
      throw new AppError("Failed to get online status", 500);
    }
  }
}
