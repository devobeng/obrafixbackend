import { INotification, IUser, IBooking, IService } from "../types";
import { Notification } from "../models/Notification";
import { User } from "../models/User";
import { Booking } from "../models/Booking";
import { Service } from "../models/Service";
import { AppError } from "../utils/AppError";

export interface NotificationData {
  bookingId?: string;
  serviceId?: string;
  amount?: number;
  status?: string;
  metadata?: any;
}

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: INotification["type"];
  category: INotification["category"];
  priority?: INotification["priority"];
  data?: NotificationData;
  scheduledAt?: Date;
  expiresAt?: Date;
}

export class NotificationService {
  // Create a new notification
  async createNotification(
    params: CreateNotificationParams
  ): Promise<INotification> {
    const notification = new Notification({
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      category: params.category,
      priority: params.priority || "medium",
      data: params.data,
      scheduledAt: params.scheduledAt,
      expiresAt: params.expiresAt,
    });

    await notification.save();
    return notification;
  }

  // Create job status update notifications
  async createJobStatusNotification(
    bookingId: string,
    status: string,
    userId: string,
    providerId: string
  ): Promise<void> {
    const [booking, service, user, provider] = await Promise.all([
      Booking.findById(bookingId),
      Service.findById(booking?.serviceId),
      User.findById(userId),
      User.findById(providerId),
    ]);

    if (!booking || !service || !user || !provider) {
      throw new AppError("Required data not found for notification", 404);
    }

    const serviceName = service.title;
    const providerName = `${provider.firstName} ${provider.lastName}`;
    const userName = `${user.firstName} ${user.lastName}`;

    let userNotification: CreateNotificationParams | null = null;
    let providerNotification: CreateNotificationParams | null = null;

    switch (status) {
      case "accepted":
        userNotification = {
          userId: userId,
          title: "Job Accepted! 🎉",
          message: `${providerName} has accepted your ${serviceName} job request. They will contact you soon to confirm details.`,
          type: "job_accepted",
          category: "booking",
          priority: "high",
          data: {
            bookingId: bookingId,
            serviceId: service._id.toString(),
            status: "accepted",
          },
        };
        break;

      case "on_way":
        userNotification = {
          userId: userId,
          title: "Provider On The Way! 🚗",
          message: `${providerName} is on the way to your location for the ${serviceName} job.`,
          type: "vendor_on_way",
          category: "booking",
          priority: "high",
          data: {
            bookingId: bookingId,
            serviceId: service._id.toString(),
            status: "on_way",
          },
        };
        break;

      case "in_progress":
        userNotification = {
          userId: userId,
          title: "Job Started! 🔨",
          message: `${providerName} has started working on your ${serviceName} job.`,
          type: "job_started",
          category: "booking",
          priority: "medium",
          data: {
            bookingId: bookingId,
            serviceId: service._id.toString(),
            status: "in_progress",
          },
        };
        break;

      case "completed":
        userNotification = {
          userId: userId,
          title: "Job Completed! ✅",
          message: `${providerName} has completed your ${serviceName} job. Please rate their service!`,
          type: "job_completed",
          category: "booking",
          priority: "high",
          data: {
            bookingId: bookingId,
            serviceId: service._id.toString(),
            status: "completed",
          },
        };
        break;

      case "cancelled":
        userNotification = {
          userId: userId,
          title: "Job Cancelled ❌",
          message: `Your ${serviceName} job has been cancelled.`,
          type: "job_cancelled",
          category: "booking",
          priority: "medium",
          data: {
            bookingId: bookingId,
            serviceId: service._id.toString(),
            status: "cancelled",
          },
        };
        break;
    }

    // Create notifications
    if (userNotification) {
      await this.createNotification(userNotification);
    }

    if (providerNotification) {
      await this.createNotification(providerNotification);
    }
  }

  // Create payment notifications
  async createPaymentNotification(
    userId: string,
    type: "payment_received" | "withdrawal_approved" | "withdrawal_rejected",
    data: NotificationData
  ): Promise<INotification> {
    let title: string;
    let message: string;
    let priority: INotification["priority"] = "medium";

    switch (type) {
      case "payment_received":
        title = "Payment Received! 💰";
        message = `Payment of GHS ${data.amount} has been received for your service.`;
        priority = "high";
        break;
      case "withdrawal_approved":
        title = "Withdrawal Approved! ✅";
        message = `Your withdrawal request of GHS ${data.amount} has been approved and processed.`;
        priority = "high";
        break;
      case "withdrawal_rejected":
        title = "Withdrawal Rejected ❌";
        message = `Your withdrawal request of GHS ${data.amount} has been rejected. Please contact support for more information.`;
        priority = "high";
        break;
    }

    return await this.createNotification({
      userId,
      title,
      message,
      type,
      category: "payment",
      priority,
      data,
    });
  }

