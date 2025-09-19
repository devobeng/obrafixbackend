import mongoose from "mongoose";
import dotenv from "dotenv";
import { Banner } from "../src/models/Banner";
import { User } from "../src/models/User";
import { uploadBase64ToCloudinary } from "../src/config/cloudinary";

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

// Function to create promotional banner images
const createBannerImage = (
  discount: string,
  title: string,
  subtitle: string,
  serviceType: string,
  backgroundColor: string = "#8B5CF6"
): string => {
  const svg = `
    <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${backgroundColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${backgroundColor}CC;stop-opacity:1" />
        </linearGradient>
        <pattern id="hexPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <polygon points="20,5 35,15 35,25 20,35 5,25 5,15" fill="${backgroundColor}AA" opacity="0.3"/>
        </pattern>
      </defs>
      
      <!-- Background -->
      <rect width="400" height="200" fill="url(#bgGradient)"/>
      <rect width="400" height="200" fill="url(#hexPattern)"/>
      
      <!-- Left side content -->
      <g transform="translate(30, 30)">
        <!-- Discount percentage -->
        <text x="0" y="40" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white">
          ${discount}
        </text>
        
        <!-- Title -->
        <text x="0" y="70" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white">
          ${title}
        </text>
        
        <!-- Subtitle -->
        <text x="0" y="95" font-family="Arial, sans-serif" font-size="12" fill="white" opacity="0.9">
          ${subtitle}
        </text>
      </g>
      
      <!-- Right side service icon -->
      <g transform="translate(320, 50)">
        <circle cx="30" cy="30" r="25" fill="white" opacity="0.2"/>
        <text x="30" y="38" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="white">
          ${serviceType}
        </text>
      </g>
      
      <!-- Bottom pagination dots -->
      <g transform="translate(180, 180)">
        <circle cx="0" cy="0" r="3" fill="white" opacity="0.7"/>
        <circle cx="15" cy="0" r="3" fill="white" opacity="0.3"/>
        <circle cx="30" cy="0" r="3" fill="white" opacity="0.3"/>
      </g>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};

// Sample banners data
const sampleBanners = [
  {
    title: "30% Today's Special!",
    description: "Get discount for every order. Only valid for today",
    type: "promotion" as const,
    targetAudience: "customers" as const,
    discount: "30%",
    subtitle: "Get discount for every order. only valid for today",
    serviceType: "🧹",
    backgroundColor: "#8B5CF6", // Purple
    priority: 10,
    displayOrder: 1,
    linkUrl: "/services/cleaning",
  },
  {
    title: "50% Off Electrical Services!",
    description:
      "Professional electrical repairs and installations at half price",
    type: "promotion" as const,
    targetAudience: "customers" as const,
    discount: "50%",
    subtitle: "Professional electrical services. Limited time offer",
    serviceType: "💡",
    backgroundColor: "#F59E0B", // Amber
    priority: 9,
    displayOrder: 2,
    linkUrl: "/services/electrical",
  },
  {
    title: "Free Plumbing Consultation!",
    description:
      "Get expert plumbing advice at no cost. Book your consultation today",
    type: "promotion" as const,
    targetAudience: "customers" as const,
    discount: "FREE",
    subtitle: "Expert plumbing consultation. Book your appointment now",
    serviceType: "🚰",
    backgroundColor: "#10B981", // Emerald
    priority: 8,
    displayOrder: 3,
    linkUrl: "/services/plumbing",
  },
  {
    title: "25% Off Security Services!",
    description:
      "Protect your property with our professional security solutions",
    type: "promotion" as const,
    targetAudience: "customers" as const,
    discount: "25%",
    subtitle: "Professional security services. Keep your property safe",
    serviceType: "🛡️",
    backgroundColor: "#EF4444", // Red
    priority: 7,
    displayOrder: 4,
    linkUrl: "/services/security",
  },
  {
    title: "New Provider Welcome!",
    description:
      "Join our platform and start earning. No registration fees for limited time",
    type: "announcement" as const,
    targetAudience: "providers" as const,
    discount: "0%",
    subtitle: "Join our platform today. Start earning immediately",
    serviceType: "👷",
    backgroundColor: "#3B82F6", // Blue
    priority: 6,
    displayOrder: 5,
    linkUrl: "/provider/register",
  },
  {
    title: "Weekend Special - 40% Off!",
    description:
      "Book any service this weekend and save big. Valid Saturday & Sunday only",
    type: "promotion" as const,
    targetAudience: "customers" as const,
    discount: "40%",
    subtitle: "Weekend special offer. Book now and save big",
    serviceType: "🎉",
    backgroundColor: "#EC4899", // Pink
    priority: 5,
    displayOrder: 6,
    linkUrl: "/services",
  },
  {
    title: "Emergency Services Available!",
    description:
      "24/7 emergency services for urgent repairs. Fast response guaranteed",
    type: "announcement" as const,
    targetAudience: "all" as const,
    discount: "24/7",
    subtitle: "Emergency services available. Fast response guaranteed",
    serviceType: "🚨",
    backgroundColor: "#F97316", // Orange
    priority: 4,
    displayOrder: 7,
    linkUrl: "/emergency",
  },
  {
    title: "Referral Bonus - GHS 50!",
    description:
      "Refer a friend and earn GHS 50. Both you and your friend get rewards",
    type: "promotion" as const,
    targetAudience: "all" as const,
    discount: "GHS 50",
    subtitle: "Refer a friend and earn. Both get rewards",
    serviceType: "💰",
    backgroundColor: "#8B5CF6", // Purple
    priority: 3,
    displayOrder: 8,
    linkUrl: "/referral",
  },
];

// Main seeding function
const seedBanners = async () => {
  try {
    console.log("🌱 Starting banners seeding...");

    // Get admin user for createdBy field
    const adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      console.log("❌ No admin user found. Please seed users first.");
      return;
    }

    console.log(`👤 Using admin: ${adminUser.firstName} ${adminUser.lastName}`);

    // Clear existing banners
    await Banner.deleteMany({});
    console.log("🗑️ Cleared existing banners");

    // Create banners with images
    for (let i = 0; i < sampleBanners.length; i++) {
      const bannerData = sampleBanners[i];
      if (!bannerData) continue;

      console.log(`📝 Creating banner: ${bannerData.title}`);

      try {
        // Create banner image
        const bannerImage = createBannerImage(
          bannerData.discount,
          bannerData.title,
          bannerData.subtitle,
          bannerData.serviceType,
          bannerData.backgroundColor
        );

        // Upload banner image to Cloudinary
        const imageResult = await uploadBase64ToCloudinary(
          bannerImage,
          "banners"
        );

        // Set start and end dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // 30 days from now

        // Create banner
        const newBanner = new Banner({
          title: bannerData.title,
          description: bannerData.description,
          imageUrl: imageResult.secure_url,
          linkUrl: bannerData.linkUrl,
          type: bannerData.type,
          targetAudience: bannerData.targetAudience,
          startDate: startDate,
          endDate: endDate,
          isActive: true,
          priority: bannerData.priority,
          displayOrder: bannerData.displayOrder,
          clickCount: Math.floor(Math.random() * 100), // Random click count
          viewCount: Math.floor(Math.random() * 1000), // Random view count
          createdBy: adminUser._id,
        });

        await newBanner.save();
        console.log(
          `✅ Created: ${bannerData.title} - Image: ${imageResult.public_id}`
        );
      } catch (error) {
        console.error(`❌ Error creating banner ${bannerData.title}:`, error);
        // Continue with other banners even if one fails
        continue;
      }
    }

    console.log("🎉 Banners seeding completed!");

    // Display summary
    const totalBanners = await Banner.countDocuments();
    const activeBanners = await Banner.countDocuments({ isActive: true });
    const promotionBanners = await Banner.countDocuments({ type: "promotion" });
    const announcementBanners = await Banner.countDocuments({
      type: "announcement",
    });

    console.log(`📊 Total banners: ${totalBanners}`);
    console.log(`✅ Active banners: ${activeBanners}`);
    console.log(`🎯 Promotion banners: ${promotionBanners}`);
    console.log(`📢 Announcement banners: ${announcementBanners}`);

    // Display banners by target audience
    const bannersByAudience = await Banner.aggregate([
      { $group: { _id: "$targetAudience", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log("\n📈 Banners by target audience:");
    bannersByAudience.forEach((item: any) => {
      console.log(`  ${item._id}: ${item.count} banners`);
    });

    // Display top priority banners
    const topBanners = await Banner.find({ isActive: true })
      .sort({ priority: -1, displayOrder: 1 })
      .limit(5)
      .select("title type targetAudience priority displayOrder");

    console.log("\n🏆 Top priority banners:");
    topBanners.forEach((banner: any, index: number) => {
      console.log(
        `  ${index + 1}. ${banner.title} (${banner.type}) - Priority: ${
          banner.priority
        }, Order: ${banner.displayOrder}`
      );
    });
  } catch (error) {
    console.error("❌ Seeding error:", error);
  }
};

// Run the seeding
const runSeed = async () => {
  await connectDB();
  await seedBanners();
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

export { seedBanners };
