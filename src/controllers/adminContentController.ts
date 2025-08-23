import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../utils/catchAsync";
import AdminContentService from "../services/AdminContentService";

class AdminContentController {
  // Banner Management
  createBanner = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const banner = await AdminContentService.createBanner(
        req.body,
        req.user!.id
      );

      res.status(201).json({
        status: "success",
        data: banner,
      });
    }
  );

  updateBanner = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const banner = await AdminContentService.updateBanner(
        id,
        req.body,
        req.user!.id
      );

      res.status(200).json({
        status: "success",
        data: banner,
      });
    }
  );

  deleteBanner = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      await AdminContentService.deleteBanner(id);

      res.status(204).json({
        status: "success",
        data: null,
      });
    }
  );

  getBanners = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { type, targetAudience, isActive, page, limit } = req.query;

      const filters: any = {};
      if (type) filters.type = type as string;
      if (targetAudience) filters.targetAudience = targetAudience as string;
      if (isActive !== undefined) filters.isActive = isActive === "true";
      if (page) filters.page = parseInt(page as string);
      if (limit) filters.limit = parseInt(limit as string);

      const result = await AdminContentService.getBanners(filters);

      res.status(200).json({
        status: "success",
        data: result.banners,
        pagination: {
          page: result.page,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    }
  );

  getBannerStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await AdminContentService.getBannerStats();

      res.status(200).json({
        status: "success",
        data: stats,
      });
    }
  );

  // Promotion Management
  createPromotion = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const promotion = await AdminContentService.createPromotion(
        req.body,
        req.user!.id
      );

      res.status(201).json({
        status: "success",
        data: promotion,
      });
    }
  );

  updatePromotion = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const promotion = await AdminContentService.updatePromotion(
        id,
        req.body,
        req.user!.id
      );

      res.status(200).json({
        status: "success",
        data: promotion,
      });
    }
  );

  deletePromotion = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      await AdminContentService.deletePromotion(id);

      res.status(204).json({
        status: "success",
        data: null,
      });
    }
  );

  getPromotions = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { type, targetAudience, isActive, page, limit } = req.query;

      const filters: any = {};
      if (type) filters.type = type as string;
      if (targetAudience) filters.targetAudience = targetAudience as string;
      if (isActive !== undefined) filters.isActive = isActive === "true";
      if (page) filters.page = parseInt(page as string);
      if (limit) filters.limit = parseInt(limit as string);

      const result = await AdminContentService.getPromotions(filters);

      res.status(200).json({
        status: "success",
        data: result.promotions,
        pagination: {
          page: result.page,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    }
  );

  getPromotionStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await AdminContentService.getPromotionStats();

      res.status(200).json({
        status: "success",
        data: stats,
      });
    }
  );

  // Referral Campaign Management
  createReferralCampaign = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const campaign = await AdminContentService.createReferralCampaign(
        req.body,
        req.user!.id
      );

      res.status(201).json({
        status: "success",
        data: campaign,
      });
    }
  );

  updateReferralCampaign = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const campaign = await AdminContentService.updateReferralCampaign(
        id,
        req.body,
        req.user!.id
      );

      res.status(200).json({
        status: "success",
        data: campaign,
      });
    }
  );

  deleteReferralCampaign = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      await AdminContentService.deleteReferralCampaign(id);

      res.status(204).json({
        status: "success",
        data: null,
      });
    }
  );

  getReferralCampaigns = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { type, targetAudience, isActive, page, limit } = req.query;

      const filters: any = {};
      if (type) filters.type = type as string;
      if (targetAudience) filters.targetAudience = targetAudience as string;
      if (isActive !== undefined) filters.isActive = isActive === "true";
      if (page) filters.page = parseInt(page as string);
      if (limit) filters.limit = parseInt(limit as string);

      const result = await AdminContentService.getReferralCampaigns(filters);

      res.status(200).json({
        status: "success",
        data: result.campaigns,
        pagination: {
          page: result.page,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    }
  );

  getReferralStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await AdminContentService.getReferralStats();

      res.status(200).json({
        status: "success",
        data: stats,
      });
    }
  );

  // Push Notification Management
  createPushNotification = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const notification = await AdminContentService.createPushNotification(
        req.body,
        req.user!.id
      );

      res.status(201).json({
        status: "success",
        data: notification,
      });
    }
  );

  updatePushNotification = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const notification = await AdminContentService.updatePushNotification(
        id,
        req.body,
        req.user!.id
      );

      res.status(200).json({
        status: "success",
        data: notification,
      });
    }
  );

  deletePushNotification = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      await AdminContentService.deletePushNotification(id);

      res.status(204).json({
        status: "success",
        data: null,
      });
    }
  );

  getPushNotifications = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { type, targetAudience, priority, isSent, isActive, page, limit } =
        req.query;

      const filters: any = {};
      if (type) filters.type = type as string;
      if (targetAudience) filters.targetAudience = targetAudience as string;
      if (priority) filters.priority = priority as string;
      if (isSent !== undefined) filters.isSent = isSent === "true";
      if (isActive !== undefined) filters.isActive = isActive === "true";
      if (page) filters.page = parseInt(page as string);
      if (limit) filters.limit = parseInt(limit as string);

      const result = await AdminContentService.getPushNotifications(filters);

      res.status(200).json({
        status: "success",
        data: result.notifications,
        pagination: {
          page: result.page,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    }
  );

  sendPushNotification = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      await AdminContentService.sendPushNotification(id);

      res.status(200).json({
        status: "success",
        message: "Push notification sent successfully",
      });
    }
  );

  getNotificationStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await AdminContentService.getNotificationStats();

      res.status(200).json({
        status: "success",
        data: stats,
      });
    }
  );

  // Analytics
  getContentAnalytics = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const analytics = await AdminContentService.getContentAnalytics();

      res.status(200).json({
        status: "success",
        data: analytics,
      });
    }
  );

  // Bulk Operations
  bulkUpdateBannerStatus = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { bannerIds, isActive } = req.body;
      await AdminContentService.bulkUpdateBannerStatus(
        bannerIds,
        isActive,
        req.user!.id
      );

      res.status(200).json({
        status: "success",
        message: "Banner status updated successfully",
      });
    }
  );

  bulkUpdatePromotionStatus = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { promotionIds, isActive } = req.body;
      await AdminContentService.bulkUpdatePromotionStatus(
        promotionIds,
        isActive,
        req.user!.id
      );

      res.status(200).json({
        status: "success",
        message: "Promotion status updated successfully",
      });
    }
  );

  bulkSendNotifications = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { notificationIds } = req.body;
      await AdminContentService.bulkSendNotifications(notificationIds);

      res.status(200).json({
        status: "success",
        message: "Notifications sent successfully",
      });
    }
  );
}

export default new AdminContentController();
