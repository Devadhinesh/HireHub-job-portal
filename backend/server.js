const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const Message = require("./models/Message");
const Notification = require("./models/Notification");
const { setIO } = require("./socket");

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

setIO(io);
connectDB();

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`REQUEST: ${req.method} ${req.originalUrl}`);
  next();
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/candidates/profile", require("./routes/candidateProfileRoutes"));
app.use("/api/jobs", require("./routes/jobRoutes"));
app.use("/api/applications", require("./routes/applicationRoutes"));
app.use("/api/interviews", require("./routes/interviewRoutes"));
app.use("/api/saved-jobs", require("./routes/savedJobRoutes"));
app.use("/api/recruiter-profile", require("./routes/recruiterProfileRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinUser", (userId) => {
    if (!userId) {
      console.log("joinUser: userId missing");
      return;
    }

    const roomId = userId.toString();
    socket.userId = roomId;
    socket.join(roomId);

    if (!onlineUsers.has(roomId)) {
      onlineUsers.set(roomId, new Set());
    }

    onlineUsers.get(roomId).add(socket.id);

    console.log(`User ${roomId} joined room`);

    if (onlineUsers.get(roomId).size === 1) {
      io.emit("userOnline", { userId: roomId });
    }
  });

  socket.on("getOnlineUsers", () => {
    socket.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });

  socket.on("typing", (data) => {
    try {
      const { sender, receiver } = data;

      if (!sender || !receiver) return;

      io.to(receiver.toString()).emit("userTyping", {
        sender: sender.toString(),
      });
    } catch (error) {
      console.error("Typing error:", error.message);
    }
  });

  socket.on("stopTyping", (data) => {
    try {
      const { sender, receiver } = data;

      if (!sender || !receiver) return;

      io.to(receiver.toString()).emit("userStopTyping", {
        sender: sender.toString(),
      });
    } catch (error) {
      console.error("Stop typing error:", error.message);
    }
  });

  socket.on("sendMessage", async (data) => {
    try {
      const { sender, receiver, content } = data;

      if (!sender || !receiver || !content?.trim()) return;

      if (sender.toString() === receiver.toString()) return;

      io.to(receiver.toString()).emit("userStopTyping", {
        sender: sender.toString(),
      });

      const message = await Message.create({
        sender,
        receiver,
        content: content.trim(),
      });

      const populatedMessage = await Message.findById(message._id)
        .populate("sender", "name email role")
        .populate("receiver", "name email role");

      io.to(receiver.toString()).emit("receiveMessage", populatedMessage);
      io.to(sender.toString()).emit("messageSent", populatedMessage);

      try {
        const notification = await Notification.create({
          recipient: receiver,
          sender,
          type: "message",
          message: message._id,
          title: `New message from ${populatedMessage.sender?.name || "User"}`,
          content: content.trim(),
          isRead: false,
        });

        const populatedNotification = await Notification.findById(notification._id)
          .populate("sender", "name email role")
          .populate("recipient", "name email role")
          .populate("message");

        io.to(receiver.toString()).emit("newMessageNotification", populatedNotification);

        console.log(`Notification sent to receiver: ${receiver}`);
      } catch (notificationError) {
        console.error("Notification creation error:", notificationError.message);
      }

      console.log(`Message sent from ${sender} to ${receiver}`);
    } catch (error) {
      console.error("Socket message error:", error.message);

      socket.emit("messageError", {
        message: "Failed to send message",
      });
    }
  });

  socket.on("markMessageRead", async (messageId) => {
    try {
      const message = await Message.findById(messageId);

      if (!message) return;

      message.isRead = true;
      await message.save();

      io.to(message.sender.toString()).emit("messageRead", message);
    } catch (error) {
      console.error("Mark message read error:", error.message);
    }
  });

  socket.on("disconnect", () => {
    const userId = socket.userId;

    if (userId && onlineUsers.has(userId)) {
      const userSockets = onlineUsers.get(userId);

      userSockets.delete(socket.id);

      if (userSockets.size === 0) {
        onlineUsers.delete(userId);

        io.emit("userOffline", {
          userId,
        });

        console.log(`User ${userId} went offline`);
      }
    }

    console.log("User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    message: "HireHub Backend API",
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});