import { Router } from "express";
import { WalletController } from "../controllers/walletController";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/auth";

const router = Router();
const walletController = new WalletController();

// User routes (authenticated users)
router.get("/balance", authenticate(), walletController.getWalletBalance);
router.get("/transactions", authenticate(), walletController.getWalletTransactions);
router.get("/stats", authenticate(), walletController.getWalletStats);
router.post("/add-funds", authenticate(), walletController.addFunds);

// Admin routes
router.get("/all", authenticate(), requireRole(["admin"]), walletController.getAllWallets);
router.get("/user/:userId", authenticate(), requireRole(["admin"]), walletController.getWalletByUserId);

export default router; 