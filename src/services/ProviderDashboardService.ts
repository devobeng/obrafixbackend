import { Service } from "../models/Service";
import { BookingRequest } from "../models/BookingRequest";
import { Booking } from "../models/Booking";
import { User } from "../models/User";
import { Notification } from "../models/Notification";
import { AppError } from "../utils/AppError";
import { IService } from "../types";

export class ProviderDashboardService {
  // Service Management
  async createService(
    providerId: string,
    serviceData: Partial<IService>
  ): Promise<IService> {
    try {
      const service = new Service({
        ...serviceData,
        provider: providerId,
        status: "active",
      });

      await service.save();
      return service;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to create service", 500);
    }
  }

  async updateService(
    serviceId: string,
    providerId: string,
    updateData: Partial<IService>
  ): Promise<IService> {
    try {
      const service = await Service.findOneAndUpdate(
        { _id: serviceId, provider: providerId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!service) {
        throw new AppError("Service not found or access denied", 404);
      }

      return service;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to update service", 500);
    }
  }

  async getProviderServices(
    providerId: string,
    filters?: any
  ): Promise<IService[]> {
    try {
      const query: any = { provider: providerId };

      if (filters?.status) query.status = filters.status;
      if (filters?.category) query.category = filters.category;
      if (filters?.isAvailable)
        query["availability.isAvailable"] = filters.isAvailable;

      const services = await Service.find(query)
        .sort({ createdAt: -1 })
        .populate("provider", "firstName lastName businessName");

      return services;
    } catch (error) {
      throw new AppError("Failed to fetch provider services", 500);
    }
  }

  async updateServiceAvailability(
    serviceId: string,
    providerId: string,
    availabilityData: any
  ): Promise<IService> {
    try {
      const service = await Service.findOneAndUpdate(
        { _id: serviceId, provider: providerId },
        {
          availability: availabilityData,
          "availabilityStatus.lastSeen": new Date(),
        },
        { new: true, runValidators: true }
      );

      if (!service) {
        throw new AppError("Service not found or access denied", 404);
      }

      return service;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to update service availability", 500);
    }
  }

  async setOnlineStatus(providerId: string, isOnline: boolean): Promise<void> {
    try {
      await Service.updateMany(
        { provider: providerId },
        {
          "availabilityStatus.isOnline": isOnline,
          "availabilityStatus.lastSeen": new Date(),
        }
      );
    } catch (error) {
      throw new AppError("Failed to update online status", 500);
    }
  }

  // Job Requests Management
  async getJobRequests(providerId: string, filters?: any): Promise<any[]> {
    try {
      const query: any = { providerId };

      if (filters?.status) query.status = filters.status;
      if (filters?.date) {
        const startDate = new Date(filters.date);
        const endDate = new Date(filters.date);
        endDate.setDate(endDate.getDate() + 1);
        query.createdAt = { $gte: startDate, $lt: endDate };
      }

      const requests = await BookingRequest.find(query)
        .populate({
          path: "bookingId",
          populate: [
            {
              path: "userId",
              select: "firstName lastName phone email address",
            },
            { path: "serviceId", select: "title category pricing" },
          ],
        })
        .sort({ createdAt: -1 });

      return requests;
    } catch (error) {
      throw new AppError("Failed to fetch job requests", 500);
    }
  }

  async acceptJobRequest(
    requestId: string,
    providerId: string,
    responseData: any
  ): Promise<any> {
    try {
      const request = await BookingRequest.findOne({
        _id: requestId,
        providerId,
      });

      if (!request) {
        throw new AppError("Job request not found", 404);
      }

      if (request.status !== "pending") {
        throw new AppError("Job request is no longer pending", 400);
      }

      // Accept the request
      await request.accept(
        responseData.estimatedStartTime,
        responseData.estimatedDuration,
        responseData.note
      );

      // Update booking status
      await Booking.findByIdAndUpdate(request.bookingId, {
        status: "confirmed",
        "jobStatus.currentStatus": "confirmed",
        "jobStatus.confirmedAt": new Date(),
        "jobStatus.providerNotes": responseData.note,
      });

      // Send notification to user
      await this.sendJobAcceptedNotification(
        request.bookingId.toString(),
        providerId
      );

      return request;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to accept job request", 500);
    }
  }

  async rejectJobRequest(
    requestId: string,
    providerId: string,
    rejectionData: any
  ): Promise<any> {
    try {
      const request = await BookingRequest.findOne({
        _id: requestId,
        providerId,
      });

      if (!request) {
        throw new AppError("Job request not found", 404);
      }

      if (request.status !== "pending") {
        throw new AppError("Job request is no longer pending", 400);
      }

      // Reject the request
      await request.reject(rejectionData.note);

      // Update booking status
      await Booking.findByIdAndUpdate(request.bookingId, {
        status: "provider_rejected",
        "jobStatus.currentStatus": "provider_rejected",
        "jobStatus.rejectionReason": rejectionData.note,
        "jobStatus.rejectedAt": new Date(),
      });

      // Send notification to user
      await this.sendJobRejectedNotification(
        request.bookingId.toString(),
        providerId
      );

      return request;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to reject job request", 500);
    }
  }

  // Real-time Job Status Updates
  async updateJobStatus(
    bookingId: string,
    providerId: string,
    statusData: any
  ): Promise<any> {
    try {
      const booking = await Booking.findOne({ _id: bookingId, providerId });

      if (!booking) {
        throw new AppError("Booking not found or access denied", 404);
      }

      const updateData: any = {
        "jobStatus.currentStatus": statusData.status,
        "jobStatus.lastUpdated": new Date(),
      };

      // Add status-specific data
      switch (statusData.status) {
        case "on_the_way":
          updateData["jobStatus.onTheWayAt"] = new Date();
          updateData["jobStatus.estimatedArrival"] =
            statusData.estimatedArrival;
          break;
        case "in_progress":
          updateData["jobStatus.startedAt"] = new Date();
          updateData["jobStatus.estimatedCompletion"] =
            statusData.estimatedCompletion;
          break;
        case "completed":
          updateData["jobStatus.completedAt"] = new Date();
          updateData["jobStatus.completionNotes"] = statusData.completionNotes;
          updateData.status = "completed";
          break;
        case "paused":
          updateData["jobStatus.pausedAt"] = new Date();
          updateData["jobStatus.pauseReason"] = statusData.pauseReason;
          break;
        case "resumed":
          updateData["jobStatus.resumedAt"] = new Date();
          break;
      }

      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        updateData,
        { new: true, runValidators: true }
      );

      // Send notification to user about status update
      await this.sendJobStatusNotification(
        bookingId,
        providerId,
        statusData.status
      );

      return updatedBooking;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to update job status", 500);
    }
  }

