import request from "supertest";
import { app } from "../index";
import mongoose from "mongoose";
import { User } from "../models/User";
import { Banner } from "../models/Banner";
import { Promotion } from "../models/Promotion";
import { ReferralCampaign } from "../models/ReferralCampaign";
import { PushNotification } from "../models/PushNotification";

describe("Admin Content Management API", () => {
  let adminToken: string;
  let adminUser: any;
  let testBanner: any;
  let testPromotion: any;
  let testReferralCampaign: any;
  let testNotification: any;

  beforeAll(async () => {
    // Create admin user
    adminUser = await User.create({
      firstName: "Admin",
      lastName: "User",
      email: "admin@test.com",
      password: "password123",
      role: "admin",
      isVerified: true,
    });

    // Login to get token
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "admin@test.com",
      password: "password123",
    });

    adminToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Banner.deleteMany({});
    await Promotion.deleteMany({});
    await ReferralCampaign.deleteMany({});
    await PushNotification.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Banner.deleteMany({});
    await Promotion.deleteMany({});
    await ReferralCampaign.deleteMany({});
    await PushNotification.deleteMany({});
  });

  describe("Banner Management", () => {
    describe("POST /api/admin/content/banners", () => {
      it("should create a new banner", async () => {
        const bannerData = {
          title: "Test Banner",
          description: "Test banner description",
          type: "promotion",
          targetAudience: "customers",
          targetRoles: ["customer"],
          isActive: true,
          priority: 5,
          displayOrder: 1,
        };

        const response = await request(app)
          .post("/api/admin/content/banners")
          .set("Authorization", `Bearer ${adminToken}`)
          .send(bannerData);

        expect(response.status).toBe(201);
        expect(response.body.status).toBe("success");
        expect(response.body.data.title).toBe(bannerData.title);
        expect(response.body.data.createdBy).toBe(adminUser._id.toString());
      });

      it("should validate required fields", async () => {
        const response = await request(app)
          .post("/api/admin/content/banners")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.status).toBe("error");
      });
    });

    describe("GET /api/admin/content/banners", () => {
      beforeEach(async () => {
        testBanner = await Banner.create({
          title: "Test Banner",
          description: "Test description",
          type: "promotion",
          targetAudience: "customers",
          createdBy: adminUser._id,
        });
      });

      it("should get banners with pagination", async () => {
        const response = await request(app)
          .get("/api/admin/content/banners")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data).toHaveLength(1);
        expect(response.body.pagination).toBeDefined();
      });

      it("should filter banners by type", async () => {
        const response = await request(app)
          .get("/api/admin/content/banners?type=promotion")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
      });
    });

    describe("GET /api/admin/content/banners/stats", () => {
      it("should get banner statistics", async () => {
        const response = await request(app)
          .get("/api/admin/content/banners/stats")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data).toHaveProperty("totalBanners");
        expect(response.body.data).toHaveProperty("activeBanners");
        expect(response.body.data).toHaveProperty("totalViews");
        expect(response.body.data).toHaveProperty("totalClicks");
      });
    });

    describe("PATCH /api/admin/content/banners/:id", () => {
      beforeEach(async () => {
        testBanner = await Banner.create({
          title: "Test Banner",
          description: "Test description",
          type: "promotion",
          targetAudience: "customers",
          createdBy: adminUser._id,
        });
      });

      it("should update banner", async () => {
        const updateData = {
          title: "Updated Banner",
          isActive: false,
        };

        const response = await request(app)
          .patch(`/api/admin/content/banners/${testBanner._id}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.data.title).toBe(updateData.title);
        expect(response.body.data.isActive).toBe(updateData.isActive);
      });
    });

    describe("DELETE /api/admin/content/banners/:id", () => {
      beforeEach(async () => {
        testBanner = await Banner.create({
          title: "Test Banner",
          description: "Test description",
          type: "promotion",
          targetAudience: "customers",
          createdBy: adminUser._id,
        });
      });

      it("should delete banner", async () => {
        const response = await request(app)
          .delete(`/api/admin/content/banners/${testBanner._id}`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(204);
      });
    });
  });

  describe("Promotion Management", () => {
    describe("POST /api/admin/content/promotions", () => {
      it("should create a new promotion", async () => {
        const promotionData = {
          title: "Test Promotion",
          description: "Test promotion description",
          type: "discount",
          discountType: "percentage",
          discountValue: 15,
          minimumAmount: 50,
          maximumDiscount: 100,
          code: "TEST15",
          targetAudience: "customers",
          targetRoles: ["customer"],
          isActive: true,
          conditions: ["New customers only"],
          terms: ["Cannot be combined with other offers"],
        };

        const response = await request(app)
          .post("/api/admin/content/promotions")
          .set("Authorization", `Bearer ${adminToken}`)
          .send(promotionData);

        expect(response.status).toBe(201);
        expect(response.body.status).toBe("success");
        expect(response.body.data.title).toBe(promotionData.title);
        expect(response.body.data.code).toBe(promotionData.code);
      });
    });

    describe("GET /api/admin/content/promotions", () => {
      beforeEach(async () => {
        testPromotion = await Promotion.create({
          title: "Test Promotion",
          description: "Test description",
          type: "discount",
          discountType: "percentage",
          discountValue: 15,
          targetAudience: "customers",
          createdBy: adminUser._id,
        });
      });

      it("should get promotions with pagination", async () => {
        const response = await request(app)
          .get("/api/admin/content/promotions")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data).toHaveLength(1);
      });
    });

    describe("GET /api/admin/content/promotions/stats", () => {
      it("should get promotion statistics", async () => {
        const response = await request(app)
          .get("/api/admin/content/promotions/stats")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data).toHaveProperty("totalPromotions");
        expect(response.body.data).toHaveProperty("activePromotions");
        expect(response.body.data).toHaveProperty("totalUsage");
      });
    });
  });

  describe("Referral Campaign Management", () => {
    describe("POST /api/admin/content/referral-campaigns", () => {
      it("should create a new referral campaign", async () => {
        const campaignData = {
          title: "Test Referral Campaign",
          description: "Test referral campaign description",
          type: "both",
          referrerReward: {
            type: "fixed",
            value: 50,
            description: "Get $50 for each referral",
          },
          refereeReward: {
            type: "percentage",
            value: 10,
            description: "Get 10% off first booking",
          },
          targetAudience: "all",
          minimumReferrals: 1,
          maximumReferrals: 10,
          referralCodeLength: 8,
          terms: ["Valid for new users only"],
          conditions: ["Referral must complete first booking"],
        };

        const response = await request(app)
          .post("/api/admin/content/referral-campaigns")
          .set("Authorization", `Bearer ${adminToken}`)
          .send(campaignData);

        expect(response.status).toBe(201);
        expect(response.body.status).toBe("success");
        expect(response.body.data.title).toBe(campaignData.title);
        expect(response.body.data.referrerReward.value).toBe(50);
      });
    });

    describe("GET /api/admin/content/referral-campaigns", () => {
      beforeEach(async () => {
        testReferralCampaign = await ReferralCampaign.create({
          title: "Test Referral Campaign",
          description: "Test description",
          type: "both",
          referrerReward: {
            type: "fixed",
            value: 50,
            description: "Get $50 for each referral",
          },
          refereeReward: {
            type: "percentage",
            value: 10,
            description: "Get 10% off first booking",
          },
          targetAudience: "all",
          createdBy: adminUser._id,
        });
      });

      it("should get referral campaigns with pagination", async () => {
        const response = await request(app)
          .get("/api/admin/content/referral-campaigns")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data).toHaveLength(1);
      });
    });

    describe("GET /api/admin/content/referral-campaigns/stats", () => {
      it("should get referral campaign statistics", async () => {
        const response = await request(app)
          .get("/api/admin/content/referral-campaigns/stats")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data).toHaveProperty("totalCampaigns");
        expect(response.body.data).toHaveProperty("activeCampaigns");
        expect(response.body.data).toHaveProperty("totalReferrals");
      });
    });
  });

  describe("Push Notification Management", () => {
    describe("POST /api/admin/content/notifications", () => {
      it("should create a new push notification", async () => {
        const notificationData = {
          title: "Test Notification",
          message: "This is a test notification",
          type: "info",
          targetAudience: "customers",
          targetRoles: ["customer"],
          priority: "normal",
          isActive: true,
        };

        const response = await request(app)
          .post("/api/admin/content/notifications")
          .set("Authorization", `Bearer ${adminToken}`)
          .send(notificationData);

        expect(response.status).toBe(201);
        expect(response.body.status).toBe("success");
        expect(response.body.data.title).toBe(notificationData.title);
        expect(response.body.data.isSent).toBe(false);
      });
    });

    describe("GET /api/admin/content/notifications", () => {
      beforeEach(async () => {
        testNotification = await PushNotification.create({
          title: "Test Notification",
          message: "Test message",
          type: "info",
          targetAudience: "customers",
          createdBy: adminUser._id,
        });
      });

      it("should get notifications with pagination", async () => {
        const response = await request(app)
          .get("/api/admin/content/notifications")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data).toHaveLength(1);
      });

      it("should filter notifications by type", async () => {
        const response = await request(app)
          .get("/api/admin/content/notifications?type=info")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
      });
    });

    describe("POST /api/admin/content/notifications/:id/send", () => {
      beforeEach(async () => {
        testNotification = await PushNotification.create({
          title: "Test Notification",
          message: "Test message",
          type: "info",
          targetAudience: "customers",
          createdBy: adminUser._id,
        });
      });

      it("should send notification", async () => {
        const response = await request(app)
          .post(`/api/admin/content/notifications/${testNotification._id}/send`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.message).toBe(
          "Push notification sent successfully"
        );
      });
    });

    describe("GET /api/admin/content/notifications/stats", () => {
      it("should get notification statistics", async () => {
        const response = await request(app)
          .get("/api/admin/content/notifications/stats")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data).toHaveProperty("totalNotifications");
        expect(response.body.data).toHaveProperty("sentNotifications");
        expect(response.body.data).toHaveProperty("pendingNotifications");
      });
    });
  });

  describe("Analytics", () => {
    describe("GET /api/admin/content/analytics", () => {
      it("should get comprehensive content analytics", async () => {
        const response = await request(app)
          .get("/api/admin/content/analytics")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data).toHaveProperty("bannerStats");
        expect(response.body.data).toHaveProperty("promotionStats");
        expect(response.body.data).toHaveProperty("referralStats");
        expect(response.body.data).toHaveProperty("notificationStats");
        expect(response.body.data).toHaveProperty("overallEngagement");
      });
    });
  });

  describe("Bulk Operations", () => {
    describe("PATCH /api/admin/content/banners/bulk-status", () => {
      beforeEach(async () => {
        testBanner = await Banner.create({
          title: "Test Banner",
          description: "Test description",
          type: "promotion",
          targetAudience: "customers",
          createdBy: adminUser._id,
        });
      });

      it("should update multiple banner statuses", async () => {
        const response = await request(app)
          .patch("/api/admin/content/banners/bulk-status")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            bannerIds: [testBanner._id.toString()],
            isActive: false,
          });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
      });
    });

    describe("PATCH /api/admin/content/promotions/bulk-status", () => {
      beforeEach(async () => {
        testPromotion = await Promotion.create({
          title: "Test Promotion",
          description: "Test description",
          type: "discount",
          discountType: "percentage",
          discountValue: 15,
          targetAudience: "customers",
          createdBy: adminUser._id,
        });
      });

      it("should update multiple promotion statuses", async () => {
        const response = await request(app)
          .patch("/api/admin/content/promotions/bulk-status")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            promotionIds: [testPromotion._id.toString()],
            isActive: false,
          });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
      });
    });

    describe("POST /api/admin/content/notifications/bulk-send", () => {
      beforeEach(async () => {
        testNotification = await PushNotification.create({
          title: "Test Notification",
          message: "Test message",
          type: "info",
          targetAudience: "customers",
          createdBy: adminUser._id,
        });
      });

      it("should send multiple notifications", async () => {
        const response = await request(app)
          .post("/api/admin/content/notifications/bulk-send")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            notificationIds: [testNotification._id.toString()],
          });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
      });
    });
  });

  describe("Authentication & Authorization", () => {
    it("should require authentication", async () => {
      const response = await request(app).get("/api/admin/content/banners");

      expect(response.status).toBe(401);
    });

    it("should require admin role", async () => {
      // Create non-admin user
      const regularUser = await User.create({
        firstName: "Regular",
        lastName: "User",
        email: "regular@test.com",
        password: "password123",
        role: "customer",
        isVerified: true,
      });

      const loginResponse = await request(app).post("/api/auth/login").send({
        email: "regular@test.com",
        password: "password123",
      });

      const regularToken = loginResponse.body.data.token;

      const response = await request(app)
        .get("/api/admin/content/banners")
        .set("Authorization", `Bearer ${regularToken}`);

      expect(response.status).toBe(403);

      await User.findByIdAndDelete(regularUser._id);
    });
  });

  describe("Validation", () => {
    it("should validate banner creation data", async () => {
      const invalidData = {
        title: "", // Empty title
        type: "invalid_type", // Invalid type
      };

      const response = await request(app)
        .post("/api/admin/content/banners")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
    });

    it("should validate promotion creation data", async () => {
      const invalidData = {
        title: "Test",
        type: "discount",
        discountValue: -10, // Negative value
      };

      const response = await request(app)
        .post("/api/admin/content/promotions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
    });
  });
});
