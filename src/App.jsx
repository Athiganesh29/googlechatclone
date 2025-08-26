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
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';

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
    } else {
      // Show login page if no user is logged in
      setShowLoginPage(true);
    }
  }, []);

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
      setUser(null);
      setIsLoggedIn(false);
      setShowProfileDropdown(false);
      setShowLoginPage(true);
      setAllContacts([]);
      setSelectedContacts([]);
      setContactSearchQuery('');
      setContactSearchResults([]);
      setAccessToken(null);
      localStorage.removeItem('googleChatUser');
      localStorage.removeItem('googleChatAccessToken');
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

  // Google People API login for contacts access
  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        // Store access token
        setAccessToken(response.access_token);

        // Get user info
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${response.access_token}` },
        });
        const userInfo = await userInfoResponse.json();

        // Get contacts
        await fetchContacts(response.access_token);

      } catch (error) {
        console.error('Error in Google login:', error);
      }
    },
    scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/contacts.readonly https://www.googleapis.com/auth/admin.directory.user.readonly',
  });
  const searchGmailUsers = async (query, token) => {
    try {
      console.log('Searching for:', query);
      let results = [];

      // First, try to search through user's own contacts
      if (allContacts.length > 0) {
        const contactMatches = allContacts.filter(contact => {
          const name = contact.names?.[0]?.displayName || '';
          const email = contact.emailAddresses?.[0]?.value || '';
          const searchTerm = query.toLowerCase();

          return name.toLowerCase().includes(searchTerm) ||
            email.toLowerCase().includes(searchTerm);
        });

        results = contactMatches.map(contact => ({
          id: contact.resourceName,
          name: contact.names?.[0]?.displayName || 'Unknown',
          email: contact.emailAddresses?.[0]?.value || '',
          photo: contact.photos?.[0]?.url || null,
          source: 'contact'
        }));
      }

      // If the query looks like an email, add it as a potential result
      if (query.includes('@') && query.includes('.') && !results.find(r => r.email === query)) {
        results.push({
          id: `email-${query}`,
          name: query.split('@')[0], // Use the part before @ as name
          email: query,
          photo: null,
          source: 'email'
        });
      }

      // Add some common Gmail domains as suggestions if query is short
      if (query.length < 3 && results.length === 0) {
        const commonDomains = ['gmail.com', 'googlemail.com'];
        commonDomains.forEach(domain => {
          results.push({
            id: `suggestion-${domain}`,
            name: `Search ${domain} users`,
            email: `@${domain}`,
            photo: null,
            source: 'suggestion'
          });
        });
      }

      console.log('Search results:', results);
      return results;

    } catch (error) {
      console.error('Error searching Gmail users:', error);
      return [];
    }
  };

  // Fetch user's own contacts (for reference)
  const fetchContacts = async (token) => {
    try {
      const contactsResponse = await fetch(
        `https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,photos&pageSize=100`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!contactsResponse.ok) {
        throw new Error(`HTTP error! status: ${contactsResponse.status}`);
      }

      const contactsData = await contactsResponse.json();
      console.log('Contacts loaded:', contactsData.connections || []);

      // Store contacts in state
      setAllContacts(contactsData.connections || []);

    } catch (error) {
      console.error('Error fetching contacts:', error);
      setAllContacts([]);
    }
  };

  // State for storing all contacts
  const [allContacts, setAllContacts] = useState([]);

  // Load contacts when user logs in
  useEffect(() => {
    if (isLoggedIn && user) {
      loadContacts();
    }
  }, [isLoggedIn, user]);

  // Load all contacts from Google People API
  const loadContacts = async () => {
    try {
      // If we already have contacts loaded, don't fetch again
      if (allContacts.length > 0) {
        return;
      }

      // If we have an access token, use it to fetch contacts
      if (accessToken) {
        await fetchContacts(accessToken);
      } else {
        console.log('No access token available, need to login first');
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  // Search Gmail users function
  const searchContacts = async (query) => {
    if (!query.trim()) {
      setContactSearchResults([]);
      return;
    }

    setIsSearchingContacts(true);
    try {
      // First, ensure we have contacts loaded if user is logged in
      if (isLoggedIn && accessToken && allContacts.length === 0) {
        await fetchContacts(accessToken);
      }

      // Now search for users
      const searchResults = await searchGmailUsers(query, accessToken);
      setContactSearchResults(searchResults);

    } catch (error) {
      console.error('Error searching Gmail users:', error);
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
    if (!selectedContacts.find(c => c.id === contact.id)) {
      setSelectedContacts([...selectedContacts, contact]);
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
    setUser(userData);
    setIsLoggedIn(true);
    setShowLoginPage(false);
    setShowLoginModal(false);
  };

  // Handle back to app from login page
  const handleBackToApp = () => {
    setShowLoginPage(false);
  };

  // Handle start chat
  const handleStartChat = () => {
    if (selectedContacts.length > 0) {
      const contact = selectedContacts[0]; // For now, handle single contact

      // Create a new direct message
      const newDirectMessage = {
        id: Date.now(),
        contact: contact,
        lastMessage: null,
        timestamp: new Date()
      };

      // Add to direct messages if not already exists
      const existingDM = directMessages.find(dm => dm.contact.email === contact.email);
      if (!existingDM) {
        setDirectMessages(prev => [...prev, newDirectMessage]);
      }

      // Set as current direct message
      setCurrentDirectMessage(existingDM || newDirectMessage);

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
                <div className="status-dot"></div>
                <span className="status-text">Active</span>
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
                      onClick={() => handleDirectMessageClick(dm)}
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
                    Start chat
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
