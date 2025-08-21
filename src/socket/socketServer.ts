import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { ChatMessage } from "../models/ChatMessage";
import { NotificationService } from "../services/NotificationService";

export class SocketServer {
  private io: SocketIOServer;
  private notificationService: NotificationService;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env["CORS_ORIGIN"] || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.notificationService = new NotificationService();
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace("Bearer ", "");

        if (!token) {
          return next(new Error("Authentication error"));
        }

        const decoded = jwt.verify(
          token,
          process.env["JWT_SECRET"] || "fallback-secret-key"
        ) as any;
        if (!decoded || !decoded.userId) {
          return next(new Error("Invalid token"));
        }

        const user = await User.findById(decoded.userId).select(
          "_id email role isVerified"
        );
        if (!user || !user.isVerified) {
          return next(new Error("User not found or not verified"));
        }

        socket.data.user = {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
        };

        next();
      } catch (error) {
        next(new Error("Authentication failed"));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket) => {
      const user = socket.data.user;
      console.log(`User ${user.email} connected with socket ${socket.id}`);

      // Store user-socket mapping
      this.userSockets.set(user.id, socket.id);
      this.socketUsers.set(socket.id, user.id);

      // Join user to their personal room
      socket.join(`user:${user.id}`);

      // Join provider to provider room if applicable
      if (user.role === "provider") {
        socket.join("providers");
      }

      // Join admin to admin room if applicable
      if (user.role === "admin") {
        socket.join("admins");
      }

      // Handle chat messages
      socket.on("send_message", async (data) => {
        await this.handleChatMessage(socket, data);
      });

      // Handle typing indicators
      socket.on("typing_start", (data) => {
        socket.to(`chat:${data.bookingId}`).emit("typing_start", {
          userId: user.id,
          userName: user.email,
        });
      });

      socket.on("typing_stop", (data) => {
        socket.to(`chat:${data.bookingId}`).emit("typing_stop", {
          userId: user.id,
        });
      });

      // Handle read receipts
      socket.on("mark_read", async (data) => {
        await this.handleMarkAsRead(socket, data);
      });

      // Handle job status updates
      socket.on("job_status_update", async (data) => {
        await this.handleJobStatusUpdate(socket, data);
      });

      // Handle location updates
      socket.on("location_update", (data) => {
        socket.to(`booking:${data.bookingId}`).emit("location_updated", {
          userId: user.id,
          location: data.location,
          timestamp: new Date(),
        });
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log(`User ${user.email} disconnected`);
        this.userSockets.delete(user.id);
        this.socketUsers.delete(socket.id);
      });
    });
  }

  private async handleChatMessage(socket: any, data: any) {
    try {
      const { bookingId, message, messageType = "text" } = data;
      const user = socket.data.user;

      // Save message to database
      const chatMessage = new ChatMessage({
        bookingId,
        senderId: user.id,
        message,
        messageType,
        timestamp: new Date(),
      });

      await chatMessage.save();

      // Emit message to all users in the booking chat
      this.io.to(`chat:${bookingId}`).emit("new_message", {
        id: chatMessage._id,
        bookingId,
        senderId: user.id,
        senderName: user.email,
        message,
        messageType,
        timestamp: chatMessage.timestamp,
      });

      // Send push notification to other users in the chat
      const booking = await import("../models/Booking").then((m) =>
        m.Booking.findById(bookingId)
      );
      if (booking) {
        const recipientId =
          user.id === booking.userId.toString()
            ? booking.providerId.toString()
            : booking.userId.toString();

        await this.notificationService.sendNotification({
          recipient: recipientId,
          type: "new_chat_message",
          title: "New Message",
          message: `New message in booking #${bookingId}`,
          metadata: { bookingId, message: message.substring(0, 50) },
        });
      }
    } catch (error) {
      console.error("Error handling chat message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  }

  private async handleMarkAsRead(socket: any, data: any) {
    try {
      const { messageIds, bookingId } = data;
      const user = socket.data.user;

      // Update messages as read
      await ChatMessage.updateMany(
        { _id: { $in: messageIds }, recipientId: user.id },
        { isRead: true, readAt: new Date() }
      );

      // Emit read receipt to other users
      socket.to(`chat:${bookingId}`).emit("messages_read", {
        userId: user.id,
        messageIds,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }

  private async handleJobStatusUpdate(socket: any, data: any) {
    try {
      const { bookingId, status, note, location } = data;
      const user = socket.data.user;

      // Emit job status update to all users in the booking
      this.io.to(`booking:${bookingId}`).emit("job_status_updated", {
        bookingId,
        status,
        note,
        location,
        updatedBy: user.id,
        timestamp: new Date(),
      });

      // Send push notifications
      const booking = await import("../models/Booking").then((m) =>
        m.Booking.findById(bookingId)
      );
      if (booking) {
        const recipientId =
          user.id === booking.userId.toString()
            ? booking.providerId.toString()
            : booking.userId.toString();

        const statusMessages = {
          accepted: "Your booking has been accepted by the provider",
          on_way: "The provider is on their way to your location",
          in_progress: "The service is now in progress",
          completed: "The service has been completed",
          cancelled: "Your booking has been cancelled",
        };

        const message =
          statusMessages[status as keyof typeof statusMessages] ||
          `Job status updated to ${status}`;

        await this.notificationService.sendNotification({
          recipient: recipientId,
          type: "job_status_update",
          title: "Job Status Updated",
          message,
          metadata: { bookingId, status, note, location },
        });
      }
    } catch (error) {
      console.error("Error handling job status update:", error);
      socket.emit("error", { message: "Failed to update job status" });
    }
  }

  // Public methods for other services to use
  public emitToUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  public emitToBooking(bookingId: string, event: string, data: any) {
    this.io.to(`booking:${bookingId}`).emit(event, data);
  }

  public emitToProviders(event: string, data: any) {
    this.io.to("providers").emit(event, data);
  }

  public emitToAdmins(event: string, data: any) {
    this.io.to("admins").emit(event, data);
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}
