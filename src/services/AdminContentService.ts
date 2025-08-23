import { Banner, IBanner } from "../models/Banner";
import { Promotion, IPromotion } from "../models/Promotion";
import {
  ReferralCampaign,
  IReferralCampaign,
} from "../models/ReferralCampaign";
import {
  PushNotification,
  IPushNotification,
} from "../models/PushNotification";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";

export interface IBannerStats {
  totalBanners: number;
  activeBanners: number;
  totalViews: number;
  totalClicks: number;
  averageClickRate: number;
  topPerformingBanners: IBanner[];
}

export interface IPromotionStats {
  totalPromotions: number;
  activePromotions: number;
  totalUsage: number;
  totalDiscount: number;
  averageUsage: number;
  topPromotions: IPromotion[];
}

export interface IReferralStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalReferrals: number;
  totalRewards: number;
  averageReferralsPerCampaign: number;
  topCampaigns: IReferralCampaign[];
}

export interface INotificationStats {
  totalNotifications: number;
  sentNotifications: number;
  pendingNotifications: number;
  averageDeliveryRate: number;
  notificationsByType: Record<string, number>;
  notificationsByPriority: Record<string, number>;
}

export interface IContentAnalytics {
  bannerStats: IBannerStats;
  promotionStats: IPromotionStats;
  referralStats: IReferralStats;
  notificationStats: INotificationStats;
  overallEngagement: {
    totalViews: number;
    totalClicks: number;
    totalUsage: number;
    totalReferrals: number;
  };
}

class AdminContentService {
  // Banner Management
  async createBanner(
    bannerData: Partial<IBanner>,
    adminId: string
  ): Promise<IBanner> {
    const banner = await Banner.create({
      ...bannerData,
      createdBy: adminId,
    });
    return banner;
  }

  async updateBanner(
    bannerId: string,
    updateData: Partial<IBanner>,
    adminId: string
  ): Promise<IBanner> {
    const banner = await Banner.findByIdAndUpdate(
      bannerId,
      {
        ...updateData,
        updatedBy: adminId,
      },
      { new: true, runValidators: true }
    );

    if (!banner) {
      throw new AppError("Banner not found", 404);
    }

    return banner;
  }

  async deleteBanner(bannerId: string): Promise<void> {
    const banner = await Banner.findByIdAndDelete(bannerId);
    if (!banner) {
      throw new AppError("Banner not found", 404);
    }
  }

