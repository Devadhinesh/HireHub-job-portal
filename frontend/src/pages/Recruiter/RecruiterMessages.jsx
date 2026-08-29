import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { FiMessageSquare, FiSend, FiSearch, FiTrash2, FiCheck, FiCheckCircle, FiArrowLeft } from "react-icons/fi";
import { useAuth } from "../../components/context/AuthContext";
import "./RecruiterMessages.css";

const SERVER_URL = "http://localhost:5000";
const MESSAGE_API = `${SERVER_URL}/api/messages`;
const APPLICATION_API = `${SERVER_URL}/api/applications/recruiter`;

const RecruiterMessages = () => {
  const { user, token } = useAuth();

  const [messages, setMessages] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const selectedUserRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  // const [candidateProfiles, setCandidateProfiles] = useState({});

  const getUserId = () => {
    return user?._id || user?.id || user?.userId || user?.user?._id || user?.user?.id;
  };

  const currentUserId = getUserId();

  const getPhotoUrl = (photo) => {
    if (!photo || typeof photo !== "string") return null;
    if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;
    if (photo.startsWith("/")) return `${SERVER_URL}${photo}`;
    return `${SERVER_URL}/${photo}`;
  };

  // const fetchCandidateProfile = async (candidateId) => {
  //   try {
  //     const response = await axios.get(
  //       `${SERVER_URL}/api/candidates/profile/${candidateId}`,
  //       { headers: { Authorization: `Bearer ${token}` } }
  //     );

  //     return response.data.profile || null;
  //   } catch (error) {
  //     console.error(
  //       "Candidate profile error:",
  //       error.response?.data?.message || error.message
  //     );
  //     return null;
  //   }
  // };

  const getProfilePhoto = (person) => {
    return person?.profilePhoto || person?.profile?.profilePhoto || person?.candidateProfile?.profilePhoto || person?.user?.profilePhoto || null;
  };

  const getPersonName = (person) => {
    return person?.fullName || person?.name || person?.profile?.fullName || person?.candidateProfile?.fullName || person?.user?.name || "Candidate";
  };

  const getPersonEmail = (person) => {
    return person?.email || person?.user?.email || person?.profile?.email || "";
  };

  const isSelectedUserOnline = selectedUser ? onlineUsers.has(selectedUser._id?.toString()) : false;

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  };

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  const fetchRecruiterData = async () => {
    if (!token) return;

    try {
      setLoadingMessages(true);
      setError("");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const [messagesResponse, applicationsResponse] = await Promise.all([
        axios.get(MESSAGE_API, config),
        axios.get(APPLICATION_API, config),
      ]);

      const messageData = Array.isArray(messagesResponse.data.messages) ? messagesResponse.data.messages : [];
      setMessages(messageData);

      const applicationData = Array.isArray(applicationsResponse.data.applications) ? applicationsResponse.data.applications : [];
      console.log("Recruiter applications:", applicationsResponse.data);

      const candidateMap = new Map();

      applicationData.forEach((application) => {
        const candidate = application.candidate || application.user || application.candidateUser;
        if (!candidate) return;

        const candidateId = candidate._id || candidate.id;
        if (!candidateId) return;

        candidateMap.set(candidateId.toString(), {
          ...candidate,
          _id: candidateId,
          role: "candidate",
          profilePhoto: candidate.profilePhoto || candidate.profile?.profilePhoto || candidate.candidateProfile?.profilePhoto || candidate.user?.profilePhoto || null,
          fullName: candidate.fullName || candidate.profile?.fullName || candidate.candidateProfile?.fullName || candidate.name || candidate.user?.name || "Candidate",
          email: candidate.email || candidate.user?.email || "",
        });
      });

      const candidateList = Array.from(candidateMap.values());
      console.log("Recruiter candidates:", candidateList);
      setCandidates(candidateList);
    } catch (error) {
      console.error("Fetch recruiter messaging data error:", error.response?.data?.message || error.message);
      setError(error.response?.data?.message || "Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRecruiterData();
    }
  }, [token]);

  const getConversationUsers = () => {
    const usersMap = new Map();

    candidates.forEach((candidate) => {
      if (!candidate?._id) return;
      usersMap.set(candidate._id.toString(), {
        ...candidate,
        _id: candidate._id,
        lastMessage: "",
        lastMessageDate: null,
        unreadCount: 0,
      });
    });

    messages.forEach((message) => {
      const sender = message.sender;
      const receiver = message.receiver;

      if (!sender || !receiver) return;

      const senderId = sender._id?.toString();
      const currentId = currentUserId?.toString();
      const otherUser = senderId === currentId ? receiver : sender;

      if (!otherUser?._id) return;

      const otherUserId = otherUser._id.toString();
      const isCandidate = candidates.some((candidate) => candidate._id?.toString() === otherUserId);

      if (!isCandidate) return;

      const existing = usersMap.get(otherUserId);

      if (!existing || !existing.lastMessageDate || new Date(message.createdAt) > new Date(existing.lastMessageDate)) {
        usersMap.set(otherUserId, {
          ...existing,
          ...otherUser,
          _id: otherUser._id,
          name: getPersonName(existing || otherUser),
          email: getPersonEmail(existing || otherUser),
          profilePhoto: getProfilePhoto(existing || otherUser),
          lastMessage: message.content,
          lastMessageDate: message.createdAt,
        });
      }
    });

    return Array.from(usersMap.values())
      .map((person) => {
        const unreadCount = messages.filter(
          (message) =>
            message.sender?._id?.toString() === person._id.toString() &&
            message.receiver?._id?.toString() === currentUserId?.toString() &&
            !message.isRead
        ).length;

        return {
          ...person,
          unreadCount,
        };
      })
      .sort((a, b) => {
        if (!a.lastMessageDate && !b.lastMessageDate) {
          return getPersonName(a).localeCompare(getPersonName(b));
        }
        if (!a.lastMessageDate) return 1;
        if (!b.lastMessageDate) return -1;
        return new Date(b.lastMessageDate) - new Date(a.lastMessageDate);
      });
  };

  const conversationUsers = getConversationUsers();
  const totalUnread = conversationUsers.reduce((total, person) => total + person.unreadCount, 0);

  const filteredUsers = conversationUsers.filter((person) => {
    const name = getPersonName(person).toLowerCase();
    const email = getPersonEmail(person).toLowerCase();
    const search = searchText.toLowerCase();
    return name.includes(search) || email.includes(search);
  });

  const markMessageAsRead = async (messageId, updateSocket = true) => {
    try {
      await axios.put(
        `${MESSAGE_API}/${messageId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setConversation((prev) =>
        prev.map((message) =>
          message._id === messageId ? { ...message, isRead: true } : message
        )
      );

      setMessages((prev) =>
        prev.map((message) =>
          message._id === messageId ? { ...message, isRead: true } : message
        )
      );

      if (updateSocket && socketRef.current?.connected) {
        socketRef.current.emit("markMessageRead", messageId);
      }
    } catch (error) {
      console.error("Mark message read error:", error);
    }
  };

  const fetchConversation = async (userId) => {
    if (!token || !userId) return;

    try {
      setLoadingConversation(true);

      const response = await axios.get(`${MESSAGE_API}/conversation/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = Array.isArray(response.data.messages) ? response.data.messages : [];

      setConversation(data);
      setIsTyping(false);
      scrollToBottom();

      const unreadMessages = data.filter(
        (message) =>
          message.receiver?._id?.toString() === currentUserId?.toString() &&
          !message.isRead
      );

      for (const message of unreadMessages) {
        await markMessageAsRead(message._id, false);
      }
    } catch (error) {
      console.error("Fetch conversation error:", error.response?.data?.message || error.message);
    } finally {
      setLoadingConversation(false);
    }
  };

  const handleSelectUser = async (person) => {
    setSelectedUser(person);
    selectedUserRef.current = person;
    setIsTyping(false);

    await fetchConversation(person._id);
  };

  useEffect(() => {
    if (!token || !currentUserId) return;

    const socket = io(SERVER_URL, {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Recruiter socket connected:", socket.id);
      socket.emit("joinUser", currentUserId.toString());
      socket.emit("getOnlineUsers");
    });

    socket.on("onlineUsers", (users) => {
      setOnlineUsers(new Set(users.map((id) => id.toString())));
    });

    socket.on("userOnline", ({ userId }) => {
      if (!userId) return;
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.add(userId.toString());
        return next;
      });
    });

    socket.on("userOffline", ({ userId }) => {
      if (!userId) return;
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId.toString());
        return next;
      });
    });

    socket.on("userTyping", ({ sender }) => {
      const selected = selectedUserRef.current;
      if (selected && sender?.toString() === selected._id?.toString()) {
        setIsTyping(true);
      }
    });

    socket.on("userStopTyping", ({ sender }) => {
      const selected = selectedUserRef.current;
      if (selected && sender?.toString() === selected._id?.toString()) {
        setIsTyping(false);
      }
    });

    socket.on("receiveMessage", (newMessage) => {
      console.log("Recruiter received message:", newMessage);
      setMessages((prev) => {
        const exists = prev.some((message) => message._id === newMessage._id);
        return exists ? prev : [newMessage, ...prev];
      });

      const senderId = newMessage.sender?._id?.toString();
      const selected = selectedUserRef.current;

      if (selected && senderId === selected._id?.toString()) {
        setConversation((prev) => {
          const exists = prev.some((message) => message._id === newMessage._id);
          return exists ? prev : [...prev, newMessage];
        });
        setIsTyping(false);
        scrollToBottom();
        markMessageAsRead(newMessage._id);
      }
    });

    socket.on("messageSent", (sentMessage) => {
      console.log("Recruiter message sent:", sentMessage);
      setMessages((prev) => {
        const exists = prev.some((message) => message._id === sentMessage._id);
        return exists ? prev : [sentMessage, ...prev];
      });

      const receiverId = sentMessage.receiver?._id?.toString();
      const selected = selectedUserRef.current;

      if (selected && receiverId === selected._id?.toString()) {
        setConversation((prev) => {
          const exists = prev.some((message) => message._id === sentMessage._id);
          return exists ? prev : [...prev, sentMessage];
        });
        scrollToBottom();
      }
    });

    socket.on("messageRead", (updatedMessage) => {
      setConversation((prev) =>
        prev.map((message) =>
          message._id === updatedMessage._id ? { ...message, isRead: true } : message
        )
      );
      setMessages((prev) =>
        prev.map((message) =>
          message._id === updatedMessage._id ? { ...message, isRead: true } : message
        )
      );
    });

    socket.on("messageError", (data) => {
      console.error("Recruiter message error:", data);
      setSending(false);
    });

    return () => {
      socket.off("onlineUsers");
      socket.off("userOnline");
      socket.off("userOffline");
      socket.off("userTyping");
      socket.off("userStopTyping");
      socket.off("receiveMessage");
      socket.off("messageSent");
      socket.off("messageRead");
      socket.off("messageError");

      clearTimeout(typingTimeoutRef.current);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, currentUserId]);

  const handleTyping = (event) => {
    const value = event.target.value;
    setMessageText(value);

    if (!selectedUser || !socketRef.current?.connected) return;

    socketRef.current.emit("typing", {
      sender: currentUserId,
      receiver: selectedUser._id,
    });

    clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("stopTyping", {
        sender: currentUserId,
        receiver: selectedUser._id,
      });
    }, 1000);
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const content = messageText.trim();

    if (!content || !selectedUser || !currentUserId || sending) return;

    try {
      setSending(true);
      clearTimeout(typingTimeoutRef.current);

      socketRef.current?.emit("stopTyping", {
        sender: currentUserId,
        receiver: selectedUser._id,
      });

      setIsTyping(false);

      if (socketRef.current?.connected) {
        socketRef.current.emit("sendMessage", {
          sender: currentUserId,
          receiver: selectedUser._id,
          content,
        });

        setMessageText("");
        setTimeout(() => setSending(false), 300);
        return;
      }

      const response = await axios.post(
        MESSAGE_API,
        {
          receiver: selectedUser._id,
          content,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const sentMessage = response.data.data;
      setConversation((prev) => [...prev, sentMessage]);
      setMessages((prev) => [sentMessage, ...prev]);
      setMessageText("");
      scrollToBottom();
    } catch (error) {
      console.error("Send message error:", error.response?.data?.message || error.message);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;

    try {
      await axios.delete(`${MESSAGE_API}/${messageId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setConversation((prev) => prev.filter((message) => message._id !== messageId));
      setMessages((prev) => prev.filter((message) => message._id !== messageId));
    } catch (error) {
      console.error("Delete message error:", error.response?.data?.message || error.message);
    }
  };

  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isMyMessage = (message) => {
    return message.sender?._id?.toString() === currentUserId?.toString();
  };

  return (
    <div className="recruiter-messages-page">
      <div className="recruiter-messages-header">
        <div>
          <h1>
            <FiMessageSquare /> Messages
            {totalUnread > 0 && (
              <span className="recruiter-messages-total-badge">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </h1>
          <p>Connect with candidates and manage your conversations.</p>
        </div>
      </div>

      {error && <div className="recruiter-message-error">{error}</div>}

      <div className="recruiter-messages-container">
        <aside className={`recruiter-conversations ${selectedUser ? "mobile-hidden" : ""}`}>
          <div className="recruiter-conversation-search">
            <FiSearch />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>

          <div className="recruiter-conversation-list">
            {loadingMessages ? (
              <div className="recruiter-conversation-loading">Loading candidates...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="recruiter-conversation-empty">
                <div className="recruiter-empty-icon">
                  <FiMessageSquare />
                </div>
                <h3>No candidates</h3>
                <p>Candidates from your job applications will appear here.</p>
              </div>
            ) : (
              filteredUsers.map((person) => {
                const photo = getProfilePhoto(person);
                const name = getPersonName(person);

                return (
                  <button
                    type="button"
                    key={person._id}
                    className={`recruiter-conversation-item ${selectedUser?._id === person._id ? "active" : ""} ${person.unreadCount > 0 ? "has-unread" : ""}`}
                    onClick={() => handleSelectUser(person)}
                  >
                    <div className="recruiter-conversation-avatar">
                      {getPhotoUrl(photo) ? (
                        <img src={getPhotoUrl(photo)} alt={name} />
                      ) : (
                        name.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="recruiter-conversation-content">
                      <div className="recruiter-conversation-top">
                        <strong>{name}</strong>
                        <div className="recruiter-conversation-time">
                          {person.lastMessageDate && (
                            <small>{formatTime(person.lastMessageDate)}</small>
                          )}
                          {person.unreadCount > 0 && (
                            <span className="recruiter-conversation-unread-badge">
                              {person.unreadCount > 99 ? "99+" : person.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <p>{person.lastMessage || "Start a conversation"}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className={`recruiter-chat ${selectedUser ? "mobile-visible" : ""}`}>
          {!selectedUser ? (
            <div className="recruiter-chat-welcome">
              <div className="recruiter-chat-welcome-icon">
                <FiMessageSquare />
              </div>
              <h2>Candidate Messages</h2>
              <p>Select a candidate to start or continue a conversation.</p>
            </div>
          ) : (
            <>
              <div className="recruiter-chat-header">
                <button
                  type="button"
                  className="recruiter-mobile-back-btn"
                  onClick={() => {
                    setSelectedUser(null);
                    selectedUserRef.current = null;
                    setIsTyping(false);
                  }}
                >
                  <FiArrowLeft />
                </button>

                <div className="recruiter-chat-user-avatar">
                  {getPhotoUrl(getProfilePhoto(selectedUser)) ? (
                    <img
                      src={getPhotoUrl(getProfilePhoto(selectedUser))}
                      alt={getPersonName(selectedUser)}
                    />
                  ) : (
                    getPersonName(selectedUser).charAt(0).toUpperCase()
                  )}
                </div>

                <div className="recruiter-chat-user-info">
                  <h2>{getPersonName(selectedUser)}</h2>
                  <span>{isSelectedUserOnline ? "Online" : "Offline"}</span>
                </div>

                <div className={`recruiter-chat-status ${isSelectedUserOnline ? "online" : "offline"}`}>
                  <span />
                  {isSelectedUserOnline ? "Online" : "Offline"}
                </div>
              </div>

              <div className="recruiter-chat-messages">
                {loadingConversation ? (
                  <div className="recruiter-chat-loading">Loading conversation...</div>
                ) : conversation.length === 0 ? (
                  <div className="recruiter-chat-empty">
                    <div className="recruiter-chat-empty-icon">
                      <FiMessageSquare />
                    </div>
                    <h3>Start a conversation</h3>
                    <p>Send a message to {getPersonName(selectedUser)}.</p>
                  </div>
                ) : (
                  conversation.map((message, index) => {
                    const mine = isMyMessage(message);
                    const showDate =
                      index === 0 ||
                      formatDate(conversation[index - 1]?.createdAt) !==
                      formatDate(message.createdAt);

                    return (
                      <React.Fragment key={message._id}>
                        {showDate && (
                          <div className="recruiter-chat-date">
                            <span>{formatDate(message.createdAt)}</span>
                          </div>
                        )}

                        <div className={`recruiter-message-row ${mine ? "recruiter-message-own" : "recruiter-message-other"}`}>
                          <div className="recruiter-message-bubble">
                            <p>{message.content}</p>

                            <div className="recruiter-message-meta">
                              <span>{formatTime(message.createdAt)}</span>
                              {mine && (
                                <span className="recruiter-message-status">
                                  {message.isRead ? <FiCheckCircle /> : <FiCheck />}
                                </span>
                              )}
                            </div>

                            {mine && (
                              <button
                                type="button"
                                className="recruiter-delete-message-btn"
                                title="Delete message"
                                onClick={() => handleDeleteMessage(message._id)}
                              >
                                <FiTrash2 />
                              </button>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}

                {isTyping && (
                  <div className="recruiter-typing-indicator">
                    <div className="recruiter-typing-bubble">
                      <span />
                      <span />
                      <span />
                    </div>
                    <small>{getPersonName(selectedUser)} is typing...</small>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <form className="recruiter-message-input-area" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  value={messageText}
                  onChange={handleTyping}
                  placeholder={`Type a message to ${getPersonName(selectedUser)}...`}
                  disabled={sending}
                />

                <button
                  type="submit"
                  disabled={!messageText.trim() || sending}
                >
                  <FiSend />
                  <span>{sending ? "Sending..." : "Send"}</span>
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default RecruiterMessages;