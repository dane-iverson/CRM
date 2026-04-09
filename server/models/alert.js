const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },
    level: {
      type: String,
      enum: ["warning", "critical"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "resolved", "dismissed"],
      default: "active",
    },
    resolvedAt: Date,
    dismissedAt: Date,
  },
  { timestamps: true },
);

alertSchema.index(
  { leadId: 1, userId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  },
);

module.exports = mongoose.model("Alert", alertSchema);
