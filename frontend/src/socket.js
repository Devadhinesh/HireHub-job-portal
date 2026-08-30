import { io } from "socket.io-client";

const SERVER_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const socket = io(SERVER_URL, {
  autoConnect: true,
});

export default socket;