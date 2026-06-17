import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import chatAPI from '../services/chatAPI';
import rideAPI from '../services/rideAPI';
import { useAuth } from '../contexts/AuthContext';
import { Send, ArrowLeft, Users, AlertCircle, MessageSquare } from 'lucide-react';

const Chat = () => {
  const { rideId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ride, setRide] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [status, setStatus] = useState('connecting'); // 'connecting' | 'connected' | 'error'
  const [accessDenied, setAccessDenied] = useState(false);
  
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch ride details and historical messages
  useEffect(() => {
    const initChat = async () => {
      try {
        const rideData = await rideAPI.getRideDetails(rideId);
        setRide(rideData);

        const history = await chatAPI.getChatHistory(rideId);
        setMessages(history);
        setStatus('connected');
      } catch (err) {
        console.error(err);
        if (err.response?.status === 403 || err.response?.status === 401) {
          setAccessDenied(true);
        } else {
          setStatus('error');
        }
      }
    };

    if (user && rideId) {
      initChat();
    }
  }, [user, rideId]);

  // Establish WebSocket connection
  useEffect(() => {
    if (!user || !rideId) return;

    let socket;
    let isMounted = true;
    const connect = () => {
      if (!isMounted) return;
      try {
        const wsUrl = chatAPI.getWebSocketURL(rideId);
        socket = new WebSocket(wsUrl);
        ws.current = socket;

        socket.onopen = () => {
          if (isMounted) setStatus('connected');
        };

        socket.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'chat') {
              const incomingMsg = payload.data;
              setMessages((prev) => {
                if (prev.some(m => m.id === incomingMsg.id)) return prev;
                return [...prev, incomingMsg];
              });
            }
          } catch (e) {
            console.error("Error parsing chat WS frame:", e);
          }
        };

        socket.onclose = () => {
          if (isMounted) {
            setStatus('connecting');
            // Reconnect after 3 seconds if socket closed unexpectedly
            setTimeout(() => {
              if (isMounted && ws.current === socket) connect();
            }, 3000);
          }
        };

        socket.onerror = (err) => {
          console.error("Chat WS Error:", err);
          socket.close();
        };
      } catch (err) {
        console.error("WebSocket connection setup failed:", err);
        if (isMounted) setStatus('connecting');
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (socket) {
        socket.close();
      }
    };
  }, [user, rideId]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    
    const content = typedMessage.trim();
    if (!content) return;

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      // Send text raw (backend handles parse)
      ws.current.send(content);
      
      // Optimistically append sender message in UI
      const optimisticMsg = {
        id: Math.random().toString(36).substring(2, 7),
        ride_id: rideId,
        sender_id: user.id,
        sender_name: user.name,
        content: content,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, optimisticMsg]);
      setTypedMessage('');
    } else {
      alert("Chat connection is offline. Trying to reconnect...");
    }
  };

  if (accessDenied) {
    return (
      <div className="glass-panel" style={styles.errorBox}>
        <AlertCircle size={32} color="var(--danger)" />
        <h3 style={{ marginTop: '1rem' }}>Access Denied</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'center' }}>
          You must be a confirmed participant (driver or passenger) of this ride to join the chat channel.
        </p>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (status === 'error' && !ride) {
    return (
      <div className="glass-panel" style={styles.errorBox}>
        <AlertCircle size={32} color="var(--danger)" />
        <h3 style={{ marginTop: '1rem' }}>Connection Error</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'center' }}>
          Failed to load ride details. Please check your connection.
        </p>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container} className="animate-fade">
      <div className="glass-panel" style={styles.chatCard}>
        {/* Chat Header */}
        <div style={styles.header}>
          <Link to={`/rides/${rideId}`} style={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <div style={styles.titleInfo}>
            {ride ? (
              <>
                <h3 style={styles.title}>{ride.source.split(',')[0]} → {ride.destination.split(',')[0]}</h3>
                <span style={styles.driverLabel}>Driver: {ride.owner.name}</span>
              </>
            ) : (
              <h3 style={styles.title}>Loading Ride Chat...</h3>
            )}
          </div>
          <div style={styles.statusBadge}>
            <span style={{
              ...styles.statusDot,
              backgroundColor: status === 'connected' ? 'var(--success)' : 'var(--warning)'
            }} />
            <span style={styles.statusText}>{status}</span>
          </div>
        </div>

        {/* Chat Messages Log */}
        <div style={styles.messagesContainer}>
          {messages.length === 0 ? (
            <div style={styles.emptyChat}>
              <MessageSquare size={36} color="var(--text-muted)" />
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                No messages in this chat room yet. Send a message to coordinate pickup spot and timings!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user.id;
              const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div
                  key={msg.id}
                  style={{
                    ...styles.messageRow,
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      ...styles.bubble,
                      backgroundColor: isMe ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      borderBottomRightRadius: isMe ? '2px' : '12px',
                      borderBottomLeftRadius: isMe ? '12px' : '2px',
                    }}
                  >
                    {!isMe && <span style={styles.senderName}>{msg.sender_name}</span>}
                    <div style={styles.bubbleContent}>{msg.content}</div>
                    <span style={styles.bubbleTime}>{time}</span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} style={styles.inputForm}>
          <input
            type="text"
            className="form-input"
            placeholder="Type your message here..."
            value={typedMessage}
            onChange={(e) => setTypedMessage(e.target.value)}
            style={styles.textInput}
            disabled={status !== 'connected'}
          />
          <button type="submit" className="btn btn-primary" style={styles.sendBtn} disabled={status !== 'connected'}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    paddingTop: '20px',
    maxWidth: '850px',
    margin: '0 auto',
    height: 'calc(100vh - 120px)',
  },
  chatCard: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: 0,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid var(--border-color)',
    gap: '1rem',
  },
  backBtn: {
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    transition: 'color var(--transition-fast)',
  },
  titleInfo: {
    flex: 1,
  },
  title: {
    fontSize: '1.15rem',
    fontWeight: 600,
  },
  driverLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: '0.3rem 0.6rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  statusText: {
    fontSize: '0.7rem',
  },
  messagesContainer: {
    flex: 1,
    padding: '1.5rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  emptyChat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    padding: '0 2rem',
  },
  messageRow: {
    display: 'flex',
    width: '100%',
  },
  bubble: {
    maxWidth: '70%',
    padding: '0.6rem 0.9rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  senderName: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'var(--accent-secondary)',
    marginBottom: '0.2rem',
    textTransform: 'capitalize',
  },
  bubbleContent: {
    fontSize: '0.9rem',
    color: '#fff',
    wordBreak: 'break-word',
  },
  bubbleTime: {
    fontSize: '0.65rem',
    color: 'rgba(255, 255, 255, 0.5)',
    alignSelf: 'flex-end',
    marginTop: '0.2rem',
  },
  inputForm: {
    display: 'flex',
    padding: '1rem 1.5rem',
    borderTop: '1px solid var(--border-color)',
    gap: '0.75rem',
    backgroundColor: 'var(--bg-secondary)',
  },
  textInput: {
    flex: 1,
  },
  sendBtn: {
    padding: '0 1.25rem',
  },
  errorBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    maxWidth: '500px',
    margin: '4rem auto 0 auto',
  },
};

export default Chat;
