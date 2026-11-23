// src/routes/taskRoutes.js
import { Router } from "express";
import multer from "multer";
import * as taskController from "../controllers/taskController.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { createTaskSchema, updateTaskSchema } from "../schemas/taskSchema.js";
import { BadRequestError } from "../utils/AppError.js";

const fileFilter = (req, file, cb) => {
  // Allow documents, spreadsheets, presentations, text, archives, images
  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "text/markdown",
    "application/zip",
    "application/x-zip-compressed",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];

  if (
    allowedMimes.includes(file.mimetype) ||
    file.originalname.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|md|zip|png|jpe?g|gif|webp|svg)$/i)
  ) {
    cb(null, true);
  } else {
    cb(new BadRequestError("Unsupported file type. Please upload a PDF, Word document, Excel spreadsheet, image, or text file."));
  }
};

const uploadAttachment = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter,
});

const router = Router();

router.use(authenticate); // every route below requires a valid token

router.get("/", taskController.listTasks);
router.get("/:id", taskController.getTask);
router.post("/", validate(createTaskSchema), taskController.createTask);
router.patch("/:id", validate(updateTaskSchema), taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

// Task Attachments / File Sharing
router.post("/:id/attachments", uploadAttachment.single("file"), taskController.uploadAttachment);
router.delete("/:id/attachments/:attachmentId", taskController.removeAttachment);

export default router;
