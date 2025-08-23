import request from "supertest";
import mongoose from "mongoose";
import { app } from "../index";
import { connectDB, closeDB } from "../config/database";
import { User } from "../models/User";
import { WithdrawalRequest } from "../models/WithdrawalRequest";
import { BookingPayment } from "../models/BookingPayment";
import { Service } from "../models/Service";
import { ServiceCategory } from "../models/ServiceCategory";
import { Booking } from "../models/Booking";

describe("Admin Payment Management API", () => {
  let adminToken: string;
  let adminUser: any;
  let providerUser: any;
  let withdrawalRequest: any;
  let serviceCategory: any;
  let service: any;
  let booking: any;

  beforeAll(async () => {
    await connectDB();

    // Create admin user
    adminUser = await User.create({
      firstName: "Admin",
      lastName: "User",
      email: "admin@test.com",
      password: "password123",
      role: "admin",
      isVerified: true,
    });

    // Create provider user
    providerUser = await User.create({
      firstName: "Provider",
      lastName: "User",
      email: "provider@test.com",
      password: "password123",
      role: "provider",
      isVerified: true,
    });

    // Create service category
    serviceCategory = await ServiceCategory.create({
      name: "Cleaning Services",
      description: "House cleaning services",
      commissionRate: 10,
      isActive: true,
    });

    // Create service
    service = await Service.create({
      title: "House Cleaning",
      description: "Professional house cleaning",
      category: serviceCategory._id,
      providerId: providerUser._id,
      basePrice: 100,
      isActive: true,
    });

    // Create booking
    booking = await Booking.create({
      userId: adminUser._id,
      providerId: providerUser._id,
      serviceId: service._id,
      status: "completed",
      pricing: {
        basePrice: 100,
        totalAmount: 100,
        paymentMethod: "credit_card",
      },
      payment: {
        status: "paid",
        paidAt: new Date(),
      },
    });

    // Create withdrawal request
    withdrawalRequest = await WithdrawalRequest.create({
      providerId: providerUser._id,
      amount: 500,
      paymentMethod: "bank_transfer",
      status: "pending",
    });

    // Create payment records
    await BookingPayment.create([
      {
        bookingId: booking._id,
        amount: 100,
        type: "payment",
        status: "completed",
        paymentMethod: "credit_card",
      },
      {
        bookingId: booking._id,
        amount: 10,
        type: "commission",
        status: "completed",
        paymentMethod: "credit_card",
      },
    ]);

    // Login as admin
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "admin@test.com",
      password: "password123",
    });

    adminToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await WithdrawalRequest.deleteMany({});
    await BookingPayment.deleteMany({});
    await Service.deleteMany({});
    await ServiceCategory.deleteMany({});
    await Booking.deleteMany({});
    await closeDB();
  });

  describe("Payout Management", () => {
    describe("GET /api/admin/payments/withdrawals", () => {
      it("should get withdrawal requests with pagination", async () => {
        const response = await request(app)
          .get("/api/admin/payments/withdrawals")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.status).toBe("success");
        expect(response.body.data.withdrawals).toBeDefined();
        expect(response.body.data.total).toBeGreaterThan(0);
        expect(response.body.data.page).toBe(1);
      });

      it("should filter withdrawal requests by status", async () => {
        const response = await request(app)
          .get("/api/admin/payments/withdrawals?status=pending")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.status).toBe("success");
        expect(response.body.data.withdrawals).toBeDefined();
        expect(response.body.data.withdrawals.length).toBeGreaterThan(0);
      });

      it("should require admin authentication", async () => {
        await request(app).get("/api/admin/payments/withdrawals").expect(401);
      });
    });

    describe("GET /api/admin/payments/withdrawals/stats", () => {
      it("should get payout statistics", async () => {
        const response = await request(app)
          .get("/api/admin/payments/withdrawals/stats")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.status).toBe("success");
        expect(response.body.data.totalPayouts).toBeGreaterThan(0);
        expect(response.body.data.pendingPayouts).toBeGreaterThan(0);
        expect(response.body.data.payoutMethods).toBeDefined();
      });
    });

    describe("POST /api/admin/payments/withdrawals/:id/approve", () => {
      it("should approve withdrawal request", async () => {
        const response = await request(app)
          .post(
            `/api/admin/payments/withdrawals/${withdrawalRequest._id}/approve`
          )
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            adminNotes: "Approved after verification",
          })
          .expect(200);

        expect(response.body.status).toBe("success");
        expect(response.body.message).toBe(
          "Withdrawal request approved successfully"
        );
        expect(response.body.data.status).toBe("approved");
      });

      it("should require admin authentication", async () => {
        await request(app)
          .post(
            `/api/admin/payments/withdrawals/${withdrawalRequest._id}/approve`
          )
          .send({
            adminNotes: "Approved after verification",
          })
          .expect(401);
      });

      it("should handle invalid withdrawal ID", async () => {
        const invalidId = new mongoose.Types.ObjectId();
        await request(app)
          .post(`/api/admin/payments/withdrawals/${invalidId}/approve`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            adminNotes: "Approved after verification",
          })
          .expect(404);
      });
    });

    describe("POST /api/admin/payments/withdrawals/:id/reject", () => {
      it("should reject withdrawal request", async () => {
        // Create a new pending withdrawal for testing
        const newWithdrawal = await WithdrawalRequest.create({
          providerId: providerUser._id,
          amount: 300,
          paymentMethod: "mobile_money",
          status: "pending",
        });

        const response = await request(app)
          .post(`/api/admin/payments/withdrawals/${newWithdrawal._id}/reject`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            reason: "Insufficient documentation",
            adminNotes: "Please provide additional documents",
          })
          .expect(200);

        expect(response.body.status).toBe("success");
        expect(response.body.message).toBe(
          "Withdrawal request rejected successfully"
        );
        expect(response.body.data.status).toBe("rejected");
        expect(response.body.data.rejectionReason).toBe(
          "Insufficient documentation"
        );
      });

      it("should require rejection reason", async () => {
        const newWithdrawal = await WithdrawalRequest.create({
          providerId: providerUser._id,
          amount: 200,
          paymentMethod: "bank_transfer",
          status: "pending",
        });

        await request(app)
          .post(`/api/admin/payments/withdrawals/${newWithdrawal._id}/reject`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            adminNotes: "No reason provided",
          })
          .expect(400);
      });
    });
  });

  describe("Revenue & Commission Management", () => {
    describe("GET /api/admin/payments/revenue/stats", () => {
      it("should get revenue statistics", async () => {
        const response = await request(app)
          .get("/api/admin/payments/revenue/stats")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.status).toBe("success");
        expect(response.body.data.totalRevenue).toBeGreaterThan(0);
        expect(response.body.data.platformFees).toBeGreaterThan(0);
        expect(response.body.data.netRevenue).toBeDefined();
      });

      it("should support period filtering", async () => {
        const response = await request(app)
          .get("/api/admin/payments/revenue/stats?period=month")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.status).toBe("success");
        expect(response.body.data).toBeDefined();
      });
    });

    describe("GET /api/admin/payments/commission/stats", () => {
      it("should get commission statistics", async () => {
        const response = await request(app)
          .get("/api/admin/payments/commission/stats")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.status).toBe("success");
        expect(response.body.data.totalCommissions).toBeGreaterThan(0);
        expect(response.body.data.averageCommissionRate).toBeDefined();
        expect(response.body.data.commissionsByCategory).toBeDefined();
        expect(response.body.data.topEarningProviders).toBeDefined();
      });
    });
  });

  describe("Payment Analytics", () => {
    describe("GET /api/admin/payments/analytics/payments", () => {
      it("should get payment analytics", async () => {
        const response = await request(app)
          .get("/api/admin/payments/analytics/payments")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.status).toBe("success");
        expect(response.body.data.paymentMethods).toBeDefined();
        expect(response.body.data.paymentStatus).toBeDefined();
        expect(response.body.data.dailyPayments).toBeDefined();
        expect(response.body.data.monthlyTrends).toBeDefined();
      });

      it("should support period filtering", async () => {
        const response = await request(app)
          .get("/api/admin/payments/analytics/payments?period=month")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.status).toBe("success");
        expect(response.body.data).toBeDefined();
      });
    });
  });

  describe("Integration Management", () => {
    describe("GET /api/admin/payments/integrations/status", () => {
      it("should get payment integration status", async () => {
        const response = await request(app)
          .get("/api/admin/payments/integrations/status")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.status).toBe("success");
        expect(response.body.data.stripe).toBeDefined();
        expect(response.body.data.paystack).toBeDefined();
        expect(response.body.data.mobileMoney).toBeDefined();
      });
    });

    describe("PATCH /api/admin/payments/integrations/settings", () => {
      it("should update payment integration settings", async () => {
        const response = await request(app)
          .patch("/api/admin/payments/integrations/settings")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            settings: {
              stripe: {
                enabled: true,
                apiKey: "sk_test_...",
              },
            },
          })
          .expect(200);

        expect(response.body.status).toBe("success");
        expect(response.body.message).toBe(
          "Payment integration settings updated successfully"
        );
      });
    });
  });

  describe("Reports & Analytics", () => {
    describe("GET /api/admin/payments/reports/revenue/daily", () => {
      it("should get daily revenue report", async () => {
        const response = await request(app)
          .get("/api/admin/payments/reports/revenue/daily")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.status).toBe("success");
        expect(response.body.data.date).toBeDefined();
        expect(response.body.data.totalRevenue).toBeGreaterThan(0);
      });
    });

    describe("GET /api/admin/payments/reports/revenue/weekly", () => {
      it("should get weekly revenue report", async () => {
        const response = await request(app)
          .get("/api/admin/payments/reports/revenue/weekly")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.status).toBe("success");
        expect(response.body.data.totalRevenue).toBeGreaterThan(0);
      });
    });

    describe("GET /api/admin/payments/reports/revenue/monthly", () => {
      it("should get monthly revenue report", async () => {
        const response = await request(app)
          .get("/api/admin/payments/reports/revenue/monthly")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.status).toBe("success");
        expect(response.body.data.totalRevenue).toBeGreaterThan(0);
      });
    });

    describe("GET /api/admin/payments/reports/services/top", () => {
      it("should get top services report", async () => {
        const response = await request(app)
          .get("/api/admin/payments/reports/services/top")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.status).toBe("success");
        expect(response.body.data.period).toBeDefined();
        expect(response.body.data.topServices).toBeDefined();
      });

      it("should support limit parameter", async () => {
        const response = await request(app)
          .get("/api/admin/payments/reports/services/top?limit=5")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.status).toBe("success");
        expect(response.body.data.topServices.length).toBeLessThanOrEqual(5);
      });
    });

    describe("GET /api/admin/payments/reports/vendors/top", () => {
      it("should get top vendors report", async () => {
        const response = await request(app)
          .get("/api/admin/payments/reports/vendors/top")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.status).toBe("success");
        expect(response.body.data.period).toBeDefined();
        expect(response.body.data.topVendors).toBeDefined();
      });
    });

    describe("GET /api/admin/payments/reports/customers/activity", () => {
      it("should get customer activity report", async () => {
        const response = await request(app)
          .get("/api/admin/payments/reports/customers/activity")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.status).toBe("success");
        expect(response.body.data.period).toBeDefined();
        expect(response.body.data.totalCustomers).toBeGreaterThan(0);
        expect(response.body.data.activeCustomers).toBeDefined();
        expect(response.body.data.topCustomerSegments).toBeDefined();
      });
    });

    describe("GET /api/admin/payments/reports/usage/analytics", () => {
      it("should get usage analytics", async () => {
        const response = await request(app)
          .get("/api/admin/payments/reports/usage/analytics")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.status).toBe("success");
        expect(response.body.data.period).toBeDefined();
        expect(response.body.data.totalBookings).toBeGreaterThan(0);
        expect(response.body.data.completedBookings).toBeDefined();
        expect(response.body.data.peakBookingHours).toBeDefined();
        expect(response.body.data.popularServiceCategories).toBeDefined();
        expect(response.body.data.platformUsage).toBeDefined();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid ObjectId", async () => {
      await request(app)
        .get("/api/admin/payments/withdrawals/invalid-id")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(400);
    });

    it("should handle missing authentication", async () => {
      await request(app).get("/api/admin/payments/withdrawals").expect(401);
    });

    it("should handle non-admin access", async () => {
      // Login as provider
      const providerLoginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: "provider@test.com",
          password: "password123",
        });

      const providerToken = providerLoginResponse.body.data.token;

      await request(app)
        .get("/api/admin/payments/withdrawals")
        .set("Authorization", `Bearer ${providerToken}`)
        .expect(403);
    });
  });
});
