import mongoose from "mongoose";

const { Schema } = mongoose;

const chatMessageSchema = new Schema(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    senderEmail: {
      type: String,
      trim: true,
      default: "",
    },
    senderAvatar: {
      type: String,
      default: null,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

function transform(doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  ret.boardId = ret.boardId?.toString?.() ?? ret.boardId;
  ret.senderId = ret.sender?.toString?.() ?? ret.sender;
  delete ret.sender;
  return ret;
}

chatMessageSchema.set("toJSON", { transform });
chatMessageSchema.set("toObject", { transform });

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
