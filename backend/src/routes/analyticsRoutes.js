// src/routes/analyticsRoutes.js
import { Router } from "express";
import * as analyticsController from "../controllers/analyticsController.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.use(authenticate);

router.get("/workspace", analyticsController.getWorkspaceAnalytics);
router.get("/boards/:id", analyticsController.getBoardAnalytics);

export default router;
