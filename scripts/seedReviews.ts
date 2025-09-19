import mongoose from "mongoose";
import dotenv from "dotenv";
import { ServiceReview } from "../src/models/ServiceReview";
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

// Sample review data
const sampleReviews = [
  // Plumbing Services Reviews
  {
    rating: 5,
    comment:
      "Excellent service! Mike arrived on time and fixed our burst pipe quickly. Very professional and clean work. Highly recommended!",
  },
  {
    rating: 4,
    comment:
      "Good service overall. The plumber was knowledgeable and fixed the issue. Took a bit longer than expected but quality work.",
  },
  {
    rating: 5,
    comment:
      "Outstanding emergency plumbing service! Called at 2 AM and they arrived within 30 minutes. Fixed the problem efficiently.",
  },
  {
    rating: 4,
    comment:
      "Professional installation of our new water heater. Clean work and explained everything clearly. Would use again.",
  },
  {
    rating: 5,
    comment:
      "Fantastic service! The water heater installation was done perfectly. Great communication throughout the process.",
  },

  // Electrical Services Reviews
  {
    rating: 5,
    comment:
      "Sarah is an excellent electrician! She rewired our entire house safely and efficiently. Very professional and knowledgeable.",
  },
  {
    rating: 4,
    comment:
      "Good electrical work. The installation was done properly and everything is working well. Would recommend.",
  },
  {
    rating: 5,
    comment:
      "Amazing service! Sarah installed our generator and it's working perfectly. Very clean installation and great communication.",
  },
  {
    rating: 4,
    comment:
      "Professional electrical work. The generator installation was completed on time and within budget. Good service.",
  },
  {
    rating: 5,
    comment:
      "Excellent electrical services! Sarah is very skilled and professional. The wiring work was done to high standards.",
  },

  // Cleaning Services Reviews
  {
    rating: 5,
    comment:
      "Akua did an amazing job cleaning our house! Everything was spotless and she was very thorough. Highly recommended!",
  },
  {
    rating: 4,
    comment:
      "Good cleaning service. The house was cleaned well and Akua was professional. Would use again for regular cleaning.",
  },
  {
    rating: 5,
    comment:
      "Outstanding office cleaning service! Our office has never been cleaner. Akua is very professional and reliable.",
  },
  {
    rating: 4,
    comment:
      "Professional cleaning service. The office was cleaned thoroughly and on time. Good value for money.",
  },
  {
    rating: 5,
    comment:
      "Excellent cleaning services! Akua is very detail-oriented and does a fantastic job. Highly satisfied with the service.",
  },

  // Carpentry Services Reviews
  {
    rating: 5,
    comment:
      "Kwame is a master craftsman! The custom furniture he made for us is absolutely beautiful and high quality.",
  },
  {
    rating: 4,
    comment:
      "Good carpentry work. The furniture was made well and delivered on time. Would recommend for custom work.",
  },
  {
    rating: 5,
    comment:
      "Excellent door and window repairs! Kwame fixed everything perfectly and the work was done quickly.",
  },
  {
    rating: 4,
    comment:
      "Professional carpentry service. The repairs were done well and the carpenter was knowledgeable and friendly.",
  },
  {
    rating: 5,
    comment:
      "Outstanding carpentry work! Kwame is very skilled and the quality of work is exceptional. Highly recommended!",
  },

  // Security Services Reviews
  {
    rating: 5,
    comment:
      "Amos installed our CCTV system perfectly! The cameras are working great and the mobile app is very user-friendly.",
  },
  {
    rating: 4,
    comment:
      "Good CCTV installation service. The system is working well and the installation was done professionally.",
  },
  {
    rating: 5,
    comment:
      "Excellent security guard service! The guards are professional and reliable. Our property feels much safer now.",
  },
  {
    rating: 4,
    comment:
      "Professional security services. The guards are well-trained and provide good coverage. Would recommend.",
  },
  {
    rating: 5,
    comment:
      "Outstanding security services! Amos and his team are very professional and provide excellent protection.",
  },

  // Mixed Reviews (some lower ratings for realism)
  {
    rating: 3,
    comment:
      "Service was okay. The work was completed but took longer than expected. The quality was acceptable.",
  },
  {
    rating: 2,
    comment:
      "Not satisfied with the service. The work was not completed properly and required follow-up repairs.",
  },
  {
    rating: 4,
    comment:
      "Good service overall. Minor issues but the provider was responsive and fixed them quickly.",
  },
  {
    rating: 3,
    comment:
      "Average service. The work was done but communication could have been better throughout the process.",
  },
  {
    rating: 4,
    comment:
      "Professional service with good results. Would consider using again for future needs.",
  },
];

