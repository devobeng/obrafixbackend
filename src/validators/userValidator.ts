import { z } from "zod";

// User registration validation schema
export const userRegistrationSchema = z
  .object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    phoneNumber: z.string().optional(),
    profilePicture: z.string().min(1, "Profile picture is required"),
    role: z.enum(["user", "provider"]).default("user"),
  })
  .transform((data) => ({
    ...data,
    phone: data.phoneNumber ? data.phoneNumber.replace(/\s/g, "") : undefined, // Normalize phone number by removing spaces
    profileImage: data.profilePicture, // Map profilePicture to profileImage for database
  }));

// Provider profile setup validation schema
export const providerProfileSchema = z.object({
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters"),
  serviceCategory: z.string().min(1, "Service category is required"),
  yearsExperience: z.number().min(0, "Years of experience cannot be negative"),
});

// ID verification validation schema
export const idVerificationSchema = z.object({
  documentType: z.enum(["ghanaCard", "driverLicense", "passport"]),
  documentNumber: z.string().min(1, "Document number is required"),
  documentImage: z.string().url("Invalid document image URL"),
});

// Bank account setup validation schema
export const bankAccountSchema = z.object({
  accountNumber: z.string().min(1, "Account number is required"),
  accountName: z.string().min(1, "Account name is required"),
  bankName: z.string().min(1, "Bank name is required"),
});

// Mobile money setup validation schema
export const mobileMoneySchema = z.object({
  provider: z.enum(["mtn", "vodafone", "airtelTigo"]),
  phoneNumber: z.string().min(1, "Phone number is required"),
});

// User update validation schema
export const userUpdateSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .optional(),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .optional(),
  phone: z.string().optional(),
  profileImage: z.string().url("Invalid image URL").optional(),
  address: z
    .object({
      street: z.string().min(1, "Street is required"),
      city: z.string().min(1, "City is required"),
      state: z.string().min(1, "State is required"),
      zipCode: z.string().min(1, "Zip code is required"),
      country: z.string().min(1, "Country is required"),
    })
    .optional(),
});

// User login validation schema
export const userLoginSchema = z.object({
  emailOrPhone: z.string().min(1, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
});

// Password change validation schema
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

// User role update validation schema
export const userRoleUpdateSchema = z.object({
  role: z.enum(["user", "provider", "admin"], {
    errorMap: () => ({ message: "Role must be user, provider, or admin" }),
  }),
});

// User search validation schema
export const userSearchSchema = z.object({
  q: z.string().min(1, "Search query is required"),
  page: z
    .string()
    .optional()
    .transform((val) => parseInt(val || "1")),
  limit: z
    .string()
    .optional()
    .transform((val) => parseInt(val || "10")),
  role: z.enum(["user", "provider", "admin"]).optional(),
});

// User filters validation schema
export const userFiltersSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => parseInt(val || "1")),
  limit: z
    .string()
    .optional()
    .transform((val) => parseInt(val || "10")),
  role: z.enum(["user", "provider", "admin"]).optional(),
  search: z.string().optional(),
});
