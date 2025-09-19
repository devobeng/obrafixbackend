import mongoose from "mongoose";
import dotenv from "dotenv";
import { Booking } from "../src/models/Booking";
import { Service } from "../src/models/Service";
import { User } from "../src/models/User";

// Load environment variables
dotenv.config();

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env["MONGODB_URI"] || "mongodb://localhost:27017/homeservices"
    );
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Helper function to get random date within range
const getRandomDate = (start: Date, end: Date): Date => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};

// Helper function to get random time
const getRandomTime = (): string => {
  const hours = Math.floor(Math.random() * 12) + 8; // 8 AM to 7 PM
  const minutes = Math.random() < 0.5 ? "00" : "30";
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
};

// Sample booking data
const sampleBookings = [
  {
    status: "completed",
    jobStatus: "completed",
    paymentStatus: "paid",
    requirements:
      "Need deep cleaning for 3-bedroom apartment. Focus on kitchen and bathrooms.",
    specialInstructions:
      "Please use eco-friendly cleaning products. Access key will be left with security.",
    duration: 4,
    additionalFees: 0,
    paymentMethod: "mobile_money",
    userRating: 5,
    userComment:
      "Excellent service! The cleaner was very thorough and professional.",
    providerRating: 5,
    providerComment:
      "Great customer, clear instructions and easy to work with.",
  },
  {
    status: "completed",
    jobStatus: "completed",
    paymentStatus: "paid",
    requirements: "Emergency plumbing repair for burst pipe in kitchen.",
    specialInstructions:
      "Urgent repair needed. Water is leaking and needs immediate attention.",
    duration: 2,
    additionalFees: 50,
    paymentMethod: "cash",
    userRating: 4,
    userComment:
      "Good service, fixed the issue quickly. Slightly higher than expected cost.",
    providerRating: 4,
    providerComment: "Emergency call handled well. Customer was cooperative.",
  },
  {
    status: "in_progress",
    jobStatus: "in_progress",
    paymentStatus: "authorized",
    requirements: "Electrical wiring installation for new office space.",
    specialInstructions:
      "Need to complete installation before end of week. All materials provided.",
    duration: 6,
    additionalFees: 0,
    paymentMethod: "bank_transfer",
    userRating: null,
    userComment: null,
    providerRating: null,
    providerComment: null,
  },
  {
    status: "confirmed",
    jobStatus: "accepted",
    paymentStatus: "pending",
    requirements: "Custom furniture making - dining table and 4 chairs.",
    specialInstructions:
      "Mahogany wood preferred. Need delivery to home address.",
    duration: 8,
    additionalFees: 200,
    paymentMethod: "mobile_money",
    userRating: null,
    userComment: null,
    providerRating: null,
    providerComment: null,
  },
  {
    status: "pending",
    jobStatus: "pending",
    paymentStatus: "pending",
    requirements: "CCTV installation for home security system.",
    specialInstructions:
      "Need 4 cameras covering front, back, and sides of house.",
    duration: 4,
    additionalFees: 0,
    paymentMethod: "bank_transfer",
    userRating: null,
    userComment: null,
    providerRating: null,
    providerComment: null,
  },
  {
    status: "cancelled",
    jobStatus: "pending",
    paymentStatus: "refunded",
    requirements: "Office cleaning service for weekly maintenance.",
    specialInstructions: "Regular weekly cleaning, every Monday morning.",
    duration: 3,
    additionalFees: 0,
    paymentMethod: "mobile_money",
    cancellationReason: "Customer changed schedule",
    cancelledBy: "user",
    userRating: null,
    userComment: null,
    providerRating: null,
    providerComment: null,
  },
  {
    status: "completed",
    jobStatus: "completed",
    paymentStatus: "paid",
    requirements: "Security guard services for weekend event.",
    specialInstructions:
      "Need 2 guards for 12-hour shifts during weekend event.",
    duration: 12,
    additionalFees: 100,
    paymentMethod: "cash",
    userRating: 5,
    userComment:
      "Professional security service. Guards were punctual and reliable.",
    providerRating: 5,
    providerComment: "Well-organized event. Clear communication throughout.",
  },
  {
    status: "confirmed",
    jobStatus: "accepted",
    paymentStatus: "authorized",
    requirements: "Generator installation and maintenance setup.",
    specialInstructions:
      "Install 5KVA generator with automatic transfer switch.",
    duration: 5,
    additionalFees: 150,
    paymentMethod: "bank_transfer",
    userRating: null,
    userComment: null,
    providerRating: null,
    providerComment: null,
  },
  {
    status: "completed",
    jobStatus: "completed",
    paymentStatus: "paid",
    requirements:
      "Door and window repairs - 3 doors and 2 windows need fixing.",
    specialInstructions: "Replace broken locks and fix window hinges.",
    duration: 3,
    additionalFees: 75,
    paymentMethod: "mobile_money",
    userRating: 4,
    userComment:
      "Good work on the repairs. Some minor issues but overall satisfied.",
    providerRating: 4,
    providerComment:
      "Customer was understanding about the additional work needed.",
  },
  {
    status: "pending",
    jobStatus: "pending",
    paymentStatus: "pending",
    requirements: "Water heater installation in master bathroom.",
    specialInstructions:
      "Install 50-liter electric water heater. Need proper electrical connection.",
    duration: 3,
    additionalFees: 0,
    paymentMethod: "mobile_money",
    userRating: null,
    userComment: null,
    providerRating: null,
    providerComment: null,
  },
];