  // Provider Dashboard Statistics
  async getDashboardStats(providerId: string): Promise<any> {
    try {
      const [
        totalServices,
        activeServices,
        totalBookings,
        pendingRequests,
        completedJobs,
        totalEarnings,
      ] = await Promise.all([
        Service.countDocuments({ provider: providerId }),
        Service.countDocuments({ provider: providerId, status: "active" }),
        Booking.countDocuments({ providerId }),
        BookingRequest.countDocuments({ providerId, status: "pending" }),
        Booking.countDocuments({ providerId, status: "completed" }),
        Booking.aggregate([
          { $match: { providerId: providerId, status: "completed" } },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]),
      ]);

      return {
        totalServices,
        activeServices,
        totalBookings,
        pendingRequests,
        completedJobs,
        totalEarnings: totalEarnings[0]?.total || 0,
      };
    } catch (error) {
      throw new AppError("Failed to fetch dashboard statistics", 500);
    }
  }

  // Service Area Management
  async updateServiceArea(
    serviceId: string,
    providerId: string,
    areaData: any
  ): Promise<IService> {
    try {
      const service = await Service.findOneAndUpdate(
        { _id: serviceId, provider: providerId },
        {
          "location.serviceRadius": areaData.serviceRadius,
          coverage: areaData.coverage,
          "providerPreferences.maxDistance": areaData.maxDistance,
        },
        { new: true, runValidators: true }
      );

      if (!service) {
        throw new AppError("Service not found or access denied", 404);
      }

      return service;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to update service area", 500);
    }
  }

  // Private helper methods
  private async sendJobAcceptedNotification(
    bookingId: string,
    providerId: string
  ): Promise<void> {
    try {
      const booking = await Booking.findById(bookingId).populate("userId");
      if (!booking) return;

      await Notification.create({
        userId: booking.userId,
        type: "job_accepted",
        title: "Job Request Accepted",
        message: `Your service request has been accepted by the provider.`,
        data: { bookingId, providerId },
        priority: "high",
      });
    } catch (error) {
      console.error("Failed to send job accepted notification:", error);
    }
  }

  private async sendJobRejectedNotification(
    bookingId: string,
    providerId: string
  ): Promise<void> {
    try {
      const booking = await Booking.findById(bookingId).populate("userId");
      if (!booking) return;

      await Notification.create({
        userId: booking.userId,
        type: "job_rejected",
        title: "Job Request Rejected",
        message: `Your service request has been rejected by the provider.`,
        data: { bookingId, providerId },
        priority: "medium",
      });
    } catch (error) {
      console.error("Failed to send job rejected notification:", error);
    }
  }

  private async sendJobStatusNotification(
    bookingId: string,
    providerId: string,
    status: string
  ): Promise<void> {
    try {
      const booking = await Booking.findById(bookingId).populate("userId");
      if (!booking) return;

      const statusMessages = {
        on_the_way: "Provider is on the way to your location",
        in_progress: "Service is now in progress",
        completed: "Service has been completed",
        paused: "Service has been paused temporarily",
      };

      await Notification.create({
        userId: booking.userId,
        type: "job_status_update",
        title: "Job Status Update",
        message: statusMessages[status] || `Job status updated to: ${status}`,
        data: { bookingId, providerId, status },
        priority: "medium",
      });
    } catch (error) {
      console.error("Failed to send job status notification:", error);
    }
  }
}
