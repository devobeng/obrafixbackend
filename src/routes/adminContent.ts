import express from "express";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import adminContentController from "../controllers/adminContentController";
import {
  createBannerSchema,
  updateBannerSchema,
  bannerFiltersSchema,
  createPromotionSchema,
  updatePromotionSchema,
  promotionFiltersSchema,
  createReferralCampaignSchema,
  updateReferralCampaignSchema,
  referralCampaignFiltersSchema,
  createPushNotificationSchema,
  updatePushNotificationSchema,
  pushNotificationFiltersSchema,
  bulkUpdateBannerStatusSchema,
  bulkUpdatePromotionStatusSchema,
  bulkSendNotificationsSchema,
  contentAnalyticsFiltersSchema,
} from "../validations/adminContentValidation";

const router = express.Router();

// Apply authentication and admin role requirement to all routes
router.use(authenticate());
router.use(requireRole("admin"));

// Banner Management Routes
router.post(
  "/banners",
  validateRequest(createBannerSchema),
  adminContentController.createBanner
);

router.get(
  "/banners",
  validateRequest(bannerFiltersSchema),
  adminContentController.getBanners
);

router.get("/banners/stats", adminContentController.getBannerStats);

router.patch(
  "/banners/:id",
  validateRequest(updateBannerSchema),
  adminContentController.updateBanner
);

router.delete("/banners/:id", adminContentController.deleteBanner);

// Promotion Management Routes
router.post(
  "/promotions",
  validateRequest(createPromotionSchema),
  adminContentController.createPromotion
);

router.get(
  "/promotions",
  validateRequest(promotionFiltersSchema),
  adminContentController.getPromotions
);

router.get("/promotions/stats", adminContentController.getPromotionStats);

router.patch(
  "/promotions/:id",
  validateRequest(updatePromotionSchema),
  adminContentController.updatePromotion
);

router.delete("/promotions/:id", adminContentController.deletePromotion);

// Referral Campaign Management Routes
router.post(
  "/referral-campaigns",
  validateRequest(createReferralCampaignSchema),
  adminContentController.createReferralCampaign
);

router.get(
  "/referral-campaigns",
  validateRequest(referralCampaignFiltersSchema),
  adminContentController.getReferralCampaigns
);

router.get(
  "/referral-campaigns/stats",
  adminContentController.getReferralStats
);

router.patch(
  "/referral-campaigns/:id",
  validateRequest(updateReferralCampaignSchema),
  adminContentController.updateReferralCampaign
);

router.delete(
  "/referral-campaigns/:id",
  adminContentController.deleteReferralCampaign
);

// Push Notification Management Routes
router.post(
  "/notifications",
  validateRequest(createPushNotificationSchema),
  adminContentController.createPushNotification
);

router.get(
  "/notifications",
  validateRequest(pushNotificationFiltersSchema),
  adminContentController.getPushNotifications
);

router.get("/notifications/stats", adminContentController.getNotificationStats);

router.patch(
  "/notifications/:id",
  validateRequest(updatePushNotificationSchema),
  adminContentController.updatePushNotification
);

router.delete(
  "/notifications/:id",
  adminContentController.deletePushNotification
);

router.post(
  "/notifications/:id/send",
  adminContentController.sendPushNotification
);

// Analytics Routes
router.get(
  "/analytics",
  validateRequest(contentAnalyticsFiltersSchema),
  adminContentController.getContentAnalytics
);

// Bulk Operations Routes
router.patch(
  "/banners/bulk-status",
  validateRequest(bulkUpdateBannerStatusSchema),
  adminContentController.bulkUpdateBannerStatus
);

router.patch(
  "/promotions/bulk-status",
  validateRequest(bulkUpdatePromotionStatusSchema),
  adminContentController.bulkUpdatePromotionStatus
);

router.post(
  "/notifications/bulk-send",
  validateRequest(bulkSendNotificationsSchema),
  adminContentController.bulkSendNotifications
);

export default router;
