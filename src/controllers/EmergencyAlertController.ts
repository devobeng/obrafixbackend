import { Request, Response, NextFunction } from "express";
import { EmergencyAlertService } from "../services/EmergencyAlertService";
import { AppError } from "../utils/AppError";

export class EmergencyAlertController {
  private emergencyAlertService: EmergencyAlertService;

  constructor() {
    this.emergencyAlertService = new EmergencyAlertService();
  }

  // Create emergency alert
  createAlert = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const alertData = req.body;

      const alert = await this.emergencyAlertService.createAlert(
        userId,
        alertData
      );

      res.status(201).json({
        success: true,
        data: alert,
        message: "Emergency alert created successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // Get user's active alerts
  getUserActiveAlerts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user.id;

      const alerts = await this.emergencyAlertService.getUserActiveAlerts(
        userId
      );

      res.status(200).json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get alert by ID
  getAlertById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { alertId } = req.params;

      const alert = await this.emergencyAlertService.getAlertById(
        alertId,
        userId
      );

      res.status(200).json({
        success: true,
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  };

  // Update alert status
  updateAlertStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { alertId } = req.params;
      const { status } = req.body;

      if (!status || typeof status !== "string") {
        throw new AppError("Status is required", 400);
      }

      const alert = await this.emergencyAlertService.updateAlertStatus(
        alertId,
        userId,
        status
      );

      res.status(200).json({
        success: true,
        data: alert,
        message: "Alert status updated successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // Add update to alert
  addAlertUpdate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { alertId } = req.params;
      const { update } = req.body;

      if (!update || typeof update !== "string") {
        throw new AppError("Update is required", 400);
      }

      const alert = await this.emergencyAlertService.addAlertUpdate(
        alertId,
        userId,
        update
      );

      res.status(200).json({
        success: true,
        data: alert,
        message: "Alert update added successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // Find nearby emergency services
  findNearbyServices = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { latitude, longitude, radius = "5" } = req.query;

      if (!latitude || !longitude) {
        throw new AppError("Location coordinates are required", 400);
      }

      const location = {
        type: "Point",
        coordinates: [
          parseFloat(longitude as string),
          parseFloat(latitude as string),
        ],
      };

      const radiusKm = parseFloat(radius as string);

      const services = await this.emergencyAlertService.findNearbyServices(
        location,
        radiusKm
      );

      res.status(200).json({
        success: true,
        data: services,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get critical alerts (for emergency response)
  getCriticalAlerts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const alerts = await this.emergencyAlertService.getCriticalAlerts();

      res.status(200).json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      next(error);
    }
  };

  // Find nearby alerts
  findNearbyAlerts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { latitude, longitude, radius = "10" } = req.query;

      if (!latitude || !longitude) {
        throw new AppError("Location coordinates are required", 400);
      }

      const location = {
        type: "Point",
        coordinates: [
          parseFloat(longitude as string),
          parseFloat(latitude as string),
        ],
      };

      const radiusKm = parseFloat(radius as string);

      const alerts = await this.emergencyAlertService.findNearbyAlerts(
        location,
        radiusKm
      );

      res.status(200).json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get emergency statistics
  getEmergencyStatistics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id; // Optional for admin access

      const statistics =
        await this.emergencyAlertService.getEmergencyStatistics(userId);

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  };

  // Send SOS
  sendSOS = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { alertId } = req.params;
      const { message } = req.body;

      await this.emergencyAlertService.sendSOS(alertId, userId, message);

      res.status(200).json({
        success: true,
        message: "SOS sent successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // Get emergency contacts
  getEmergencyContacts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user.id;

      const contacts = await this.emergencyAlertService.getEmergencyContacts(
        userId
      );

      res.status(200).json({
        success: true,
        data: contacts,
      });
    } catch (error) {
      next(error);
    }
  };
}
