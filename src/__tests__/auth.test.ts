import request from "supertest";
import app from "../index";
import { User } from "../schemas/userSchema";

describe("Authentication Endpoints", () => {
  beforeEach(async () => {
    // Clear users before each test
    await User.deleteMany({});
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        role: "user",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User registered successfully");
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.firstName).toBe(userData.firstName);
      expect(response.body.user.lastName).toBe(userData.lastName);
      expect(response.body.user.role).toBe(userData.role);
    });

    it("should not register user with existing email", async () => {
      // First user
      const userData = {
        email: "test@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        role: "user",
      };

      await request(app).post("/api/auth/register").send(userData).expect(201);

      // Second user with same email
      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("User with this email already exists");
      expect(response.body.error).toBe("USER_ALREADY_EXISTS");
    });

    it("should validate required fields", async () => {
      const invalidData = {
        email: "invalid-email",
        password: "123", // too short
        firstName: "J", // too short
        lastName: "D", // too short
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Create a test user
      const userData = {
        email: "test@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        role: "user",
      };

      await request(app).post("/api/auth/register").send(userData);
    });

    it("should login user with valid credentials", async () => {
      const loginData = {
        email: "test@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Login successful");
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user.email).toBe(loginData.email);
    });

    it("should not login with invalid email", async () => {
      const loginData = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid credentials");
      expect(response.body.error).toBe("INVALID_CREDENTIALS");
    });

    it("should not login with invalid password", async () => {
      const loginData = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid credentials");
      expect(response.body.error).toBe("INVALID_CREDENTIALS");
    });
  });

  describe("GET /api/auth/me", () => {
    let token: string;

    beforeEach(async () => {
      // Create and login a test user
      const userData = {
        email: "test@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        role: "user",
      };

      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send(userData);

      token = registerResponse.body.token;
    });

    it("should get current user profile with valid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User profile retrieved successfully");
      expect(response.body.data.email).toBe("test@example.com");
      expect(response.body.data.firstName).toBe("John");
      expect(response.body.data.lastName).toBe("Doe");
    });

    it("should not get profile without token", async () => {
      const response = await request(app).get("/api/auth/me").expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Access token required");
      expect(response.body.error).toBe("MISSING_TOKEN");
    });

    it("should not get profile with invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
