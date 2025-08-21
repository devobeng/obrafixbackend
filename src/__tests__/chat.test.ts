import request from "supertest";
import { app } from "../index";
import { connectDB, closeDB } from "../config/database";
import { User } from "../models/User";
import { Service } from "../models/Service";
import { Booking } from "../models/Booking";
import { ChatMessage } from "../models/ChatMessage";

describe("Chat API", () => {
  let userToken: string;
  let providerToken: string;
  let testBooking: any;
  let testUser: any;
  let testProvider: any;

  beforeAll(async () => {
    await connectDB();

    // Create test user
    testUser = await User.create({
      email: "testuser@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      role: "user",
      isVerified: true,
    });

    // Create test provider
    testProvider = await User.create({
      email: "testprovider@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "Provider",
      role: "provider",
      isVerified: true,
    });

    // Create test service
    const testService = await Service.create({
      title: "Test Service",
      description: "Test service description",
      category: "cleaning",
      pricing: {
        type: "fixed",
        amount: 100,
        currency: "GHS",
      },
      provider: testProvider._id,
      location: {
        city: "Accra",
        state: "Greater Accra",
        country: "Ghana",
        serviceRadius: 10,
      },
      images: [],
      availability: {
        isAvailable: true,
        workingDays: [],
        emergencyService: false,
        noticeRequired: 24,
      },
      rating: {
        average: 0,
        count: 0,
        reviews: [],
      },
      status: "active",
      tags: [],
      requirements: [],
    });

    // Create test booking
    testBooking = await Booking.create({
      serviceId: testService._id,
      userId: testUser._id,
      providerId: testProvider._id,
      status: "confirmed",
      bookingDetails: {
        scheduledDate: new Date(),
        scheduledTime: "10:00",
        duration: 2,
        location: {
          address: "Test Address",
          city: "Accra",
          state: "Greater Accra",
        },
        requirements: "Test requirements",
        photos: [],
      },
      pricing: {
        basePrice: 100,
        totalAmount: 100,
        currency: "GHS",
        paymentMethod: "mobile_money",
      },
      jobStatus: {
        currentStatus: "accepted",
        statusHistory: [],
      },
      payment: {
        status: "pending",
      },
    });

    // Login to get tokens
    const userLoginResponse = await request(app).post("/api/auth/login").send({
      email: "testuser@example.com",
      password: "password123",
    });
    userToken = userLoginResponse.body.token;

    const providerLoginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "testprovider@example.com",
        password: "password123",
      });
    providerToken = providerLoginResponse.body.token;
  });

  afterAll(async () => {
    await ChatMessage.deleteMany({});
    await Booking.deleteMany({});
    await Service.deleteMany({});
    await User.deleteMany({});
    await closeDB();
  });

  describe("POST /api/chat/messages", () => {
    it("should send a message successfully", async () => {
      const response = await request(app)
        .post("/api/chat/messages")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          bookingId: testBooking._id.toString(),
          message: "Hello, when will you arrive?",
          messageType: "text",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe("Hello, when will you arrive?");
      expect(response.body.data.senderId).toBe(testUser._id.toString());
    });

    it("should reject message without booking ID", async () => {
      const response = await request(app)
        .post("/api/chat/messages")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          message: "Test message",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/chat/messages/:bookingId", () => {
    it("should get chat history successfully", async () => {
      const response = await request(app)
        .get(`/api/chat/messages/${testBooking._id}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should reject access to unauthorized booking", async () => {
      const response = await request(app)
        .get("/api/chat/messages/507f1f77bcf86cd799439011")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/chat/conversations", () => {
    it("should get recent conversations successfully", async () => {
      const response = await request(app)
        .get("/api/chat/conversations")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /api/chat/unread-count", () => {
    it("should get unread count successfully", async () => {
      const response = await request(app)
        .get("/api/chat/unread-count")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("unreadCount");
    });
  });
});
