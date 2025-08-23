import express from "express";
import { SupportTicketController } from "../controllers/SupportTicketController";
import { authenticate } from "../middleware/auth";

const router = express.Router();
const supportTicketController = new SupportTicketController();

// All routes require authentication
router.use(authenticate());

// Support ticket management
router.post("/", supportTicketController.createTicket);
router.get("/", supportTicketController.getUserTickets);
router.get("/statistics", supportTicketController.getTicketStatistics);
router.get("/search", supportTicketController.searchTickets);

// Individual ticket operations
router.get("/:ticketId", supportTicketController.getTicketById);
router.put("/:ticketId", supportTicketController.updateTicket);
router.post("/:ticketId/comments", supportTicketController.addComment);
router.post("/:ticketId/close", supportTicketController.closeTicket);
router.post("/:ticketId/reopen", supportTicketController.reopenTicket);

export default router;
