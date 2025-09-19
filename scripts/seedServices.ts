import mongoose from "mongoose";
import dotenv from "dotenv";
import { Service } from "../src/models/Service";
import { User } from "../src/models/User";
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

// Function to create placeholder service images
const createServiceImage = (serviceName: string, category: string): string => {
  const categoryColors: { [key: string]: string } = {
    "House Cleaning & Domestic Help": "#4ECDC4",
    "Plumbing Repairs & Water Services": "#45B7D1",
    "Electrical Repairs & Installations": "#FFEAA7",
    "Appliance Repairs": "#96CEB4",
    "DSTV / Satellite Dish Installation & Repairs": "#DDA0DD",
    Carpentry: "#98D8C8",
    "Masonry & Tiling": "#F7DC6F",
    "Painting & Home Decoration": "#BB8FCE",
    "Pest Control": "#85C1E9",
    "Waste Collection & Bulk Trash Disposal": "#FF6B6B",
    "Moving & Relocation": "#4ECDC4",
    "Gardening & Landscaping": "#96CEB4",
    "Welding & Metalwork": "#FFEAA7",
    "Security Services": "#DDA0DD",
    "Babysitting & Childcare": "#98D8C8",
    "Home Tutoring": "#F7DC6F",
    "Elderly Care & Nursing at Home": "#BB8FCE",
    "Beauty & Grooming": "#85C1E9",
    "Massage & Spa": "#FF6B6B",
    "Courier & Small Package Delivery": "#4ECDC4",
  };

  const color = categoryColors[category] || "#4ECDC4";

  const svg = `
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="200" fill="${color}" opacity="0.8"/>
      <rect width="300" height="200" fill="url(#gradient)" opacity="0.3"/>
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:white;stop-opacity:0.1" />
          <stop offset="100%" style="stop-color:black;stop-opacity:0.1" />
        </linearGradient>
      </defs>
      <text x="150" y="80" font-family="Arial, sans-serif" font-size="16" 
            text-anchor="middle" dominant-baseline="middle" fill="white" font-weight="bold">
        ${serviceName}
      </text>
      <text x="150" y="110" font-family="Arial, sans-serif" font-size="12" 
            text-anchor="middle" dominant-baseline="middle" fill="white" opacity="0.9">
        ${category}
      </text>
      <text x="150" y="140" font-family="Arial, sans-serif" font-size="10" 
            text-anchor="middle" dominant-baseline="middle" fill="white" opacity="0.7">
        Professional Service
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};

// Sample services data
const sampleServices = [
  // Plumbing Services
  {
    title: "Emergency Plumbing Repairs",
    description:
      "24/7 emergency plumbing services for burst pipes, blocked drains, and urgent repairs. Fast response time with experienced plumbers.",
    category: "Plumbing Repairs & Water Services",
    pricing: {
      type: "hourly" as const,
      amount: 150,
      currency: "GHS",
      unit: "per hour",
    },
    location: {
      city: "Accra",
      state: "Greater Accra",
      country: "Ghana",
      serviceRadius: 25,
    },
    availability: {
      isAvailable: true,
      workingDays: [
        {
          day: "monday" as const,
          startTime: "06:00",
          endTime: "22:00",
          isAvailable: true,
        },
        {
          day: "tuesday" as const,
          startTime: "06:00",
          endTime: "22:00",
          isAvailable: true,
        },
        {
          day: "wednesday" as const,
          startTime: "06:00",
          endTime: "22:00",
          isAvailable: true,
        },
        {
          day: "thursday" as const,
          startTime: "06:00",
          endTime: "22:00",
          isAvailable: true,
        },
        {
          day: "friday" as const,
          startTime: "06:00",
          endTime: "22:00",
          isAvailable: true,
        },
        {
          day: "saturday" as const,
          startTime: "08:00",
          endTime: "20:00",
          isAvailable: true,
        },
        {
          day: "sunday" as const,
          startTime: "09:00",
          endTime: "18:00",
          isAvailable: true,
        },
      ],
      emergencyService: true,
      noticeRequired: 0,
    },
    tags: ["emergency", "plumbing", "repairs", "24/7"],
    requirements: ["Valid ID", "Access to property"],
    estimatedDuration: "1-3 hours",
    status: "active" as const,
  },
  {
    title: "Water Heater Installation",
    description:
      "Professional water heater installation and maintenance services. We handle all types of water heaters with warranty included.",
    category: "Plumbing Repairs & Water Services",
    pricing: {
      type: "fixed" as const,
      amount: 800,
      currency: "GHS",
      unit: "per installation",
    },
    location: {
      city: "Accra",
      state: "Greater Accra",
      country: "Ghana",
      serviceRadius: 30,
    },
    availability: {
      isAvailable: true,
      workingDays: [
        {
          day: "monday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "tuesday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "wednesday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "thursday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "friday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "saturday" as const,
          startTime: "09:00",
          endTime: "15:00",
          isAvailable: true,
        },
      ],
      emergencyService: false,
      noticeRequired: 24,
    },
    tags: ["water heater", "installation", "maintenance"],
    requirements: ["Valid ID", "Access to property", "Water heater unit"],
    estimatedDuration: "2-4 hours",
    status: "active" as const,
  },

  // Electrical Services
  {
    title: "Electrical Wiring & Installation",
    description:
      "Complete electrical wiring services for homes and offices. Licensed electricians with modern equipment and safety standards.",
    category: "Electrical Repairs & Installations",
    pricing: {
      type: "hourly" as const,
      amount: 200,
      currency: "GHS",
      unit: "per hour",
    },
    location: {
      city: "Tema",
      state: "Greater Accra",
      country: "Ghana",
      serviceRadius: 35,
    },
    availability: {
      isAvailable: true,
      workingDays: [
        {
          day: "monday" as const,
          startTime: "07:00",
          endTime: "18:00",
          isAvailable: true,
        },
        {
          day: "tuesday" as const,
          startTime: "07:00",
          endTime: "18:00",
          isAvailable: true,
        },
        {
          day: "wednesday" as const,
          startTime: "07:00",
          endTime: "18:00",
          isAvailable: true,
        },
        {
          day: "thursday" as const,
          startTime: "07:00",
          endTime: "18:00",
          isAvailable: true,
        },
        {
          day: "friday" as const,
          startTime: "07:00",
          endTime: "18:00",
          isAvailable: true,
        },
        {
          day: "saturday" as const,
          startTime: "08:00",
          endTime: "16:00",
          isAvailable: true,
        },
      ],
      emergencyService: true,
      noticeRequired: 12,
    },
    tags: ["electrical", "wiring", "installation", "licensed"],
    requirements: ["Valid ID", "Access to property", "Electrical permit"],
    estimatedDuration: "4-8 hours",
    status: "active" as const,
  },
  {
    title: "Generator Installation & Maintenance",
    description:
      "Professional generator installation, maintenance, and repair services. We handle all generator types and sizes.",
    category: "Electrical Repairs & Installations",
    pricing: {
      type: "fixed" as const,
      amount: 1200,
      currency: "GHS",
      unit: "per installation",
    },
    location: {
      city: "Tema",
      state: "Greater Accra",
      country: "Ghana",
      serviceRadius: 40,
    },
    availability: {
      isAvailable: true,
      workingDays: [
        {
          day: "monday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "tuesday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "wednesday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "thursday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "friday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "saturday" as const,
          startTime: "09:00",
          endTime: "15:00",
          isAvailable: true,
        },
      ],
      emergencyService: true,
      noticeRequired: 24,
    },
    tags: ["generator", "installation", "maintenance", "backup power"],
    requirements: ["Valid ID", "Access to property", "Generator unit"],
    estimatedDuration: "6-10 hours",
    status: "active" as const,
  },

  // Cleaning Services
  {
    title: "Deep House Cleaning",
    description:
      "Comprehensive deep cleaning service for homes and apartments. Includes all rooms, appliances, and hard-to-reach areas.",
    category: "House Cleaning & Domestic Help",
    pricing: {
      type: "fixed" as const,
      amount: 400,
      currency: "GHS",
      unit: "per session",
    },
    location: {
      city: "Kumasi",
      state: "Ashanti",
      country: "Ghana",
      serviceRadius: 20,
    },
    availability: {
      isAvailable: true,
      workingDays: [
        {
          day: "monday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "tuesday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "wednesday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "thursday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "friday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "saturday" as const,
          startTime: "09:00",
          endTime: "16:00",
          isAvailable: true,
        },
      ],
      emergencyService: false,
      noticeRequired: 48,
    },
    tags: ["cleaning", "deep clean", "housekeeping", "domestic"],
    requirements: [
      "Valid ID",
      "Access to property",
      "Cleaning supplies provided",
    ],
    estimatedDuration: "4-6 hours",
    status: "active" as const,
  },
  {
    title: "Office Cleaning Service",
    description:
      "Professional office cleaning services including desks, floors, restrooms, and common areas. Regular and one-time cleaning available.",
    category: "House Cleaning & Domestic Help",
    pricing: {
      type: "hourly" as const,
      amount: 80,
      currency: "GHS",
      unit: "per hour",
    },
    location: {
      city: "Kumasi",
      state: "Ashanti",
      country: "Ghana",
      serviceRadius: 25,
    },
    availability: {
      isAvailable: true,
      workingDays: [
        {
          day: "monday" as const,
          startTime: "06:00",
          endTime: "18:00",
          isAvailable: true,
        },
        {
          day: "tuesday" as const,
          startTime: "06:00",
          endTime: "18:00",
          isAvailable: true,
        },
        {
          day: "wednesday" as const,
          startTime: "06:00",
          endTime: "18:00",
          isAvailable: true,
        },
        {
          day: "thursday" as const,
          startTime: "06:00",
          endTime: "18:00",
          isAvailable: true,
        },
        {
          day: "friday" as const,
          startTime: "06:00",
          endTime: "18:00",
          isAvailable: true,
        },
        {
          day: "saturday" as const,
          startTime: "08:00",
          endTime: "14:00",
          isAvailable: true,
        },
      ],
      emergencyService: false,
      noticeRequired: 24,
    },
    tags: ["office cleaning", "commercial", "regular cleaning"],
    requirements: [
      "Valid ID",
      "Access to office",
      "Cleaning supplies provided",
    ],
    estimatedDuration: "2-4 hours",
    status: "active" as const,
  },

  // Carpentry Services
  {
    title: "Custom Furniture Making",
    description:
      "Handcrafted custom furniture including tables, chairs, cabinets, and wardrobes. Made to your specifications with quality materials.",
    category: "Carpentry",
    pricing: {
      type: "negotiable" as const,
      amount: 0,
      currency: "GHS",
      unit: "quote based",
    },
    location: {
      city: "Accra",
      state: "Greater Accra",
      country: "Ghana",
      serviceRadius: 30,
    },
    availability: {
      isAvailable: true,
      workingDays: [
        {
          day: "monday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "tuesday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "wednesday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "thursday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "friday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "saturday" as const,
          startTime: "09:00",
          endTime: "15:00",
          isAvailable: true,
        },
      ],
      emergencyService: false,
      noticeRequired: 72,
    },
    tags: ["custom furniture", "carpentry", "handcrafted", "woodwork"],
    requirements: ["Valid ID", "Design specifications", "Material selection"],
    estimatedDuration: "1-2 weeks",
    status: "active" as const,
  },
  {
    title: "Door & Window Repairs",
    description:
      "Professional door and window repair services including hinges, locks, frames, and glass replacement.",
    category: "Carpentry",
    pricing: {
      type: "hourly" as const,
      amount: 120,
      currency: "GHS",
      unit: "per hour",
    },
    location: {
      city: "Accra",
      state: "Greater Accra",
      country: "Ghana",
      serviceRadius: 25,
    },
    availability: {
      isAvailable: true,
      workingDays: [
        {
          day: "monday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "tuesday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "wednesday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "thursday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "friday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "saturday" as const,
          startTime: "09:00",
          endTime: "15:00",
          isAvailable: true,
        },
      ],
      emergencyService: true,
      noticeRequired: 12,
    },
    tags: ["doors", "windows", "repairs", "locks"],
    requirements: ["Valid ID", "Access to property"],
    estimatedDuration: "1-3 hours",
    status: "active" as const,
  },

  // Security Services
  {
    title: "CCTV Installation & Monitoring",
    description:
      "Professional CCTV camera installation with remote monitoring capabilities. High-quality cameras with mobile app access.",
    category: "Security Services",
    pricing: {
      type: "fixed" as const,
      amount: 1500,
      currency: "GHS",
      unit: "per installation",
    },
    location: {
      city: "Tema",
      state: "Greater Accra",
      country: "Ghana",
      serviceRadius: 35,
    },
    availability: {
      isAvailable: true,
      workingDays: [
        {
          day: "monday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "tuesday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "wednesday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "thursday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "friday" as const,
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
        {
          day: "saturday" as const,
          startTime: "09:00",
          endTime: "15:00",
          isAvailable: true,
        },
      ],
      emergencyService: true,
      noticeRequired: 48,
    },
    tags: ["CCTV", "security", "monitoring", "cameras"],
    requirements: ["Valid ID", "Access to property", "Internet connection"],
    estimatedDuration: "4-6 hours",
    status: "active" as const,
  },
  {
    title: "Security Guard Services",
    description:
      "Professional security guard services for homes, offices, and events. Trained and licensed security personnel available 24/7.",
    category: "Security Services",
    pricing: {
      type: "hourly" as const,
      amount: 50,
      currency: "GHS",
      unit: "per hour",
    },
    location: {
      city: "Tema",
      state: "Greater Accra",
      country: "Ghana",
      serviceRadius: 50,
    },
    availability: {
      isAvailable: true,
      workingDays: [
        {
          day: "monday" as const,
          startTime: "00:00",
          endTime: "23:59",
          isAvailable: true,
        },
        {
          day: "tuesday" as const,
          startTime: "00:00",
          endTime: "23:59",
          isAvailable: true,
        },
        {
          day: "wednesday" as const,
          startTime: "00:00",
          endTime: "23:59",
          isAvailable: true,
        },
        {
          day: "thursday" as const,
          startTime: "00:00",
          endTime: "23:59",
          isAvailable: true,
        },
        {
          day: "friday" as const,
          startTime: "00:00",
          endTime: "23:59",
          isAvailable: true,
        },
        {
          day: "saturday" as const,
          startTime: "00:00",
          endTime: "23:59",
          isAvailable: true,
        },
        {
          day: "sunday" as const,
          startTime: "00:00",
          endTime: "23:59",
          isAvailable: true,
        },
      ],
      emergencyService: true,
      noticeRequired: 24,
    },
    tags: ["security guard", "24/7", "protection", "licensed"],
    requirements: ["Valid ID", "Security clearance", "Minimum 8-hour booking"],
    estimatedDuration: "8+ hours",
    status: "active" as const,
  },
];

// Main seeding function
const seedServices = async () => {
  try {
    console.log("🌱 Starting services seeding...");

    // Get providers and categories
    const providers = await User.find({ role: "provider" });
    const categories = await ServiceCategory.find({ isActive: true });

    console.log(`👥 Found ${providers.length} providers`);
    console.log(`📋 Found ${categories.length} service categories`);

    if (providers.length === 0) {
      console.log("❌ No providers found. Please seed users first.");
      return;
    }

    // Clear existing services
    await Service.deleteMany({});
    console.log("🗑️ Cleared existing services");

    // Create services with images
    for (let i = 0; i < sampleServices.length; i++) {
      const serviceData = sampleServices[i];
      if (!serviceData) continue;

      console.log(`📝 Creating service: ${serviceData.title}`);

      try {
        // Find a provider for this service category
        const category = categories.find(
          (cat: any) => cat.name === serviceData.category
        );
        let provider = providers.find(
          (p: any) =>
            p.providerProfile?.serviceCategory === serviceData.category
        );

        // If no specific provider found, use any provider
        if (!provider) {
          provider = providers[i % providers.length];
        }

        // Create service image
        const serviceImage = createServiceImage(
          serviceData.title,
          serviceData.category
        );

        // Upload service image to Cloudinary
        const imageResult = await uploadBase64ToCloudinary(
          serviceImage,
          "service-images"
        );

        // Create service with image
        const newService = new Service({
          ...serviceData,
          provider: provider._id,
          images: [
            {
              url: imageResult.secure_url,
              alt: `${serviceData.title} - ${serviceData.category}`,
            },
          ],
          rating: {
            average: Math.random() * 2 + 3, // Random rating between 3-5
            count: Math.floor(Math.random() * 20) + 5, // Random review count 5-24
            reviews: [],
          },
          commissionRate: category?.commissionRate || 10,
        });

        await newService.save();
        console.log(
          `✅ Created: ${serviceData.title} - Provider: ${provider.firstName} ${provider.lastName} - Image: ${imageResult.public_id}`
        );
      } catch (error) {
        console.error(`❌ Error creating service ${serviceData.title}:`, error);
        // Continue with other services even if one fails
        continue;
      }
    }

    console.log("🎉 Services seeding completed!");

    // Display summary
    const totalServices = await Service.countDocuments();
    const activeServices = await Service.countDocuments({ status: "active" });
    const servicesByCategory = await Service.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log(`📊 Total services: ${totalServices}`);
    console.log(`✅ Active services: ${activeServices}`);
    console.log("\n📈 Services by category:");
    servicesByCategory.forEach((item: any) => {
      console.log(`  ${item._id}: ${item.count} services`);
    });
  } catch (error) {
    console.error("❌ Seeding error:", error);
  }
};

// Run the seeding
const runSeed = async () => {
  await connectDB();
  await seedServices();
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

export { seedServices };
