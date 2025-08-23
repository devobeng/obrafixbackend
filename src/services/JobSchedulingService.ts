import { Booking } from "../models/Booking";
import { BookingRequest } from "../models/BookingRequest";
import { Notification } from "../models/Notification";
import { Service } from "../models/Service";
import { AppError } from "../utils/AppError";
import cron from "node-cron";

export class JobSchedulingService {
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.initializeCronJobs();
  }

  // Initialize all cron jobs
  private initializeCronJobs(): void {
    // Check for expired job requests every 5 minutes
    this.scheduleExpiredJobRequests();
    
    // Send job reminders every hour
    this.scheduleJobReminders();
    
    // Check for overdue jobs every 30 minutes
    this.scheduleOverdueJobChecks();
    
    // Auto-cancel expired bookings daily at midnight
    this.scheduleExpiredBookingCleanup();
    
    // Update provider availability status every 15 minutes
    this.scheduleProviderAvailabilityUpdate();
  }

  // Schedule expired job requests check
  private scheduleExpiredJobRequests(): void {
    const job = cron.schedule("*/5 * * * *", async () => {
      try {
        await this.checkExpiredJobRequests();
      } catch (error) {
        console.error("Error checking expired job requests:", error);
      }
    });

    this.cronJobs.set("expiredJobRequests", job);
  }

  // Schedule job reminders
  private scheduleJobReminders(): void {
    const job = cron.schedule("0 * * * *", async () => {
      try {
        await this.sendJobReminders();
      } catch (error) {
        console.error("Error sending job reminders:", error);
      }
    });

    this.cronJobs.set("jobReminders", job);
  }

  // Schedule overdue job checks
  private scheduleOverdueJobChecks(): void {
    const job = cron.schedule("*/30 * * * *", async () => {
      try {
        await this.checkOverdueJobs();
      } catch (error) {
        console.error("Error checking overdue jobs:", error);
      }
      });
    });

    this.cronJobs.set("overdueJobChecks", job);
  }

  // Schedule expired booking cleanup
  private scheduleExpiredBookingCleanup(): void {
    const job = cron.schedule("0 0 * * *", async () => {
      try {
        await this.cleanupExpiredBookings();
      } catch (error) {
        console.error("Error cleaning up expired bookings:", error);
      }
    });

    this.cronJobs.set("expiredBookingCleanup", job);
  }

  // Schedule provider availability update
  private scheduleProviderAvailabilityUpdate(): void {
    const job = cron.schedule("*/15 * * * *", async () => {
      try {
        await this.updateProviderAvailabilityStatus();
      } catch (error) {
        console.error("Error updating provider availability:", error);
      }
    });

    this.cronJobs.set("providerAvailabilityUpdate", job);
  }

  // Check for expired job requests
  private async checkExpiredJobRequests(): Promise<void> {
    try {
      const expiredRequests = await BookingRequest.find({
        status: "pending",
        createdAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 hours ago
      });

      for (const request of expiredRequests) {
        await request.expire();
        
        // Update booking status
        await Booking.findByIdAndUpdate(request.bookingId, {
          status: "expired",
          "jobStatus.currentStatus": "expired",
          "jobStatus.expiredAt": new Date()
        });

        // Send notification to user
        await this.sendExpiredRequestNotification(request);
      }

      if (expiredRequests.length > 0) {
        console.log(`Expired ${expiredRequests.length} job requests`);
      }
    } catch (error) {
      console.error("Error checking expired job requests:", error);
    }
  }

  // Send job reminders
  private async sendJobReminders(): Promise<void> {
    try {
      const now = new Date();
      const reminderTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

      const upcomingJobs = await Booking.find({
        status: "confirmed",
        "jobStatus.currentStatus": "confirmed",
        "bookingDetails.scheduledDate": {
          $gte: now,
          $lte: reminderTime
        }
      }).populate("userId providerId serviceId");

      for (const job of upcomingJobs) {
        const timeUntilJob = job.bookingDetails.scheduledDate.getTime() - now.getTime();
        const hoursUntilJob = Math.ceil(timeUntilJob / (1000 * 60 * 60));

        // Send reminder to user
        await Notification.create({
          userId: job.userId,
          type: "job_reminder",
          title: "Upcoming Service Reminder",
          message: `Your service is scheduled in ${hoursUntilJob} hour(s). Please ensure you're available.`,
          data: { bookingId: job._id, scheduledTime: job.bookingDetails.scheduledDate },
          priority: "medium"
        });

        // Send reminder to provider
        await Notification.create({
          userId: job.providerId,
          type: "job_reminder",
          title: "Upcoming Job Reminder",
          message: `You have a service scheduled in ${hoursUntilJob} hour(s). Please prepare accordingly.`,
          data: { bookingId: job._id, scheduledTime: job.bookingDetails.scheduledDate },
          priority: "medium"
        });
      }

      if (upcomingJobs.length > 0) {
        console.log(`Sent reminders for ${upcomingJobs.length} upcoming jobs`);
      }
    } catch (error) {
      console.error("Error sending job reminders:", error);
    }
  }

  // Check for overdue jobs
  private async checkOverdueJobs(): Promise<void> {
    try {
      const now = new Date();
      const overdueThreshold = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours overdue

      const overdueJobs = await Booking.find({
        status: "confirmed",
        "jobStatus.currentStatus": "confirmed",
        "bookingDetails.scheduledDate": { $lte: overdueThreshold }
      }).populate("userId providerId");

      for (const job of overdueJobs) {
        // Send overdue notification to user
        await Notification.create({
          userId: job.userId,
          type: "job_overdue",
          title: "Service Overdue",
          message: "Your scheduled service is overdue. Please contact the provider or support team.",
          data: { bookingId: job._id, scheduledTime: job.bookingDetails.scheduledDate },
          priority: "high"
        });

        // Send overdue notification to provider
        await Notification.create({
          userId: job.providerId,
          type: "job_overdue",
          title: "Job Overdue",
          message: "You have an overdue service. Please update the status or contact the customer.",
          data: { bookingId: job._id, scheduledTime: job.bookingDetails.scheduledDate },
          priority: "high"
        });
      }

      if (overdueJobs.length > 0) {
        console.log(`Found ${overdueJobs.length} overdue jobs`);
      }
    } catch (error) {
      console.error("Error checking overdue jobs:", error);
    }
  }

  // Clean up expired bookings
  private async cleanupExpiredBookings(): Promise<void> {
    try {
      const expiredThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

      const expiredBookings = await Booking.find({
        status: { $in: ["expired", "cancelled", "rejected"] },
        updatedAt: { $lte: expiredThreshold }
      });

      // Archive or delete expired bookings (implement based on business requirements)
      console.log(`Found ${expiredBookings.length} expired bookings for cleanup`);
    } catch (error) {
      console.error("Error cleaning up expired bookings:", error);
    }
  }

  // Update provider availability status
  private async updateProviderAvailabilityStatus(): Promise<void> {
    try {
      const offlineThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

      // Mark providers as offline if they haven't updated their status recently
      await Service.updateMany(
        {
          "availabilityStatus.lastSeen": { $lte: offlineThreshold },
          "availabilityStatus.isOnline": true
        },
        {
          "availabilityStatus.isOnline": false
        }
      );
    } catch (error) {
      console.error("Error updating provider availability:", error);
    }
  }

  // Send expired request notification
  private async sendExpiredRequestNotification(request: any): Promise<void> {
    try {
      const booking = await Booking.findById(request.bookingId).populate("userId");
      if (!booking) return;

      await Notification.create({
        userId: booking.userId,
        type: "job_request_expired",
        title: "Job Request Expired",
        message: "Your service request has expired. Please create a new request if you still need the service.",
        data: { bookingId: request.bookingId },
        priority: "medium"
      });
    } catch (error) {
      console.error("Error sending expired request notification:", error);
    }
  }

  // Manual job scheduling methods
  async scheduleJobReminder(bookingId: string, reminderTime: Date): Promise<void> {
    try {
      const timeUntilReminder = reminderTime.getTime() - Date.now();
      
      if (timeUntilReminder <= 0) {
        throw new AppError("Reminder time must be in the future", 400);
      }

      setTimeout(async () => {
        try {
          const booking = await Booking.findById(bookingId).populate("userId providerId");
          if (!booking) return;

          // Send reminder notification
          await Notification.create({
            userId: booking.userId,
            type: "custom_job_reminder",
            title: "Service Reminder",
            message: "This is a reminder for your scheduled service.",
            data: { bookingId: booking._id },
            priority: "medium"
          });
        } catch (error) {
          console.error("Error sending custom job reminder:", error);
        }
      }, timeUntilReminder);

    } catch (error) {
      throw new AppError("Failed to schedule job reminder", 500);
    }
  }

  // Stop all cron jobs
  async stopAllJobs(): Promise<void> {
    for (const [name, job] of this.cronJobs) {
      job.stop();
      console.log(`Stopped cron job: ${name}`);
    }
    this.cronJobs.clear();
  }

  // Get job status
  getJobStatus(): { [key: string]: boolean } {
    const status: { [key: string]: boolean } = {};
    for (const [name, job] of this.cronJobs) {
      status[name] = job.getStatus() === "scheduled";
    }
    return status;
  }
} 