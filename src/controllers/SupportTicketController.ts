import { Request, Response, NextFunction } from "express";
import { SupportTicketService } from "../services/SupportTicketService";
import { AppError } from "../utils/AppError";

export class SupportTicketController {
  private supportTicketService: SupportTicketService;

  constructor() {
    this.supportTicketService = new SupportTicketService();
  }

  // Create support ticket
  createTicket = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const ticketData = req.body;

      const ticket = await this.supportTicketService.createTicket(
        userId,
        ticketData
      );

      res.status(201).json({
        success: true,
        data: ticket,
        message: "Support ticket created successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // Get user's tickets
  getUserTickets = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { status, page = "1", limit = "10" } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      const result = await this.supportTicketService.getUserTickets(
        userId,
        status as string,
        pageNum,
        limitNum
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get ticket by ID
  getTicketById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { ticketId } = req.params;

      const ticket = await this.supportTicketService.getTicketById(
        ticketId,
        userId
      );

      res.status(200).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  };

  // Update ticket
  updateTicket = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { ticketId } = req.params;
      const updateData = req.body;

      const ticket = await this.supportTicketService.updateTicket(
        ticketId,
        userId,
        updateData
      );

      res.status(200).json({
        success: true,
        data: ticket,
        message: "Support ticket updated successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // Add comment to ticket
  addComment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { ticketId } = req.params;
      const { comment } = req.body;

      if (!comment || typeof comment !== "string") {
        throw new AppError("Comment is required", 400);
      }

      const ticket = await this.supportTicketService.addComment(
        ticketId,
        userId,
        comment
      );

      res.status(200).json({
        success: true,
        data: ticket,
        message: "Comment added successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // Close ticket
  closeTicket = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { ticketId } = req.params;

      const ticket = await this.supportTicketService.closeTicket(
        ticketId,
        userId
      );

      res.status(200).json({
        success: true,
        data: ticket,
        message: "Support ticket closed successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // Reopen ticket
  reopenTicket = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { ticketId } = req.params;

      const ticket = await this.supportTicketService.reopenTicket(
        ticketId,
        userId
      );

      res.status(200).json({
        success: true,
        data: ticket,
        message: "Support ticket reopened successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // Get ticket statistics
  getTicketStatistics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user.id;

      const statistics = await this.supportTicketService.getTicketStatistics(
        userId
      );

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  };

  // Search tickets
  searchTickets = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { q: searchTerm, page = "1", limit = "10" } = req.query;

      if (!searchTerm || typeof searchTerm !== "string") {
        throw new AppError("Search term is required", 400);
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      const result = await this.supportTicketService.searchTickets(
        userId,
        searchTerm,
        pageNum,
        limitNum
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
