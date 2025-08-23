import { SupportTicket, ISupportTicket } from "../models/SupportTicket";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";

export class SupportTicketService {
  // Create a new support ticket
  async createTicket(
    userId: string,
    ticketData: {
      subject: string;
      description: string;
      category: string;
      attachments?: string[];
      tags?: string[];
      isUrgent?: boolean;
    }
  ): Promise<ISupportTicket> {
    try {
      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Create ticket
      const ticket = new SupportTicket({
        userId,
        ...ticketData,
      });

      await ticket.save();
      return ticket;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to create support ticket", 500);
    }
  }

  // Get user's tickets
  async getUserTickets(
    userId: string,
    status?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    tickets: ISupportTicket[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const query: any = { userId };
      if (status) {
        query.status = status;
      }

      const [tickets, total] = await Promise.all([
        SupportTicket.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("assignedTo", "firstName lastName email")
          .lean(),
        SupportTicket.countDocuments(query),
      ]);

      return {
        tickets,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new AppError("Failed to retrieve user tickets", 500);
    }
  }

  // Get ticket by ID
  async getTicketById(
    ticketId: string,
    userId?: string
  ): Promise<ISupportTicket> {
    try {
      const query: any = { _id: ticketId };
      if (userId) {
        query.userId = userId; // Ensure user can only access their own tickets
      }

      const ticket = await SupportTicket.findOne(query)
        .populate("userId", "firstName lastName email phone")
        .populate("assignedTo", "firstName lastName email");

      if (!ticket) {
        throw new AppError("Support ticket not found", 404);
      }

      return ticket;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to retrieve support ticket", 500);
    }
  }

  // Update ticket
  async updateTicket(
    ticketId: string,
    userId: string,
    updateData: {
      subject?: string;
      description?: string;
      category?: string;
      tags?: string[];
      isUrgent?: boolean;
    }
  ): Promise<ISupportTicket> {
    try {
      const ticket = await SupportTicket.findOne({
        _id: ticketId,
        userId,
      });

      if (!ticket) {
        throw new AppError("Support ticket not found", 404);
      }

      // Only allow updates if ticket is not closed
      if (ticket.status === "closed") {
        throw new AppError("Cannot update closed ticket", 400);
      }

      // Update ticket
      Object.assign(ticket, updateData);
      await ticket.save();

      return ticket;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to update support ticket", 500);
    }
  }

  // Add comment to ticket
  async addComment(
    ticketId: string,
    userId: string,
    comment: string
  ): Promise<ISupportTicket> {
    try {
      const ticket = await SupportTicket.findOne({
        _id: ticketId,
        userId,
      });

      if (!ticket) {
        throw new AppError("Support ticket not found", 404);
      }

      if (ticket.status === "closed") {
        throw new AppError("Cannot add comment to closed ticket", 400);
      }

      // Add comment to ticket
      ticket.comments = ticket.comments || [];
      ticket.comments.push({
        userId,
        comment,
        timestamp: new Date(),
      });

      // Update status to "in_progress" if it was "open"
      if (ticket.status === "open") {
        ticket.status = "in_progress";
      }

      await ticket.save();
      return ticket;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to add comment", 500);
    }
  }

  // Close ticket
  async closeTicket(ticketId: string, userId: string): Promise<ISupportTicket> {
    try {
      const ticket = await SupportTicket.findOne({
        _id: ticketId,
        userId,
      });

      if (!ticket) {
        throw new AppError("Support ticket not found", 404);
      }

      if (ticket.status === "closed") {
        throw new AppError("Ticket is already closed", 400);
      }

      ticket.status = "closed";
      ticket.closedAt = new Date();
      await ticket.save();

      return ticket;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to close ticket", 500);
    }
  }

  // Reopen ticket
  async reopenTicket(
    ticketId: string,
    userId: string
  ): Promise<ISupportTicket> {
    try {
      const ticket = await SupportTicket.findOne({
        _id: ticketId,
        userId,
      });

      if (!ticket) {
        throw new AppError("Support ticket not found", 404);
      }

      if (ticket.status !== "closed") {
        throw new AppError("Ticket is not closed", 400);
      }

      ticket.status = "open";
      ticket.closedAt = undefined;
      await ticket.save();

      return ticket;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to reopen ticket", 500);
    }
  }

  // Get ticket statistics
  async getTicketStatistics(userId: string): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    urgent: number;
  }> {
    try {
      const stats = await SupportTicket.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const urgentCount = await SupportTicket.countDocuments({
        userId,
        isUrgent: true,
      });

      const result = {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        urgent: urgentCount,
      };

      stats.forEach((stat) => {
        result.total += stat.count;
        switch (stat._id) {
          case "open":
            result.open = stat.count;
            break;
          case "in_progress":
            result.inProgress = stat.count;
            break;
          case "resolved":
            result.resolved = stat.count;
            break;
          case "closed":
            result.closed = stat.count;
            break;
        }
      });

      return result;
    } catch (error) {
      throw new AppError("Failed to retrieve ticket statistics", 500);
    }
  }

  // Search tickets
  async searchTickets(
    userId: string,
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    tickets: ISupportTicket[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new AppError(
          "Search term must be at least 2 characters long",
          400
        );
      }

      const query = {
        userId,
        $or: [
          { subject: { $regex: searchTerm.trim(), $options: "i" } },
          { description: { $regex: searchTerm.trim(), $options: "i" } },
          { tags: { $in: [new RegExp(searchTerm.trim(), "i")] } },
        ],
      };

      const [tickets, total] = await Promise.all([
        SupportTicket.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("assignedTo", "firstName lastName email")
          .lean(),
        SupportTicket.countDocuments(query),
      ]);

      return {
        tickets,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to search tickets", 500);
    }
  }
}
