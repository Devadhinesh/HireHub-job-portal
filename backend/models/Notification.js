const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["message", "interview"],
      default: "message",
      required: true,
    },

    // Used for message notifications
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: false,
    },

    // Used for message notifications
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: false,
    },

    // Used for interview notifications
    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      required: false,
    },

    // Used for interview notifications
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: false,
    },

    title: {
      type: String,
      default: "Notification",
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);