let io = null;

// Set Socket.IO instance
const setIO = (socketIO) => {
  io = socketIO;
};

// Get Socket.IO instance
const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
};

module.exports = {
  setIO,
  getIO,
};