// Main seeding function
const seedReviews = async () => {
  try {
    console.log("🌱 Starting reviews seeding...");

    // Get services and users
    const services = await Service.find({ status: "active" });
    const users = await User.find({ role: "user" });

    console.log(`🔧 Found ${services.length} active services`);
    console.log(`👥 Found ${users.length} regular users`);

    if (services.length === 0 || users.length === 0) {
      console.log(
        "❌ No services or users found. Please seed services and users first."
      );
      return;
    }

    // Clear existing reviews
    await ServiceReview.deleteMany({});
    console.log("🗑️ Cleared existing reviews");

    let totalReviewsCreated = 0;

    // Create reviews for each service
    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      if (!service) continue;

      console.log(`📝 Creating reviews for service: ${service.title}`);

      // Create 3-5 reviews per service
      const numReviews = Math.floor(Math.random() * 3) + 3; // 3-5 reviews
      const serviceReviews: any[] = [];

      for (let j = 0; j < numReviews; j++) {
        try {
          // Get a random user (avoid duplicates for the same service)
          const availableUsers = users.filter(
            (user: any) =>
              !serviceReviews.some(
                (review: any) =>
                  review.userId.toString() === user._id.toString()
              )
          );

          if (availableUsers.length === 0) break;

          const randomUser =
            availableUsers[Math.floor(Math.random() * availableUsers.length)];
          const randomReview =
            sampleReviews[Math.floor(Math.random() * sampleReviews.length)];

          if (!randomReview) continue;

          // Create review
          const newReview = new ServiceReview({
            serviceId: service._id,
            userId: randomUser._id,
            rating: randomReview.rating,
            comment: randomReview.comment,
            isVerified: Math.random() > 0.2, // 80% verified reviews
          });

          await newReview.save();
          serviceReviews.push(newReview);
          totalReviewsCreated++;

          console.log(
            `  ✅ Created review: ${randomReview.rating} stars by ${randomUser.firstName} ${randomUser.lastName}`
          );
        } catch (error) {
          console.error(`  ❌ Error creating review:`, error);
          continue;
        }
      }

      // Update service rating statistics
      if (serviceReviews.length > 0) {
        const totalRating = serviceReviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        const averageRating = totalRating / serviceReviews.length;

        await Service.updateOne(
          { _id: service._id },
          {
            $set: {
              "rating.average": Math.round(averageRating * 10) / 10, // Round to 1 decimal
              "rating.count": serviceReviews.length,
            },
          }
        );

        console.log(
          `  📊 Updated service rating: ${
            Math.round(averageRating * 10) / 10
          } stars (${serviceReviews.length} reviews)`
        );
      }
    }

    console.log("🎉 Reviews seeding completed!");

    // Display summary
    const totalReviews = await ServiceReview.countDocuments();
    const verifiedReviews = await ServiceReview.countDocuments({
      isVerified: true,
    });
    const averageRating = await ServiceReview.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    const ratingDistribution = await ServiceReview.aggregate([
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    console.log(`📊 Total reviews created: ${totalReviews}`);
    console.log(`✅ Verified reviews: ${verifiedReviews}`);
    console.log(
      `⭐ Average rating: ${
        averageRating[0]?.averageRating?.toFixed(2) || 0
      } stars`
    );

    console.log("\n📈 Rating distribution:");
    ratingDistribution.forEach((item: any) => {
      const stars = "⭐".repeat(item._id);
      console.log(`  ${stars} (${item._id} stars): ${item.count} reviews`);
    });

    // Display top-rated services
    const topServices = await Service.find({ status: "active" })
      .sort({ "rating.average": -1 })
      .limit(5)
      .select("title rating category");

    console.log("\n🏆 Top-rated services:");
    topServices.forEach((service: any, index: number) => {
      console.log(
        `  ${index + 1}. ${service.title} - ${service.rating.average} stars (${
          service.rating.count
        } reviews)`
      );
    });
  } catch (error) {
    console.error("❌ Seeding error:", error);
  }
};

// Run the seeding
const runSeed = async () => {
  await connectDB();
  await seedReviews();
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

export { seedReviews };