  async getBanners(filters: {
    type?: string;
    targetAudience?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    banners: IBanner[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { type, targetAudience, isActive, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (type) query.type = type;
    if (targetAudience) query.targetAudience = targetAudience;
    if (isActive !== undefined) query.isActive = isActive;

    const [banners, total] = await Promise.all([
      Banner.find(query)
        .populate("createdBy", "firstName lastName")
        .populate("updatedBy", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Banner.countDocuments(query),
    ]);

    return {
      banners,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getBannerStats(): Promise<IBannerStats> {
    const [
      totalBanners,
      activeBanners,
      totalViews,
      totalClicks,
      topPerformingBanners,
    ] = await Promise.all([
      Banner.countDocuments(),
      Banner.countDocuments({ isActive: true }),
      Banner.aggregate([
        { $group: { _id: null, total: { $sum: "$viewCount" } } },
      ]),
      Banner.aggregate([
        { $group: { _id: null, total: { $sum: "$clickCount" } } },
      ]),
      Banner.find({ isActive: true })
        .sort({ clickCount: -1 })
        .limit(5)
        .populate("createdBy", "firstName lastName"),
    ]);

    const averageClickRate =
      totalViews[0]?.total > 0
        ? (totalClicks[0]?.total / totalViews[0]?.total) * 100
        : 0;

    return {
      totalBanners,
      activeBanners,
      totalViews: totalViews[0]?.total || 0,
      totalClicks: totalClicks[0]?.total || 0,
      averageClickRate: Math.round(averageClickRate * 100) / 100,
      topPerformingBanners,
    };
  }

  // Promotion Management
  async createPromotion(
    promotionData: Partial<IPromotion>,
    adminId: string
  ): Promise<IPromotion> {
    const promotion = await Promotion.create({
      ...promotionData,
      createdBy: adminId,
    });
    return promotion;
  }

  async updatePromotion(
    promotionId: string,
    updateData: Partial<IPromotion>,
    adminId: string
  ): Promise<IPromotion> {
    const promotion = await Promotion.findByIdAndUpdate(
      promotionId,
      {
        ...updateData,
        updatedBy: adminId,
      },
      { new: true, runValidators: true }
    );

    if (!promotion) {
      throw new AppError("Promotion not found", 404);
    }

    return promotion;
  }

  async deletePromotion(promotionId: string): Promise<void> {
    const promotion = await Promotion.findByIdAndDelete(promotionId);
    if (!promotion) {
      throw new AppError("Promotion not found", 404);
    }
  }

  async getPromotions(filters: {
    type?: string;
    targetAudience?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    promotions: IPromotion[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { type, targetAudience, isActive, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (type) query.type = type;
    if (targetAudience) query.targetAudience = targetAudience;
    if (isActive !== undefined) query.isActive = isActive;

    const [promotions, total] = await Promise.all([
      Promotion.find(query)
        .populate("createdBy", "firstName lastName")
        .populate("updatedBy", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Promotion.countDocuments(query),
    ]);

    return {
      promotions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPromotionStats(): Promise<IPromotionStats> {
    const [
      totalPromotions,
      activePromotions,
      totalUsage,
      totalDiscount,
      topPromotions,
    ] = await Promise.all([
      Promotion.countDocuments(),
      Promotion.countDocuments({ isActive: true }),
      Promotion.aggregate([
        { $group: { _id: null, total: { $sum: "$usageCount" } } },
      ]),
      Promotion.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ["$discountValue", "$usageCount"] } },
          },
        },
      ]),
      Promotion.find({ isActive: true })
        .sort({ usageCount: -1 })
        .limit(5)
        .populate("createdBy", "firstName lastName"),
    ]);

    const averageUsage =
      totalPromotions > 0 ? (totalUsage[0]?.total || 0) / totalPromotions : 0;

    return {
      totalPromotions,
      activePromotions,
      totalUsage: totalUsage[0]?.total || 0,
      totalDiscount: totalDiscount[0]?.total || 0,
      averageUsage: Math.round(averageUsage * 100) / 100,
      topPromotions,
    };
  }

  // Referral Campaign Management
  async createReferralCampaign(
    campaignData: Partial<IReferralCampaign>,
    adminId: string
  ): Promise<IReferralCampaign> {
    const campaign = await ReferralCampaign.create({
      ...campaignData,
      createdBy: adminId,
    });
    return campaign;
  }

  async updateReferralCampaign(
    campaignId: string,
    updateData: Partial<IReferralCampaign>,
    adminId: string
  ): Promise<IReferralCampaign> {
    const campaign = await ReferralCampaign.findByIdAndUpdate(
      campaignId,
      {
        ...updateData,
        updatedBy: adminId,
      },
      { new: true, runValidators: true }
    );

    if (!campaign) {
      throw new AppError("Referral campaign not found", 404);
    }

    return campaign;
  }

  async deleteReferralCampaign(campaignId: string): Promise<void> {
    const campaign = await ReferralCampaign.findByIdAndDelete(campaignId);
    if (!campaign) {
      throw new AppError("Referral campaign not found", 404);
    }
  }

  async getReferralCampaigns(filters: {
    type?: string;
    targetAudience?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    campaigns: IReferralCampaign[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { type, targetAudience, isActive, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (type) query.type = type;
    if (targetAudience) query.targetAudience = targetAudience;
    if (isActive !== undefined) query.isActive = isActive;

    const [campaigns, total] = await Promise.all([
      ReferralCampaign.find(query)
        .populate("createdBy", "firstName lastName")
        .populate("updatedBy", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ReferralCampaign.countDocuments(query),
    ]);

    return {
      campaigns,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getReferralStats(): Promise<IReferralStats> {
    // Placeholder implementation - would need actual referral tracking
    const [totalCampaigns, activeCampaigns] = await Promise.all([
      ReferralCampaign.countDocuments(),
      ReferralCampaign.countDocuments({ isActive: true }),
    ]);

    // Mock data for now - would be replaced with actual referral tracking
    const totalReferrals = 150;
    const totalRewards = 2500;
    const averageReferralsPerCampaign =
      totalCampaigns > 0 ? totalReferrals / totalCampaigns : 0;

    const topCampaigns = await ReferralCampaign.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("createdBy", "firstName lastName");

    return {
      totalCampaigns,
      activeCampaigns,
      totalReferrals,
      totalRewards,
      averageReferralsPerCampaign:
        Math.round(averageReferralsPerCampaign * 100) / 100,
      topCampaigns,
    };
  }

  // Push Notification Management
  async createPushNotification(
    notificationData: Partial<IPushNotification>,
    adminId: string
  ): Promise<IPushNotification> {
    const notification = await PushNotification.create({
      ...notificationData,
      createdBy: adminId,
    });
    return notification;
  }

  async updatePushNotification(
    notificationId: string,
    updateData: Partial<IPushNotification>,
    adminId: string
  ): Promise<IPushNotification> {
    const notification = await PushNotification.findByIdAndUpdate(
      notificationId,
      {
        ...updateData,
        updatedBy: adminId,
      },
      { new: true, runValidators: true }
    );

    if (!notification) {
      throw new AppError("Push notification not found", 404);
    }

    return notification;
  }

  async deletePushNotification(notificationId: string): Promise<void> {
    const notification = await PushNotification.findByIdAndDelete(
      notificationId
    );
    if (!notification) {
      throw new AppError("Push notification not found", 404);
    }
  }

  async getPushNotifications(filters: {
    type?: string;
    targetAudience?: string;
    priority?: string;
    isSent?: boolean;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    notifications: IPushNotification[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      type,
      targetAudience,
      priority,
      isSent,
      isActive,
      page = 1,
      limit = 10,
    } = filters;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (type) query.type = type;
    if (targetAudience) query.targetAudience = targetAudience;
    if (priority) query.priority = priority;
    if (isSent !== undefined) query.isSent = isSent;
    if (isActive !== undefined) query.isActive = isActive;

    const [notifications, total] = await Promise.all([
      PushNotification.find(query)
        .populate("createdBy", "firstName lastName")
        .populate("updatedBy", "firstName lastName")
        .populate("targetUsers", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PushNotification.countDocuments(query),
    ]);

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async sendPushNotification(notificationId: string): Promise<void> {
    const notification = await PushNotification.findById(notificationId);
    if (!notification) {
      throw new AppError("Push notification not found", 404);
    }

    if (notification.isSent) {
      throw new AppError("Notification has already been sent", 400);
    }

    // Here you would integrate with actual push notification service
    // (Firebase, OneSignal, etc.)
    console.log(`Sending push notification: ${notification.title}`);

    // Mark as sent
    await notification.markAsSent();
  }

  async getNotificationStats(): Promise<INotificationStats> {
    const [
      totalNotifications,
      sentNotifications,
      pendingNotifications,
      notificationsByType,
      notificationsByPriority,
    ] = await Promise.all([
      PushNotification.countDocuments(),
      PushNotification.countDocuments({ isSent: true }),
      PushNotification.countDocuments({ isSent: false, isActive: true }),
      PushNotification.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
      PushNotification.aggregate([
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
    ]);

    const averageDeliveryRate =
      totalNotifications > 0
        ? (sentNotifications / totalNotifications) * 100
        : 0;

    const typeStats = notificationsByType.reduce(
      (acc: Record<string, number>, item: any) => {
        acc[item._id] = item.count;
        return acc;
      },
      {}
    );

    const priorityStats = notificationsByPriority.reduce(
      (acc: Record<string, number>, item: any) => {
        acc[item._id] = item.count;
        return acc;
      },
      {}
    );

    return {
      totalNotifications,
      sentNotifications,
      pendingNotifications,
      averageDeliveryRate: Math.round(averageDeliveryRate * 100) / 100,
      notificationsByType: typeStats,
      notificationsByPriority: priorityStats,
    };
  }

  // Analytics
  async getContentAnalytics(): Promise<IContentAnalytics> {
    const [bannerStats, promotionStats, referralStats, notificationStats] =
      await Promise.all([
        this.getBannerStats(),
        this.getPromotionStats(),
        this.getReferralStats(),
        this.getNotificationStats(),
      ]);

    const overallEngagement = {
      totalViews: bannerStats.totalViews,
      totalClicks: bannerStats.totalClicks,
      totalUsage: promotionStats.totalUsage,
      totalReferrals: referralStats.totalReferrals,
    };

    return {
      bannerStats,
      promotionStats,
      referralStats,
      notificationStats,
      overallEngagement,
    };
  }

  // Bulk Operations
  async bulkUpdateBannerStatus(
    bannerIds: string[],
    isActive: boolean,
    adminId: string
  ): Promise<void> {
    await Banner.updateMany(
      { _id: { $in: bannerIds } },
      {
        isActive,
        updatedBy: adminId,
      }
    );
  }

  async bulkUpdatePromotionStatus(
    promotionIds: string[],
    isActive: boolean,
    adminId: string
  ): Promise<void> {
    await Promotion.updateMany(
      { _id: { $in: promotionIds } },
      {
        isActive,
        updatedBy: adminId,
      }
    );
  }

  async bulkSendNotifications(notificationIds: string[]): Promise<void> {
    const notifications = await PushNotification.find({
      _id: { $in: notificationIds },
      isSent: false,
      isActive: true,
    });

    for (const notification of notifications) {
      await this.sendPushNotification(notification._id.toString());
    }
  }
}

export default new AdminContentService();
