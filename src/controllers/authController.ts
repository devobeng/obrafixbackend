import { Request, Response } from "express";
import { User } from "../models/User";
import { JWTService } from "../services/JWTService";
import { AuthService } from "../services/AuthService";
import { asyncHandler } from "../middleware/errorHandler";
import {
  userRegistrationSchema,
  userLoginSchema,
} from "../validators/userValidator";
import { AppError } from "../utils/AppError";

export class AuthController {
  private authService: AuthService;
  private jwtService: JWTService;

  constructor() {
    this.authService = new AuthService();
    this.jwtService = new JWTService();
  }

  // Register new user
  public register = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = userRegistrationSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await User.findByEmail(validatedData.email);
    if (existingUser) {
      throw new AppError("User with this email already exists", 409);
    }

    // Create user with role-based defaults
    const userData = {
      ...validatedData,
      accountStatus: "active",
      locationPermissions: {
        allowLocationAccess: false,
      },
    };

    // If registering as provider, set additional defaults
    if (validatedData.role === "provider") {
      userData.providerProfile = {
        businessName: "",
        serviceCategory: "",
        yearsExperience: 0,
      };
    }

    const user = await this.authService.createUser(userData);

    // Generate tokens
    const accessToken = this.jwtService.generateAccessToken(
      user._id.toString()
    );
    const refreshToken = this.jwtService.generateRefreshToken(
      user._id.toString()
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isVerified: user.isVerified,
          accountStatus: user.accountStatus,
        },
        accessToken,
        refreshToken,
      },
    });
  });

  // Login user
  public login = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = userLoginSchema.parse(req.body);

    // Find user and verify password
    const user = await this.authService.authenticateUser(
      validatedData.email,
      validatedData.password
    );

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    // Generate tokens
    const accessToken = this.jwtService.generateAccessToken(
      user._id.toString()
    );
    const refreshToken = this.jwtService.generateRefreshToken(
      user._id.toString()
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isVerified: user.isVerified,
        },
        accessToken,
        refreshToken,
      },
    });
  });

  // Refresh access token
  public refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError("Refresh token is required", 400);
    }

    const decoded = this.jwtService.verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const newAccessToken = this.jwtService.generateAccessToken(
      user._id.toString()
    );

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken,
      },
    });
  });

  // Get current user profile
  public getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json({
      success: true,
      data: { user },
    });
  });

  // Logout user
  public logout = asyncHandler(async (req: Request, res: Response) => {
    // In a production app, you might want to blacklist the refresh token
    res.json({
      success: true,
      message: "Logout successful",
    });
  });
}

export default new AuthController();
