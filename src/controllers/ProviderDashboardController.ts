import { Request, Response } from "express";
import { ProviderDashboardService } from "../services/ProviderDashboardService";
import { asyncHandler } from "../middleware/errorHandler";
import { AppError } from "../utils/AppError";

export class ProviderDashboardController {
  private providerDashboardService: ProviderDashboardService;

  constructor() {
    this.providerDashboardService = new ProviderDashboardService();
  }

  // Service Management
  public createService = asyncHandler(async (req: Request, res: Response) => {
    const providerId = (req as any).user?.id;
    const serviceData = req.body;

    if (
      !serviceData.title ||
      !serviceData.description ||
      !serviceData.category
    ) {
      throw new AppError("Missing required service fields", 400);
    }

    const service = await this.providerDashboardService.createService(
      providerId,
      serviceData
    );

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: { service },
    });
  });

  public updateService = asyncHandler(async (req: Request, res: Response) => {
    const providerId = (req as any).user?.id;
    const { serviceId } = req.params;

    if (!serviceId) {
      throw new AppError("Service ID is required", 400);
    }

    const updateData = req.body;

    const service = await this.providerDashboardService.updateService(
      serviceId,
      providerId,
      updateData
    );

    res.json({
      success: true,
      message: "Service updated successfully",
      data: { service },
    });
  });

  public getProviderServices = asyncHandler(
    async (req: Request, res: Response) => {
      const providerId = (req as any).user?.id;
      const filters = req.query;

      const services = await this.providerDashboardService.getProviderServices(
        providerId,
        filters
      );

      res.json({
        success: true,
        message: "Provider services retrieved successfully",
        data: { services, count: services.length },
      });
    }
  );

  // Job Requests Management
  public getJobRequests = asyncHandler(async (req: Request, res: Response) => {
    const providerId = (req as any).user?.id;
    const filters = req.query;

    const requests = await this.providerDashboardService.getJobRequests(
      providerId,
      filters
    );

    res.json({
      success: true,
      message: "Job requests retrieved successfully",
      data: { requests, count: requests.length },
    });
  });

  public acceptJobRequest = asyncHandler(
    async (req: Request, res: Response) => {
      const providerId = (req as any).user?.id;
      const { requestId } = req.params;

      if (!requestId) {
        throw new AppError("Request ID is required", 400);
      }

      const responseData = req.body;

      if (!responseData.estimatedStartTime || !responseData.estimatedDuration) {
        throw new AppError("Missing required response fields", 400);
      }

      const request = await this.providerDashboardService.acceptJobRequest(
        requestId,
        providerId,
        responseData
      );

      res.json({
        success: true,
        message: "Job request accepted successfully",
        data: { request },
      });
    }
  );

  public rejectJobRequest = asyncHandler(
    async (req: Request, res: Response) => {
      const providerId = (req as any).user?.id;
      const { requestId } = req.params;

      if (!requestId) {
        throw new AppError("Request ID is required", 400);
      }

      const rejectionData = req.body;

      if (!rejectionData.note) {
        throw new AppError("Rejection note is required", 400);
      }

      const request = await this.providerDashboardService.rejectJobRequest(
        requestId,
        providerId,
        rejectionData
      );

      res.json({
        success: true,
        message: "Job request rejected successfully",
        data: { request },
      });
    }
  );

  // Real-time Job Status Updates
  public updateJobStatus = asyncHandler(async (req: Request, res: Response) => {
    const providerId = (req as any).user?.id;
    const { bookingId } = req.params;

    if (!bookingId) {
      throw new AppError("Booking ID is required", 400);
    }

    const statusData = req.body;

    if (!statusData.status) {
      throw new AppError("Job status is required", 400);
    }

    const validStatuses = [
      "on_the_way",
      "in_progress",
      "completed",
      "paused",
      "resumed",
    ];

    if (!validStatuses.includes(statusData.status)) {
      throw new AppError("Invalid job status", 400);
    }

    const booking = await this.providerDashboardService.updateJobStatus(
      bookingId,
      providerId,
      statusData
    );

    res.json({
      success: true,
      message: "Job status updated successfully",
      data: { booking },
    });
  });

  // Provider Dashboard Statistics
  public getDashboardStats = asyncHandler(
    async (req: Request, res: Response) => {
      const providerId = (req as any).user?.id;

      const stats = await this.providerDashboardService.getDashboardStats(
        providerId
      );

      res.json({
        success: true,
        message: "Dashboard statistics retrieved successfully",
        data: { stats },
      });
    }
  );
}
