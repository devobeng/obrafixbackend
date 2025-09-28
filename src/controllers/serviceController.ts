import { Request, Response } from "express";
import { Service } from "../models/Service";
import { ServiceService } from "../services/ServiceService";
import { asyncHandler } from "../middleware/errorHandler";
import {
  serviceCreateSchema,
  serviceUpdateSchema,
} from "../validators/serviceValidator";
import { AppError } from "../utils/AppError";
import { validateObjectId } from "../utils/validation";

export class ServiceController {
  private serviceService: ServiceService;

  constructor() {
    this.serviceService = new ServiceService();
  }

  // Get popular services (public)
  public getPopularServices = asyncHandler(
    async (req: Request, res: Response) => {
      const limit = parseInt(req.query["limit"] as string) || 10;
      const services = await this.serviceService.getPopularServices(limit);

      res.json({
        success: true,
        data: services,
      });
    }
  );

  // Get all services (public)
  public getAllServices = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query["page"] as string) || 1;
    const limit = parseInt(req.query["limit"] as string) || 10;
    const category = req.query["category"] as string;
    const subcategory = req.query["subcategory"] as string;
    const minPrice = req.query["minPrice"] as string;
    const maxPrice = req.query["maxPrice"] as string;
    const location = req.query["location"] as string;
    const rating = req.query["rating"] as string;
    const availability = req.query["availability"] as string;
    const serviceRadius = req.query["serviceRadius"] as string;
    const pricingType = req.query["pricingType"] as
      | "hourly"
      | "fixed"
      | "negotiable";

    const result = await this.serviceService.getServices({
      page,
      limit,
      category,
      subcategory,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      location,
      rating: rating ? parseFloat(rating) : undefined,
      availability,
      serviceRadius: serviceRadius ? parseFloat(serviceRadius) : undefined,
      pricingType,
    });

    res.json({
      success: true,
      data: result,
    });
  });

  // Get service by ID (public)
  public getServiceById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      throw new AppError("Invalid service ID format", 400);
    }

    const service = await this.serviceService.getServiceById(id);

    if (!service) {
      throw new AppError("Service not found", 404);
    }

    res.json({
      success: true,
      data: { service },
    });
  });

  // Create new service (provider/admin only)
  public createService = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = serviceCreateSchema.parse(req.body);
    const providerId = (req as any).user?.id;

    const service = await this.serviceService.createService({
      ...validatedData,
      provider: providerId,
    });

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: { service },
    });
  });

  // Update service (provider/admin only)
  public updateService = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const validatedData = serviceUpdateSchema.parse(req.body);
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    const service = await this.serviceService.updateService(
      id,
      validatedData,
      userId,
      userRole
    );

    if (!service) {
      throw new AppError("Service not found", 404);
    }

    res.json({
      success: true,
      message: "Service updated successfully",
      data: { service },
    });
  });

  // Delete service (provider/admin only)
  public deleteService = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    const result = await this.serviceService.deleteService(
      id,
      userId,
      userRole
    );

    if (!result) {
      throw new AppError("Service not found", 404);
    }

    res.json({
      success: true,
      message: "Service deleted successfully",
    });
  });

  // Update service status (provider/admin only)
  public updateServiceStatus = asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const { status } = req.body;

      if (!["active", "inactive", "suspended"].includes(status)) {
        throw new AppError("Invalid status", 400);
      }

      const service = await this.serviceService.updateServiceStatus(id, status);

      if (!service) {
        throw new AppError("Service not found", 404);
      }

      res.json({
        success: true,
        message: "Service status updated successfully",
        data: { service },
      });
    }
  );

  // Get services by provider
  public getServicesByProvider = asyncHandler(
    async (req: Request, res: Response) => {
      const { providerId } = req.params;
      const page = parseInt(req.query["page"] as string) || 1;
      const limit = parseInt(req.query["limit"] as string) || 10;

      const result = await this.serviceService.getServicesByProvider(
        providerId,
        {
          page,
          limit,
        }
      );

      res.json({
        success: true,
        data: result,
      });
    }
  );

  // Get services by category
  public getServicesByCategory = asyncHandler(
    async (req: Request, res: Response) => {
      const { category } = req.params;
      const page = parseInt(req.query["page"] as string) || 1;
      const limit = parseInt(req.query["limit"] as string) || 10;
      const sortBy = req.query["sortBy"] as string;
      const sortOrder = req.query["sortOrder"] as string;
      const minPrice = req.query["minPrice"]
        ? parseFloat(req.query["minPrice"] as string)
        : undefined;
      const maxPrice = req.query["maxPrice"]
        ? parseFloat(req.query["maxPrice"] as string)
        : undefined;
      const minRating = req.query["minRating"]
        ? parseFloat(req.query["minRating"] as string)
        : undefined;
      const location = req.query["location"] as string;
      const maxDistance = req.query["maxDistance"]
        ? parseFloat(req.query["maxDistance"] as string)
        : undefined;
      const search = req.query["search"] as string;

      const result = await this.serviceService.getServicesByCategory(category, {
        page,
        limit,
        sortBy,
        sortOrder,
        minPrice,
        maxPrice,
        minRating,
        location,
        maxDistance,
        search,
      });

      res.json({
        success: true,
        data: result,
      });
    }
  );

  // Search services with advanced filtering
  public searchServices = asyncHandler(async (req: Request, res: Response) => {
    const { q } = req.query;
    const page = parseInt(req.query["page"] as string) || 1;
    const limit = parseInt(req.query["limit"] as string) || 10;
    const category = req.query["category"] as string;
    const subcategory = req.query["subcategory"] as string;
    const minPrice = req.query["minPrice"] as string;
    const maxPrice = req.query["maxPrice"] as string;
    const location = req.query["location"] as string;
    const rating = req.query["rating"] as string;
    const availability = req.query["availability"] as string;
    const serviceRadius = req.query["serviceRadius"] as string;
    const pricingType = req.query["pricingType"] as
      | "hourly"
      | "fixed"
      | "negotiable";
    const sortBy = req.query["sortBy"] as string;
    const sortOrder = req.query["sortOrder"] as string;

    if (!q) {
      throw new AppError("Search query is required", 400);
    }

    const result = await this.serviceService.searchServicesAdvanced(
      q as string,
      {
        page,
        limit,
        category,
        subcategory,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        location,
        rating: rating ? parseFloat(rating) : undefined,
        availability,
        serviceRadius: serviceRadius ? parseFloat(serviceRadius) : undefined,
        pricingType,
        sortBy,
        sortOrder,
      }
    );

    res.json({
      success: true,
      data: result,
    });
  });

  // Get services by availability
  public getServicesByAvailability = asyncHandler(
    async (req: Request, res: Response) => {
      const { day, time } = req.query;
      const page = parseInt(req.query["page"] as string) || 1;
      const limit = parseInt(req.query["limit"] as string) || 10;

      if (!day || !time) {
        throw new AppError("Day and time are required", 400);
      }

      const result = await this.serviceService.getServicesByAvailability(
        day as string,
        time as string,
        { page, limit }
      );

      res.json({
        success: true,
        data: result,
      });
    }
  );

  // Get services within radius
  public getServicesWithinRadius = asyncHandler(
    async (req: Request, res: Response) => {
      const { latitude, longitude, radius } = req.query;
      const page = parseInt(req.query["page"] as string) || 1;
      const limit = parseInt(req.query["limit"] as string) || 10;

      if (!latitude || !longitude || !radius) {
        throw new AppError("Latitude, longitude, and radius are required", 400);
      }

      const result = await this.serviceService.getServicesWithinRadius(
        parseFloat(latitude as string),
        parseFloat(longitude as string),
        parseFloat(radius as string),
        { page, limit }
      );

      res.json({
        success: true,
        data: result,
      });
    }
  );

  // Get service statistics
  public getServiceStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.serviceService.getServiceStats();

    res.json({
      success: true,
      data: { stats },
    });
  });

  // Update service availability
  public updateServiceAvailability = asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const { availability } = req.body;
      const providerId = (req as any).user?.id;

      if (!id) {
        throw new AppError("Service ID is required", 400);
      }

      if (!availability) {
        throw new AppError("Availability data is required", 400);
      }

      const service = await this.serviceService.updateServiceAvailability(
        id,
        providerId,
        availability
      );

      res.json({
        success: true,
        message: "Service availability updated successfully",
        data: { service },
      });
    }
  );
}

export default new ServiceController();
