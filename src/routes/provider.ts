import { Router } from "express";
import providerController from "../controllers/providerController";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

// All routes require authentication and provider role
router.use(authenticate());
router.use(requireRole("provider"));

// Provider profile management
router.post("/profile", providerController.setupProfile);
router.get("/profile", providerController.getProfile);

// ID verification
router.post("/verification", providerController.uploadIdVerification);
router.get("/verification", providerController.getVerificationStatus);

// Payout setup
router.post("/bank-account", providerController.setupBankAccount);
router.post("/mobile-money", providerController.setupMobileMoney);

export default router;
