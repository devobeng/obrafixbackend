import mongoose from "mongoose";
import dotenv from "dotenv";
import { ServiceCategory } from "../src/models/ServiceCategory";
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

// Service categories data with emojis and descriptions
const serviceCategories = [
  {
    name: "House Cleaning & Domestic Help",
    description:
      "Professional house cleaning, domestic help, and home maintenance services to keep your space spotless and organized.",
    icon: "🧹",
    commissionRate: 12,
    sortOrder: 1,
  },
  {
    name: "Plumbing Repairs & Water Services",
    description:
      "Expert plumbing services including repairs, installations, water system maintenance, and emergency plumbing solutions.",
    icon: "🚰",
    commissionRate: 15,
    sortOrder: 2,
  },
  {
    name: "Electrical Repairs & Installations",
    description:
      "Licensed electricians for electrical repairs, installations, wiring, and electrical system maintenance for your home.",
    icon: "💡",
    commissionRate: 18,
    sortOrder: 3,
  },
  {
    name: "Appliance Repairs",
    description:
      "Professional repair services for refrigerators, air conditioners, washing machines, and other home appliances.",
    icon: "❄️",
    commissionRate: 15,
    sortOrder: 4,
  },
  {
    name: "DSTV / Satellite Dish Installation & Repairs",
    description:
      "DSTV installation, satellite dish setup, repairs, and maintenance services for uninterrupted entertainment.",
    icon: "📡",
    commissionRate: 10,
    sortOrder: 5,
  },
  {
    name: "Carpentry",
    description:
      "Skilled carpenters for furniture making, door repairs, roofing repairs, and custom woodwork projects.",
    icon: "🔨",
    commissionRate: 12,
    sortOrder: 6,
  },
  {
    name: "Masonry & Tiling",
    description:
      "Professional masonry work, tiling services, brickwork, and stone installation for your home improvement needs.",
    icon: "🧱",
    commissionRate: 14,
    sortOrder: 7,
  },
  {
    name: "Painting & Home Decoration",
    description:
      "Interior and exterior painting services, home decoration, color consultation, and finishing touches.",
    icon: "🎨",
    commissionRate: 10,
    sortOrder: 8,
  },
  {
    name: "Pest Control",
    description:
      "Effective pest control services for cockroaches, bedbugs, mosquitoes, termites, and other household pests.",
    icon: "🪳",
    commissionRate: 16,
    sortOrder: 9,
  },
  {
    name: "Waste Collection & Bulk Trash Disposal",
    description:
      "Reliable waste collection services, bulk trash disposal, and environmental cleanup solutions.",
    icon: "🚛",
    commissionRate: 8,
    sortOrder: 10,
  },
  {
    name: "Moving & Relocation",
    description:
      "Professional moving services with packers, loaders, trucks, and complete relocation assistance.",
    icon: "📦",
    commissionRate: 12,
    sortOrder: 11,
  },
  {
    name: "Gardening & Landscaping",
    description:
      "Expert gardening services, lawn care, tree cutting, landscaping, and outdoor space beautification.",
    icon: "🌳",
    commissionRate: 10,
    sortOrder: 12,
  },
  {
    name: "Welding & Metalwork",
    description:
      "Professional welding services for gates, burglar proofs, roofing sheets, and custom metal fabrication.",
    icon: "⚙️",
    commissionRate: 15,
    sortOrder: 13,
  },
  {
    name: "Security Services",
    description:
      "Comprehensive security solutions including guards, CCTV installation, alarm systems, and locksmith services.",
    icon: "🛡️",
    commissionRate: 20,
    sortOrder: 14,
  },
  {
    name: "Babysitting & Childcare",
    description:
      "Trusted babysitting and childcare services with experienced caregivers for your children's safety and care.",
    icon: "👶",
    commissionRate: 12,
    sortOrder: 15,
  },
  {
    name: "Home Tutoring",
    description:
      "Qualified tutors for JHS/SHS subjects, ICT, languages, and personalized educational support at home.",
    icon: "📘",
    commissionRate: 10,
    sortOrder: 16,
  },
  {
    name: "Elderly Care & Nursing at Home",
    description:
      "Professional elderly care services, nursing assistance, and compassionate home healthcare for seniors.",
    icon: "🧓",
    commissionRate: 15,
    sortOrder: 17,
  },
  {
    name: "Beauty & Grooming",
    description:
      "Professional beauty services including hairdressing, braiding, barber services, makeup, and nail care.",
    icon: "💇",
    commissionRate: 12,
    sortOrder: 18,
  },
  {
    name: "Massage & Spa",
    description:
      "Relaxing at-home massage and spa services for wellness, stress relief, and therapeutic treatments.",
    icon: "💆",
    commissionRate: 15,
    sortOrder: 19,
  },
  {
    name: "Courier & Small Package Delivery",
    description:
      "Reliable courier services for market errands, grocery delivery, food delivery assistance, and small package transport.",
    icon: "📦",
    commissionRate: 8,
    sortOrder: 20,
  },
];

// Function to create placeholder images for categories
const createPlaceholderImage = (categoryName: string, icon: string): string => {
  // Create a simple SVG as base64 for each category
  const svg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
      <text x="100" y="100" font-family="Arial, sans-serif" font-size="60" text-anchor="middle" dominant-baseline="middle">${icon}</text>
      <text x="100" y="160" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" dominant-baseline="middle" fill="#6c757d">${categoryName}</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};

// Main seeding function
const seedCategories = async () => {
  try {
    console.log("🌱 Starting service categories seeding...");

    // Clear existing categories
    await ServiceCategory.deleteMany({});
    console.log("🗑️ Cleared existing categories");

    // Create categories with images
    for (let i = 0; i < serviceCategories.length; i++) {
      const category = serviceCategories[i];
      if (!category) continue;

      console.log(`📝 Creating category: ${category.name}`);

      try {
        // Create placeholder image
        const placeholderImage = createPlaceholderImage(
          category.name,
          category.icon
        );

        // Upload to Cloudinary
        const imageResult = await uploadBase64ToCloudinary(
          placeholderImage,
          "service-categories"
        );

        // Create category with image URL
        const newCategory = new ServiceCategory({
          ...category,
          icon: imageResult.secure_url, // Store the Cloudinary URL instead of emoji
          isActive: true,
        });

        await newCategory.save();
        console.log(
          `✅ Created: ${category.name} (Image: ${imageResult.public_id})`
        );
      } catch (error) {
        console.error(`❌ Error creating ${category.name}:`, error);
        // Continue with other categories even if one fails
        continue;
      }
    }

    console.log("🎉 Service categories seeding completed!");

    // Display summary
    const totalCategories = await ServiceCategory.countDocuments();
    console.log(`📊 Total categories created: ${totalCategories}`);
  } catch (error) {
    console.error("❌ Seeding error:", error);
  }
};

// Run the seeding
const runSeed = async () => {
  await connectDB();
  await seedCategories();
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

export { seedCategories };