  // Create review notifications
  async createReviewNotification(
    providerId: string,
    serviceId: string,
    rating: number,
    comment: string
  ): Promise<INotification> {
    const [service, user] = await Promise.all([
      Service.findById(serviceId),
      User.findById(service?.provider),
    ]);

    if (!service || !user) {
      throw new AppError("Service or user not found", 404);
    }

    const userName = `${user.firstName} ${user.lastName}`;
    const stars = "⭐".repeat(rating);

    return await this.createNotification({
      userId: providerId,
      title: "New Review Received! ⭐",
      message: `${userName} gave you ${rating} stars for your ${
        service.title
      } service: "${comment.substring(0, 100)}${
        comment.length > 100 ? "..." : ""
      }"`,
      type: "review_received",
      category: "review",
      priority: "medium",
      data: {
        serviceId: serviceId,
        status: "reviewed",
        metadata: { rating, comment },
      },
    });
  }

  // Get notifications for a user
  async getUserNotifications(
    userId: string,
    limit: number = 50,
    skip: number = 0,
    unreadOnly: boolean = false
  ): Promise<{ notifications: INotification[]; total: number }> {
    const query: any = { userId };
    if (unreadOnly) query.isRead = false;

    const [notifications, total] = await Promise.all([
      Notification["findByUser"](userId, limit, skip),
      Notification.countDocuments(query),
    ]);

    return { notifications, total };
  }

  // Get unread notifications count
  async getUnreadCount(userId: string): Promise<number> {
    return await Notification.countDocuments({ userId, isRead: false });
  }

  // Mark notification as read
  async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<INotification> {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new AppError("Notification not found", 404);
    }

    if (notification.userId.toString() !== userId) {
      throw new AppError("Access denied", 403);
    }

