import { Service } from "../models/Service";
import { IService } from "../types";
import { AppError } from "../utils/AppError";

interface ServiceFilters {
  page: number;
  limit: number;
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  rating?: number;
  availability?: string;
  serviceRadius?: number;
  pricingType?: "hourly" | "fixed" | "negotiable";
}

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class ServiceService {
  // Get services with pagination and filters
  async getServices(
    filters: ServiceFilters
  ): Promise<PaginatedResult<IService>> {
    try {
      const { page, limit, category, minPrice, maxPrice, location } = filters;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = { status: "active" };
      if (category) query.category = category;
      if (minPrice || maxPrice) {
        query["pricing.amount"] = {};
        if (minPrice) query["pricing.amount"].$gte = minPrice;
        if (maxPrice) query["pricing.amount"].$lte = maxPrice;
      }
      if (filters.pricingType) query["pricing.type"] = filters.pricingType;
      if (filters.subcategory) query.subcategory = filters.subcategory;
      if (filters.rating) query["rating.average"] = { $gte: filters.rating };
      if (filters.availability)
        query["availability.isAvailable"] = filters.availability === "true";
      if (filters.serviceRadius)
        query["location.serviceRadius"] = { $gte: filters.serviceRadius };
      if (location) {
        query.$or = [
          { "location.city": { $regex: location, $options: "i" } },
          { "location.state": { $regex: location, $options: "i" } },
        ];
      }

      // Execute query with pagination
      const [services, total] = await Promise.all([
        Service.find(query)
          .populate("provider", "firstName lastName email profileImage")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Service.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: services,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new AppError("Failed to fetch services", 500);
    }
  }

  // Get service by ID
  async getServiceById(serviceId: string): Promise<IService | null> {
    try {
      return await Service.findById(serviceId).populate(
        "provider",
        "firstName lastName email profileImage phone address"
      );
    } catch (error) {
      throw new AppError("Failed to fetch service", 500);
    }
  }

  // Create new service
  async createService(serviceData: Partial<IService>): Promise<IService> {
    try {
      // Set default commission rate if not provided
      if (!serviceData.commissionRate) {
        serviceData.commissionRate = 10; // Default 10%
      }

      const service = new Service(serviceData);
      await service.save();
      return service.populate(
        "provider",
        "firstName lastName email profileImage"
      );
    } catch (error) {
      throw new AppError("Failed to create service", 500);
    }
  }

  // Update service
  async updateService(
    serviceId: string,
    updateData: Partial<IService>,
    userId: string,
    userRole: string
  ): Promise<IService | null> {
    try {
      const service = await Service.findById(serviceId);

      if (!service) {
        return null;
      }

      // Check if user can update this service
      if (userRole !== "admin" && service.provider.toString() !== userId) {
        throw new AppError("Not authorized to update this service", 403);
      }

      return await Service.findByIdAndUpdate(serviceId, updateData, {
        new: true,
        runValidators: true,
      }).populate("provider", "firstName lastName email profileImage");
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to update service", 500);
    }
  }

  // Delete service
  async deleteService(
    serviceId: string,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    try {
      const service = await Service.findById(serviceId);

      if (!service) {
        return false;
      }

      // Check if user can delete this service
      if (userRole !== "admin" && service.provider.toString() !== userId) {
        throw new AppError("Not authorized to delete this service", 403);
      }

      await Service.findByIdAndDelete(serviceId);
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to delete service", 500);
    }
  }

  // Update service status
  async updateServiceStatus(
    serviceId: string,
    status: string,
    reason?: string
  ): Promise<IService | null> {
    try {
      const updateData: any = { status };

      if (reason) {
        updateData.statusReason = reason;
        updateData.statusUpdatedAt = new Date();
      }

      return await Service.findByIdAndUpdate(serviceId, updateData, {
        new: true,
        runValidators: true,
      }).populate("provider", "firstName lastName email profileImage");
    } catch (error) {
      throw new AppError("Failed to update service status", 500);
    }
  }

  // Get services by provider
  async getServicesByProvider(
    providerId: string,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedResult<IService>> {
    try {
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;

      const [services, total] = await Promise.all([
        Service.find({ provider: providerId })
          .populate("provider", "firstName lastName email profileImage")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Service.countDocuments({ provider: providerId }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: services,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new AppError("Failed to fetch provider services", 500);
    }
  }

  // Get services by category
  async getServicesByCategory(
    category: string,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedResult<IService>> {
    try {
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;

      const [services, total] = await Promise.all([
        Service.find({ category, status: "active" })
          .populate("provider", "firstName lastName email profileImage")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Service.countDocuments({ category, status: "active" }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: services,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new AppError("Failed to fetch category services", 500);
    }
  }

  // Search services
  async searchServices(
    query: string,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedResult<IService>> {
    try {
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;

      const searchQuery = {
        status: "active",
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { category: { $regex: query, $options: "i" } },
          { subcategory: { $regex: query, $options: "i" } },
        ],
      };

      const [services, total] = await Promise.all([
        Service.find(searchQuery)
          .populate("provider", "firstName lastName email profileImage")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Service.countDocuments(searchQuery),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: services,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new AppError("Failed to search services", 500);
    }
  }

  // Get services by availability
  async getServicesByAvailability(
    day: string,
    time: string,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedResult<IService>> {
    try {
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;

      const query = {
        status: "active",
        "availability.workingDays": {
          $elemMatch: {
            day: day.toLowerCase(),
            isAvailable: true,
            startTime: { $lte: time },
            endTime: { $gte: time },
          },
        },
      };

      const [services, total] = await Promise.all([
        Service.find(query)
          .populate("provider", "firstName lastName email profileImage")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Service.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: services,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new AppError("Failed to fetch services by availability", 500);
    }
  }

  // Get services within radius
  async getServicesWithinRadius(
    latitude: number,
    longitude: number,
    radius: number,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedResult<IService>> {
    try {
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;

      const query = {
        status: "active",
        "location.coordinates": {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            $maxDistance: radius * 1000, // Convert km to meters
          },
        },
      };

      const [services, total] = await Promise.all([
        Service.find(query)
          .populate("provider", "firstName lastName email profileImage")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Service.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: services,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new AppError("Failed to fetch services within radius", 500);
    }
  }

  // Get service statistics
  async getServiceStats(): Promise<any> {
    try {
      const [
        totalServices,
        activeServices,
        totalCategories,
        averageRating,
        totalReviews,
      ] = await Promise.all([
        Service.countDocuments(),
        Service.countDocuments({ status: "active" }),
        Service.distinct("category").then((categories) => categories.length),
        Service.aggregate([
          { $match: { status: "active" } },
          { $group: { _id: null, avgRating: { $avg: "$rating.average" } } },
        ]).then((result) => result[0]?.avgRating || 0),
        Service.aggregate([
          { $match: { status: "active" } },
          { $group: { _id: null, totalReviews: { $sum: "$rating.count" } } },
        ]).then((result) => result[0]?.totalReviews || 0),
      ]);

      return {
        totalServices,
        activeServices,
        totalCategories,
        averageRating: Math.round(averageRating * 100) / 100,
        totalReviews,
      };
    } catch (error) {
      throw new AppError("Failed to fetch service statistics", 500);
    }
  }

  // Get all services with advanced filtering and sorting (for admin)
  async getAllServices(
    page: number,
    limit: number,
    filters: any = {},
    sort: any = { createdAt: -1 }
  ): Promise<PaginatedResult<IService>> {
    try {
      const skip = (page - 1) * limit;

      // Execute query with pagination
      const [services, total] = await Promise.all([
        Service.find(filters)
          .populate("provider", "firstName lastName email profileImage")
          .populate("category", "name")
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Service.countDocuments(filters),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: services,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new AppError("Failed to fetch services", 500);
    }
  }

  // Service Category Management (for admin)
  async createServiceCategory(categoryData: {
    name: string;
    description?: string;
    icon?: string;
    commissionRate?: number;
    isActive?: boolean;
  }) {
    try {
      const { ServiceCategory } = await import("../models/ServiceCategory");

      const category = new ServiceCategory({
        name: categoryData.name,
        description: categoryData.description,
        icon: categoryData.icon,
        commissionRate: categoryData.commissionRate || 0,
        isActive: categoryData.isActive !== false,
      });

      return await category.save();
    } catch (error) {
      throw new AppError("Failed to create service category", 500);
    }
  }

  async updateServiceCategory(
    categoryId: string,
    updateData: Partial<{
      name: string;
      description: string;
      icon: string;
      commissionRate: number;
      isActive: boolean;
    }>
  ) {
    try {
      const { ServiceCategory } = await import("../models/ServiceCategory");

      return await ServiceCategory.findByIdAndUpdate(categoryId, updateData, {
        new: true,
        runValidators: true,
      });
    } catch (error) {
      throw new AppError("Failed to update service category", 500);
    }
  }

  async deleteServiceCategory(categoryId: string): Promise<boolean> {
    try {
      const { ServiceCategory } = await import("../models/ServiceCategory");

      // Check if any services are using this category
      const servicesCount = await Service.countDocuments({
        category: categoryId,
      });
      if (servicesCount > 0) {
        throw new AppError(
          "Cannot delete category with existing services",
          400
        );
      }

      const result = await ServiceCategory.findByIdAndDelete(categoryId);
      return !!result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to delete service category", 500);
    }
  }
}
