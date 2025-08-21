import { Request, Response } from "express";
import { ServiceCategoryService } from "../services/ServiceCategoryService";
import { asyncHandler } from "../middleware/errorHandler";
import { AppError } from "../utils/AppError";

export class ServiceCategoryController {
  private categoryService: ServiceCategoryService;

  constructor() {
    this.categoryService = new ServiceCategoryService();
  }

  // Get all active categories (public)
  public getAllCategories = asyncHandler(
    async (req: Request, res: Response) => {
      const categories = await this.categoryService.getAllActiveCategories();

      res.json({
        success: true,
        data: { categories },
      });
    }
  );

  // Get root categories (public)
  public getRootCategories = asyncHandler(
    async (req: Request, res: Response) => {
      const categories = await this.categoryService.getRootCategories();

      res.json({
        success: true,
        data: { categories },
      });
    }
  );

  // Get subcategories by parent (public)
  public getSubcategories = asyncHandler(
    async (req: Request, res: Response) => {
      const { parentId } = req.params;
      const categories = await this.categoryService.getSubcategories(parentId);

      res.json({
        success: true,
        data: { categories },
      });
    }
  );

  // Get category by ID (public)
  public getCategoryById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const category = await this.categoryService.getCategoryById(id);

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    res.json({
      success: true,
      data: { category },
    });
  });

  // Create new category (admin only)
  public createCategory = asyncHandler(async (req: Request, res: Response) => {
    const {
      name,
      description,
      icon,
      parentCategory,
      commissionRate,
      sortOrder,
    } = req.body;

    if (!name || !description) {
      throw new AppError("Name and description are required", 400);
    }

    const category = await this.categoryService.createCategory({
      name,
      description,
      icon,
      parentCategory,
      commissionRate: commissionRate || 10,
      sortOrder: sortOrder || 0,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: { category },
    });
  });

  // Update category (admin only)
  public updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const category = await this.categoryService.updateCategory(id, updateData);

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    res.json({
      success: true,
      message: "Category updated successfully",
      data: { category },
    });
  });

  // Delete category (admin only)
  public deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await this.categoryService.deleteCategory(id);

    if (!result) {
      throw new AppError("Category not found", 404);
    }

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  });

  // Update commission rate (admin only)
  public updateCommissionRate = asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const { commissionRate } = req.body;

      if (commissionRate === undefined) {
        throw new AppError("Commission rate is required", 400);
      }

      const category = await this.categoryService.updateCommissionRate(
        id,
        commissionRate
      );

      if (!category) {
        throw new AppError("Category not found", 404);
      }

      res.json({
        success: true,
        message: "Commission rate updated successfully",
        data: { category },
      });
    }
  );

  // Toggle category status (admin only)
  public toggleCategoryStatus = asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;

      const category = await this.categoryService.toggleCategoryStatus(id);

      if (!category) {
        throw new AppError("Category not found", 404);
      }

      res.json({
        success: true,
        message: `Category ${
          category.isActive ? "activated" : "deactivated"
        } successfully`,
        data: { category },
      });
    }
  );

  // Get category statistics (admin only)
  public getCategoryStats = asyncHandler(
    async (req: Request, res: Response) => {
      const stats = await this.categoryService.getCategoryStats();

      res.json({
        success: true,
        data: { stats },
      });
    }
  );
}

export default new ServiceCategoryController();
