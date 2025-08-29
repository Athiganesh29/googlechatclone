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
    List,
    Trash2
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import websocketService from './services/websocketService';
import apiService from './services/apiService';

function DirectMessageView({ directMessage, onBack, initialMessages = [], onDeleteConversation }) {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState(initialMessages);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showFormatting, setShowFormatting] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);
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
    const voiceInputRef = useRef(null);

    // Set up WebSocket message handlers
    useEffect(() => {
        const handleNewMessage = (message) => {
            // Check if message matches current conversation
            const messageMatches = message.message && message.message.conversationId === directMessage.conversationId;

            if (messageMatches) {
                const isFromCurrentUser = message.message.senderId === websocketService.user?.id;

                // Add the new message to the messages list
                const newMessage = {
                    id: message.message.id,
                    content: message.message.content,
                    sender: isFromCurrentUser ? 'You' : 'Other',
                    timestamp: new Date(message.message.timestamp),
                    type: message.message.type || 'text',
                    fileInfo: message.message.fileInfo // Include file info for file messages
                };

                setMessages(prev => {
                    // Check if message already exists to avoid duplicates
                    const exists = prev.find(m => m.id === newMessage.id);
                    if (exists) {
                        return prev;
                    }

                    // If this is from current user, replace optimistic message
                    if (isFromCurrentUser) {
                        return prev.map(msg =>
                            msg.isOptimistic && msg.content === newMessage.content
                                ? newMessage
                                : msg
                        ).filter(msg => !(msg.isOptimistic && msg.content === newMessage.content));
                    }

                    return [...prev, newMessage];
                });
                scrollToBottom();

                // Show notification for received message
                if (!isFromCurrentUser) {
                    // Change the page title briefly
                    const originalTitle = document.title;
                    document.title = '📨 New message! - Google Chat';
                    setTimeout(() => {
                        document.title = originalTitle;
                    }, 2000);
                }
            }
        };

        // Register handlers
        websocketService.onMessage('new_message', handleNewMessage);

        // Cleanup function
        return () => {
            websocketService.offMessage('new_message', handleNewMessage);
        };
    }, [directMessage.conversationId, directMessage]);

    // Update messages when initialMessages changes
    useEffect(() => {
        if (initialMessages && initialMessages.length > 0) {
            setMessages(initialMessages);
        } else if (initialMessages && initialMessages.length === 0) {
            setMessages([]);
        }
    }, [initialMessages]);

    // Clear messages when conversation changes
    useEffect(() => {
        setMessages([]);
    }, [directMessage.conversationId]);

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
        if (message.trim() && directMessage.conversationId) {
            const messageContent = message.trim();
            const tempId = `temp_${Date.now()}_${Math.random()}`;

            // Create optimistic message
            const optimisticMessage = {
                id: tempId,
                content: messageContent,
                sender: 'You',
                timestamp: new Date(),
                type: 'text',
                isOptimistic: true // Mark as optimistic
            };

            // Add optimistic message to UI immediately
            setMessages(prev => [...prev, optimisticMessage]);

            // Clear the input
            setMessage('');

            // Clear the contenteditable div
            const editableDiv = messageInputRef.current;
            if (editableDiv) {
                editableDiv.innerHTML = '';
                editableDiv.style.height = 'auto';
                editableDiv.style.height = '24px';
            }

            scrollToBottom();

            // Send message immediately
            websocketService.sendMessage(directMessage.conversationId, messageContent);
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

    // Auto-resize contenteditable div
    const autoResizeDiv = () => {
        const editableDiv = messageInputRef.current;
        if (editableDiv) {
            editableDiv.style.height = 'auto';
            const scrollHeight = editableDiv.scrollHeight;
            editableDiv.style.height = Math.min(scrollHeight, 120) + 'px';
        }
    };

    // Auto-resize when message changes
    useEffect(() => {
        autoResizeDiv();
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
        const editableDiv = messageInputRef.current;
        if (editableDiv) {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const textNode = document.createTextNode(emoji);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            selection.removeAllRanges();
            selection.addRange(range);
            setMessage(editableDiv.innerHTML);
        }
        setShowEmojiPicker(false);
    };

    // Text formatting functions
    const applyFormatting = (formatType) => {
        const editableDiv = messageInputRef.current;
        if (!editableDiv) return;

        // Focus on the editable div first
        editableDiv.focus();

        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();

        switch (formatType) {
            case 'bold':
                document.execCommand('bold', false, null);
                break;
            case 'italic':
                document.execCommand('italic', false, null);
                break;
            case 'underline':
                document.execCommand('underline', false, null);
                break;
            case 'list':
                if (selectedText) {
                    // Create a list item for each line
                    const lines = selectedText.split('\n');
                    const listItems = lines.map(line => `<li>${line}</li>`).join('');
                    const listHtml = `<ul>${listItems}</ul>`;

                    // Replace selected text with list
                    range.deleteContents();
                    const listElement = document.createElement('div');
                    listElement.innerHTML = listHtml;
                    range.insertNode(listElement);
                } else {
                    // Insert a new list item
                    const listItem = document.createElement('li');
                    listItem.textContent = 'list item';
                    range.insertNode(listItem);
                }
                break;
        }

        // Update the message state with the new HTML content
        setMessage(editableDiv.innerHTML);
        setShowFormatting(false);
    };

    const handleBoldFormatting = () => applyFormatting('bold');
    const handleItalicFormatting = () => applyFormatting('italic');
    const handleUnderlineFormatting = () => applyFormatting('underline');
    const handleListFormatting = () => applyFormatting('list');

    // Function to render formatted text
    const renderFormattedText = (text) => {
        if (!text) return '';

        // Since we're now using HTML tags directly, we just need to wrap lists in <ul> tags
        let formattedText = text;

        // Wrap consecutive <li> elements in <ul> tags
        if (formattedText.includes('<li>')) {
            // Split by <li> tags and wrap consecutive ones in <ul>
            const parts = formattedText.split(/(<li>.*?<\/li>)/g);
            let result = '';
            let inList = false;

            for (let i = 0; i < parts.length; i++) {
                if (parts[i].startsWith('<li>') && parts[i].endsWith('</li>')) {
                    if (!inList) {
                        result += '<ul>';
                        inList = true;
                    }
                    result += parts[i];
                } else {
                    if (inList) {
                        result += '</ul>';
                        inList = false;
                    }
                    result += parts[i];
                }
            }

            if (inList) {
                result += '</ul>';
            }

            formattedText = result;
        }

        return formattedText;
    };

    // File upload function
    const handleFileUpload = async (e) => {
        const files = e.target.files;
        if (files.length > 0 && directMessage.conversationId) {
            Array.from(files).forEach(async (file) => {
                try {
                    // Create optimistic message
                    const tempId = `temp_${Date.now()}_${Math.random()}`;
                    const optimisticMessage = {
                        id: tempId,
                        content: file.name,
                        sender: 'You',
                        timestamp: new Date(),
                        type: 'file',
                        isOptimistic: true
                    };

                    // Add optimistic message to UI immediately
                    setMessages(prev => [...prev, optimisticMessage]);
                    scrollToBottom();

                    // Upload file to server
                    const fileInfo = await apiService.uploadFile(file);

                    // Send file message via WebSocket
                    websocketService.sendFile(directMessage.conversationId, fileInfo);

                } catch (error) {
                    console.error('Error uploading file:', error);
                    // Remove optimistic message on error
                    setMessages(prev => prev.filter(msg => msg.id !== tempId));
                    alert('Failed to upload file. Please try again.');
                }
            });

            // Clear the file input
            e.target.value = '';
        }
    };

    // Voice recording function
    const handleVoiceRecord = async () => {
        if (!isRecording) {
            try {
                // Check if MediaRecorder is supported
                if (!window.MediaRecorder) {
                    alert('Voice recording is not supported in this browser. Please use a modern browser.');
                    return;
                }

                // Request microphone permission
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

                // Create MediaRecorder with fallback mime types
                let mimeType = 'audio/webm;codecs=opus';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'audio/webm';
                    if (!MediaRecorder.isTypeSupported(mimeType)) {
                        mimeType = 'audio/mp4';
                        if (!MediaRecorder.isTypeSupported(mimeType)) {
                            mimeType = '';
                        }
                    }
                }

                const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});

                const chunks = [];

                recorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        chunks.push(event.data);
                    }
                };

                recorder.onstop = async () => {
                    // Stop all tracks
                    stream.getTracks().forEach(track => track.stop());

                    // Create audio blob
                    const audioBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });

                    // Create file from blob with appropriate extension
                    const fileExtension = mimeType.includes('webm') ? 'webm' :
                        mimeType.includes('mp4') ? 'm4a' : 'wav';
                    const audioFile = new File([audioBlob], `voice-message-${Date.now()}.${fileExtension}`, {
                        type: mimeType || 'audio/webm'
                    });

                    // Upload and send voice message
                    await handleVoiceMessageUpload(audioFile);

                    // Reset state
                    setAudioChunks([]);
                    setMediaRecorder(null);
                };

                // Start recording
                recorder.start();
                setMediaRecorder(recorder);
                setAudioChunks(chunks);
                setIsRecording(true);
                setRecordingTime(0);

                recordingIntervalRef.current = setInterval(() => {
                    setRecordingTime(prev => prev + 1);
                }, 1000);

            } catch (error) {
                console.error('Error starting voice recording:', error);
                alert('Could not access microphone. Please check permissions.');
            }
        } else {
            // Stop recording
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }

            setIsRecording(false);
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
            setRecordingTime(0);
        }
    };

    // Handle voice message upload
    const handleVoiceMessageUpload = async (audioFile) => {
        if (!directMessage.conversationId) {
            console.error('No conversation ID available');
            return;
        }

        if (!audioFile) {
            console.error('No audio file provided');
            return;
        }

        // Create optimistic message
        const tempId = `temp_${Date.now()}_${Math.random()}`;
        const optimisticMessage = {
            id: tempId,
            content: 'Voice Message',
            sender: 'You',
            timestamp: new Date(),
            type: 'voice',
            isOptimistic: true
        };

        try {
            // Add optimistic message to UI immediately
            setMessages(prev => [...prev, optimisticMessage]);
            scrollToBottom();

            console.log('Uploading voice file:', {
                name: audioFile.name,
                size: audioFile.size,
                type: audioFile.type
            });

            // Check if server is running first
            try {
                await apiService.checkServerHealth();
                console.log('Server is running');
            } catch (healthError) {
                console.error('Server health check failed:', healthError);
                throw new Error('Server is not running. Please start the server first.');
            }

            // Upload voice file to server
            const voiceInfo = await apiService.uploadFile(audioFile);
            console.log('Voice file uploaded successfully:', voiceInfo);

            // Add duration to voice info
            voiceInfo.duration = recordingTime;

            // Send voice message via WebSocket
            websocketService.sendVoiceMessage(directMessage.conversationId, voiceInfo);
            console.log('Voice message sent via WebSocket');

        } catch (error) {
            console.error('Error uploading voice message:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                audioFile: {
                    name: audioFile?.name,
                    size: audioFile?.size,
                    type: audioFile?.type
                }
            });
            // Remove optimistic message on error
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            alert(`Failed to upload voice message: ${error.message}`);
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
        if (!directMessage.conversationId) {
            return;
        }

        // Create optimistic message
        const tempId = `temp_${Date.now()}_${Math.random()}`;
        const optimisticMessage = {
            id: tempId,
            content: gif.images.fixed_height.url,
            sender: 'You',
            timestamp: new Date(),
            type: 'gif',
            isOptimistic: true
        };

        // Add optimistic message to UI immediately
        setMessages(prev => [...prev, optimisticMessage]);
        scrollToBottom();

        // Send GIF message via WebSocket
        websocketService.sendGif(directMessage.conversationId, gif.images.fixed_height.url);

        setShowGifPicker(false);
        setGifSearchQuery('');
        setGifResults([]);
    };

    const handleDeleteConversation = () => {
        if (!directMessage.conversationId) {
            return;
        }

        const isConfirmed = window.confirm(
            `Are you sure you want to delete this conversation with ${directMessage.contact.name}? This action cannot be undone and will remove all messages.`
        );

        if (isConfirmed) {
            // Call the parent's delete function
            if (onDeleteConversation) {
                onDeleteConversation(directMessage.conversationId);
            }
        }
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
                    <button
                        className="header-icon-btn delete-btn"
                        onClick={handleDeleteConversation}
                        title="Delete conversation"
                    >
                        <Trash2 size={20} />
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
                            <div key={msg.id} className={`message-item ${msg.sender === 'You' ? 'sent' : 'received'}`}>
                                <div className="message-wrapper">
                                    <div className="message-header">
                                        <span className="message-sender">{msg.sender}</span>
                                        <span className="message-time">{formatMessageTime(msg.timestamp)}</span>
                                        {msg.sender === 'Other' && (
                                            <span className="message-status">📨 Received</span>
                                        )}
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
                                                {msg.fileInfo && (
                                                    <div className="file-info">
                                                        <span className="file-size">
                                                            {msg.fileInfo.size > 1024 * 1024
                                                                ? `${(msg.fileInfo.size / (1024 * 1024)).toFixed(1)} MB`
                                                                : `${(msg.fileInfo.size / 1024).toFixed(1)} KB`
                                                            }
                                                        </span>
                                                        <a
                                                            href={`http://localhost:3001${msg.fileInfo.url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="file-download"
                                                        >
                                                            Download
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        ) : msg.type === 'voice' ? (
                                            <div className="message-voice">
                                                <div className="voice-player">
                                                    <audio controls className="voice-audio">
                                                        <source src={`http://localhost:3001${msg.voiceInfo?.url}`} type={msg.voiceInfo?.mimetype} />
                                                        Your browser does not support the audio element.
                                                    </audio>
                                                    <div className="voice-info">
                                                        <span className="voice-duration">
                                                            {msg.voiceInfo?.duration ? formatRecordingTime(msg.voiceInfo.duration) : 'Voice Message'}
                                                        </span>
                                                        <span className="voice-size">
                                                            {msg.voiceInfo?.size ?
                                                                (msg.voiceInfo.size > 1024 * 1024
                                                                    ? `${(msg.voiceInfo.size / (1024 * 1024)).toFixed(1)} MB`
                                                                    : `${(msg.voiceInfo.size / 1024).toFixed(1)} KB`
                                                                ) : ''
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className="message-text"
                                                dangerouslySetInnerHTML={{
                                                    __html: renderFormattedText(msg.content)
                                                }}
                                            />
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
                    <div
                        contentEditable
                        onInput={(e) => setMessage(e.currentTarget.innerHTML)}
                        onKeyPress={handleKeyPress}
                        onFocus={(e) => {
                            if (e.currentTarget.innerHTML === '') {
                                e.currentTarget.innerHTML = '';
                            }
                        }}
                        onBlur={(e) => {
                            if (e.currentTarget.innerHTML === '') {
                                e.currentTarget.innerHTML = '';
                            }
                        }}
                        className="message-input"
                        ref={messageInputRef}
                        style={{
                            minHeight: '24px',
                            maxHeight: '120px',
                            overflowY: 'auto',
                            border: 'none',
                            outline: 'none',
                            resize: 'none',
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            lineHeight: 'inherit',
                            padding: '8px 12px'
                        }}
                        data-placeholder="Type a message..."
                        disabled={!directMessage.conversationId}
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
                        title="Record voice message"
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
                        className={`input-icon-btn send-btn ${message.trim() && directMessage.conversationId ? 'active' : ''}`}
                        onClick={handleSendMessage}
                        disabled={!message.trim() || !directMessage.conversationId}
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DirectMessageView;
