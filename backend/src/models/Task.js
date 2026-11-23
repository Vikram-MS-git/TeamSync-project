import mongoose from "mongoose";
const { Schema } = mongoose;

const attachmentSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String },
    size: { type: Number, default: 0 },
    mimeType: { type: String, default: "application/octet-stream" },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
    uploadedByName: { type: String, default: "Team Member" },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const taskSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  // `assignee` stays a display-name string (kept for backward compatibility
  // with the stats aggregation and the existing UI, which key off names).
  // `assigneeId` is the real, reliable link to a User — that's what
  // permission checks (e.g. "can this user move this task?") use.
  assignee: { type: String },
  assigneeId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  // Stored as free text (e.g. "Aug 12", "No date"), not a real Date —
  // this matches how the frontend reads/writes it (plain text input).
  dueDate: { type: String },
  description: { type: String },
  boardId: { type: Schema.Types.ObjectId, ref: "Board", required: true, index: true },
  columnId: { type: Schema.Types.ObjectId, required: true, index: true },
  version: { type: Number, required: true, default: 0 },
  attachments: [attachmentSchema],
}, { timestamps: true });

// Same transform as User.js / Board.js: _id -> id, drop __v, so the
// frontend (which reads task.id everywhere) gets the shape it expects.
function transform(doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  if (ret.assigneeId) ret.assigneeId = ret.assigneeId.toString();
  if (Array.isArray(ret.attachments)) {
    ret.attachments = ret.attachments.map((att) => ({
      id: att._id ? att._id.toString() : att.id,
      name: att.name,
      url: att.url,
      publicId: att.publicId,
      size: att.size,
      mimeType: att.mimeType,
      uploadedBy: att.uploadedBy ? att.uploadedBy.toString() : undefined,
      uploadedByName: att.uploadedByName,
      uploadedAt: att.uploadedAt,
    }));
  }
  return ret;
}
taskSchema.set("toJSON", { transform });
taskSchema.set("toObject", { transform });

export const Task = mongoose.model("Task", taskSchema);