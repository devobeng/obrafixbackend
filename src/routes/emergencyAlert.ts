import express from "express";
import { EmergencyAlertController } from "../controllers/EmergencyAlertController";
import { authenticate } from "../middleware/auth";

const router = express.Router();
const emergencyAlertController = new EmergencyAlertController();

// All routes require authentication
router.use(authenticate());

// Emergency alert management
router.post("/", emergencyAlertController.createAlert);
router.get("/active", emergencyAlertController.getUserActiveAlerts);
router.get("/contacts", emergencyAlertController.getEmergencyContacts);
router.get("/statistics", emergencyAlertController.getEmergencyStatistics);

// Individual alert operations
router.get("/:alertId", emergencyAlertController.getAlertById);
router.put("/:alertId/status", emergencyAlertController.updateAlertStatus);
router.post("/:alertId/updates", emergencyAlertController.addAlertUpdate);
router.post("/:alertId/sos", emergencyAlertController.sendSOS);

// Location-based services
router.get("/services/nearby", emergencyAlertController.findNearbyServices);
router.get("/alerts/nearby", emergencyAlertController.findNearbyAlerts);

// Admin routes (for emergency response)
router.get("/critical/all", emergencyAlertController.getCriticalAlerts);

export default router;
