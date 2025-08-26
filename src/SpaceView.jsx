import {
    ArrowLeft,
    ChevronDown,
    Search,
    Plus,
    Pin,
    Calendar,
    Settings,
    Users,
    FileText,
    CheckSquare,
    Smile,
    Paperclip,
    Mic,
    Send,
    Bold,
    Italic,
    Underline,
    List,
    Image,
    Video,
    File,
    Trash2
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

function SpaceView({ space, onBack }) {
    const [activeTab, setActiveTab] = useState('chat');
    const [message, setMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showFormatting, setShowFormatting] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [activeEmojiCategory, setActiveEmojiCategory] = useState(0);
    const [gifSearchQuery, setGifSearchQuery] = useState('');
    const [gifResults, setGifResults] = useState([]);
    const [isLoadingGifs, setIsLoadingGifs] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', assignedTo: '', dueDate: '', dueTime: '' });
    const [messages, setMessages] = useState([]);
    const [members, setMembers] = useState(() => {
        // Try to load members from localStorage for this space
        const savedMembers = localStorage.getItem(`space-members-${space.id}`);
        if (savedMembers) {
            try {
                return JSON.parse(savedMembers);
            } catch (error) {
                console.error('Error parsing saved members:', error);
            }
        }
        // Default to just the creator
        return [{ id: 1, name: 'Athi', email: 'athi@example.com', avatar: 'A' }];
    });
    const [showMembersDropdown, setShowMembersDropdown] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const [memberSearchResults, setMemberSearchResults] = useState([]);
    const [isSearchingMembers, setIsSearchingMembers] = useState(false);
    const fileInputRef = useRef(null);
    const recordingIntervalRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const gifPickerRef = useRef(null);
    const formattingRef = useRef(null);
    const messageInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const membersDropdownRef = useRef(null);

    // Emoji picker - using emoji-mart data
    const emojiCategories = [
        { name: 'Smileys & Emotion', emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'] },
        { name: 'People & Body', emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'] },
        { name: 'Animals & Nature', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦙', '🦒', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔'] },
        { name: 'Food & Drink', emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '🫖', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍷', '🥂', '🥃', '🍸', '🍹', '🧉', '🍾', '🥄', '🍴', '🍽️', '🥣', '🥡', '🥢', '🧂'] },
        { name: 'Activities', emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️‍♀️', '🏋️', '🏋️‍♂️', '🤼‍♀️', '🤼', '🤼‍♂️', '🤸‍♀️', '🤸', '🤸‍♂️', '⛹️‍♀️', '⛹️', '⛹️‍♂️', '🤺', '🤾‍♀️', '🤾', '🤾‍♂️', '🏊‍♀️', '🏊', '🏊‍♂️', '🤽‍♀️', '🤽', '🤽‍♂️', '🚣‍♀️', '🚣', '🚣‍♂️', '🧗‍♀️', '🧗', '🧗‍♂️', '🚵‍♀️', '🚵', '🚵‍♂️', '🚴‍♀️', '🚴', '🚴‍♂️', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹‍♀️', '🤹', '🤹‍♂️', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🪘', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩', '🎨', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '🧮', '🎥', '📺', '📻', '📷', '📸', '📹', '🎞️', '📽️', '🎬', '📱', '📲', '☎️', '📞', '📟', '📠', '🔋', '🔌', '💻', '🖥️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '🧮', '🎥', '📺', '📻', '📷', '📸', '📹', '🎞️', '📽️', '🎬', '📱', '📲', '☎️', '📞', '📟', '📠', '🔋', '🔌', '💻', '🖥️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '🧮', '🎥', '📺', '📻', '📷', '📸', '📹', '🎞️', '📽️', '🎬'] }
    ];

    const handleEmojiClick = (emoji) => {
        setMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    // Member management functions
    const searchGmailUsers = async (query) => {
        try {
            setIsSearchingMembers(true);
            console.log('Searching for members:', query);
            let results = [];

            // Simulate Gmail API search - in real implementation, this would call Google People API
            const mockContacts = [
                { id: `user-${Date.now()}-1`, name: 'John Doe', email: 'john.doe@gmail.com', avatar: 'J' },
                { id: `user-${Date.now()}-2`, name: 'Jane Smith', email: 'jane.smith@gmail.com', avatar: 'J' },
                { id: `user-${Date.now()}-3`, name: 'Mike Johnson', email: 'mike.johnson@gmail.com', avatar: 'M' },
                { id: `user-${Date.now()}-4`, name: 'Sarah Wilson', email: 'sarah.wilson@gmail.com', avatar: 'S' },
                { id: `user-${Date.now()}-5`, name: 'David Brown', email: 'david.brown@gmail.com', avatar: 'D' }
            ];

            // Filter contacts based on search query
            const contactMatches = mockContacts.filter(user =>
                user.name.toLowerCase().includes(query.toLowerCase()) ||
                user.email.toLowerCase().includes(query.toLowerCase())
            );

            results = contactMatches.map(user => ({
                ...user,
                source: 'contact'
            }));

            // If the query looks like an email, add it as a potential result
            if (query.includes('@') && query.includes('.') && !results.find(r => r.email === query)) {
                results.push({
                    id: `email-${query}`,
                    name: query.split('@')[0], // Use the part before @ as name
                    email: query,
                    avatar: query.charAt(0).toUpperCase(),
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
                        avatar: 'S',
                        source: 'suggestion'
                    });
                });
            }

            setMemberSearchResults(results);
            setIsSearchingMembers(false);
        } catch (error) {
            console.error('Error searching for members:', error);
            setIsSearchingMembers(false);
        }
    };

    const handleAddMember = (member) => {
        if (!members.find(m => m.email === member.email)) {
            const newMember = {
                id: Date.now(),
                name: member.name,
                email: member.email,
                avatar: member.avatar
            };
            setMembers(prev => {
                const updatedMembers = [...prev, newMember];
                console.log('Members updated:', updatedMembers);
                // Save to localStorage
                localStorage.setItem(`space-members-${space.id}`, JSON.stringify(updatedMembers));
                return updatedMembers;
            });
            setShowAddMemberModal(false);
            setMemberSearchQuery('');
            setMemberSearchResults([]);
        }
    };

    const handleRemoveMember = (memberId) => {
        setMembers(prev => {
            const updatedMembers = prev.filter(member => member.id !== memberId);
            // Save to localStorage
            localStorage.setItem(`space-members-${space.id}`, JSON.stringify(updatedMembers));
            return updatedMembers;
        });
    };

    const handleMemberSearch = (e) => {
        const query = e.target.value;
        setMemberSearchQuery(query);

        if (query.length >= 2) {
            searchGmailUsers(query);
        } else {
            setMemberSearchResults([]);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (membersDropdownRef.current && !membersDropdownRef.current.contains(event.target)) {
                setShowMembersDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);



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
            const messagesContainer = document.querySelector('.messages-container');
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
            console.log('Message sent:', newMessage);

            // Auto-scroll to the latest message
            scrollToBottom();
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }

        // Bold formatting with Ctrl+B or Cmd+B
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            handleBoldFormatting();
        }

        // Italic formatting with Ctrl+I or Cmd+I
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault();
            handleItalicFormatting();
        }

        // Underline formatting with Ctrl+U or Cmd+U
        if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
            e.preventDefault();
            handleUnderlineFormatting();
        }
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
                console.log('File sent:', fileMessage);
            });

            // Auto-scroll to the latest message
            scrollToBottom();
        }
    };

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
            console.log('Recording stopped, duration:', recordingTime);
            setRecordingTime(0);
        }
    };

    const formatRecordingTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        console.log('GIF sent:', gifMessage);

        // Auto-scroll to the latest message
        scrollToBottom();
    };

    // Task Management Functions
    const handleAddTask = () => {
        if (newTask.title.trim()) {
            const task = {
                id: Date.now(),
                title: newTask.title,
                assignedTo: newTask.assignedTo,
                dueDate: newTask.dueDate,
                dueTime: newTask.dueTime,
                createdAt: new Date().toISOString(),
                completed: false
            };
            setTasks(prevTasks => [...prevTasks, task]);
            setNewTask({ title: '', assignedTo: '', dueDate: '', dueTime: '' });
            setShowTaskForm(false);
        }
    };

    const handleCompleteTask = (taskId) => {
        const taskToComplete = tasks.find(task => task.id === taskId);
        if (taskToComplete) {
            const completedTask = {
                ...taskToComplete,
                completed: true,
                completedAt: new Date().toISOString()
            };
            setCompletedTasks([...completedTasks, completedTask]);
            setTasks(tasks.filter(task => task.id !== taskId));
        }
    };

    const handleDeleteTask = (taskId, isCompleted = false) => {
        if (isCompleted) {
            setCompletedTasks(completedTasks.filter(task => task.id !== taskId));
        } else {
            setTasks(tasks.filter(task => task.id !== taskId));
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTaskTime = (timeString) => {
        if (!timeString) return '';
        return timeString;
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

    // Auto-resize textarea when message changes
    useEffect(() => {
        autoResizeTextarea();
    }, [message]);

    return (
        <div className="space-view">
            {/* Header */}
            <header className="space-header">
                <div className="space-header-left">
                    <button className="back-button" onClick={onBack}>
                        <ArrowLeft size={20} />
                    </button>
                    <div className="space-info">
                        <div className="space-avatar">
                            <span className="space-avatar-text">{space.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="space-details">
                            <div className="space-name-row" ref={membersDropdownRef}>
                                <span className="space-name">{space.name}</span>
                                <button
                                    className="chevron-button"
                                    onClick={() => setShowMembersDropdown(!showMembersDropdown)}
                                >
                                    <ChevronDown size={16} />
                                </button>
                            </div>
                            <span className="space-members">{members.length} member{members.length !== 1 ? 's' : ''}</span>
                            {console.log('Current members count:', members.length, 'Members:', members)}

                            {/* Members Dropdown */}
                            {showMembersDropdown && (
                                <div className="members-dropdown">
                                    <div className="members-dropdown-header">
                                        <h4>Members ({members.length})</h4>
                                        <button
                                            className="add-member-btn"

                                        >
                                            <Plus size={16} />
                                            Add  member
                                        </button>
                                    </div>
                                    <div className="members-list">
                                        {members.map(member => (
                                            <div key={member.id} className="member-item">
                                                <div className="member-avatar">
                                                    <span>{member.avatar}</span>
                                                </div>
                                                <div className="member-info">
                                                    <div className="member-name">{member.name}</div>
                                                    <div className="member-email">{member.email}</div>
                                                </div>
                                                {member.id !== 1 && (
                                                    <button
                                                        className="remove-member-btn"
                                                        onClick={() => handleRemoveMember(member.id)}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-header-right">
                    <button className="header-icon-btn">
                        <Search size={20} />
                    </button>
                    <button className="header-icon-btn">
                        <Pin size={20} />
                    </button>
                    <button className="header-icon-btn">
                        <Settings size={20} />
                    </button>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="space-tabs">
                <div
                    className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
                    onClick={() => setActiveTab('chat')}
                >
                    Chat
                </div>
                <div
                    className={`tab ${activeTab === 'shared' ? 'active' : ''}`}
                    onClick={() => setActiveTab('shared')}
                >
                    Shared
                </div>
                <div
                    className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tasks')}
                >
                    Tasks
                </div>
            </div>

            {/* Main Content */}
            <div className="space-content">
                {activeTab === 'chat' && (
                    <>
                        <div className="date-separator">
                            <span>Today</span>
                        </div>

                        {/* Welcome Card */}
                        <div className="welcome-card">
                            <h3>Athi, welcome to your new collaboration space! Let's get started:</h3>
                            <div className="welcome-actions">
                                <button
                                    className="welcome-btn"
                                    onClick={() => setShowAddMemberModal(true)}
                                >
                                    <Users size={16} />
                                    Add members
                                </button>
                                <button onClick={() => fileInputRef.current?.click()} className="welcome-btn">
                                    <FileText size={16} />
                                    Share a file
                                </button>
                                <button className="welcome-btn" onClick={() => setShowTaskForm(true)}>
                                    <CheckSquare size={16} />
                                    Assign tasks
                                </button>
                            </div>
                        </div>

                        <div className="space-created">
                            You created this space today
                        </div>

                        {/* Messages Display */}
                        <div className="messages-container">
                            {messages.length === 0 ? (
                                <div className="no-messages">
                                    <p>No messages yet. Start the conversation!</p>
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
                                                            <img src={msg.content} alt="GIF" />
                                                        </div>
                                                    ) : msg.type === 'file' ? (
                                                        <div className="message-file">
                                                            <FileText size={16} />
                                                            <span>{msg.content}</span>
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
                    </>
                )}

                {activeTab === 'shared' && (
                    <div className="empty-state">
                        <div className="empty-illustration">
                            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* File icon */}
                                <rect x="60" y="40" width="80" height="100" rx="8" fill="#4285f4" stroke="#1a73e8" strokeWidth="2" />
                                <rect x="70" y="60" width="60" height="4" rx="2" fill="white" />
                                <rect x="70" y="70" width="40" height="4" rx="2" fill="white" />
                                <rect x="70" y="80" width="50" height="4" rx="2" fill="white" />
                                <rect x="70" y="90" width="35" height="4" rx="2" fill="white" />
                                <rect x="70" y="100" width="45" height="4" rx="2" fill="white" />

                                {/* Upload arrow */}
                                <path d="M100 120 L100 140 M90 130 L100 120 L110 130" stroke="#1a73e8" strokeWidth="3" fill="none" />

                                {/* Dots */}
                                <circle cx="140" cy="60" r="3" fill="#ea4335" />
                                <circle cx="150" cy="60" r="3" fill="#fbbc04" />
                                <circle cx="160" cy="60" r="3" fill="#34a853" />
                            </svg>
                        </div>
                        <h2 className="empty-title">No shared files</h2>
                        <p className="empty-message">Files shared in this space will appear here</p>
                        <p className="empty-instruction">
                            Share files by clicking the paperclip icon in the message input or drag and drop files directly.
                        </p>
                        <button onClick={() => fileInputRef.current?.click()} className="empty-action-btn">
                            <FileText size={16} />
                            Add files
                        </button>
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div className="tasks-container">
                        {/* Add Task Button */}
                        <div className="tasks-header">
                            <button
                                className="add-task-btn"
                                onClick={() => setShowTaskForm(true)}
                            >
                                <Plus size={16} />
                                Add Task
                            </button>
                        </div>



                        {/* Active Tasks */}
                        <div className="tasks-section">
                            <h3 className="section-title">Active Tasks ({tasks.length})</h3>
                            {tasks.length === 0 ? (
                                <div className="no-tasks">
                                    <p>No active tasks. Create your first task above!</p>
                                </div>
                            ) : (
                                <div className="tasks-table-container">
                                    <table className="tasks-table">
                                        <thead>
                                            <tr>
                                                <th className="checkbox-header">
                                                    <div className="checkbox-placeholder"></div>
                                                </th>
                                                <th>Task Title</th>
                                                <th>Assigned To</th>
                                                <th>Due Date</th>
                                                <th>Created</th>
                                                <th className="actions-header">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tasks.map((task) => (
                                                <tr key={task.id} className="task-row">
                                                    <td className="checkbox-cell">
                                                        <button
                                                            className="checkbox-btn"
                                                            onClick={() => handleCompleteTask(task.id)}
                                                        >
                                                            <div className="checkbox"></div>
                                                        </button>
                                                    </td>
                                                    <td className="task-title-cell">
                                                        <div className="task-title">{task.title}</div>
                                                    </td>
                                                    <td className="assignee-cell">
                                                        {task.assignedTo || '-'}
                                                    </td>
                                                    <td className="due-date-cell">
                                                        {task.dueDate ? (
                                                            <span>
                                                                {formatDate(task.dueDate)}
                                                                {task.dueTime && <span className="due-time"> at {formatTaskTime(task.dueTime)}</span>}
                                                            </span>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="created-cell">
                                                        {formatDate(task.createdAt)}
                                                    </td>
                                                    <td className="actions-cell">
                                                        <button
                                                            className="delete-task-btn"
                                                            onClick={() => handleDeleteTask(task.id)}
                                                            title="Delete task"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Completed Tasks */}
                        <div className="tasks-section">
                            <h3 className="section-title">Completed Tasks ({completedTasks.length})</h3>
                            {completedTasks.length === 0 ? (
                                <div className="no-tasks">
                                    <p>No completed tasks yet.</p>
                                </div>
                            ) : (
                                <div className="tasks-table-container">
                                    <table className="tasks-table completed">
                                        <thead>
                                            <tr>
                                                <th className="checkbox-header">
                                                    <div className="checkbox-placeholder completed">
                                                        <CheckSquare size={16} />
                                                    </div>
                                                </th>
                                                <th>Task Title</th>
                                                <th>Assigned To</th>
                                                <th>Completed</th>
                                                <th>Created</th>
                                                <th className="actions-header">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {completedTasks.map((task) => (
                                                <tr key={task.id} className="task-row completed">
                                                    <td className="checkbox-cell">
                                                        <div className="checkbox completed">
                                                            <CheckSquare size={16} />
                                                        </div>
                                                    </td>
                                                    <td className="task-title-cell">
                                                        <div className="task-title completed">{task.title}</div>
                                                    </td>
                                                    <td className="assignee-cell">
                                                        {task.assignedTo || '-'}
                                                    </td>
                                                    <td className="completed-cell">
                                                        {formatDate(task.completedAt)}
                                                    </td>
                                                    <td className="created-cell">
                                                        {formatDate(task.createdAt)}
                                                    </td>
                                                    <td className="actions-cell">
                                                        <button
                                                            className="delete-task-btn"
                                                            onClick={() => handleDeleteTask(task.id, true)}
                                                            title="Delete task"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Input Bar */}
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

            {/* Task Form Modal - Global Modal */}
            {showTaskForm && (
                <div className="task-form-overlay">
                    <div className="task-form-modal">
                        <div className="task-form-header">
                            <h3>Create New Task</h3>
                            <button
                                className="close-btn"
                                onClick={() => setShowTaskForm(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="task-form-content">
                            <div className="form-group">
                                <label>Task Title</label>
                                <input
                                    type="text"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    placeholder="Enter task title"
                                    className="task-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Assigned To</label>
                                <input
                                    type="text"
                                    value={newTask.assignedTo}
                                    onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                                    placeholder="Enter assignee name"
                                    className="task-input"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Due Date</label>
                                    <input
                                        type="date"
                                        value={newTask.dueDate}
                                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                        className="task-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Due Time</label>
                                    <input
                                        type="time"
                                        value={newTask.dueTime}
                                        onChange={(e) => setNewTask({ ...newTask, dueTime: e.target.value })}
                                        className="task-input"
                                    />
                                </div>
                            </div>
                            <div className="task-form-actions">
                                <button
                                    className="cancel-btn"
                                    onClick={() => setShowTaskForm(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="create-btn"
                                    onClick={handleAddTask}
                                    disabled={!newTask.title.trim()}
                                >
                                    Create Task
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {showAddMemberModal && (
                <div className="add-member-overlay">
                    <div className="add-member-modal">
                        <div className="add-member-header">
                            <h3>Add members to {space.name}</h3>
                            <button
                                className="close-btn"
                                onClick={() => {
                                    setShowAddMemberModal(false);
                                    setMemberSearchQuery('');
                                    setMemberSearchResults([]);
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div className="add-member-content">
                            <div className="search-section">
                                <label>Search people</label>
                                <div className="search-input-container">
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search by name or email"
                                        value={memberSearchQuery}
                                        onChange={handleMemberSearch}
                                        className="member-search-input"
                                    />
                                </div>
                            </div>

                            <div className="search-results">
                                {isSearchingMembers ? (
                                    <div className="search-loading">
                                        <div className="loading-spinner"></div>
                                        <span>Searching contacts...</span>
                                    </div>
                                ) : memberSearchResults.length > 0 ? (
                                    memberSearchResults.map(user => (
                                        <div
                                            key={user.id}
                                            className="contact-result-item"
                                            onClick={() => handleAddMember(user)}
                                        >
                                            <div className="contact-avatar">
                                                <span>{user.avatar}</span>
                                            </div>
                                            <div className="contact-info">
                                                <div className="contact-name">
                                                    {user.name}
                                                    {user.source === 'email' && (
                                                        <span className="contact-source"> (Email)</span>
                                                    )}
                                                    {user.source === 'suggestion' && (
                                                        <span className="contact-source"> (Suggestion)</span>
                                                    )}
                                                </div>
                                                <div className="contact-email">{user.email}</div>
                                            </div>
                                            {members.find(m => m.email === user.email) && (
                                                <div className="contact-added">
                                                    <span>Added</span>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : memberSearchQuery.length >= 2 ? (
                                    <div className="no-contacts-found">
                                        <p>No results found for "{memberSearchQuery}"</p>
                                        <div>
                                            <p>Try searching for:</p>
                                            <ul className="search-tips">
                                                <li>• A contact name from your Gmail contacts</li>
                                                <li>• A full email address (e.g., john@gmail.com)</li>
                                                <li>• A partial name or email</li>
                                            </ul>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="search-hint">Start typing to search for users</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SpaceView;
