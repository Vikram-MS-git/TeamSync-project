// src/controllers/analyticsController.js
import * as analyticsService from "../services/analyticsService.js";
import { catchAsync } from "../utils/catchAsync.js";

export const getBoardAnalytics = catchAsync(async (req, res) => {
  const analytics = await analyticsService.getBoardAnalytics(req.params.id, req.user.id);
  res.json(analytics);
});

export const getWorkspaceAnalytics = catchAsync(async (req, res) => {
  const analytics = await analyticsService.getWorkspaceAnalytics(req.user.id);
  res.json(analytics);
});
