import { EmergencyAlert, IEmergencyAlert } from "../models/EmergencyAlert";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";

export class EmergencyAlertService {
  // Create emergency alert
  async createAlert(
    userId: string,
    alertData: {
      alertType: string;
      description: string;
      location: {
        type: string;
        coordinates: number[];
        address?: string;
      };
      emergencyContacts?: string[];
      metadata?: any;
    }
  ): Promise<IEmergencyAlert> {
    try {
      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Create emergency alert
      const alert = new EmergencyAlert({
        userId,
        ...alertData,
        status: "active",
        priority: this.calculatePriority(alertData.alertType),
      });

      await alert.save();
      return alert;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to create emergency alert", 500);
    }
  }

  // Get user's active alerts
  async getUserActiveAlerts(userId: string): Promise<IEmergencyAlert[]> {
    try {
      return await EmergencyAlert.findActiveByUser(userId);
    } catch (error) {
      throw new AppError("Failed to retrieve user alerts", 500);
    }
  }

  // Get alert by ID
  async getAlertById(
    alertId: string,
    userId?: string
  ): Promise<IEmergencyAlert> {
    try {
      const query: any = { _id: alertId };
      if (userId) {
        query.userId = userId; // Ensure user can only access their own alerts
      }

      const alert = await EmergencyAlert.findOne(query).populate(
        "userId",
        "firstName lastName email phone"
      );

      if (!alert) {
        throw new AppError("Emergency alert not found", 404);
      }

      return alert;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to retrieve emergency alert", 500);
    }
  }

  // Update alert status
  async updateAlertStatus(
    alertId: string,
    userId: string,
    status: string
  ): Promise<IEmergencyAlert> {
    try {
      const alert = await EmergencyAlert.findOne({
        _id: alertId,
        userId,
      });

      if (!alert) {
        throw new AppError("Emergency alert not found", 404);
      }

      // Validate status
      const validStatuses = ["active", "resolved", "false_alarm", "cancelled"];
      if (!validStatuses.includes(status)) {
        throw new AppError("Invalid status", 400);
      }

      alert.status = status;
      if (status === "resolved" || status === "false_alarm") {
        alert.resolvedAt = new Date();
      }

      await alert.save();
      return alert;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to update alert status", 500);
    }
  }

  // Add update to alert
  async addAlertUpdate(
    alertId: string,
    userId: string,
    update: string
  ): Promise<IEmergencyAlert> {
    try {
      const alert = await EmergencyAlert.findOne({
        _id: alertId,
        userId,
      });

      if (!alert) {
        throw new AppError("Emergency alert not found", 404);
      }

      if (alert.status !== "active") {
        throw new AppError("Cannot update non-active alert", 400);
      }

      // Add update to alert
      alert.updates = alert.updates || [];
      alert.updates.push({
        userId,
        update,
        timestamp: new Date(),
      });

      await alert.save();
      return alert;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to add alert update", 500);
    }
  }

  // Find nearby emergency services
  async findNearbyServices(
    location: {
      type: string;
      coordinates: number[];
    },
    radiusKm: number = 5
  ): Promise<any[]> {
    try {
      // This would typically integrate with external emergency service APIs
      // For now, return mock data structure
      return [
        {
          name: "Police Station",
          type: "police",
          distance: "0.5 km",
          phone: "+233-XXX-XXX-XXX",
          address: "Nearby police station",
        },
        {
          name: "Hospital",
          type: "medical",
          distance: "1.2 km",
          phone: "+233-XXX-XXX-XXX",
          address: "Regional hospital",
        },
        {
          name: "Fire Station",
          type: "fire",
          distance: "2.1 km",
          phone: "+233-XXX-XXX-XXX",
          address: "City fire department",
        },
      ];
    } catch (error) {
      throw new AppError("Failed to find nearby services", 500);
    }
  }

  // Get critical alerts (for emergency response)
  async getCriticalAlerts(): Promise<IEmergencyAlert[]> {
    try {
      return await EmergencyAlert.findCritical();
    } catch (error) {
      throw new AppError("Failed to retrieve critical alerts", 500);
    }
  }

  // Find alerts near a location
  async findNearbyAlerts(
    location: {
      type: string;
      coordinates: number[];
    },
    radiusKm: number = 10
  ): Promise<IEmergencyAlert[]> {
    try {
      return await EmergencyAlert.findNearby(location, radiusKm);
    } catch (error) {
      throw new AppError("Failed to find nearby alerts", 500);
    }
  }

  // Get emergency statistics
  async getEmergencyStatistics(userId?: string): Promise<{
    total: number;
    active: number;
    resolved: number;
    falseAlarms: number;
    byType: any[];
    recentTrends: any[];
  }> {
    try {
      const query: any = {};
      if (userId) {
        query.userId = userId;
      }

      const [total, active, resolved, falseAlarms] = await Promise.all([
        EmergencyAlert.countDocuments(query),
        EmergencyAlert.countDocuments({ ...query, status: "active" }),
        EmergencyAlert.countDocuments({ ...query, status: "resolved" }),
        EmergencyAlert.countDocuments({ ...query, status: "false_alarm" }),
      ]);

      // Get alerts by type
      const byType = await EmergencyAlert.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$alertType",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      // Get recent trends (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentTrends = await EmergencyAlert.aggregate([
        {
          $match: {
            ...query,
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return {
        total,
        active,
        resolved,
        falseAlarms,
        byType,
        recentTrends,
      };
    } catch (error) {
      throw new AppError("Failed to retrieve emergency statistics", 500);
    }
  }

  // Send SOS to emergency contacts
  async sendSOS(
    alertId: string,
    userId: string,
    message?: string
  ): Promise<void> {
    try {
      const alert = await EmergencyAlert.findOne({
        _id: alertId,
        userId,
      });

      if (!alert) {
        throw new AppError("Emergency alert not found", 404);
      }

      if (alert.status !== "active") {
        throw new AppError("Cannot send SOS for non-active alert", 400);
      }

      // This would integrate with SMS/email services
      // For now, just log the action
      console.log(
        `SOS sent for alert ${alertId}: ${message || "Emergency situation"}`
      );

      // Update alert with SOS sent timestamp
      alert.sosSentAt = new Date();
      await alert.save();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to send SOS", 500);
    }
  }

  // Calculate priority based on alert type
  private calculatePriority(alertType: string): string {
    const highPriorityTypes = [
      "medical_emergency",
      "fire",
      "crime",
      "accident",
    ];
    const mediumPriorityTypes = [
      "suspicious_activity",
      "noise_complaint",
      "power_outage",
    ];

    if (highPriorityTypes.includes(alertType)) {
      return "high";
    } else if (mediumPriorityTypes.includes(alertType)) {
      return "medium";
    } else {
      return "low";
    }
  }

  // Get emergency contact information
  async getEmergencyContacts(userId: string): Promise<any[]> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Return user's emergency contacts
      return user.emergencyContacts || [];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to retrieve emergency contacts", 500);
    }
  }
}
