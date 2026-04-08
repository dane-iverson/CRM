const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    notes: String,
    product: String,
    status: {
      type: String,
      enum: ["New", "Contacted", "Quoted", "Closed"],
      default: "New",
    },
    followUpDate: Date,
    reminderEmail: { type: Boolean, default: false },
    reminderSms: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Lead", leadSchema);
