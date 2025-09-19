import mongoose from "mongoose";
import dotenv from "dotenv";
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

// Function to create placeholder profile images
const createProfileImage = (name: string, initials: string): string => {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
  ];
  const color = colors[Math.floor(Math.random() * colors.length)];

  const svg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="${color}"/>
      <text x="100" y="120" font-family="Arial, sans-serif" font-size="60" 
            text-anchor="middle" dominant-baseline="middle" fill="white" font-weight="bold">
        ${initials}
      </text>
      <text x="100" y="180" font-family="Arial, sans-serif" font-size="12" 
            text-anchor="middle" dominant-baseline="middle" fill="white">
        ${name}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};

// Sample users data
const sampleUsers = [
  // Admin users
  {
    email: "admin@homeservices.com",
    password: "Admin123!",
    firstName: "System",
    lastName: "Administrator",
    phone: "+233241234567",
    role: "admin" as const,
    isVerified: true,
    address: {
      street: "123 Admin Street",
      city: "Accra",
      state: "Greater Accra",
      zipCode: "GA-123-4567",
      country: "Ghana",
    },
    accountStatus: "active" as const,
  },
  {
    email: "superadmin@homeservices.com",
    password: "SuperAdmin123!",
    firstName: "Super",
    lastName: "Admin",
    phone: "+233241234568",
    role: "admin" as const,
    isVerified: true,
    address: {
      street: "456 Super Admin Avenue",
      city: "Kumasi",
      state: "Ashanti",
      zipCode: "AS-456-7890",
      country: "Ghana",
    },
    accountStatus: "active" as const,
  },

  // Regular users
  {
    email: "john.doe@email.com",
    password: "User123!",
    firstName: "John",
    lastName: "Doe",
    phone: "+233241234569",
    role: "user" as const,
    isVerified: true,
    address: {
      street: "789 User Lane",
      city: "Accra",
      state: "Greater Accra",
      zipCode: "GA-789-0123",
      country: "Ghana",
    },
    accountStatus: "active" as const,
    emergencyContacts: [
      {
        name: "Jane Doe",
        phone: "+233241234570",
        email: "jane.doe@email.com",
        relationship: "Spouse",
        isPrimary: true,
      },
    ],
  },
  {
    email: "mary.smith@email.com",
    password: "User123!",
    firstName: "Mary",
    lastName: "Smith",
    phone: "+233241234571",
    role: "user" as const,
    isVerified: true,
    address: {
      street: "321 Customer Road",
      city: "Tema",
      state: "Greater Accra",
      zipCode: "GA-321-0456",
      country: "Ghana",
    },
    accountStatus: "active" as const,
    emergencyContacts: [
      {
        name: "Robert Smith",
        phone: "+233241234572",
        relationship: "Brother",
        isPrimary: true,
      },
    ],
  },
  {
    email: "kofi.mensah@email.com",
    password: "User123!",
    firstName: "Kofi",
    lastName: "Mensah",
    phone: "+233241234573",
    role: "user" as const,
    isVerified: true,
    address: {
      street: "654 Ghana Street",
      city: "Kumasi",
      state: "Ashanti",
      zipCode: "AS-654-0789",
      country: "Ghana",
    },
    accountStatus: "active" as const,
  },

  // Provider users
  {
    email: "plumber.mike@email.com",
    password: "Provider123!",
    firstName: "Mike",
    lastName: "Johnson",
    phone: "+233241234574",
    role: "provider" as const,
    isVerified: true,
    address: {
      street: "987 Provider Street",
      city: "Accra",
      state: "Greater Accra",
      zipCode: "GA-987-1011",
      country: "Ghana",
    },
    accountStatus: "active" as const,
    providerProfile: {
      businessName: "Mike's Plumbing Services",
      serviceCategory: "Plumbing Repairs & Water Services",
      yearsExperience: 8,
      idVerification: {
        documentType: "ghanaCard" as const,
        documentNumber: "GHA-123456789-0",
        isVerified: true,
        verifiedAt: new Date(),
      },
      bankDetails: {
        accountNumber: "1234567890",
        accountName: "Mike Johnson",
        bankName: "Ghana Commercial Bank",
        isVerified: true,
      },
      mobileMoney: {
        provider: "mtn" as const,
        phoneNumber: "+233241234574",
        isVerified: true,
      },
    },
  },
  {
    email: "electrician.sarah@email.com",
    password: "Provider123!",
    firstName: "Sarah",
    lastName: "Williams",
    phone: "+233241234575",
    role: "provider" as const,
    isVerified: true,
    address: {
      street: "147 Electric Avenue",
      city: "Tema",
      state: "Greater Accra",
      zipCode: "GA-147-1213",
      country: "Ghana",
    },
    accountStatus: "active" as const,
    providerProfile: {
      businessName: "Sarah's Electrical Solutions",
      serviceCategory: "Electrical Repairs & Installations",
      yearsExperience: 12,
      idVerification: {
        documentType: "driverLicense" as const,
        documentNumber: "DL-987654321",
        isVerified: true,
        verifiedAt: new Date(),
      },
      bankDetails: {
        accountNumber: "0987654321",
        accountName: "Sarah Williams",
        bankName: "Ecobank Ghana",
        isVerified: true,
      },
      mobileMoney: {
        provider: "vodafone" as const,
        phoneNumber: "+233241234575",
        isVerified: true,
      },
    },
  },
  {
    email: "cleaner.akua@email.com",
    password: "Provider123!",
    firstName: "Akua",
    lastName: "Asante",
    phone: "+233241234576",
    role: "provider" as const,
    isVerified: true,
    address: {
      street: "258 Clean Street",
      city: "Kumasi",
      state: "Ashanti",
      zipCode: "AS-258-1415",
      country: "Ghana",
    },
    accountStatus: "active" as const,
    providerProfile: {
      businessName: "Akua's Cleaning Services",
      serviceCategory: "House Cleaning & Domestic Help",
      yearsExperience: 5,
      idVerification: {
        documentType: "ghanaCard" as const,
        documentNumber: "GHA-456789123-1",
        isVerified: true,
        verifiedAt: new Date(),
      },
      bankDetails: {
        accountNumber: "1122334455",
        accountName: "Akua Asante",
        bankName: "Standard Chartered Bank",
        isVerified: true,
      },
      mobileMoney: {
        provider: "airtelTigo" as const,
        phoneNumber: "+233241234576",
        isVerified: true,
      },
    },
  },
  {
    email: "carpenter.kwame@email.com",
    password: "Provider123!",
    firstName: "Kwame",
    lastName: "Osei",
    phone: "+233241234577",
    role: "provider" as const,
    isVerified: true,
    address: {
      street: "369 Wood Street",
      city: "Accra",
      state: "Greater Accra",
      zipCode: "GA-369-1617",
      country: "Ghana",
    },
    accountStatus: "active" as const,
    providerProfile: {
      businessName: "Kwame's Carpentry Works",
      serviceCategory: "Carpentry",
      yearsExperience: 15,
      idVerification: {
        documentType: "ghanaCard" as const,
        documentNumber: "GHA-789123456-2",
        isVerified: true,
        verifiedAt: new Date(),
      },
      bankDetails: {
        accountNumber: "5566778899",
        accountName: "Kwame Osei",
        bankName: "Fidelity Bank",
        isVerified: true,
      },
      mobileMoney: {
        provider: "mtn" as const,
        phoneNumber: "+233241234577",
        isVerified: true,
      },
    },
  },
  {
    email: "security.amos@email.com",
    password: "Provider123!",
    firstName: "Amos",
    lastName: "Tetteh",
    phone: "+233241234578",
    role: "provider" as const,
    isVerified: true,
    address: {
      street: "741 Security Boulevard",
      city: "Tema",
      state: "Greater Accra",
      zipCode: "GA-741-1819",
      country: "Ghana",
    },
    accountStatus: "active" as const,
    providerProfile: {
      businessName: "Amos Security Services",
      serviceCategory: "Security Services",
      yearsExperience: 10,
      idVerification: {
        documentType: "passport" as const,
        documentNumber: "P123456789",
        isVerified: true,
        verifiedAt: new Date(),
      },
      bankDetails: {
        accountNumber: "9988776655",
        accountName: "Amos Tetteh",
        bankName: "Zenith Bank",
        isVerified: true,
      },
      mobileMoney: {
        provider: "vodafone" as const,
        phoneNumber: "+233241234578",
        isVerified: true,
      },
    },
  },
];

