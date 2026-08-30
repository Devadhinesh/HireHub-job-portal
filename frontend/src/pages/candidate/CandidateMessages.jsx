import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { FiMessageSquare, FiSend, FiSearch, FiTrash2, FiCheck, FiCheckCircle, FiArrowLeft } from "react-icons/fi";
import { useAuth } from "../../components/context/AuthContext";
import "./CandidateMessages.css";

const SERVER_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";
const MESSAGE_API = `${SERVER_URL}/api/messages`;
const PROFILE_API = `${SERVER_URL}/api/candidates/profile`;
const RECRUITER_PROFILE_API = `${SERVER_URL}/api/recruiter-profile`;

const CandidateMessages = () => {
  const { user, token } = useAuth();

  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [selectedRecruiterProfile, setSelectedRecruiterProfile] = useState(null);
  const [recruiterProfiles, setRecruiterProfiles] = useState({});

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const getUserId = () => user?._id || user?.id || user?.userId || user?.user?._id || user?.user?.id;
  const currentUserId = getUserId();

  /* PHOTO URL */
  const getPhotoUrl = (photo) => {
    if (!photo) return null;

    if (
      photo.startsWith("http://") ||
      photo.startsWith("https://")
    ) {
      return photo;
    }

    return `${SERVER_URL}${photo.startsWith("/") ? photo : `/${photo}`
      }`;
  };

  /* SCROLL */
  const scrollToBottom = (smooth = true) => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
    }, 80);
  };

  /* FETCH CANDIDATE PROFILE */
  const fetchCandidateProfile = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${PROFILE_API}/me`, { headers: { Authorization: `Bearer ${token}` } });
      const profile = response.data.profile || response.data.candidateProfile || response.data;
      setCandidateProfile(profile);
      console.log("Candidate profile:", profile);
      console.log("Profile photo:", profile?.profilePhoto);
    } catch (error) {
      console.error("Fetch candidate profile error:", error.response?.data?.message || error.message);
    }
  };

  const fetchRecruiterProfile = async (userId) => {
    if (!token || !userId) return null;

    try {
      const response = await axios.get(
        `${RECRUITER_PROFILE_API}/public/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const profile = response.data.profile;

      console.log("Recruiter profile:", profile);
      console.log("Recruiter profile photo:", profile?.profilePhoto);

      return profile;
    } catch (error) {
      console.error(
        "Fetch recruiter profile error:",
        error.response?.data?.message || error.message
      );

      return null;
    }
  };
  const fetchAllRecruiterProfiles = async (users) => {
    if (!token || !users?.length) return;

    const profileMap = {};

    await Promise.all(
      users.map(async (person) => {
        if (!person?._id) return;

        try {
          const response = await axios.get(
            `${RECRUITER_PROFILE_API}/public/${person._id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const profile = response.data.profile;

          if (profile) {
            profileMap[person._id.toString()] = profile;
          }
        } catch (error) {
          console.error(
            `Failed to fetch recruiter ${person._id} profile:`,
            error.response?.data?.message || error.message
          );
        }
      })
    );

    console.log("ALL RECRUITER PROFILES:", profileMap);

    setRecruiterProfiles(profileMap);
  };

  /* FETCH MESSAGES */
  const fetchMessages = async () => {
    if (!token) return;
    try {
      setLoadingMessages(true);
      setError("");
      const response = await axios.get(MESSAGE_API, { headers: { Authorization: `Bearer ${token}` } });
      const data = Array.isArray(response.data.messages) ? response.data.messages : [];
      setMessages(data);
    } catch (error) {
      console.error("Fetch messages error:", error.response?.data?.message || error.message);
      setError(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  /* INITIAL LOAD */
  useEffect(() => {
    if (!token) return;
    fetchMessages();
    fetchCandidateProfile();
  }, [token]);

  /* CONVERSATION USERS */
  const getConversationUsers = () => {
    const usersMap = new Map();

    messages.forEach((message) => {
      const sender = message.sender;
      const receiver = message.receiver;
      if (!sender || !receiver) return;

      const senderId = sender._id?.toString();
      const otherUser = senderId === currentUserId?.toString() ? receiver : sender;
      if (!otherUser?._id) return;

      const otherUserId = otherUser._id.toString();
      const existing = usersMap.get(otherUserId);

      if (!existing || new Date(message.createdAt) > new Date(existing.lastMessageDate)) {
        usersMap.set(otherUserId, { ...otherUser, lastMessage: message.content, lastMessageDate: message.createdAt });
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

        return { ...person, unreadCount };
      })
      .sort((a, b) => new Date(b.lastMessageDate) - new Date(a.lastMessageDate));
  };

  const conversationUsers = getConversationUsers();

  useEffect(() => {
    if (!token || conversationUsers.length === 0) return;

    fetchAllRecruiterProfiles(conversationUsers);
  }, [token, messages.length]);

  /* SEARCH */
  const filteredUsers = conversationUsers.filter((person) => {
    const name = person.name?.toLowerCase() || "";
    const email = person.email?.toLowerCase() || "";
    const search = searchText.toLowerCase();
    return name.includes(search) || email.includes(search);
  });

  /* FETCH CONVERSATION */
  const fetchConversation = async (userId) => {
    if (!token || !userId) return;
    try {
      setLoadingConversation(true);

      const response = await axios.get(`${MESSAGE_API}/conversation/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = Array.isArray(response.data.messages) ? response.data.messages : [];
      setConversation(data);
      scrollToBottom(false);

      const unreadMessages = data.filter(
        (message) => message.receiver?._id?.toString() === currentUserId?.toString() && !message.isRead
      );

      for (const message of unreadMessages) {
        await markMessageAsRead(message._id, false);
      }

      setMessages((prev) =>
        prev.map((message) => {
          const isCurrentConversation =
            (message.sender?._id?.toString() === userId.toString() &&
              message.receiver?._id?.toString() === currentUserId?.toString()) ||
            (message.sender?._id?.toString() === currentUserId?.toString() &&
              message.receiver?._id?.toString() === userId.toString());

          if (isCurrentConversation && message.receiver?._id?.toString() === currentUserId?.toString()) {
            return { ...message, isRead: true };
          }
          return message;
        })
      );
    } catch (error) {
      console.error("Fetch conversation error:", error.response?.data?.message || error.message);
    } finally {
      setLoadingConversation(false);
    }
  };

  /* SELECT USER */
  const handleSelectUser = async (person) => {
    setSelectedUser(person);

    // Fetch actual recruiter profile
    const recruiterProfile = await fetchRecruiterProfile(person._id);

    setSelectedRecruiterProfile(recruiterProfile);

    // Fetch conversation
    await fetchConversation(person._id);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 200);
  };

  /* MARK READ */
  const markMessageAsRead = async (messageId, updateSocket = true) => {
    try {
      await axios.put(`${MESSAGE_API}/${messageId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });

      setConversation((prev) =>
        prev.map((message) => (message._id === messageId ? { ...message, isRead: true } : message))
      );

      setMessages((prev) =>
        prev.map((message) => (message._id === messageId ? { ...message, isRead: true } : message))
      );

      if (updateSocket && socketRef.current) {
        socketRef.current.emit("markMessageRead", messageId);
      }
    } catch (error) {
      console.error("Mark message read error:", error);
    }
  };

  /* SOCKET */
  useEffect(() => {
    if (!token || !currentUserId) return;

    const socket = io(SERVER_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Candidate socket connected:", socket.id);
      socket.emit("joinUser", currentUserId.toString());
    });

    socket.on("receiveMessage", (newMessage) => {
      setMessages((prev) => {
        const exists = prev.some((message) => message._id === newMessage._id);
        return exists ? prev : [newMessage, ...prev];
      });

      const senderId = newMessage.sender?._id?.toString();

      if (selectedUser && senderId === selectedUser._id?.toString()) {
        setConversation((prev) => {
          const exists = prev.some((message) => message._id === newMessage._id);
          return exists ? prev : [...prev, newMessage];
        });

        scrollToBottom();
        markMessageAsRead(newMessage._id);
      }
    });

    socket.on("messageSent", (sentMessage) => {
      setMessages((prev) => {
        const exists = prev.some((message) => message._id === sentMessage._id);
        return exists ? prev : [sentMessage, ...prev];
      });

      const receiverId = sentMessage.receiver?._id?.toString();

      if (selectedUser && receiverId === selectedUser._id?.toString()) {
        setConversation((prev) => {
          const exists = prev.some((message) => message._id === sentMessage._id);
          return exists ? prev : [...prev, sentMessage];
        });

        scrollToBottom();
      }

      setSending(false);
    });

    socket.on("messageRead", (updatedMessage) => {
      setConversation((prev) =>
        prev.map((message) => (message._id === updatedMessage._id ? { ...message, isRead: true } : message))
      );

      setMessages((prev) =>
        prev.map((message) => (message._id === updatedMessage._id ? { ...message, isRead: true } : message))
      );
    });

    socket.on("messageError", (data) => {
      console.error("Socket message error:", data);
      setSending(false);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("messageSent");
      socket.off("messageRead");
      socket.off("messageError");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, currentUserId, selectedUser]);

  /* SEND MESSAGE */
  const handleSendMessage = async (event) => {
    event.preventDefault();
    const content = messageText.trim();

    if (!content || !selectedUser || !currentUserId || sending) return;

    try {
      setSending(true);

      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("sendMessage", { sender: currentUserId, receiver: selectedUser._id, content });
        setMessageText("");
        return;
      }

      const response = await axios.post(
        MESSAGE_API,
        { receiver: selectedUser._id, content },
        { headers: { Authorization: `Bearer ${token}` } }
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

  /* DELETE MESSAGE */
  const handleDeleteMessage = async (messageId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this message?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${MESSAGE_API}/${messageId}`, { headers: { Authorization: `Bearer ${token}` } });
      setConversation((prev) => prev.filter((message) => message._id !== messageId));
      setMessages((prev) => prev.filter((message) => message._id !== messageId));
    } catch (error) {
      console.error("Delete message error:", error.response?.data?.message || error.message);
    }
  };

  /* FORMAT */
  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const isMyMessage = (message) => message.sender?._id?.toString() === currentUserId?.toString();

  const getLastMessage = (person) => (person?.lastMessage ? person.lastMessage : "No messages yet");

  const totalUnread = conversationUsers.reduce((total, person) => total + person.unreadCount, 0);

  /* RENDER */
  return (
    <div className="candidate-messages-page">
      <div className="candidate-messages-header">
        <div>
          <h1>
            <FiMessageSquare />
            Messages
            {totalUnread > 0 && (
              <span className="messages-total-badge">{totalUnread > 99 ? "99+" : totalUnread}</span>
            )}
          </h1>
          <p>Communicate with recruiters in real time.</p>
        </div>
      </div>

      {error && <div className="candidate-message-error">{error}</div>}

      <div className="candidate-messages-container">
        <aside className={`candidate-conversations ${selectedUser ? "mobile-hidden" : ""}`}>
          <div className="conversation-search">
            <FiSearch />
            <input
              type="text"
              placeholder="Search recruiters..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>

          <div className="conversation-list">
            {loadingMessages ? (
              <div className="conversation-loading">Loading conversations...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="conversation-empty">
                <div className="conversation-empty-icon">
                  <FiMessageSquare />
                </div>
                <h3>No conversations</h3>
                <p>Your recruiter conversations will appear here.</p>
              </div>
            ) : (
              filteredUsers.map((person) => (
                <button
                  type="button"
                  key={person._id}
                  className={`conversation-item ${selectedUser?._id === person._id ? "active" : ""} ${person.unreadCount > 0 ? "has-unread" : ""
                    }`}
                  onClick={() => handleSelectUser(person)}
                >
                  <div className="conversation-avatar">
                    {recruiterProfiles[person._id?.toString()]?.profilePhoto ? (
                      <img
                        src={getPhotoUrl(
                          recruiterProfiles[person._id.toString()].profilePhoto
                        )}
                        alt={
                          recruiterProfiles[person._id.toString()].fullName ||
                          person.name ||
                          "Recruiter"
                        }
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      recruiterProfiles[person._id?.toString()]?.fullName
                        ?.charAt(0)
                        ?.toUpperCase() ||
                      person.name?.charAt(0)?.toUpperCase() ||
                      "R"
                    )}
                  </div>

                  <div className="conversation-content">
                    <div className="conversation-top">
                      <strong>{person.name || "Recruiter"}</strong>
                      <div className="conversation-time">
                        <small>{formatTime(person.lastMessageDate)}</small>
                        {person.unreadCount > 0 && (
                          <span className="conversation-unread-badge">
                            {person.unreadCount > 99 ? "99+" : person.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <p>{getLastMessage(person)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className={`candidate-chat ${selectedUser ? "mobile-visible" : ""}`}>
          {!selectedUser ? (
            <div className="chat-welcome">
              <div className="chat-welcome-icon">
                <FiMessageSquare />
              </div>
              <h2>Your Messages</h2>
              <p>Select a recruiter to start a conversation.</p>
            </div>
          ) : (
            <>
              <div className="chat-header">

                <button
                  type="button"
                  className="mobile-back-btn"
                  onClick={() => {
                    setSelectedUser(null);
                    setSelectedRecruiterProfile(null);
                  }}
                >
                  <FiArrowLeft />
                </button>

                {/* RECRUITER PROFILE PHOTO */}
                <div className="recruiter-profile-photo">
                  {selectedRecruiterProfile?.profilePhoto ? (
                    <img
                      src={getPhotoUrl(selectedRecruiterProfile.profilePhoto)}
                      alt={
                        selectedRecruiterProfile.fullName ||
                        selectedUser?.name ||
                        "Recruiter"
                      }
                    />
                  ) : (
                    selectedRecruiterProfile?.fullName
                      ?.charAt(0)
                      ?.toUpperCase() ||
                    selectedUser?.name
                      ?.charAt(0)
                      ?.toUpperCase() ||
                    "R"
                  )}
                </div>

                <div className="chat-user-info">
                  <h2>
                    {selectedRecruiterProfile?.fullName ||
                      selectedUser?.name ||
                      "Recruiter"}
                  </h2>

                  <span>
                    {selectedRecruiterProfile?.email ||
                      selectedUser?.email ||
                      "Recruiter"}
                  </span>
                </div>

                <div className="chat-online">
                  <span />
                  Online
                </div>

              </div>

              <div className="chat-messages">
                {loadingConversation ? (
                  <div className="chat-loading">Loading conversation...</div>
                ) : conversation.length === 0 ? (
                  <div className="chat-empty">
                    <div className="chat-empty-icon">
                      <FiMessageSquare />
                    </div>
                    <h3>Start the conversation</h3>
                    <p>
                      Send your first message to <strong>{selectedUser.name}</strong>
                    </p>
                    <span>Say hello and start connecting.</span>
                  </div>
                ) : (
                  conversation.map((message, index) => {
                    const mine = isMyMessage(message);
                    const showDate =
                      index === 0 ||
                      formatDate(conversation[index - 1]?.createdAt) !== formatDate(message.createdAt);

                    return (
                      <React.Fragment key={message._id}>
                        {showDate && (
                          <div className="chat-date">
                            <span>{formatDate(message.createdAt)}</span>
                          </div>
                        )}

                        <div className={`message-row ${mine ? "message-own" : "message-other"}`}>
                          <div className="message-bubble">
                            <p>{message.content}</p>

                            <div className="message-meta">
                              <span>{formatTime(message.createdAt)}</span>
                              {mine && (
                                <span className="message-status">
                                  {message.isRead ? <FiCheckCircle /> : <FiCheck />}
                                </span>
                              )}
                            </div>

                            {mine && (
                              <button
                                type="button"
                                className="delete-message-btn"
                                onClick={() => handleDeleteMessage(message._id)}
                                title="Delete message"
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

                <div ref={messagesEndRef} />
              </div>

              <form className="message-input-area" onSubmit={handleSendMessage}>
                <input
                  ref={inputRef}
                  type="text"
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder="Type a message..."
                  disabled={sending}
                />

                <button type="submit" disabled={!messageText.trim() || sending}>
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

export default CandidateMessages;