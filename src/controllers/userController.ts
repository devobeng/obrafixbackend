import { Request, Response } from "express";
import { User } from "../models/User";
import { UserService } from "../services/UserService";
import { asyncHandler } from "../middleware/errorHandler";
import { userUpdateSchema } from "../validators/userValidator";
import { AppError } from "../utils/AppError";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  // Get all users (admin only)
  public getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query["page"] as string) || 1;
    const limit = parseInt(req.query["limit"] as string) || 10;
    const role = req.query["role"] as string;
    const search = req.query["search"] as string;

    const result = await this.userService.getUsers({
      page,
      limit,
      role,
      search,
    });

    res.json({
      success: true,
      data: result,
    });
  });

  // Get user by ID
  public getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await this.userService.getUserById(id);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json({
      success: true,
      data: { user },
    });
  });

  // Update user
  public updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const validatedData = userUpdateSchema.parse(req.body);

    const user = await this.userService.updateUser(id, validatedData);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json({
      success: true,
      message: "User updated successfully",
      data: { user },
    });
  });

  // Delete user (admin only)
  public deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await this.userService.deleteUser(id);

    if (!result) {
      throw new AppError("User not found", 404);
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  });

  // Update user role (admin only)
  public updateUserRole = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "provider", "admin"].includes(role)) {
      throw new AppError("Invalid role", 400);
    }

    const user = await this.userService.updateUserRole(id, role);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json({
      success: true,
      message: "User role updated successfully",
      data: { user },
    });
  });

  // Verify user (admin only)
  public verifyUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await this.userService.verifyUser(id);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json({
      success: true,
      message: "User verified successfully",
      data: { user },
    });
  });

  // Search users
  public searchUsers = asyncHandler(async (req: Request, res: Response) => {
    const { q } = req.query;
    const page = parseInt(req.query["page"] as string) || 1;
    const limit = parseInt(req.query["limit"] as string) || 10;

    if (!q) {
      throw new AppError("Search query is required", 400);
    }

    const result = await this.userService.searchUsers(q as string, {
      page,
      limit,
    });

    res.json({
      success: true,
      data: result,
    });
  });

  // Get user statistics (admin only)
  public getUserStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.userService.getUserStats();

    res.json({
      success: true,
      data: { stats },
    });
  });
}

export default new UserController();
