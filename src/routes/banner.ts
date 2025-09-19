import express from "express";
import { Banner } from "../models/Banner";
import { authenticate } from "../middleware/auth";
import { requireAnyRole } from "../middleware/roleAuth";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";

const router = express.Router();

// Get active banners (public endpoint)
router.get(
  "/active",
  catchAsync(async (req, res) => {
    const { audience = "all", roles } = req.query;

    const query: any = {
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    };

    if (audience !== "all") {
      query.targetAudience = audience;
    }

    if (roles && typeof roles === "string") {
      const roleArray = roles.split(",");
      query.targetRoles = { $in: roleArray };
    }

    const banners = await Banner.find(query)
      .sort({ priority: -1, displayOrder: 1, createdAt: -1 })
      .populate("createdBy", "firstName lastName");

    res.json({
      success: true,
      message: "Active banners retrieved successfully",
      data: banners,
    });
  })
);

// Get all banners (admin only)
router.get(
  "/",
  authenticate(),
  requireAnyRole(["admin"]),
  catchAsync(async (req, res) => {
    const { page = 1, limit = 10, status, type } = req.query;

    const query: any = {};
    if (status) query.isActive = status === "active";
    if (type) query.type = type;

    const banners = await Banner.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "firstName lastName")
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Banner.countDocuments(query);

    res.json({
      success: true,
      message: "Banners retrieved successfully",
      data: banners,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  })
);

// Get banner by ID
router.get(
  "/:id",
  authenticate(),
  requireAnyRole(["admin"]),
  catchAsync(async (req, res) => {
    const banner = await Banner.findById(req.params.id).populate(
      "createdBy",
      "firstName lastName"
    );

    if (!banner) {
      throw new AppError("Banner not found", 404);
    }

    res.json({
      success: true,
      message: "Banner retrieved successfully",
      data: banner,
    });
  })
);

// Create banner (admin only)
router.post(
  "/",
  authenticate(),
  requireAnyRole(["admin"]),
  catchAsync(async (req, res) => {
    const bannerData = {
      ...req.body,
      createdBy: req.user?.id,
    };

    const banner = await Banner.create(bannerData);

    res.status(201).json({
      success: true,
      message: "Banner created successfully",
      data: banner,
    });
  })
);

// Update banner (admin only)
router.put(
  "/:id",
  authenticate(),
  requireAnyRole(["admin"]),
  catchAsync(async (req, res) => {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "firstName lastName");

    if (!banner) {
      throw new AppError("Banner not found", 404);
    }

    res.json({
      success: true,
      message: "Banner updated successfully",
      data: banner,
    });
  })
);

// Delete banner (admin only)
router.delete(
  "/:id",
  authenticate(),
  requireAnyRole(["admin"]),
  catchAsync(async (req, res) => {
    const banner = await Banner.findByIdAndDelete(req.params.id);

    if (!banner) {
      throw new AppError("Banner not found", 404);
    }

    res.json({
      success: true,
      message: "Banner deleted successfully",
    });
  })
);

// Increment view count
router.post(
  "/:id/view",
  catchAsync(async (req, res) => {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      throw new AppError("Banner not found", 404);
    }

    await banner.incrementViewCount();

    res.json({
      success: true,
      message: "View count incremented",
    });
  })
);

// Increment click count
router.post(
  "/:id/click",
  catchAsync(async (req, res) => {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      throw new AppError("Banner not found", 404);
    }

    await banner.incrementClickCount();

    res.json({
      success: true,
      message: "Click count incremented",
    });
  })
);

export default router;
