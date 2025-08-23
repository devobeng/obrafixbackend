import request from "supertest";
import { app } from "../index";
import { connectDB, closeDB } from "../config/database";
import { User } from "../models/User";
import { Wallet } from "../models/Wallet";
import { WalletTransaction } from "../models/WalletTransaction";
import { WithdrawalRequest } from "../models/WithdrawalRequest";
import { Booking } from "../models/Booking";
import { ProviderEarningsService } from "../services/ProviderEarningsService";

describe("Provider Earnings API", () => {
  let providerToken: string;
  let adminToken: string;
  let providerId: string;
  let adminId: string;
  let earningsService: ProviderEarningsService;

  beforeAll(async () => {
    await connectDB();
    earningsService = new ProviderEarningsService();
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    // Clean up database
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await WalletTransaction.deleteMany({});
    await WithdrawalRequest.deleteMany({});
    await Booking.deleteMany({});

    // Create test provider
    const provider = new User({
      email: "provider@test.com",
      password: "password123",
      firstName: "John",
      lastName: "Provider",
      role: "provider",
      isVerified: true,
    });
    await provider.save();
    providerId = provider._id.toString();

    // Create test admin
    const admin = new User({
      email: "admin@test.com",
      password: "password123",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      isVerified: true,
    });
    await admin.save();
    adminId = admin._id.toString();

    // Login to get tokens
    const providerLogin = await request(app).post("/api/auth/login").send({
      email: "provider@test.com",
      password: "password123",
    });
    providerToken = providerLogin.body.data.token;

    const adminLogin = await request(app).post("/api/auth/login").send({
      email: "admin@test.com",
      password: "password123",
    });
    adminToken = adminLogin.body.data.token;
  });

  describe("GET /api/provider-earnings/dashboard", () => {
    it("should get earnings dashboard for provider", async () => {
      // Create some test transactions
      const wallet = await earningsService.getOrCreateWallet(providerId);

      await earningsService.processJobPayment(providerId, "booking1", 500, {
        serviceType: "cleaning",
        duration: "2 hours",
      });

      await earningsService.processJobPayment(providerId, "booking2", 1000, {
        serviceType: "plumbing",
        duration: "3 hours",
      });

      const response = await request(app)
        .get("/api/provider-earnings/dashboard")
        .set("Authorization", `Bearer ${providerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("dailyReport");
      expect(response.body.data).toHaveProperty("weeklyReport");
      expect(response.body.data).toHaveProperty("monthlyReport");
      expect(response.body.data).toHaveProperty("walletSummary");
      expect(response.body.data).toHaveProperty("performanceMetrics");
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app).get(
        "/api/provider-earnings/dashboard"
      );

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/provider-earnings/report", () => {
    it("should get earnings report for specific period", async () => {
      // Create test transactions
      await earningsService.processJobPayment(providerId, "booking1", 500);
      await earningsService.processJobPayment(providerId, "booking2", 1000);

      const response = await request(app)
        .get("/api/provider-earnings/report?period=monthly")
        .set("Authorization", `Bearer ${providerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.period).toBe("monthly");
      expect(response.body.data.totalEarnings).toBe(1500);
      expect(response.body.data.totalJobs).toBe(2);
    });

    it("should validate period parameter", async () => {
      const response = await request(app)
        .get("/api/provider-earnings/report?period=invalid")
        .set("Authorization", `Bearer ${providerToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/provider-earnings/wallet-summary", () => {
    it("should get wallet summary", async () => {
      // Create test transactions
      await earningsService.processJobPayment(providerId, "booking1", 500);

      const response = await request(app)
        .get("/api/provider-earnings/wallet-summary")
        .set("Authorization", `Bearer ${providerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("wallet");
      expect(response.body.data).toHaveProperty("stats");
      expect(response.body.data).toHaveProperty("recentTransactions");
    });
  });

  describe("GET /api/provider-earnings/payment-history", () => {
    it("should get payment history with pagination", async () => {
      // Create test transactions
      await earningsService.processJobPayment(providerId, "booking1", 500);
      await earningsService.processJobPayment(providerId, "booking2", 1000);

      const response = await request(app)
        .get("/api/provider-earnings/payment-history?page=1&limit=10")
        .set("Authorization", `Bearer ${providerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("transactions");
      expect(response.body.data).toHaveProperty("total");
      expect(response.body.data.transactions.length).toBeGreaterThan(0);
    });

    it("should filter payment history by type", async () => {
      // Create test transactions
      await earningsService.processJobPayment(providerId, "booking1", 500);

      const response = await request(app)
        .get("/api/provider-earnings/payment-history?type=credit")
        .set("Authorization", `Bearer ${providerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(
        response.body.data.transactions.every((tx: any) => tx.type === "credit")
      ).toBe(true);
    });
  });

  describe("GET /api/provider-earnings/withdrawal-history", () => {
    it("should get withdrawal history", async () => {
      // Create test withdrawal request
      const withdrawal = new WithdrawalRequest({
        userId: providerId,
        walletId: (await earningsService.getOrCreateWallet(providerId))._id,
        amount: 500,
        currency: "GHS",
        withdrawalMethod: "bank_transfer",
        withdrawalDetails: {
          bankDetails: {
            accountNumber: "1234567890",
            accountName: "John Provider",
            bankName: "Test Bank",
          },
        },
        platformFee: 25,
        netAmount: 475,
        reference: "WDR_TEST123",
        status: "completed",
      });
      await withdrawal.save();

      const response = await request(app)
        .get("/api/provider-earnings/withdrawal-history")
        .set("Authorization", `Bearer ${providerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("withdrawals");
      expect(response.body.data).toHaveProperty("total");
      expect(response.body.data.withdrawals.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/provider-earnings/performance-metrics", () => {
    it("should get performance metrics", async () => {
      // Create test bookings
      const booking1 = new Booking({
        userId: "user1",
        providerId,
        serviceId: "service1",
        status: "completed",
        totalAmount: 500,
        rating: 5,
      });
      await booking1.save();

      const booking2 = new Booking({
        userId: "user2",
        providerId,
        serviceId: "service2",
        status: "completed",
        totalAmount: 1000,
        rating: 4,
      });
      await booking2.save();

      const response = await request(app)
        .get("/api/provider-earnings/performance-metrics?period=month")
        .set("Authorization", `Bearer ${providerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("totalJobs");
      expect(response.body.data).toHaveProperty("totalRevenue");
      expect(response.body.data).toHaveProperty("averageJobValue");
      expect(response.body.data).toHaveProperty("averageRating");
    });
  });

  describe("POST /api/provider-earnings/calculate-estimated", () => {
    it("should calculate estimated earnings", async () => {
      const response = await request(app)
        .post("/api/provider-earnings/calculate-estimated")
        .set("Authorization", `Bearer ${providerToken}`)
        .send({ amount: 500 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("grossAmount");
      expect(response.body.data).toHaveProperty("commission");
      expect(response.body.data).toHaveProperty("netAmount");
      expect(response.body.data).toHaveProperty("rate");
      expect(response.body.data.grossAmount).toBe(500);
    });

    it("should validate amount parameter", async () => {
      const response = await request(app)
        .post("/api/provider-earnings/calculate-estimated")
        .set("Authorization", `Bearer ${providerToken}`)
        .send({ amount: -100 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Admin Endpoints", () => {
    describe("GET /api/provider-earnings/commission-config", () => {
      it("should get commission configuration", async () => {
        const response = await request(app)
          .get("/api/provider-earnings/commission-config")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty("rate");
        expect(response.body.data).toHaveProperty("tieredRates");
      });

      it("should return 403 for non-admin user", async () => {
        const response = await request(app)
          .get("/api/provider-earnings/commission-config")
          .set("Authorization", `Bearer ${providerToken}`);

        expect(response.status).toBe(403);
      });
    });

    describe("PUT /api/provider-earnings/commission-config", () => {
      it("should update commission configuration", async () => {
        const newConfig = {
          rate: 0.12,
          tieredRates: [
            { minAmount: 0, maxAmount: 1000, rate: 0.18 },
            { minAmount: 1000, rate: 0.12 },
          ],
        };

        const response = await request(app)
          .put("/api/provider-earnings/commission-config")
          .set("Authorization", `Bearer ${adminToken}`)
          .send(newConfig);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.rate).toBe(0.12);
      });

      it("should validate commission rate", async () => {
        const response = await request(app)
          .put("/api/provider-earnings/commission-config")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ rate: 1.5 });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe("POST /api/provider-earnings/process-job-payment", () => {
      it("should process job payment", async () => {
        const paymentData = {
          providerId,
          bookingId: "booking123",
          amount: 500,
          jobDetails: {
            serviceType: "cleaning",
            duration: "2 hours",
            location: "Accra, Ghana",
          },
        };

        const response = await request(app)
          .post("/api/provider-earnings/process-job-payment")
          .set("Authorization", `Bearer ${adminToken}`)
          .send(paymentData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty("type", "credit");
        expect(response.body.data).toHaveProperty("amount");
        expect(response.body.data.metadata).toHaveProperty("platformFee");
      });

      it("should validate required fields", async () => {
        const response = await request(app)
          .post("/api/provider-earnings/process-job-payment")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ amount: 500 });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe("Commission Calculation", () => {
    it("should calculate tiered commission correctly", () => {
      const config = earningsService.getCommissionConfig();

      // Test tiered rates
      const result1 = earningsService.calculateEstimatedEarnings(500); // Should use 20% rate
      const result2 = earningsService.calculateEstimatedEarnings(2000); // Should use 15% rate
      const result3 = earningsService.calculateEstimatedEarnings(6000); // Should use 10% rate

      expect(result1.rate).toBe(0.2);
      expect(result1.commission).toBe(100);
      expect(result1.netAmount).toBe(400);

      expect(result2.rate).toBe(0.15);
      expect(result2.commission).toBe(300);
      expect(result2.netAmount).toBe(1700);

      expect(result3.rate).toBe(0.1);
      expect(result3.commission).toBe(600);
      expect(result3.netAmount).toBe(5400);
    });
  });

  describe("Earnings Breakdown", () => {
    it("should get earnings breakdown by day", async () => {
      // Create test transactions on different days
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Mock transaction creation with specific dates
      const wallet = await earningsService.getOrCreateWallet(providerId);

      const tx1 = new WalletTransaction({
        walletId: wallet._id,
        userId: providerId,
        type: "credit",
        amount: 425,
        currency: "GHS",
        description: "Payment for completed job",
        reference: "TEST1",
        status: "completed",
        metadata: {
          type: "job_payment",
          grossAmount: 500,
          platformFee: 75,
        },
        balanceBefore: 0,
        balanceAfter: 425,
        createdAt: yesterday,
      });
      await tx1.save();

      const tx2 = new WalletTransaction({
        walletId: wallet._id,
        userId: providerId,
        type: "credit",
        amount: 850,
        currency: "GHS",
        description: "Payment for completed job",
        reference: "TEST2",
        status: "completed",
        metadata: {
          type: "job_payment",
          grossAmount: 1000,
          platformFee: 150,
        },
        balanceBefore: 425,
        balanceAfter: 1275,
        createdAt: today,
      });
      await tx2.save();

      const response = await request(app)
        .get("/api/provider-earnings/breakdown")
        .query({
          startDate: yesterday.toISOString().split("T")[0],
          endDate: today.toISOString().split("T")[0],
          groupBy: "day",
        })
        .set("Authorization", `Bearer ${providerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });
});
