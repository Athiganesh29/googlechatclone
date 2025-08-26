import {
    ArrowLeft,
    Search,
    MoreVertical,
    Smile,
    Paperclip,
    Mic,
    Send,
    Plus,
    Bold,
    Italic,
    Underline,
    List
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

function DirectMessageView({ directMessage, onBack }) {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showFormatting, setShowFormatting] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [activeEmojiCategory, setActiveEmojiCategory] = useState(0);
    const [gifSearchQuery, setGifSearchQuery] = useState('');
    const [gifResults, setGifResults] = useState([]);
    const [isLoadingGifs, setIsLoadingGifs] = useState(false);

    const messageInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const gifPickerRef = useRef(null);
    const formattingRef = useRef(null);
    const fileInputRef = useRef(null);
    const recordingIntervalRef = useRef(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end',
                    inline: 'nearest'
                });
            }
            // Alternative scroll method if the above doesn't work
            const messagesContainer = document.querySelector('.dm-messages');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }, 100);
    };

    const handleSendMessage = () => {
        if (message.trim()) {
            const newMessage = {
                id: Date.now(),
                content: message,
                sender: 'You',
                timestamp: new Date(),
                type: 'text'
            };

            setMessages(prev => [...prev, newMessage]);
            setMessage('');

            // Reset textarea height to minimum size
            const textarea = messageInputRef.current;
            if (textarea) {
                textarea.style.height = 'auto';
                textarea.style.height = '24px'; // Reset to minimum height
            }

            // Auto-scroll to the latest message
            scrollToBottom();
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatMessageTime = (timestamp) => {
        const now = new Date();
        const messageTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return messageTime.toLocaleDateString();
    };

    // Auto-resize textarea
    const handleTextareaChange = (e) => {
        setMessage(e.target.value);
        autoResizeTextarea();
    };

    const autoResizeTextarea = () => {
        const textarea = messageInputRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        }
    };

    // Auto-resize textarea when message changes
    useEffect(() => {
        autoResizeTextarea();
    }, [message]);

    // Emoji picker - using emoji-mart data
    const emojiCategories = [
        { name: 'Smileys & Emotion', emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'] },
        { name: 'People & Body', emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'] },
        { name: 'Animals & Nature', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦙', '🦒', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔'] },
        { name: 'Food & Drink', emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '🫖', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍷', '🥂', '🥃', '🍸', '🍹', '🧉', '🍾', '🥄', '🍴', '🍽️', '🥣', '🥡', '🥢', '🧂'] },
        { name: 'Activities', emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️‍♀️', '🏋️', '🏋️‍♂️', '🤼‍♀️', '🤼', '🤼‍♂️', '🤸‍♀️', '🤸', '🤸‍♂️', '⛹️‍♀️', '⛹️', '⛹️‍♂️', '🤺', '🤾‍♀️', '🤾', '🤾‍♂️', '🏊‍♀️', '🏊', '🏊‍♂️', '🤽‍♀️', '🤽', '🤽‍♂️', '🚣‍♀️', '🚣', '🚣‍♂️', '🧗‍♀️', '🧗', '🧗‍♂️', '🚵‍♀️', '🚵', '🚵‍♂️', '🚴‍♀️', '🚴', '🚴‍♂️', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹‍♀️', '🤹', '🤹‍♂️', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🪘', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩', '🎨', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '🧮', '🎥', '📺', '📻', '📷', '📸', '📹', '🎞️', '📽️', '🎬', '📱', '📲', '☎️', '📞', '📟', '📠', '🔋', '🔌', '💻', '🖥️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '🧮', '🎥', '📺', '📻', '📷', '📸', '📹', '🎞️', '📽️', '🎬', '📱', '📲', '☎️', '📞', '📟', '📠', '🔋', '🔌', '💻', '🖥️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '🧮', '🎥', '📺', '📻', '📷', '📸', '📹', '🎞️', '📽️', '🎬'] }
    ];

    // Emoji and formatting functions
    const handleEmojiClick = (emoji) => {
        setMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    // Text formatting functions
    const applyFormatting = (formatType) => {
        const textarea = messageInputRef.current;
        if (!textarea) return;

        // Focus on the textarea first
        textarea.focus();

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = message.substring(start, end);

        let formattedText = '';
        let newCursorStart = start;
        let newCursorEnd = end;

        switch (formatType) {
            case 'bold':
                if (selectedText) {
                    formattedText = selectedText;
                    newCursorStart = start;
                    newCursorEnd = end;
                } else {
                    formattedText = '';
                    newCursorStart = start;
                    newCursorEnd = start + 9;
                }
                break;
            case 'italic':
                if (selectedText) {
                    formattedText = selectedText;
                    newCursorStart = start;
                    newCursorEnd = end;
                } else {
                    formattedText = 'italic text';
                    newCursorStart = start;
                    newCursorEnd = start + 11;
                }
                break;
            case 'underline':
                if (selectedText) {
                    formattedText = selectedText;
                    newCursorStart = start;
                    newCursorEnd = end;
                } else {
                    formattedText = 'underlined text';
                    newCursorStart = start;
                    newCursorEnd = start + 14;
                }
                break;
            case 'list':
                if (selectedText) {
                    const lines = selectedText.split('\n');
                    const formattedLines = lines.map(line => line.trim() ? `• ${line}` : line);
                    formattedText = formattedLines.join('\n');
                    newCursorStart = start + formattedText.length;
                    newCursorEnd = start + formattedText.length;
                } else {
                    formattedText = '• ';
                    newCursorStart = start + 2;
                    newCursorEnd = start + 2;
                }
                break;
        }

        // Update the message with formatted text
        const newText = message.substring(0, start) + formattedText + message.substring(end);
        setMessage(newText);

        // Set cursor position after formatting
        setTimeout(() => {
            textarea.setSelectionRange(newCursorStart, newCursorEnd);
            textarea.focus();
        }, 0);

        setShowFormatting(false);
    };

    const handleBoldFormatting = () => applyFormatting('bold');
    const handleItalicFormatting = () => applyFormatting('italic');
    const handleUnderlineFormatting = () => applyFormatting('underline');
    const handleListFormatting = () => applyFormatting('list');

    // File upload function
    const handleFileUpload = (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            Array.from(files).forEach(file => {
                const fileMessage = {
                    id: Date.now() + Math.random(),
                    content: file.name,
                    sender: 'You',
                    timestamp: new Date(),
                    type: 'file',
                    file: file
                };

                setMessages(prev => [...prev, fileMessage]);
            });

            // Auto-scroll to the latest message
            scrollToBottom();
        }
    };

    // Voice recording function
    const handleVoiceRecord = () => {
        if (!isRecording) {
            setIsRecording(true);
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            setIsRecording(false);
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
            setRecordingTime(0);
        }
    };

    const formatRecordingTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // GIF Search using GIPHY API
    const searchGifs = async (query) => {
        if (!query.trim()) return;

        setIsLoadingGifs(true);
        try {
            // Using GIPHY API (you'll need to get a free API key from https://developers.giphy.com/)
            const apiKey = 'tLftaPkdJn0jP4NHkbPwLQgnO3OTVTt1'; // Replace with your actual API key
            const response = await fetch(
                `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=20&rating=g`
            );
            const data = await response.json();
            setGifResults(data.data || []);
        } catch (error) {
            console.error('Error fetching GIFs:', error);
            // Fallback to mock data for demo
            setGifResults([
                { id: '1', images: { fixed_height: { url: 'https://via.placeholder.com/200x200/FF6B6B/FFFFFF?text=GIF+1' } } },
                { id: '2', images: { fixed_height: { url: 'https://via.placeholder.com/200x200/4ECDC4/FFFFFF?text=GIF+2' } } },
                { id: '3', images: { fixed_height: { url: 'https://via.placeholder.com/200x200/45B7D1/FFFFFF?text=GIF+3' } } },
                { id: '4', images: { fixed_height: { url: 'https://via.placeholder.com/200x200/96CEB4/FFFFFF?text=GIF+4' } } },
                { id: '5', images: { fixed_height: { url: 'https://via.placeholder.com/200x200/FFEAA7/FFFFFF?text=GIF+5' } } },
                { id: '6', images: { fixed_height: { url: 'https://via.placeholder.com/200x200/DDA0DD/FFFFFF?text=GIF+6' } } }
            ]);
        } finally {
            setIsLoadingGifs(false);
        }
    };

    const handleGifSearch = (e) => {
        const query = e.target.value;
        setGifSearchQuery(query);
        if (query.trim()) {
            searchGifs(query);
        } else {
            setGifResults([]);
        }
    };

    const handleGifSelect = (gif) => {
        const gifMessage = {
            id: Date.now(),
            content: gif.images.fixed_height.url,
            sender: 'You',
            timestamp: new Date(),
            type: 'gif'
        };

        setMessages(prev => [...prev, gifMessage]);
        setShowGifPicker(false);
        setGifSearchQuery('');
        setGifResults([]);

        // Auto-scroll to the latest message
        scrollToBottom();
    };

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            const clickedOutsideEmoji = !emojiPickerRef.current?.contains(event.target);
            const clickedOutsideGif = !gifPickerRef.current?.contains(event.target);
            const clickedOutsideFormatting = !formattingRef.current?.contains(event.target);

            if (showEmojiPicker && clickedOutsideEmoji) {
                setShowEmojiPicker(false);
            }

            if (showGifPicker && clickedOutsideGif) {
                setShowGifPicker(false);
            }

            if (showFormatting && clickedOutsideFormatting) {
                setShowFormatting(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker, showGifPicker, showFormatting]);

    return (
        <div className="direct-message-view">
            {/* Header */}
            <header className="dm-header">
                <div className="dm-header-left">
                    <button className="back-button" onClick={onBack}>
                        <ArrowLeft size={20} />
                    </button>
                    <div className="dm-info">
                        <div className="dm-avatar">
                            <span className="dm-avatar-text">
                                {directMessage.contact.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="dm-details">
                            <div className="dm-name">{directMessage.contact.name}</div>
                            <div className="dm-email">{directMessage.contact.email}</div>
                        </div>
                    </div>
                </div>

                <div className="dm-header-right">
                    <button className="header-icon-btn">
                        <Search size={20} />
                    </button>
                    <button className="header-icon-btn">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </header>

            {/* Messages */}
            <div className="dm-messages">
                {messages.length === 0 ? (
                    <div className="dm-empty-state">
                        <div className="dm-empty-illustration">
                            <div className="dm-empty-avatar">
                                <span>{directMessage.contact.name.charAt(0).toUpperCase()}</span>
                            </div>
                        </div>
                        <h3>Start a conversation with {directMessage.contact.name}</h3>
                        <p>Send a message to begin chatting</p>
                    </div>
                ) : (
                    <div className="messages-list">
                        {messages.map((msg) => (
                            <div key={msg.id} className="message-item">
                                <div className="message-wrapper">
                                    <div className="message-header">
                                        <span className="message-sender">{msg.sender}</span>
                                        <span className="message-time">{formatMessageTime(msg.timestamp)}</span>
                                    </div>
                                    <div className="message-content">
                                        {msg.type === 'gif' ? (
                                            <div className="message-gif">
                                                <img src={msg.content} alt="GIF" className="gif-message" />
                                            </div>
                                        ) : msg.type === 'file' ? (
                                            <div className="message-file">
                                                <Paperclip size={16} />
                                                <span className="file-name">{msg.content}</span>
                                            </div>
                                        ) : (
                                            <div className="message-text">{msg.content}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <div className="space-input-bar">
                <button className="input-icon-btn">
                    <Plus size={20} />
                </button>

                <div className="input-field">
                    <textarea
                        value={message}
                        onChange={handleTextareaChange}
                        onKeyPress={handleKeyPress}
                        placeholder="History is on"
                        className="message-input"
                        rows="1"
                        ref={messageInputRef}
                    />
                </div>

                <div className="input-actions">
                    {/* Formatting Button */}
                    <div className="input-dropdown" ref={formattingRef}>
                        <button
                            className={`input-icon-btn ${showFormatting ? 'active' : ''}`}
                            onClick={() => setShowFormatting(!showFormatting)}
                        >
                            <Bold size={16} />
                        </button>
                        {showFormatting && (
                            <div className="formatting-menu">
                                <button className="format-option" onClick={handleBoldFormatting}>
                                    <Bold size={14} />
                                    <span>Bold</span>
                                </button>
                                <button className="format-option" onClick={handleItalicFormatting}>
                                    <Italic size={14} />
                                    <span>Italic</span>
                                </button>
                                <button className="format-option" onClick={handleUnderlineFormatting}>
                                    <Underline size={14} />
                                    <span>Underline</span>
                                </button>
                                <button className="format-option" onClick={handleListFormatting}>
                                    <List size={14} />
                                    <span>List</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Emoji Picker */}
                    <div className="input-dropdown" ref={emojiPickerRef}>
                        <button
                            className={`input-icon-btn ${showEmojiPicker ? 'active' : ''}`}
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                            <Smile size={20} />
                        </button>
                        {showEmojiPicker && (
                            <div className="emoji-picker-menu">
                                <div className="emoji-categories">
                                    {emojiCategories.map((category, index) => (
                                        <button
                                            key={index}
                                            className={`emoji-category ${activeEmojiCategory === index ? 'active' : ''}`}
                                            onClick={() => setActiveEmojiCategory(index)}
                                        >
                                            {category.emojis[0]}
                                        </button>
                                    ))}
                                </div>
                                <div className="emoji-grid">
                                    {emojiCategories[activeEmojiCategory]?.emojis.map((emoji, index) => (
                                        <button
                                            key={index}
                                            className="emoji-option"
                                            onClick={() => handleEmojiClick(emoji)}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* GIF Picker */}
                    <div className="input-dropdown" ref={gifPickerRef}>
                        <button
                            className={`input-icon-btn ${showGifPicker ? 'active' : ''}`}
                            onClick={() => setShowGifPicker(!showGifPicker)}
                        >
                            <span className="gif-btn">GIF</span>
                        </button>
                        {showGifPicker && (
                            <div className="gif-picker-menu">
                                <div className="gif-search">
                                    <input
                                        type="text"
                                        placeholder="Search GIFs..."
                                        className="gif-search-input"
                                        value={gifSearchQuery}
                                        onChange={handleGifSearch}
                                    />
                                </div>
                                <div className="gif-grid">
                                    {isLoadingGifs ? (
                                        <div className="gif-loading">Loading GIFs...</div>
                                    ) : gifResults.length > 0 ? (
                                        gifResults.map((gif) => (
                                            <button
                                                key={gif.id}
                                                className="gif-option"
                                                onClick={() => handleGifSelect(gif)}
                                            >
                                                <img
                                                    src={gif.images.fixed_height.url}
                                                    alt="GIF"
                                                    className="gif-image"
                                                />
                                            </button>
                                        ))
                                    ) : gifSearchQuery ? (
                                        <div className="gif-placeholder">No GIFs found</div>
                                    ) : (
                                        <div className="gif-placeholder">Search for GIFs above</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* File Upload */}
                    <button
                        className="input-icon-btn"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Paperclip size={20} />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />

                    {/* Voice Recording */}
                    <button
                        className={`input-icon-btn ${isRecording ? 'recording' : ''}`}
                        onClick={handleVoiceRecord}
                    >
                        {isRecording ? (
                            <div className="recording-indicator">
                                <div className="recording-dot"></div>
                                <span className="recording-time">{formatRecordingTime(recordingTime)}</span>
                            </div>
                        ) : (
                            <Mic size={20} />
                        )}
                    </button>

                    {/* Send Button */}
                    <button
                        className={`input-icon-btn send-btn ${message.trim() ? 'active' : ''}`}
                        onClick={handleSendMessage}
                        disabled={!message.trim()}
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DirectMessageView;