// Main seeding function
const seedBookings = async () => {
  try {
    console.log("🌱 Starting bookings seeding...");

    // Get services, users, and providers
    const services = await Service.find({ status: "active" });
    const users = await User.find({ role: "user" });
    const providers = await User.find({ role: "provider" });

    console.log(`🔧 Found ${services.length} active services`);
    console.log(`👥 Found ${users.length} regular users`);
    console.log(`👷 Found ${providers.length} providers`);

    if (services.length === 0 || users.length === 0 || providers.length === 0) {
      console.log(
        "❌ No services, users, or providers found. Please seed them first."
      );
      return;
    }

    // Clear existing bookings
    await Booking.deleteMany({});
    console.log("🗑️ Cleared existing bookings");

    let totalBookingsCreated = 0;

    // Create bookings
    for (let i = 0; i < sampleBookings.length; i++) {
      const bookingData = sampleBookings[i];
      if (!bookingData) continue;

      try {
        // Get random service, user, and provider
        const randomService =
          services[Math.floor(Math.random() * services.length)];
        const randomUser = users[Math.floor(Math.random() * users.length)];

        if (!randomService || !randomUser) continue;

        // Find provider for this service or use any provider
        let randomProvider = providers.find(
          (p: any) =>
            p.providerProfile?.serviceCategory === randomService.category
        );
        if (!randomProvider) {
          randomProvider =
            providers[Math.floor(Math.random() * providers.length)];
        }

        if (!randomProvider) continue;

        // Generate random dates
        const now = new Date();
        const pastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

        let scheduledDate: Date;
        if (bookingData.status === "completed") {
          scheduledDate = getRandomDate(pastDate, now);
        } else if (bookingData.status === "pending") {
          scheduledDate = getRandomDate(now, futureDate);
        } else {
          scheduledDate = getRandomDate(pastDate, futureDate);
        }

        const scheduledTime = getRandomTime();

        // Calculate pricing
        const basePrice = randomService.pricing.amount * bookingData.duration;
        const totalAmount = basePrice + bookingData.additionalFees;

        // Create status history
        const statusHistory = [
          {
            status: "pending",
            timestamp: new Date(
              scheduledDate.getTime() - 7 * 24 * 60 * 60 * 1000
            ), // 7 days before
            note: "Booking created",
            updatedBy: "user",
          },
        ];

        if (bookingData.jobStatus !== "pending") {
          statusHistory.push({
            status: "accepted",
            timestamp: new Date(
              scheduledDate.getTime() - 3 * 24 * 60 * 60 * 1000
            ), // 3 days before
            note: "Provider accepted booking",
            updatedBy: "provider",
          });
        }

        if (
          bookingData.jobStatus === "in_progress" ||
          bookingData.jobStatus === "completed"
        ) {
          statusHistory.push({
            status: "in_progress",
            timestamp: new Date(scheduledDate.getTime() + 60 * 60 * 1000), // 1 hour after scheduled time
            note: "Work started",
            updatedBy: "provider",
          });
        }

        if (bookingData.jobStatus === "completed") {
          statusHistory.push({
            status: "completed",
            timestamp: new Date(
              scheduledDate.getTime() + bookingData.duration * 60 * 60 * 1000
            ),
            note: "Work completed",
            updatedBy: "provider",
          });
        }

        // Create sample messages
        const messages = [
          {
            senderId: randomUser._id,
            senderType: "user",
            message: `Hi, I need ${randomService.title.toLowerCase()}. ${
              bookingData.requirements
            }`,
            timestamp: new Date(
              scheduledDate.getTime() - 7 * 24 * 60 * 60 * 1000
            ),
            isRead: true,
          },
          {
            senderId: randomProvider._id,
            senderType: "provider",
            message:
              "Hello! I can help you with that. When would you like to schedule the service?",
            timestamp: new Date(
              scheduledDate.getTime() - 6 * 24 * 60 * 60 * 1000
            ),
            isRead: true,
          },
          {
            senderId: randomUser._id,
            senderType: "user",
            message: `Great! How about ${scheduledDate.toDateString()} at ${scheduledTime}?`,
            timestamp: new Date(
              scheduledDate.getTime() - 5 * 24 * 60 * 60 * 1000
            ),
            isRead: true,
          },
        ];

        if (bookingData.jobStatus !== "pending") {
          messages.push({
            senderId: randomProvider._id,
            senderType: "provider",
            message:
              "Perfect! I'll be there at the scheduled time. See you then!",
            timestamp: new Date(
              scheduledDate.getTime() - 3 * 24 * 60 * 60 * 1000
            ),
            isRead: true,
          });
        }

        // Create booking
        const newBooking = new Booking({
          serviceId: randomService._id,
          userId: randomUser._id,
          providerId: randomProvider._id,
          status: bookingData.status,
          bookingDetails: {
            scheduledDate: scheduledDate,
            scheduledTime: scheduledTime,
            duration: bookingData.duration,
            location: {
              address: `${Math.floor(Math.random() * 999) + 1} Main Street`,
              city: randomUser.address?.city || "Accra",
              state: randomUser.address?.state || "Greater Accra",
              coordinates: {
                latitude: 5.6037 + (Math.random() - 0.5) * 0.1,
                longitude: -0.187 + (Math.random() - 0.5) * 0.1,
              },
            },
            requirements: bookingData.requirements,
            photos: [],
            specialInstructions: bookingData.specialInstructions,
          },
          pricing: {
            basePrice: basePrice,
            additionalFees: bookingData.additionalFees,
            totalAmount: totalAmount,
            currency: "GHS",
            paymentMethod: bookingData.paymentMethod,
          },
          jobStatus: {
            currentStatus: bookingData.jobStatus,
            statusHistory: statusHistory,
            estimatedStartTime:
              bookingData.jobStatus !== "pending"
                ? new Date(scheduledDate.getTime() + 30 * 60 * 1000)
                : undefined,
            actualStartTime:
              bookingData.jobStatus === "in_progress" ||
              bookingData.jobStatus === "completed"
                ? new Date(scheduledDate.getTime() + 60 * 60 * 1000)
                : undefined,
            actualEndTime:
              bookingData.jobStatus === "completed"
                ? new Date(
                    scheduledDate.getTime() +
                      bookingData.duration * 60 * 60 * 1000
                  )
                : undefined,
          },
          communication: {
            messages: messages,
            lastMessageAt:
              messages[messages.length - 1]?.timestamp || new Date(),
          },
          payment: {
            status: bookingData.paymentStatus,
            transactionId:
              bookingData.paymentStatus === "paid" ||
              bookingData.paymentStatus === "authorized"
                ? `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`
                : undefined,
            paidAt:
              bookingData.paymentStatus === "paid"
                ? new Date(scheduledDate.getTime() - 24 * 60 * 60 * 1000)
                : undefined,
            refundedAt:
              bookingData.paymentStatus === "refunded"
                ? new Date(scheduledDate.getTime() + 2 * 24 * 60 * 60 * 1000)
                : undefined,
            refundReason:
              bookingData.paymentStatus === "refunded"
                ? "Booking cancelled"
                : undefined,
          },
          cancellation:
            bookingData.status === "cancelled"
              ? {
                  cancelledBy: bookingData.cancelledBy,
                  reason: bookingData.cancellationReason,
                  cancelledAt: new Date(
                    scheduledDate.getTime() - 2 * 24 * 60 * 60 * 1000
                  ),
                  refundAmount: totalAmount,
                }
              : undefined,
          rating: bookingData.userRating
            ? {
                userRating: bookingData.userRating,
                userComment: bookingData.userComment,
                providerRating: bookingData.providerRating,
                providerComment: bookingData.providerComment,
                ratedAt: new Date(
                  scheduledDate.getTime() +
                    (bookingData.duration + 1) * 60 * 60 * 1000
                ),
              }
            : undefined,
        });

        await newBooking.save();
        totalBookingsCreated++;

        console.log(
          `✅ Created booking: ${randomService.title} - ${randomUser.firstName} ${randomUser.lastName} to ${randomProvider.firstName} ${randomProvider.lastName} (${bookingData.status})`
        );
      } catch (error) {
        console.error(`❌ Error creating booking:`, error);
        continue;
      }
    }

    console.log("🎉 Bookings seeding completed!");

    // Display summary
    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({
      status: "completed",
    });
    const pendingBookings = await Booking.countDocuments({ status: "pending" });
    const confirmedBookings = await Booking.countDocuments({
      status: "confirmed",
    });
    const inProgressBookings = await Booking.countDocuments({
      status: "in_progress",
    });
    const cancelledBookings = await Booking.countDocuments({
      status: "cancelled",
    });

    console.log(`📊 Total bookings: ${totalBookings}`);
    console.log(`✅ Completed: ${completedBookings}`);
    console.log(`⏳ Pending: ${pendingBookings}`);
    console.log(`📋 Confirmed: ${confirmedBookings}`);
    console.log(`🔄 In Progress: ${inProgressBookings}`);
    console.log(`❌ Cancelled: ${cancelledBookings}`);

    // Display bookings by payment status
    const bookingsByPayment = await Booking.aggregate([
      { $group: { _id: "$payment.status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log("\n💰 Bookings by payment status:");
    bookingsByPayment.forEach((item: any) => {
      console.log(`  ${item._id}: ${item.count} bookings`);
    });

    // Display recent bookings
    const recentBookings = await Booking.find({})
      .populate("serviceId", "title")
      .populate("userId", "firstName lastName")
      .populate("providerId", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(5);

    console.log("\n📅 Recent bookings:");
    recentBookings.forEach((booking: any, index: number) => {
      console.log(
        `  ${index + 1}. ${booking.serviceId.title} - ${
          booking.userId.firstName
        } ${booking.userId.lastName} to ${booking.providerId.firstName} ${
          booking.providerId.lastName
        } (${booking.status})`
      );
    });
  } catch (error) {
    console.error("❌ Seeding error:", error);
  }
};

// Run the seeding
const runSeed = async () => {
  await connectDB();
  await seedBookings();
  await mongoose.connection.close();
  console.log("🔌 Database connection closed");
  process.exit(0);
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  runSeed();
}

export { seedBookings };
