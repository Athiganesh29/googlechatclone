import {
  Menu,
  Search,
  ChevronDown,
  HelpCircle,
  Settings,
  Grid3X3,
  Plus,
  MessageCircle,
  Home,
  AtSign,
  Star,
  Users,
  Grid,
  MessageSquare,
  User,
  Smile,
  X,
  MoreVertical
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import SpaceView from './SpaceView';
import DirectMessageView from './DirectMessageView';
import Login from './Login\'/Login';
import websocketService from './services/websocketService';
import apiService from './services/apiService';

function App() {
  const [showNewChatPopup, setShowNewChatPopup] = useState(false);
  const [showCreateSpace, setShowCreateSpace] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [spaceName, setSpaceName] = useState('');
  const [spaces, setSpaces] = useState([]);
  const [showSpaceMenu, setShowSpaceMenu] = useState(null);
  const [currentSpace, setCurrentSpace] = useState(null);
  const [showBrowseSpaces, setShowBrowseSpaces] = useState(false);
  const [spaceSearchQuery, setSpaceSearchQuery] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [contactSearchResults, setContactSearchResults] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [isSearchingContacts, setIsSearchingContacts] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [directMessages, setDirectMessages] = useState([]);
  const [currentDirectMessage, setCurrentDirectMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'starred', 'mentions'
  const [showLoginPage, setShowLoginPage] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [conversationMessages, setConversationMessages] = useState(new Map());

  const popupRef = useRef(null);
  const buttonRef = useRef(null);
  const createSpaceRef = useRef(null);
  const spaceMenuRef = useRef(null);
  const browseSpacesRef = useRef(null);
  const loginModalRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // Check for existing login on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('googleChatUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsLoggedIn(true);
      // Connect to WebSocket
      connectWebSocket(userData);
    } else {
      // Show login page if no user is logged in
      setShowLoginPage(true);
    }
  }, []);

  // Load available users when component mounts
  useEffect(() => {
    loadAvailableUsers();
  }, []);

  // Load existing conversations when user is authenticated and available users are loaded
  useEffect(() => {
    if (user && user.id && availableUsers.length > 0) {
      // Only load conversations if we haven't loaded them yet
      if (conversations.length === 0) {
        loadExistingConversations();
      }
    }
  }, [user, availableUsers, conversations.length]);



  // WebSocket connection function
  const connectWebSocket = async (userData) => {
    try {
      await websocketService.connect(userData);

      // Wait a moment for the connection to be fully established
      setTimeout(() => {
        setIsWebSocketConnected(websocketService.isReady());
      }, 1000);

      // Set up WebSocket message handlers
      websocketService.onMessage('login_success', (message) => {
        // Update the user state with the server's user data (which has the correct email-based ID)
        setUser(message.user);

        // Also update the WebSocket service user data
        websocketService.updateUser(message.user);

        setIsWebSocketConnected(true);
      });


      websocketService.onMessage('conversation_created', (message) => {
        console.log('🎉 Conversation created:', message.conversation);
        setConversations(prev => [...prev, message.conversation]);

        // If it's a direct message conversation, add it to direct messages
        if (message.conversation.type === 'direct') {
          // Find the other participant (not the current user)
          const otherParticipantId = message.conversation.participants.find(id => id !== user.id);

          const otherUser = availableUsers.find(u => u.id === otherParticipantId);

          if (otherUser) {
            const newDirectMessage = {
              id: message.conversation.id,
              conversationId: message.conversation.id,
              contact: otherUser,
              lastMessage: null,
              timestamp: new Date()
            };

            setDirectMessages(prev => {
              // Check if this conversation already exists
              const exists = prev.find(dm => dm.conversationId === message.conversation.id);
              if (!exists) {
                return [...prev, newDirectMessage];
              } else {
                // Update the existing conversation instead of adding a duplicate
                return prev.map(dm =>
                  dm.conversationId === message.conversation.id ? newDirectMessage : dm
                );
              }
            });

            // Set as current conversation
            setCurrentDirectMessage(newDirectMessage);
          } else {
            // Create a fallback user object if we can't find the user
            const fallbackUser = {
              id: otherParticipantId,
              name: `User ${otherParticipantId}`,
              email: `user${otherParticipantId}@example.com`,
              avatar: 'U'
            };

            const newDirectMessage = {
              id: message.conversation.id,
              conversationId: message.conversation.id,
              contact: fallbackUser,
              lastMessage: null,
              timestamp: new Date()
            };

            setDirectMessages(prev => {
              // Check if this conversation already exists
              const exists = prev.find(dm => dm.conversationId === message.conversation.id);
              if (!exists) {
                return [...prev, newDirectMessage];
              } else {
                // Update the existing conversation instead of adding a duplicate
                return prev.map(dm =>
                  dm.conversationId === message.conversation.id ? newDirectMessage : dm
                );
              }
            });

            // Set as current conversation
            setCurrentDirectMessage(newDirectMessage);
          }
        }
      });

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setIsWebSocketConnected(false);
    }
  };

  // Load available users from API
  const loadAvailableUsers = async () => {
    try {
      console.log('📥 Loading available users...');
      const users = await apiService.getUsers();
      console.log('📥 Loaded users:', users);
      setAvailableUsers(users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  // Load existing conversations from API
  const loadExistingConversations = async () => {
    try {
      console.log('📥 Loading existing conversations for user:', user.id);
      const conversations = await apiService.getConversations(user.id);
      console.log('📥 Loaded conversations:', conversations);

      // Set conversations
      setConversations(conversations);

      // Convert conversations to direct messages format
      const directMessages = conversations
        .filter(conv => conv.type === 'direct')
        .map(conv => {
          // Find the other participant
          const otherParticipantId = conv.participants.find(id => id !== user.id);
          const otherUser = availableUsers.find(u => u.id === otherParticipantId);

          if (otherUser) {
            return {
              id: conv.id,
              conversationId: conv.id,
              contact: otherUser,
              lastMessage: conv.lastMessage || null,
              timestamp: new Date(conv.createdAt)
            };
          } else {
            // Create fallback user if not found
            const fallbackUser = {
              id: otherParticipantId,
              name: `User ${otherParticipantId}`,
              email: `user${otherParticipantId}@example.com`,
              avatar: 'U'
            };

            return {
              id: conv.id,
              conversationId: conv.id,
              contact: fallbackUser,
              lastMessage: conv.lastMessage || null,
              timestamp: new Date(conv.createdAt)
            };
          }
        })
        .filter((dm, index, self) =>
          // Remove duplicates based on conversationId
          index === self.findIndex(d => d.conversationId === dm.conversationId)
        );

      console.log('📥 Converted to direct messages:', directMessages);
      // Replace existing direct messages with the loaded ones
      setDirectMessages(directMessages);

    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  // Load messages for a specific conversation
  const loadConversationMessages = async (conversationId) => {
    try {
      console.log('📥 Loading messages for conversation:', conversationId);
      const messages = await apiService.getMessages(conversationId);
      console.log('📥 Loaded messages:', messages);

      // Convert messages to the format expected by DirectMessageView
      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.senderId === user.id ? 'You' : 'Other',
        timestamp: new Date(msg.timestamp),
        type: msg.type || 'text'
      }));

      console.log('📥 Formatted messages:', formattedMessages);

      // Store messages in a state that can be passed to DirectMessageView
      setConversationMessages(prev => {
        const newMap = new Map(prev);
        newMap.set(conversationId, formattedMessages);
        return newMap;
      });

    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (conversationId) => {
    try {
      console.log('🗑️ Deleting conversation:', conversationId);
      console.log('🗑️ Current direct message:', currentDirectMessage);
      console.log('🗑️ All conversations:', conversations);
      console.log('🗑️ All direct messages:', directMessages);

      // Call API to delete conversation
      await apiService.deleteConversation(conversationId);

      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      setDirectMessages(prev => prev.filter(dm => dm.conversationId !== conversationId));

      // Remove messages from conversation messages
      setConversationMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(conversationId);
        return newMap;
      });

      // If this was the current conversation, go back to home
      if (currentDirectMessage && currentDirectMessage.conversationId === conversationId) {
        setCurrentDirectMessage(null);
      }

      console.log('🗑️ Conversation deleted successfully');

    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  // Clear all server data (debug function)
  const handleClearAllData = async () => {
    const isConfirmed = window.confirm(
      'Are you sure you want to clear ALL server data? This will remove all conversations, messages, and active connections. This action cannot be undone.'
    );

    if (isConfirmed) {
      try {
        console.log('🗑️ Clearing all server data...');
        const response = await fetch('http://localhost:3001/api/debug/clear-all', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          console.log('🗑️ Server data cleared:', result);
          alert(`Server data cleared successfully!\nCleared: ${result.cleared.connections} connections, ${result.cleared.conversations} conversations, ${result.cleared.messages} message groups`);

          // Clear local state
          setConversations([]);
          setDirectMessages([]);
          setConversationMessages(new Map());
          setCurrentDirectMessage(null);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        console.error('Failed to clear server data:', error);
        alert('Failed to clear server data. Please try again.');
      }
    }
  };



  // Update conversation with new message
  const updateConversationWithMessage = (newMessage) => {
    setConversations(prev => {
      return prev.map(conv => {
        if (conv.id === newMessage.conversationId) {
          return {
            ...conv,
            lastMessage: newMessage,
            lastMessageTime: newMessage.timestamp
          };
        }
        return conv;
      });
    });

    // Also update direct messages if this is a direct message conversation
    setDirectMessages(prev => {
      return prev.map(dm => {
        if (dm.conversationId === newMessage.conversationId) {
          return {
            ...dm,
            lastMessage: newMessage,
            timestamp: new Date(newMessage.timestamp)
          };
        }
        return dm;
      });
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutsidePopup = !popupRef.current?.contains(event.target);
      const clickedOutsideButton = !buttonRef.current?.contains(event.target);
      const clickedOutsideCreateSpace = !createSpaceRef.current?.contains(event.target);
      const clickedOutsideSpaceMenu = !spaceMenuRef.current?.contains(event.target);
      const clickedOutsideBrowseSpaces = !browseSpacesRef.current?.contains(event.target);
      const clickedOutsideLoginModal = !loginModalRef.current?.contains(event.target);
      const clickedOutsideProfileDropdown = !profileDropdownRef.current?.contains(event.target);

      if (showNewChatPopup && clickedOutsidePopup && clickedOutsideButton) {
        setShowNewChatPopup(false);
        // Reset contact search state
        setSelectedContacts([]);
        setContactSearchQuery('');
        setContactSearchResults([]);
      }

      if (showCreateSpace && clickedOutsideCreateSpace) {
        setShowCreateSpace(false);
      }

      if (showSpaceMenu && clickedOutsideSpaceMenu) {
        setShowSpaceMenu(null);
      }

      if (showBrowseSpaces && clickedOutsideBrowseSpaces) {
        setShowBrowseSpaces(false);
        setSpaceSearchQuery('');
      }

      if (showLoginModal && clickedOutsideLoginModal) {
        setShowLoginModal(false);
      }

      if (showProfileDropdown && clickedOutsideProfileDropdown) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNewChatPopup, showCreateSpace, showSpaceMenu, showBrowseSpaces, showLoginModal, showProfileDropdown]);

  // Google Login Functions
  const handleCredentialResponse = (response) => {
    try {
      // Decode the JWT token
      const decoded = JSON.parse(atob(response.credential.split('.')[1]));

      const userData = {
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
        sub: decoded.sub
      };

      setUser(userData);
      setIsLoggedIn(true);
      setShowLoginModal(false);

      // Save user data to localStorage
      localStorage.setItem('googleChatUser', JSON.stringify(userData));
    } catch (error) {
      console.error('Error processing login:', error);
    }
  };

  const handleLogout = () => {
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to log out?')) {
      websocketService.disconnect();
      setUser(null);
      setIsLoggedIn(false);
      setShowProfileDropdown(false);
      setShowLoginPage(true);
      setSelectedContacts([]);
      setContactSearchQuery('');
      setContactSearchResults([]);
      setConversations([]);
      setIsWebSocketConnected(false);
      localStorage.removeItem('googleChatUser');
    }
  };

  const handleLoginClick = () => {
    if (isLoggedIn) {
      setShowProfileDropdown(!showProfileDropdown);
    } else {
      setShowLoginPage(true);
    }
  };



  // Custom Profile Picture Component
  const ProfilePicture = ({ user, size = 32 }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    if (!user) {
      return (
        <div className="profile-fallback" style={{ width: size, height: size }}>
          <User size={size * 0.6} />
        </div>
      );
    }

    if (!user.picture || imageError) {
      return (
        <div className="profile-fallback" style={{ width: size, height: size }}>
          {user.name ? user.name.charAt(0).toUpperCase() : <User size={size * 0.6} />}
        </div>
      );
    }

    // Try to fix common Google profile picture URL issues
    const getFixedImageUrl = (url) => {
      if (!url) return null;

      // Remove any query parameters that might cause issues
      const cleanUrl = url.split('?')[0];

      // Add size parameter if not present
      if (!cleanUrl.includes('sz=')) {
        return `${cleanUrl}?sz=${size}`;
      }

      return cleanUrl;
    };

    const fixedImageUrl = getFixedImageUrl(user.picture);

    return (
      <img
        src={fixedImageUrl}
        alt={user.name}
        className="profile-image"
        style={{ width: size, height: size }}
        onLoad={() => {
          setImageLoaded(true);
          setImageError(false);
        }}
        onError={() => {
          setImageError(true);
          setImageLoaded(false);
        }}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
    );
  };

  // Search users function
  const searchContacts = async (query) => {
    if (!query.trim()) {
      setContactSearchResults([]);
      return;
    }

    console.log('🔍 Searching contacts with query:', query);
    console.log('🔍 Available users:', availableUsers);
    console.log('🔍 Current user:', user);

    setIsSearchingContacts(true);
    try {
      // Search through available users, but exclude the current user
      const searchResults = availableUsers.filter(availableUser => {
        // Don't show the current user in search results
        if (availableUser.id === user?.id) {
          console.log('🔍 Excluding current user:', availableUser.name);
          return false;
        }

        const name = availableUser.name || '';
        const email = availableUser.email || '';
        const searchTerm = query.toLowerCase();

        const matches = name.toLowerCase().includes(searchTerm) ||
          email.toLowerCase().includes(searchTerm);

        console.log('🔍 Checking user:', availableUser.name, 'matches:', matches);
        return matches;
      }).map(availableUser => ({
        id: availableUser.id,
        name: availableUser.name,
        email: availableUser.email,
        photo: null,
        source: 'user'
      }));

      console.log('🔍 Search results:', searchResults);

      // Only show real users, no email-based contacts
      // This prevents creating conversations with non-existent users

      setContactSearchResults(searchResults);

    } catch (error) {
      console.error('Error searching users:', error);
      setContactSearchResults([]);
    } finally {
      setIsSearchingContacts(false);
    }
  };

  // Handle contact search input change
  const handleContactSearchChange = (e) => {
    const query = e.target.value;
    setContactSearchQuery(query);
    searchContacts(query);
  };

  // Handle contact selection
  const handleContactSelect = (contact) => {
    console.log('🎯 Contact selected:', contact);
    console.log('🎯 Current user:', user);
    console.log('🎯 Selected contacts before:', selectedContacts);

    // Don't allow selecting yourself
    if (contact.id === user?.id) {
      console.log('Cannot select yourself as a contact');
      return;
    }
    // Don't allow selecting email-based contacts (non-existent users)
    if (contact.source === 'email') {
      console.log('Cannot select email-based contacts. Please select a real user.');
      return;
    }
    if (!selectedContacts.find(c => c.id === contact.id)) {
      console.log('🎯 Adding contact to selected contacts');
      setSelectedContacts([...selectedContacts, contact]);
    } else {
      console.log('🎯 Contact already selected');
    }
    setContactSearchQuery('');
    setContactSearchResults([]);
  };



  // Handle contact removal
  const handleContactRemove = (contactId) => {
    setSelectedContacts(selectedContacts.filter(c => c.id !== contactId));
  };

  // Handle login success
  const handleLoginSuccess = (userData) => {
    console.log('Login success with user data:', userData);
    setUser(userData);
    setIsLoggedIn(true);
    setShowLoginPage(false);
    setShowLoginModal(false);

    // Ensure the current user is in the available users list
    setAvailableUsers(prev => {
      const userExists = prev.find(u => u.id === userData.id);
      if (!userExists) {
        console.log('Adding current user to available users list');
        return [...prev, userData];
      }
      return prev;
    });
  };

  // Handle back to app from login page
  const handleBackToApp = () => {
    setShowLoginPage(false);
  };

  // Handle start chat
  const handleStartChat = () => {
    console.log('🚀 Start chat clicked');
    console.log('🚀 Selected contacts:', selectedContacts);
    console.log('🚀 Current user:', user);

    if (selectedContacts.length > 0) {
      const contact = selectedContacts[0]; // For now, handle single contact
      console.log('🚀 Using contact:', contact);

      // Check if WebSocket is ready
      if (!websocketService.isReady()) {
        console.error('WebSocket not ready. Status:', websocketService.getConnectionStatus());
        alert('Connection not ready. Please try again.');
        return;
      }

      // Check if conversation already exists
      const existingConversation = directMessages.find(dm =>
        dm.contact && dm.contact.id === contact.id
      );

      if (existingConversation) {
        console.log('🚀 Conversation already exists, opening it:', existingConversation);
        setCurrentDirectMessage(existingConversation);
        setShowNewChatPopup(false);
        setSelectedContacts([]);
        setContactSearchQuery('');
        setContactSearchResults([]);
        return;
      }

      // Create a new conversation via WebSocket
      const participants = [user.id, contact.id];
      const conversationName = `Chat with ${contact.name}`;

      console.log('🚀 Creating conversation with participants:', participants);
      console.log('🚀 Conversation name:', conversationName);

      websocketService.createConversation(participants, conversationName, 'direct');

      // Close the popup and reset state
      setShowNewChatPopup(false);
      setSelectedContacts([]);
      setContactSearchQuery('');
      setContactSearchResults([]);
    }
  };



  const handleCreateSpace = () => {
    setShowNewChatPopup(false);
    setShowCreateSpace(true);
    // Reset contact search state
    setSelectedContacts([]);
    setContactSearchQuery('');
    setContactSearchResults([]);
  };

  const handleCloseCreateSpace = () => {
    setShowCreateSpace(false);
    setSpaceName('');
  };

  const handleSubmitCreateSpace = () => {
    if (spaceName.trim()) {
      const newSpace = {
        id: Date.now(),
        name: spaceName.trim(),
        icon: '😊'
      };
      setSpaces([...spaces, newSpace]);
      setShowCreateSpace(false);
      setSpaceName('');
    }
  };

  const handleSpaceMenuClick = (spaceId, event) => {
    event.stopPropagation();
    setShowSpaceMenu(showSpaceMenu === spaceId ? null : spaceId);
  };

  const handleDeleteSpace = (spaceId) => {
    console.log('Deleting space:', spaceId);
    console.log('Current space:', currentSpace);

    // Show confirmation dialog
    const spaceToDelete = spaces.find(space => space.id === spaceId);
    const isConfirmed = window.confirm(`Are you sure you want to delete "${spaceToDelete?.name}"? This action cannot be undone.`);

    if (!isConfirmed) {
      console.log('Deletion cancelled by user');
      setShowSpaceMenu(null);
      return;
    }

    // Remove the space from the spaces array
    const updatedSpaces = spaces.filter(space => space.id !== spaceId);
    setSpaces(updatedSpaces);
    setShowSpaceMenu(null);

    // If the deleted space is the current space, go back to home
    if (currentSpace && currentSpace.id === spaceId) {
      console.log('Deleting current space, going back to home');
      setCurrentSpace(null);
    }

    console.log('Updated spaces:', updatedSpaces);
    console.log('Space deleted successfully');
  };

  const handleBrowseSpaces = () => {
    setShowNewChatPopup(false);
    setShowBrowseSpaces(true);
    // Reset contact search state
    setSelectedContacts([]);
    setContactSearchQuery('');
    setContactSearchResults([]);
  };

  const handleSpaceSearch = (e) => {
    setSpaceSearchQuery(e.target.value);
  };

  const filteredSpaces = spaces.filter(space =>
    space.name.toLowerCase().includes(spaceSearchQuery.toLowerCase())
  );

  const handleJoinSpace = (space) => {
    // For now, just navigate to the space
    handleSpaceClick(space);
    setShowBrowseSpaces(false);
    setSpaceSearchQuery('');
  };

  const handleSpaceClick = (space) => {
    setCurrentSpace(space);
    setCurrentDirectMessage(null);
  };

  const handleBackToHome = () => {
    setCurrentSpace(null);
    setCurrentDirectMessage(null);
    setCurrentPage('home');
  };

  const handleDirectMessageClick = (directMessage) => {
    // Don't allow chatting with yourself
    if (directMessage.contact.id === user?.id) {
      console.log('Cannot chat with yourself');
      return;
    }

    console.log('🎯 Clicking on direct message:', directMessage);
    console.log('🎯 Conversation ID:', directMessage.conversationId);

    // Load messages for existing conversation
    if (directMessage.conversationId) {
      console.log('🎯 Loading messages for existing conversation:', directMessage.conversationId);
      loadConversationMessages(directMessage.conversationId);
    }

    setCurrentDirectMessage(directMessage);
    setCurrentSpace(null);
  };

  return (
    <div className="google-chat">
      {/* Show Login Page if not logged in */}
      {showLoginPage && (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onBackToApp={handleBackToApp}
        />
      )}

      {/* Main App Content - Only show if logged in */}
      {!showLoginPage && (
        <>
          {/* Header */}
          <header className="header">
            <div className="header-left">
              <Menu className="menu-icon" />
              <div className="logo">
                <div className="logo-icon">
                  <MessageCircle size={20} />
                </div>
                Google Chat
              </div>
            </div>

            <div className="search-container">
              <div className="search-bar">
                <Search className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search chat"
                />
              </div>
            </div>

            <div className="header-right">
              <div className="status-indicator">
                <div className={`status-dot ${isWebSocketConnected ? 'connected' : 'disconnected'}`}></div>
                <span className="status-text">
                  {isWebSocketConnected ? 'Connected' : 'Connecting...'}
                </span>
                <ChevronDown size={16} />
              </div>

              <div className="header-icon">
                <HelpCircle size={20} />
              </div>

              <div className="header-icon">
                <Settings size={20} />
              </div>

              <div className="header-icon">
                <Grid3X3 size={20} />
              </div>

              {/* Debug button - only show in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="header-icon">
                  <button
                    className="debug-btn"
                    onClick={handleClearAllData}
                    title="Clear all server data (Debug)"
                  >
                    🗑️
                  </button>
                </div>
              )}

              <div className="profile-icon-container">
                <div className="profile-icon" onClick={handleLoginClick}>
                  <ProfilePicture user={user} size={32} />
                </div>



                {/* Profile Dropdown */}
                {showProfileDropdown && isLoggedIn && (
                  <div ref={profileDropdownRef} className="profile-dropdown">
                    <div className="profile-dropdown-header">
                      <ProfilePicture user={user} size={40} />
                      <div className="profile-dropdown-info">
                        <div className="profile-dropdown-name">{user.name}</div>
                        <div className="profile-dropdown-email">{user.email}</div>
                      </div>
                    </div>
                    <div className="profile-dropdown-divider"></div>
                    <div className="profile-dropdown-actions">
                      <button
                        className="profile-dropdown-btn logout-btn"
                        onClick={handleLogout}
                      >
                        <User size={16} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Container */}
          <div className="main-container">
            {/* Left Sidebar */}
            <aside className="sidebar">
              <button
                ref={buttonRef}
                className="new-chat-button"
                onClick={() => setShowNewChatPopup(!showNewChatPopup)}
              >
                <Plus size={20} />
                <MessageCircle size={20} />
                New chat
              </button>

              <div className="sidebar-section">
                <div className="section-header">Shortcuts</div>
                <div className={`sidebar-item ${currentPage === 'home' ? 'active' : ''}`} onClick={() => {
                  setCurrentPage('home');
                  setCurrentSpace(null);
                  setCurrentDirectMessage(null);
                }}>
                  <Home className="sidebar-item-icon" />
                  <span className="sidebar-item-text">Home</span>
                </div>
                <div className={`sidebar-item ${currentPage === 'mentions' ? 'active' : ''}`} onClick={() => {
                  setCurrentPage('mentions');
                  setCurrentSpace(null);
                  setCurrentDirectMessage(null);
                }}>
                  <AtSign className="sidebar-item-icon" />
                  <span className="sidebar-item-text">Mentions</span>
                </div>
                <div className={`sidebar-item ${currentPage === 'starred' ? 'active' : ''}`} onClick={() => {
                  setCurrentPage('starred');
                  setCurrentSpace(null);
                  setCurrentDirectMessage(null);
                }}>
                  <Star className="sidebar-item-icon" />
                  <span className="sidebar-item-text">Starred</span>
                </div>
              </div>

              <div className="sidebar-section">
                <div className="section-header">Direct messages</div>
                {directMessages.length > 0 ? (
                  directMessages.map((dm) => (
                    <div
                      key={dm.id}
                      className={`dm-item ${currentDirectMessage?.id === dm.id ? 'active' : ''}`}
                      onClick={() => {
                        handleDirectMessageClick(dm);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="dm-avatar">
                        <span className="dm-avatar-text">{dm.contact.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="dm-info">
                        <span className="dm-name">{dm.contact.name}</span>
                        <span className="dm-email">{dm.contact.email}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="dm-empty">
                    <div className="dm-empty-text">No direct messages yet</div>
                    <div className="dm-empty-hint">Start a conversation to see it here</div>
                  </div>
                )}


              </div>

              <div className="sidebar-section">
                <div className="section-header">Spaces</div>
                {spaces.length > 0 ? (
                  spaces.map((space) => (
                    <div key={space.id} className="space-item" onClick={() => handleSpaceClick(space)}>
                      <div className="space-icon">{space.icon}</div>
                      <span className="space-name">{space.name}</span>
                      <div className="space-menu-container">
                        <button
                          className="space-menu-btn"
                          onClick={(e) => handleSpaceMenuClick(space.id, e)}
                        >
                          <MoreVertical size={16} />
                        </button>
                        {showSpaceMenu === space.id && (
                          <div ref={spaceMenuRef} className="space-menu-popup">
                            <div
                              className="space-menu-option delete-option"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSpace(space.id);
                              }}
                            >
                              Delete space
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="spaces-section">
                    <div className="spaces-text">Create a space to chat and collaborate</div>
                    <a onClick={() => setShowNewChatPopup(true)} className="spaces-link">Find a space to join</a>
                  </div>
                )}
              </div>


            </aside>

            {/* New Chat Popup */}
            {showNewChatPopup && (
              <div ref={popupRef} className="new-chat-popup">
                <div className="popup-header">
                  <div className="contact-search-container">
                    <input
                      type="text"
                      className="popup-input"
                      placeholder="Add 1 or more people"
                      value={contactSearchQuery}
                      onChange={handleContactSearchChange}
                      autoFocus
                    />

                    {/* Selected Contacts */}
                    {selectedContacts.length > 0 && (
                      <div className="selected-contacts">
                        {selectedContacts.map((contact) => (
                          <div key={contact.id} className="selected-contact">
                            <span className="contact-name">{contact.name}</span>
                            <button
                              className="remove-contact-btn"
                              onClick={() => handleContactRemove(contact.id)}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Contact Search Results */}
                    {contactSearchQuery && contactSearchResults.length > 0 && (
                      <div className="contact-search-results">
                        {contactSearchResults.map((contact) => (
                          <div
                            key={contact.id}
                            className={`contact-result-item ${contact.source}`}
                            onClick={() => handleContactSelect(contact)}
                          >
                            <div className="contact-avatar">
                              {contact.photo ? (
                                <img src={contact.photo} alt={contact.name} />
                              ) : (
                                <User size={20} />
                              )}
                            </div>
                            <div className="contact-info">
                              <div className="contact-name">
                                {contact.name}
                                {contact.source === 'email' && (
                                  <span className="contact-source"> (Email)</span>
                                )}
                                {contact.source === 'suggestion' && (
                                  <span className="contact-source"> (Suggestion)</span>
                                )}
                              </div>
                              <div className="contact-email">{contact.email}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Loading State */}
                    {isSearchingContacts && (
                      <div className="contact-search-loading">
                        <div className="loading-spinner"></div>
                        <span>Searching contacts...</span>
                      </div>
                    )}

                    {/* No Results */}
                    {contactSearchQuery && !isSearchingContacts && contactSearchResults.length === 0 && (
                      <div className="no-contacts-found">
                        <p>No results found for "{contactSearchQuery}"</p>
                        {!isLoggedIn ? (
                          <button
                            className="login-for-contacts-btn"
                            onClick={() => googleLogin()}
                          >
                            Login to search contacts
                          </button>
                        ) : (
                          <div>
                            <p>Try searching for:</p>
                            <ul className="search-tips">
                              <li>• A contact name from your Gmail contacts</li>
                              <li>• A full email address (e.g., john@gmail.com)</li>
                              <li>• A partial name or email</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    )}


                  </div>
                </div>
                <div className="popup-divider"></div>
                <div className="popup-options">
                  <div className="popup-option" onClick={handleCreateSpace}>
                    <Users size={20} className="popup-icon" />
                    <span>Create a space</span>
                  </div>
                  <div className="popup-option" onClick={handleBrowseSpaces}>
                    <Search size={20} className="popup-icon" />
                    <span>Browse spaces</span>
                  </div>
                </div>
                <div className="popup-divider"></div>
                <div className="popup-footer">
                  <button
                    className="start-chat-button"
                    onClick={handleStartChat}
                    disabled={selectedContacts.length === 0}
                  >
                    Start chat ({selectedContacts.length} selected)
                  </button>
                </div>
              </div>
            )}

            {/* Create Space Modal */}
            {showCreateSpace && (
              <div className="create-space-overlay">
                <div ref={createSpaceRef} className="create-space-modal">
                  <div className="create-space-header">
                    <h2 className="create-space-title">Create a space</h2>
                    <button className="create-space-close-btn" onClick={handleCloseCreateSpace}>
                      <X size={20} />
                    </button>
                  </div>

                  <div className="create-space-content">
                    {/* Left Section - Icon Selection */}
                    <div className="create-space-left">
                      <div className="icon-selection">
                        <div className="icon-preview">
                          <span className="icon-emoji">😊</span>
                          <div className="icon-add">
                            <Plus size={16} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Input and Buttons */}
                    <div className="create-space-right">
                      <div className="create-space-input-section">
                        <input
                          type="text"
                          className="create-space-input"
                          placeholder="Space name"
                          value={spaceName}
                          onChange={(e) => setSpaceName(e.target.value)}
                          maxLength={128}
                          autoFocus
                        />
                        <div className="character-counter">
                          {spaceName.length}/128
                        </div>
                      </div>

                      <div className="create-space-buttons">
                        <button
                          className="create-space-cancel-btn"
                          onClick={handleCloseCreateSpace}
                        >
                          Cancel
                        </button>
                        <button
                          className="create-space-create-btn"
                          onClick={handleSubmitCreateSpace}
                          disabled={!spaceName.trim()}
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content */}
            {currentDirectMessage ? (
              <DirectMessageView
                directMessage={currentDirectMessage}
                onBack={handleBackToHome}
                initialMessages={conversationMessages.get(currentDirectMessage.conversationId) || []}
                onDeleteConversation={handleDeleteConversation}
              />
            ) : currentSpace ? (
              <SpaceView space={currentSpace} onBack={handleBackToHome} />
            ) : (
              <main className="main-content">
                {currentPage === 'home' && (
                  <>
                    <h1 className="content-title">Welcome to Google Chat</h1>
                    <p className="content-subtitle">Connect, collaborate, and stay organized with your team</p>

                    <div className="illustration">
                      <svg viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Chat bubbles */}
                        <rect x="50" y="80" width="80" height="40" rx="20" fill="#e8f0fe" stroke="#4285f4" strokeWidth="2" />
                        <rect x="170" y="60" width="80" height="40" rx="20" fill="#4285f4" />

                        {/* People icons */}
                        <circle cx="80" cy="40" r="15" fill="#4285f4" />
                        <circle cx="120" cy="40" r="15" fill="#34a853" />
                        <circle cx="160" cy="40" r="15" fill="#fbbc04" />
                        <circle cx="200" cy="40" r="15" fill="#ea4335" />

                        {/* Connection lines */}
                        <line x1="80" y1="55" x2="80" y2="80" stroke="#4285f4" strokeWidth="2" />
                        <line x1="120" y1="55" x2="120" y2="80" stroke="#34a853" strokeWidth="2" />
                        <line x1="160" y1="55" x2="160" y2="60" stroke="#fbbc04" strokeWidth="2" />
                        <line x1="200" y1="55" x2="200" y2="60" stroke="#ea4335" strokeWidth="2" />

                        {/* Decorative elements */}
                        <circle cx="250" cy="30" r="8" fill="#f1f3f4" />
                        <circle cx="270" cy="50" r="6" fill="#f1f3f4" />
                        <circle cx="260" cy="70" r="4" fill="#f1f3f4" />
                      </svg>
                    </div>
                  </>
                )}

                {currentPage === 'starred' && (
                  <>
                    <h1 className="content-title">Starred</h1>
                    <div className="illustration">
                      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Person silhouette */}
                        <circle cx="100" cy="120" r="25" fill="#5f6368" />
                        <path d="M75 140 Q100 160 125 140" stroke="#5f6368" strokeWidth="3" fill="none" />
                        {/* Body */}
                        <rect x="85" y="145" width="30" height="40" rx="15" fill="#4285f4" />
                        {/* Hair/ponytail */}
                        <path d="M75 115 Q70 105 75 95 Q80 85 85 95" stroke="#5f6368" strokeWidth="8" fill="none" />
                        <path d="M85 95 Q90 85 95 95 Q100 85 105 95 Q110 85 115 95" stroke="#5f6368" strokeWidth="6" fill="none" />
                        {/* Star */}
                        <path d="M140 80 L142 90 L150 85 L142 80 L140 70 L138 80 L130 85 L138 90 Z" fill="#f4b400" />
                        <line x1="150" y1="85" x2="160" y2="85" stroke="#5f6368" strokeWidth="2" />
                      </svg>
                    </div>
                    <p className="content-message">Your starred messages show up here</p>
                    <p className="content-instruction">
                      Hover over any message, click the ⋮ menu and then click the star to save it here.
                    </p>
                    <a href="#" className="learn-more-link">Learn more about starring a message</a>
                  </>
                )}

                {currentPage === 'mentions' && (
                  <>
                    <h1 className="content-title">Mentions</h1>
                    <div className="illustration">
                      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* @ symbol */}
                        <circle cx="100" cy="100" r="80" fill="#f8f9fa" stroke="#dadce0" strokeWidth="2" />
                        <text x="100" y="110" textAnchor="middle" fontSize="60" fontWeight="bold" fill="#4285f4">@</text>

                        {/* Decorative elements */}
                        <circle cx="50" cy="50" r="8" fill="#f1f3f4" />
                        <circle cx="150" cy="50" r="6" fill="#f1f3f4" />
                        <circle cx="50" cy="150" r="6" fill="#f1f3f4" />
                        <circle cx="150" cy="150" r="8" fill="#f1f3f4" />
                      </svg>
                    </div>
                    <p className="content-message">No mentions here</p>
                    <p className="content-instruction">
                      When someone mentions you with @, it will show up here.
                    </p>
                    <a href="#" className="learn-more-link">Learn more about mentions</a>
                  </>
                )}
              </main>
            )}

            {/* Browse Spaces Modal */}
            {showBrowseSpaces && (
              <div className="browse-spaces-overlay">
                <div ref={browseSpacesRef} className="browse-spaces-modal">
                  <div className="browse-spaces-header">
                    <h3>Browse Spaces</h3>
                    <button
                      className="close-btn"
                      onClick={() => {
                        setShowBrowseSpaces(false);
                        setSpaceSearchQuery('');
                      }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="browse-spaces-search">
                    <div className="search-input-container">
                      <Search size={16} className="search-icon" />
                      <input
                        type="text"
                        placeholder="Search spaces..."
                        value={spaceSearchQuery}
                        onChange={handleSpaceSearch}
                        className="space-search-input"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="browse-spaces-content">
                    {spaceSearchQuery && filteredSpaces.length === 0 ? (
                      <div className="no-spaces-found">
                        <p>No spaces found matching "{spaceSearchQuery}"</p>
                        <p>Try a different search term or create a new space.</p>
                      </div>
                    ) : filteredSpaces.length === 0 ? (
                      <div className="no-spaces-available">
                        <p>No spaces available to join.</p>
                        <p>Create a new space to get started!</p>
                      </div>
                    ) : (
                      <div className="spaces-list">
                        {filteredSpaces.map((space) => (
                          <div key={space.id} className="browse-space-item" onClick={() => handleJoinSpace(space)}>
                            <div className="browse-space-icon">{space.icon}</div>
                            <div className="browse-space-info">
                              <div className="browse-space-name">{space.name}</div>
                              <div className="browse-space-members">1 member</div>
                            </div>
                            <button className="join-space-btn">Join</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="browse-spaces-footer">
                    <button
                      className="create-space-btn"
                      onClick={() => {
                        setShowBrowseSpaces(false);
                        setShowCreateSpace(true);
                      }}
                    >
                      <Plus size={16} />
                      Create a new space
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Login Modal */}
            {showLoginModal && (
              <div ref={loginModalRef} className="login-modal-overlay">
                <div className="login-modal">
                  <h2>Login to Google Chat</h2>
                  <p>Please click the button below to log in to your Google account.</p>
                  <GoogleLogin
                    onSuccess={handleCredentialResponse}
                    onError={() => console.error('Google login failed')}
                  />
                </div>
              </div>
            )}

          </div>
        </>
      )}

    </div>
  );
}

export default App;
