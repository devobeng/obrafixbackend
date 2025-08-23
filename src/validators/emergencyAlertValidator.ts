import { z } from "zod";

// Create emergency alert schema
export const createAlertSchema = z.object({
  alertType: z.enum(
    [
      "medical_emergency",
      "fire",
      "crime",
      "accident",
      "suspicious_activity",
      "noise_complaint",
      "power_outage",
      "flood",
      "earthquake",
      "other",
    ],
    {
      errorMap: () => ({ message: "Invalid alert type selected" }),
    }
  ),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters long")
    .max(500, "Description must not exceed 500 characters"),
  location: z.object({
    type: z.literal("Point"),
    coordinates: z
      .array(z.number())
      .length(
        2,
        "Coordinates must have exactly 2 values [longitude, latitude]"
      ),
    address: z.string().optional(),
  }),
  emergencyContacts: z
    .array(z.string().min(1, "Contact ID is required"))
    .optional(),
  metadata: z.record(z.any()).optional(),
});

// Update alert status schema
export const updateAlertStatusSchema = z.object({
  status: z.enum(["active", "resolved", "false_alarm", "cancelled"], {
    errorMap: () => ({ message: "Invalid status selected" }),
  }),
});

// Add alert update schema
export const addAlertUpdateSchema = z.object({
  update: z
    .string()
    .min(5, "Update must be at least 5 characters long")
    .max(200, "Update must not exceed 200 characters"),
});

// Find nearby services schema
export const findNearbyServicesSchema = z.object({
  latitude: z.string().regex(/^-?\d+(\.\d+)?$/, "Invalid latitude format"),
  longitude: z.string().regex(/^-?\d+(\.\d+)?$/, "Invalid longitude format"),
  radius: z
    .string()
    .regex(/^\d+(\.\d+)?$/, "Invalid radius format")
    .optional(),
});

// Find nearby alerts schema
export const findNearbyAlertsSchema = z.object({
  latitude: z.string().regex(/^-?\d+(\.\d+)?$/, "Invalid latitude format"),
  longitude: z.string().regex(/^-?\d+(\.\d+)?$/, "Invalid longitude format"),
  radius: z
    .string()
    .regex(/^\d+(\.\d+)?$/, "Invalid radius format")
    .optional(),
});

// Send SOS schema
export const sendSOSSchema = z.object({
  message: z
    .string()
    .max(200, "Message must not exceed 200 characters")
    .optional(),
});

// Alert ID schema
export const alertIdSchema = z.object({
  alertId: z.string().min(1, "Alert ID is required"),
});

// Get user alerts schema
export const getUserAlertsSchema = z.object({});

// Get emergency contacts schema
export const getEmergencyContactsSchema = z.object({});

// Get emergency statistics schema
export const getEmergencyStatisticsSchema = z.object({});

// Get critical alerts schema
export const getCriticalAlertsSchema = z.object({});

// Group all validators
export const emergencyAlertValidators = {
  create: createAlertSchema,
  updateStatus: updateAlertStatusSchema,
  addUpdate: addAlertUpdateSchema,
  findNearbyServices: findNearbyServicesSchema,
  findNearbyAlerts: findNearbyAlertsSchema,
  sendSOS: sendSOSSchema,
  alertId: alertIdSchema,
  getUserAlerts: getUserAlertsSchema,
  getEmergencyContacts: getEmergencyContactsSchema,
  getEmergencyStatistics: getEmergencyStatisticsSchema,
  getCriticalAlerts: getCriticalAlertsSchema,
};
