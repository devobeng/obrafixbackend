import request from "supertest";
import { app } from "../index";
import mongoose from "mongoose";
import { User } from "../models/User";
import { ServiceCategory } from "../models/ServiceCategory";
import { Booking } from "../models/Booking";
import { Service } from "../models/Service";

describe("Admin API Tests", () => {
  let adminToken: string;
  let adminUser: any;
  let testCategory: any;
  let testBooking: any;
  let testService: any;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(
      process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/test"
    );

    // Create admin user
    adminUser = await User.create({
      firstName: "Admin",
      lastName: "User",
      email: "admin@test.com",
      password: "password123",
      role: "admin",
      accountStatus: "active",
    });

    // Login as admin
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "admin@test.com",
      password: "password123",
    });

    adminToken = loginResponse.body.data.token;

    // Create test service category
    testCategory = await ServiceCategory.create({
      name: "Test Category",
      description: "Test category description",
      commissionRate: 10,
      isActive: true,
    });

    // Create test service
    testService = await Service.create({
      title: "Test Service",
      description: "Test service description",
      category: testCategory._id,
      provider: adminUser._id,
      basePrice: 100,
      status: "active",
    });

    // Create test booking
    testBooking = await Booking.create({
      serviceId: testService._id,
      userId: adminUser._id,
      providerId: adminUser._id,
      status: "confirmed",
      bookingDetails: {
        scheduledDate: new Date(),
        scheduledTime: "14:00",
        duration: 2,
        location: {
          address: "123 Test St",
          city: "Test City",
          state: "Test State",
        },
        requirements: "Test requirements",
      },
      pricing: {
        basePrice: 100,
        totalAmount: 120,
        currency: "GHS",
        paymentMethod: "mobile_money",
      },
      payment: {
        status: "paid",
        paidAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await ServiceCategory.deleteMany({});
    await Service.deleteMany({});
    await Booking.deleteMany({});
    await mongoose.connection.close();
  });

  describe("Service & Category Management", () => {
    describe("POST /api/admin/categories", () => {
      it("should create a new service category", async () => {
        const categoryData = {
          name: "Plumbing Services",
          description: "Professional plumbing and pipe repair services",
          icon: "faucet",
          commissionRate: 15.5,
          isActive: true,
          sortOrder: 1,
        };

        const response = await request(app)
          .post("/api/admin/categories")
          .set("Authorization", `Bearer ${adminToken}`)
          .send(categoryData);

        expect(response.status).toBe(201);
        expect(response.body.status).toBe("success");
        expect(response.body.data.name).toBe(categoryData.name);
        expect(response.body.data.commissionRate).toBe(
          categoryData.commissionRate
        );
      });

      it("should return 400 for invalid category data", async () => {
        const invalidData = {
          name: "", // Invalid: empty name
          description: "Short", // Invalid: too short
          commissionRate: 150, // Invalid: > 100
        };

        const response = await request(app)
          .post("/api/admin/categories")
          .set("Authorization", `Bearer ${adminToken}`)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.status).toBe("error");
      });
    });

    describe("PUT /api/admin/categories/:id", () => {
      it("should update an existing service category", async () => {
        const updateData = {
          name: "Updated Plumbing Services",
          description: "Updated description",
          commissionRate: 18.0,
        };

        const response = await request(app)
          .put(`/api/admin/categories/${testCategory._id}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data.name).toBe(updateData.name);
        expect(response.body.data.commissionRate).toBe(
          updateData.commissionRate
        );
      });

      it("should return 404 for non-existent category", async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .put(`/api/admin/categories/${fakeId}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ name: "Test" });

        expect(response.status).toBe(404);
      });
    });

    describe("PATCH /api/admin/categories/:id/commission-rate", () => {
      it("should update commission rate for a category", async () => {
        const newRate = 20.0;

        const response = await request(app)
          .patch(`/api/admin/categories/${testCategory._id}/commission-rate`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ commissionRate: newRate });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data.commissionRate).toBe(newRate);
      });

      it("should return 400 for invalid commission rate", async () => {
        const invalidRate = 150; // > 100%

        const response = await request(app)
          .patch(`/api/admin/categories/${testCategory._id}/commission-rate`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ commissionRate: invalidRate });

        expect(response.status).toBe(400);
      });
    });

    describe("GET /api/admin/categories/stats", () => {
      it("should return category statistics", async () => {
        const response = await request(app)
          .get("/api/admin/categories/stats")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data).toHaveProperty("totalCategories");
        expect(response.body.data).toHaveProperty("activeCategories");
        expect(response.body.data).toHaveProperty("averageCommissionRate");
        expect(response.body.data).toHaveProperty("topCategories");
      });
    });

    describe("DELETE /api/admin/categories/:id", () => {
      it("should delete a service category", async () => {
        // Create a category to delete
        const categoryToDelete = await ServiceCategory.create({
          name: "Category to Delete",
          description: "This category will be deleted",
          commissionRate: 5,
          isActive: true,
        });

        const response = await request(app)
          .delete(`/api/admin/categories/${categoryToDelete._id}`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
      });

      it("should return 400 when trying to delete category with services", async () => {
        const response = await request(app)
          .delete(`/api/admin/categories/${testCategory._id}`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
        expect(response.body.status).toBe("error");
      });
    });
  });

  describe("Booking Management", () => {
    describe("GET /api/admin/bookings/live-stats", () => {
      it("should return live booking statistics", async () => {
        const response = await request(app)
          .get("/api/admin/bookings/live-stats")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data).toHaveProperty("totalBookings");
        expect(response.body.data).toHaveProperty("activeBookings");
        expect(response.body.data).toHaveProperty("totalRevenue");
        expect(response.body.data).toHaveProperty("recentDisputes");
      });
    });

    describe("GET /api/admin/bookings/live", () => {
      it("should return live bookings with pagination", async () => {
        const response = await request(app)
          .get("/api/admin/bookings/live")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data).toHaveProperty("bookings");
        expect(response.body.data).toHaveProperty("total");
        expect(response.body.data).toHaveProperty("page");
        expect(response.body.data).toHaveProperty("totalPages");
      });

      it("should filter bookings by status", async () => {
        const response = await request(app)
          .get("/api/admin/bookings/live?status=confirmed")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.bookings).toBeInstanceOf(Array);
      });
    });

    describe("POST /api/admin/bookings/:id/cancel", () => {
      it("should cancel a booking and process refund", async () => {
        const cancellationData = {
          reason: "Provider unavailable",
          refundAmount: 120,
          adminNotes: "Provider called in sick",
          notifyParties: true,
        };

        const response = await request(app)
          .post(`/api/admin/bookings/${testBooking._id}/cancel`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(cancellationData);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data.status).toBe("cancelled");
        expect(response.body.data.cancellation).toBeDefined();
      });

      it("should return 400 for already cancelled booking", async () => {
        const cancellationData = {
          reason: "Test cancellation",
        };

        const response = await request(app)
          .post(`/api/admin/bookings/${testBooking._id}/cancel`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(cancellationData);

        expect(response.status).toBe(400);
      });
    });

    describe("POST /api/admin/bookings/:id/refund", () => {
      it("should process a refund for a booking", async () => {
        // Create a paid booking for refund test
        const paidBooking = await Booking.create({
          serviceId: testService._id,
          userId: adminUser._id,
          providerId: adminUser._id,
          status: "completed",
          bookingDetails: {
            scheduledDate: new Date(),
            scheduledTime: "15:00",
            duration: 1,
            location: {
              address: "456 Test St",
              city: "Test City",
              state: "Test State",
            },
            requirements: "Test requirements",
          },
          pricing: {
            basePrice: 50,
            totalAmount: 60,
            currency: "GHS",
            paymentMethod: "mobile_money",
          },
          payment: {
            status: "paid",
            paidAt: new Date(),
          },
        });

        const refundData = {
          amount: 30,
          reason: "Partial refund due to incomplete service",
          adminNotes: "Service was only 50% completed",
          notifyParties: true,
        };

        const response = await request(app)
          .post(`/api/admin/bookings/${paidBooking._id}/refund`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(refundData);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data.payment.status).toBe("refunded");
      });
    });

    describe("GET /api/admin/disputes/stats", () => {
      it("should return dispute statistics", async () => {
        const response = await request(app)
          .get("/api/admin/disputes/stats")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data).toHaveProperty("totalDisputes");
        expect(response.body.data).toHaveProperty("resolvedDisputes");
        expect(response.body.data).toHaveProperty("pendingDisputes");
        expect(response.body.data).toHaveProperty("averageResolutionTime");
      });
    });
  });

  describe("User Management", () => {
    describe("GET /api/admin/users", () => {
      it("should return all users with pagination", async () => {
        const response = await request(app)
          .get("/api/admin/users")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data).toHaveProperty("users");
        expect(response.body.data).toHaveProperty("pagination");
      });

      it("should filter users by role", async () => {
        const response = await request(app)
          .get("/api/admin/users?role=admin")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.users).toBeInstanceOf(Array);
      });
    });

    describe("PATCH /api/admin/users/:id/status", () => {
      it("should update user status", async () => {
        const statusData = {
          status: "suspended",
          reason: "Test suspension",
        };

        const response = await request(app)
          .patch(`/api/admin/users/${adminUser._id}/status`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(statusData);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data.accountStatus).toBe("suspended");
      });
    });
  });

  describe("Service Management", () => {
    describe("GET /api/admin/services", () => {
      it("should return all services with pagination", async () => {
        const response = await request(app)
          .get("/api/admin/services")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data).toHaveProperty("services");
        expect(response.body.data).toHaveProperty("pagination");
      });
    });

    describe("PATCH /api/admin/services/:id/status", () => {
      it("should update service status", async () => {
        const statusData = {
          status: "suspended",
          reason: "Service under review",
        };

        const response = await request(app)
          .patch(`/api/admin/services/${testService._id}/status`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(statusData);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data.status).toBe("suspended");
      });
    });
  });

  describe("Authentication & Authorization", () => {
    it("should require authentication for admin endpoints", async () => {
      const response = await request(app).get("/api/admin/users");

      expect(response.status).toBe(401);
    });

    it("should require admin role for admin endpoints", async () => {
      // Create a regular user
      const regularUser = await User.create({
        firstName: "Regular",
        lastName: "User",
        email: "regular@test.com",
        password: "password123",
        role: "user",
        accountStatus: "active",
      });

      // Login as regular user
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: "regular@test.com",
        password: "password123",
      });

      const userToken = loginResponse.body.data.token;

      // Try to access admin endpoint
      const response = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid ObjectId", async () => {
      const response = await request(app)
        .get("/api/admin/users/invalid-id")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it("should handle non-existent resources", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/admin/users/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});