    await notification["markAsRead"]();
    return notification;
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
  }

  // Delete notification
  async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<void> {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new AppError("Notification not found", 404);
    }

    if (notification.userId.toString() !== userId) {
      throw new AppError("Access denied", 403);
    }

    await Notification.findByIdAndDelete(notificationId);
  }

  // Get notifications by type
  async getNotificationsByType(
    userId: string,
    type: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<{ notifications: INotification[]; total: number }> {
    const [notifications, total] = await Promise.all([
      Notification["findByType"](type, userId).skip(skip).limit(limit),
      Notification.countDocuments({ userId, type }),
    ]);

    return { notifications, total };
  }

  // Get pending delivery notifications
  async getPendingDeliveryNotifications(): Promise<INotification[]> {
    return await Notification["findPendingDelivery"]();
  }

  // Mark notification as sent
  async markAsSent(notificationId: string): Promise<INotification> {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new AppError("Notification not found", 404);
    }

    await notification["markAsSent"]();
    return notification;
  }

  // Mark notification as delivered
  async markAsDelivered(notificationId: string): Promise<INotification> {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new AppError("Notification not found", 404);
    }

    await notification["markAsDelivered"]();
    return notification;
  }

  // Mark notification as failed
  async markAsFailed(
    notificationId: string,
    reason: string
  ): Promise<INotification> {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new AppError("Notification not found", 404);
    }

    await notification["markAsFailed"](reason);
    return notification;
  }

  // Clean up expired notifications
  async cleanupExpiredNotifications(): Promise<void> {
    await Notification.deleteMany({
      expiresAt: { $lt: new Date() },
    });
  }

  // Get notification statistics for a user
  async getUserNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const [total, unread] = await Promise.all([
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    // Get breakdown by category
    const categoryBreakdown = await Notification.aggregate([
      { $match: { userId: new (require("mongoose").Types.ObjectId)(userId) } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    // Get breakdown by type
    const typeBreakdown = await Notification.aggregate([
      { $match: { userId: new (require("mongoose").Types.ObjectId)(userId) } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    const byCategory: Record<string, number> = {};
    const byType: Record<string, number> = {};

    categoryBreakdown.forEach((item: any) => {
      byCategory[item._id] = item.count;
    });

    typeBreakdown.forEach((item: any) => {
      byType[item._id] = item.count;
    });

    return {
      total,
      unread,
      byCategory,
      byType,
    };
  }

  // Send general notification
  async sendNotification(notificationData: {
    recipient: string;
    type: string;
    title: string;
    message: string;
    metadata?: any;
  }): Promise<INotification> {
    try {
      const notification = new Notification({
        recipient: notificationData.recipient,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        metadata: notificationData.metadata || {},
        isRead: false,
      });

      const savedNotification = await notification.save();

      // Here you would integrate with push notifications, email, SMS, etc.
      // For now, we'll just save to database
      console.log(`Notification sent to ${notificationData.recipient}: ${notificationData.title}`);

      return savedNotification;
    } catch (error) {
      throw new AppError("Failed to send notification", 500);
    }
  }

  // Send booking request notification to provider
  async sendBookingRequestToProvider(bookingData: any): Promise<void> {
    try {
      await this.sendNotification({
        recipient: bookingData.providerId.toString(),
        type: "new_booking_request",
        title: "New Booking Request",
        message: `You have a new booking request for ${bookingData.serviceId?.title || "your service"}`,
        metadata: { bookingId: bookingData._id, serviceTitle: bookingData.serviceId?.title },
      });
    } catch (error) {
      console.error("Failed to send booking request notification:", error);
    }
  }

  // Send job status update notification
  async sendJobStatusUpdate(bookingData: any, status: string, note: string): Promise<void> {
    try {
      const statusMessages = {
        accepted: "Your booking has been accepted by the provider",
        on_way: "The provider is on their way to your location",
        in_progress: "The service is now in progress",
        completed: "The service has been completed",
        cancelled: "Your booking has been cancelled",
      };

      const message = statusMessages[status as keyof typeof statusMessages] || `Booking status updated to ${status}`;

      await this.sendNotification({
        recipient: bookingData.userId.toString(),
        type: "job_status_update",
        title: "Job Status Updated",
        message,
        metadata: { bookingId: bookingData._id, status, note },
      });
    } catch (error) {
      console.error("Failed to send job status update notification:", error);
    }
  }

  // Send new message notification
  async sendNewMessageNotification(booking: any, senderId: string, message: string): Promise<void> {
    try {
      const recipientId = senderId === booking.userId.toString() 
        ? booking.providerId.toString() 
        : booking.userId.toString();

      await this.sendNotification({
        recipient: recipientId,
        type: "new_message",
        title: "New Message",
        message: `You have a new message about your booking`,
        metadata: { bookingId: booking._id, senderId, message: message.substring(0, 100) },
      });
    } catch (error) {
      console.error("Failed to send new message notification:", error);
    }
  }

  // Send cancellation notification
  async sendCancellationNotification(booking: any, reason: string): Promise<void> {
    try {
      // Notify customer
      await this.sendNotification({
        recipient: booking.userId.toString(),
        type: "booking_cancelled",
        title: "Booking Cancelled",
        message: `Your booking has been cancelled. Reason: ${reason}`,
        metadata: { bookingId: booking._id, reason },
      });

      // Notify provider
      await this.sendNotification({
        recipient: booking.providerId.toString(),
        type: "booking_cancelled",
        title: "Booking Cancelled",
        message: `A booking has been cancelled. Reason: ${reason}`,
        metadata: { bookingId: booking._id, reason },
      });
    } catch (error) {
      console.error("Failed to send cancellation notification:", error);
    }
  }

  // Send dispute notification
  async sendDisputeNotification(booking: any, reason: string): Promise<void> {
    try {
      // Notify both parties about dispute
      const notifications = [
        {
          recipient: booking.userId.toString(),
          type: "dispute_raised",
          title: "Dispute Raised",
          message: `A dispute has been raised for your booking. Reason: ${reason}`,
          metadata: { bookingId: booking._id, reason },
        },
        {
          recipient: booking.providerId.toString(),
          type: "dispute_raised",
          title: "Dispute Raised",
          message: `A dispute has been raised for a booking. Reason: ${reason}`,
          metadata: { bookingId: booking._id, reason },
        },
      ];

      await Promise.all(notifications.map(notification => this.sendNotification(notification)));
    } catch (error) {
      console.error("Failed to send dispute notification:", error);
    }
  }
}
