// Simple test script to verify Cloudinary connection
require("dotenv").config();
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test connection
async function testCloudinaryConnection() {
  try {
    console.log("Testing Cloudinary connection...");

    // Test API connection
    const result = await cloudinary.api.ping();
    console.log("✅ Cloudinary connection successful!");
    console.log("Response:", result);

    // Test upload capabilities (optional)
    console.log("\nTesting upload capabilities...");
    const uploadResult = await cloudinary.uploader.upload(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      {
        folder: "test",
        resource_type: "auto",
      }
    );

    console.log("✅ Upload test successful!");
    console.log("Upload result:", uploadResult.secure_url);

    // Clean up test upload
    await cloudinary.uploader.destroy(uploadResult.public_id);
    console.log("✅ Test upload cleaned up");
  } catch (error) {
    console.error("❌ Cloudinary connection failed:");
    console.error(error.message);

    if (error.message.includes("Invalid cloud_name")) {
      console.log(
        "\n💡 Make sure CLOUDINARY_CLOUD_NAME is correct in your .env file"
      );
    } else if (error.message.includes("Invalid API key")) {
      console.log(
        "\n💡 Make sure CLOUDINARY_API_KEY is correct in your .env file"
      );
    } else if (error.message.includes("Invalid API secret")) {
      console.log(
        "\n💡 Make sure CLOUDINARY_API_SECRET is correct in your .env file"
      );
    }
  }
}

// Run the test
testCloudinaryConnection();
