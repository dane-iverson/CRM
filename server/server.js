const path = require("path");
const crypto = require("crypto");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");
const schedule = require("node-schedule");
const jwt = require("jsonwebtoken");
const Lead = require("./models/lead");
const User = require("./models/user");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:2901")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow same-origin server requests and non-browser clients (Postman/curl).
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS origin not allowed"));
  },
  optionsSuccessStatus: 200,
};

const requestLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX || 200),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/health",
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many requests, please try again later.",
      requestId: req.requestId,
    });
  },
});

const handleServerError = (res, req, error, statusCode = 500) => {
  console.error(`[${req.requestId}]`, error);

  return res.status(statusCode).json({
    error: statusCode === 500 ? "Internal server error" : error.message,
    requestId: req.requestId,
  });
};

// Middleware
app.set("trust proxy", 1);
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});
app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms [${req.requestId}]`,
    );
  });

  next();
});
app.use(helmet());
app.use(cors(corsOptions));
app.use(requestLimiter);
app.use(express.json());

// Health check endpoint for hosting platforms and uptime checks.
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    requestId: req.requestId,
  });
});

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// Routes

// POST /auth/register - Register new user
app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, role = "rep", adminCode } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    if (role === "admin") {
      if (!process.env.ADMIN_SECRET) {
        return res
          .status(500)
          .json({ error: "Admin registration is not configured" });
      }
      if (adminCode !== process.env.ADMIN_SECRET) {
        return res.status(403).json({ error: "Invalid admin code" });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }
    const newUser = new User({ name, email, password, role });
    await newUser.save();
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    return handleServerError(res, req, err);
  }
});

// POST /auth/login - Login user
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    return handleServerError(res, req, err);
  }
});

// GET /leads - return leads for the current user, or all leads for an admin
app.get("/leads", authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (req.user.role !== "admin") {
      query.userId = req.user.id;
    }
    if (status) query.status = status;

    const leads = await Lead.find(query).populate("userId", "name email role");
    res.json(leads);
  } catch (err) {
    return handleServerError(res, req, err);
  }
});

// POST /leads - create new lead
app.post("/leads", authenticateToken, async (req, res) => {
  try {
    const { name, phone, email, notes, product, status, followUpDate } =
      req.body;
    // Basic validation
    if (!name || !phone) {
      return res.status(400).json({ error: "Name and phone are required" });
    }
    const lead = new Lead({
      userId: req.user.id,
      name,
      phone,
      email,
      notes,
      product,
      status,
      followUpDate,
    });
    await lead.save();
    res.status(201).json(lead);
  } catch (err) {
    return handleServerError(res, req, err);
  }
});

// PUT /leads/:id - update lead
app.put("/leads/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const query = { _id: id };
    if (req.user.role !== "admin") {
      query.userId = req.user.id;
    }
    const lead = await Lead.findOneAndUpdate(query, updates, {
      new: true,
      runValidators: true,
    }).populate("userId", "name email role");
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.json(lead);
  } catch (err) {
    return handleServerError(res, req, err);
  }
});

// DELETE /leads/:id - delete lead
app.delete("/leads/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const query = { _id: id };
    if (req.user.role !== "admin") {
      query.userId = req.user.id;
    }
    const lead = await Lead.findOneAndDelete(query);
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.json({ message: "Lead deleted" });
  } catch (err) {
    return handleServerError(res, req, err);
  }
});

// GET /leads/search?query=... - search by name or phone
app.get("/leads/search", authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }
    const searchQuery = {
      $or: [
        { name: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
      ],
    };
    if (req.user.role !== "admin") {
      searchQuery.userId = req.user.id;
    }
    const leads = await Lead.find(searchQuery).populate(
      "userId",
      "name email role",
    );
    res.json(leads);
  } catch (err) {
    return handleServerError(res, req, err);
  }
});

app.use((err, req, res, next) => {
  if (err && err.message === "CORS origin not allowed") {
    return res.status(403).json({
      error: "CORS origin not allowed",
      requestId: req.requestId,
    });
  }

  return handleServerError(res, req, err);
});

// POST /reminder/:leadId - schedule reminder
app.post("/reminder/:leadId", authenticateToken, async (req, res) => {
  try {
    const { leadId } = req.params;
    const { date, email, sms } = req.body;
    const query = { _id: leadId };
    if (req.user.role !== "admin") {
      query.userId = req.user.id;
    }
    const lead = await Lead.findOneAndUpdate(
      query,
      {
        followUpDate: new Date(date),
        reminderEmail: email,
        reminderSms: sms,
      },
      { new: true },
    );
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.json({ message: "Reminder scheduled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Function to send reminder email
const sendReminderEmail = async (lead) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: lead.email, // Send to lead's email
    subject: `Follow-up Reminder for Lead: ${lead.name}`,
    html: `
      <h2>Follow-up Reminder</h2>
      <p><strong>Name:</strong> ${lead.name}</p>
      <p><strong>Phone:</strong> ${lead.phone}</p>
      <p><strong>Product/Service:</strong> ${lead.product || "N/A"}</p>
      <p><strong>Status:</strong> ${lead.status}</p>
      <p><strong>Follow-up Date:</strong> ${lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : "N/A"}</p>
      <p>Please follow up with this lead.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reminder email sent to ${lead.email} for lead ${lead.name}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

// Schedule daily check for overdue reminders
schedule.scheduleJob("0 9 * * *", async () => {
  // Run daily at 9 AM
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueLeads = await Lead.find({
      followUpDate: { $lte: today },
      reminderEmail: true,
      email: { $exists: true, $ne: null },
    });
    for (const lead of overdueLeads) {
      await sendReminderEmail(lead);
    }
  } catch (error) {
    console.error("Error checking reminders:", error);
  }
});

// Start server
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const shutdown = async (signal) => {
  console.log(`Received ${signal}, shutting down server...`);
  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      console.log("HTTP server closed.");
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("MongoDB connection closed.");
    }
    if (typeof schedule.gracefulShutdown === "function") {
      await schedule.gracefulShutdown();
      console.log("Scheduler shut down.");
    }
  } catch (err) {
    console.error("Error during shutdown:", err);
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