// Main seeding function
const seedUsers = async () => {
  try {
    console.log("🌱 Starting users seeding...");

    // Clear existing users (except keep some for testing)
    const existingUsers = await User.find({});
    if (existingUsers.length > 0) {
      console.log(`🗑️ Found ${existingUsers.length} existing users`);
      // Only clear if we want to start fresh
      // await User.deleteMany({});
      // console.log("🗑️ Cleared existing users");
    }

    // Get service categories for provider assignment
    const categories = await ServiceCategory.find({ isActive: true });
    console.log(`📋 Found ${categories.length} service categories`);

    // Create users with profile images
    for (let i = 0; i < sampleUsers.length; i++) {
      const userData = sampleUsers[i];
      if (!userData) continue;

      console.log(
        `📝 Creating user: ${userData.firstName} ${userData.lastName} (${userData.role})`
      );

      try {
        // Check if user already exists
        const existingUser = await User.findByEmail(userData.email);
        if (existingUser) {
          console.log(`⚠️ User ${userData.email} already exists, skipping...`);
          continue;
        }

        // Create profile image
        const initials =
          `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase();
        const profileImage = createProfileImage(
          `${userData.firstName} ${userData.lastName}`,
          initials
        );

        // Upload profile image to Cloudinary
        const imageResult = await uploadBase64ToCloudinary(
          profileImage,
          "user-profiles"
        );

        // Create user with profile image
        const newUser = new User({
          ...userData,
          profileImage: imageResult.secure_url,
        });

        await newUser.save();
        console.log(
          `✅ Created: ${userData.firstName} ${userData.lastName} (${userData.role}) - Image: ${imageResult.public_id}`
        );
      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error);
        // Continue with other users even if one fails
        continue;
      }
    }

    console.log("🎉 Users seeding completed!");

    // Display summary
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: "admin" });
    const userCount = await User.countDocuments({ role: "user" });
    const providerCount = await User.countDocuments({ role: "provider" });

    console.log(`📊 Total users: ${totalUsers}`);
    console.log(`👑 Admins: ${adminCount}`);
    console.log(`👤 Regular users: ${userCount}`);
    console.log(`🔧 Providers: ${providerCount}`);

    // Display login credentials
    console.log("\n🔐 Login Credentials:");
    console.log("Admin:");
    console.log("  Email: admin@homeservices.com | Password: Admin123!");
    console.log(
      "  Email: superadmin@homeservices.com | Password: SuperAdmin123!"
    );
    console.log("\nUsers:");
    console.log("  Email: john.doe@email.com | Password: User123!");
    console.log("  Email: mary.smith@email.com | Password: User123!");
    console.log("  Email: kofi.mensah@email.com | Password: User123!");
    console.log("\nProviders:");
    console.log("  Email: plumber.mike@email.com | Password: Provider123!");
    console.log(
      "  Email: electrician.sarah@email.com | Password: Provider123!"
    );
    console.log("  Email: cleaner.akua@email.com | Password: Provider123!");
    console.log("  Email: carpenter.kwame@email.com | Password: Provider123!");
    console.log("  Email: security.amos@email.com | Password: Provider123!");
  } catch (error) {
    console.error("❌ Seeding error:", error);
  }
};

// Run the seeding
const runSeed = async () => {
  await connectDB();
  await seedUsers();
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

export { seedUsers };
