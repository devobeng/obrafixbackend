import { ServiceCategory } from "../models/ServiceCategory";
import { IServiceCategory } from "../types";
import { AppError } from "../utils/AppError";

export class ServiceCategoryService {
  // Get all active categories
  async getAllActiveCategories(): Promise<IServiceCategory[]> {
    try {
      return await ServiceCategory["findActiveCategories"]();
    } catch (error) {
      throw new AppError("Failed to fetch categories", 500);
    }
  }

  // Get root categories (no parent)
  async getRootCategories(): Promise<IServiceCategory[]> {
    try {
      return await ServiceCategory["findRootCategories"]();
    } catch (error) {
      throw new AppError("Failed to fetch root categories", 500);
    }
  }

  // Get subcategories by parent
  async getSubcategories(parentId: string): Promise<IServiceCategory[]> {
    try {
      return await ServiceCategory["findByParent"](parentId);
    } catch (error) {
      throw new AppError("Failed to fetch subcategories", 500);
    }
  }

  // Get category by ID
  async getCategoryById(categoryId: string): Promise<IServiceCategory | null> {
    try {
      return await ServiceCategory.findById(categoryId);
    } catch (error) {
      throw new AppError("Failed to fetch category", 500);
    }
  }

  // Create new category
  async createCategory(
    categoryData: Partial<IServiceCategory>
  ): Promise<IServiceCategory> {
    try {
      const category = new ServiceCategory(categoryData);
      await category.save();
      return category;
    } catch (error) {
      if (error instanceof Error && error.message.includes("duplicate key")) {
        throw new AppError("Category with this name already exists", 409);
      }
      throw new AppError("Failed to create category", 500);
    }
  }

  // Update category
  async updateCategory(
    categoryId: string,
    updateData: Partial<IServiceCategory>
  ): Promise<IServiceCategory | null> {
    try {
      return await ServiceCategory.findByIdAndUpdate(categoryId, updateData, {
        new: true,
        runValidators: true,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("duplicate key")) {
        throw new AppError("Category with this name already exists", 409);
      }
      throw new AppError("Failed to update category", 500);
    }
  }

  // Delete category
  async deleteCategory(categoryId: string): Promise<boolean> {
    try {
      const category = await ServiceCategory.findById(categoryId);

      if (!category) {
        return false;
      }

      // Check if category has subcategories
      const hasSubcategories = await ServiceCategory.exists({
        parentCategory: categoryId,
      });
      if (hasSubcategories) {
        throw new AppError("Cannot delete category with subcategories", 400);
      }

      await ServiceCategory.findByIdAndDelete(categoryId);
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to delete category", 500);
    }
  }

  // Update commission rate
  async updateCommissionRate(
    categoryId: string,
    commissionRate: number
  ): Promise<IServiceCategory | null> {
    try {
      if (commissionRate < 0 || commissionRate > 100) {
        throw new AppError("Commission rate must be between 0 and 100", 400);
      }

      return await ServiceCategory.findByIdAndUpdate(
        categoryId,
        { commissionRate },
        { new: true, runValidators: true }
      );
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to update commission rate", 500);
    }
  }

  // Toggle category status
  async toggleCategoryStatus(
    categoryId: string
  ): Promise<IServiceCategory | null> {
    try {
      const category = await ServiceCategory.findById(categoryId);

      if (!category) {
        throw new AppError("Category not found", 404);
      }

      category.isActive = !category.isActive;
      await category.save();
      return category;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to toggle category status", 500);
    }
  }

  // Get category statistics
  async getCategoryStats(): Promise<any> {
    try {
      const [
        totalCategories,
        activeCategories,
        rootCategories,
        subcategories,
        averageCommissionRate,
      ] = await Promise.all([
        ServiceCategory.countDocuments(),
        ServiceCategory.countDocuments({ isActive: true }),
        ServiceCategory.countDocuments({ parentCategory: { $exists: false } }),
        ServiceCategory.countDocuments({ parentCategory: { $exists: true } }),
        ServiceCategory.aggregate([
          { $group: { _id: null, avgCommission: { $avg: "$commissionRate" } } },
        ]).then((result) => result[0]?.avgCommission || 0),
      ]);

      return {
        totalCategories,
        activeCategories,
        rootCategories,
        subcategories,
        averageCommissionRate: Math.round(averageCommissionRate * 100) / 100,
      };
    } catch (error) {
      throw new AppError("Failed to fetch category statistics", 500);
    }
  }
}
