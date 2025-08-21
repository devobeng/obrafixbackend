import { Request, Response } from "express";
import { ProviderService } from "../services/ProviderService";
import { asyncHandler } from "../middleware/errorHandler";
import { AppError } from "../utils/AppError";

export class ProviderController {
  private providerService: ProviderService;

  constructor() {
    this.providerService = new ProviderService();
  }

  // Setup provider profile
  public setupProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { businessName, serviceCategory, yearsExperience } = req.body;

    if (!businessName || !serviceCategory || yearsExperience === undefined) {
      throw new AppError("Missing required fields", 400);
    }

    const user = await this.providerService.setupProviderProfile(userId, {
      businessName,
      serviceCategory,
      yearsExperience,
    });

    res.json({
      success: true,
      message: "Provider profile setup successfully",
      data: { user },
    });
  });

  // Upload ID verification document
  public uploadIdVerification = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = (req as any).user?.id;
      const { documentType, documentNumber, documentImage } = req.body;

      if (!documentType || !documentNumber || !documentImage) {
        throw new AppError("Missing required fields", 400);
      }

      if (!["ghanaCard", "driverLicense", "passport"].includes(documentType)) {
        throw new AppError("Invalid document type", 400);
      }

      const user = await this.providerService.uploadIdVerification(userId, {
        documentType,
        documentNumber,
        documentImage,
      });

      res.json({
        success: true,
        message: "ID verification document uploaded successfully",
        data: { user },
      });
    }
  );

  // Setup bank account for payouts
  public setupBankAccount = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = (req as any).user?.id;
      const { accountNumber, accountName, bankName } = req.body;

      if (!accountNumber || !accountName || !bankName) {
        throw new AppError("Missing required fields", 400);
      }

      const user = await this.providerService.setupBankAccount(userId, {
        accountNumber,
        accountName,
        bankName,
      });

      res.json({
        success: true,
        message: "Bank account setup successfully",
        data: { user },
      });
    }
  );

  // Setup mobile money for payouts
  public setupMobileMoney = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = (req as any).user?.id;
      const { provider, phoneNumber } = req.body;

      if (!provider || !phoneNumber) {
        throw new AppError("Missing required fields", 400);
      }

      if (!["mtn", "vodafone", "airtelTigo"].includes(provider)) {
        throw new AppError("Invalid mobile money provider", 400);
      }

      const user = await this.providerService.setupMobileMoney(userId, {
        provider,
        phoneNumber,
      });

      res.json({
        success: true,
        message: "Mobile money setup successfully",
        data: { user },
      });
    }
  );

  // Get provider profile
  public getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    // This would typically come from a UserService
    // For now, we'll return a success message
    res.json({
      success: true,
      message: "Provider profile retrieved successfully",
      data: { userId },
    });
  });

  // Get verification status
  public getVerificationStatus = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = (req as any).user?.id;

      // This would typically come from a UserService
      // For now, we'll return a success message
      res.json({
        success: true,
        message: "Verification status retrieved successfully",
        data: { userId },
      });
    }
  );
}

export default new ProviderController();
