import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/database";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { createServer } from "http";
import { SocketServer } from "./socket/socketServer";

// Import routes
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import serviceRoutes from "./routes/service";
import categoryRoutes from "./routes/category";
import reviewRoutes from "./routes/review";
import providerRoutes from "./routes/provider";
import adminRoutes from "./routes/adminRoutes";
import adminPaymentRoutes from "./routes/adminPayment";
import adminContentRoutes from "./routes/adminContent";
import bookingRoutes from "./routes/booking";
import paymentRoutes from "./routes/payment";
import walletRoutes from "./routes/wallet";
import withdrawalRoutes from "./routes/withdrawal";
import { createChatRoutes } from "./routes/chat";
import notificationRoutes from "./routes/notification";
import searchRoutes from "./routes/search";
import uploadRoutes from "./routes/upload";
import supportRoutes from "./routes/support";
import locationRoutes from "./routes/location";
import vendorReviewRoutes from "./routes/vendorReview";
import enhancedBookingRoutes from "./routes/enhancedBooking";
import faqRoutes from "./routes/faq";
import supportTicketRoutes from "./routes/supportTicket";
import emergencyAlertRoutes from "./routes/emergencyAlert";
import refundRequestRoutes from "./routes/refundRequest";
import providerDashboardRoutes from "./routes/providerDashboard";
import providerEarningsRoutes from "./routes/providerEarnings";
import providerRatingsRoutes from "./routes/providerRatings";
import providerCommunicationRoutes from "./routes/providerCommunication";

// Load environment variables
require("dotenv").config();

const app = express();
const server = createServer(app);

// Export app for testing purposes
export { app };

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env["CORS_ORIGIN"] || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env["RATE_LIMIT_WINDOW_MS"] || "900000"), // 15 minutes
  max: parseInt(process.env["RATE_LIMIT_MAX_REQUESTS"] || "100"), // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Home Services API is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/provider", providerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/payments", adminPaymentRoutes);
app.use("/api/admin/content", adminContentRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/vendor-reviews", vendorReviewRoutes);
app.use("/api/enhanced-bookings", enhancedBookingRoutes);
app.use("/api/faq", faqRoutes);
app.use("/api/support-tickets", supportTicketRoutes);
app.use("/api/emergency-alerts", emergencyAlertRoutes);
app.use("/api/refund-requests", refundRequestRoutes);
app.use("/api/provider-dashboard", providerDashboardRoutes);
app.use("/api/provider-earnings", providerEarningsRoutes);
app.use("/api/provider-ratings", providerRatingsRoutes);
app.use("/api/provider-communication", providerCommunicationRoutes);

// 404 handler for undefined routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env["PORT"] || 3001;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Initialize socket server
    const socketServer = new SocketServer(server);

    // Create chat routes with socket server
    const chatRoutes = createChatRoutes(socketServer);

    // Register chat routes
    app.use("/api/chat", chatRoutes);

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env["NODE_ENV"]}`);
      console.log(`📚 API docs: http://localhost:${PORT}/api`);
      console.log(`🔌 WebSocket server initialized`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

startServer();
