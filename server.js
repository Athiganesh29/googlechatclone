import { WebSocketServer } from 'ws';
import http from 'http';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Create upload directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const filesDir = path.join(uploadsDir, 'files');
const gifsDir = path.join(uploadsDir, 'gifs');
const voiceDir = path.join(uploadsDir, 'voice');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir, { recursive: true });
}
if (!fs.existsSync(gifsDir)) {
    fs.mkdirSync(gifsDir, { recursive: true });
}
if (!fs.existsSync(voiceDir)) {
    fs.mkdirSync(voiceDir, { recursive: true });
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Determine destination based on file type
        if (file.mimetype.startsWith('audio/')) {
            cb(null, voiceDir);
        } else if (file.mimetype.startsWith('image/') && (file.originalname.endsWith('.gif') || file.mimetype === 'image/gif')) {
            cb(null, gifsDir);
        } else {
            cb(null, filesDir);
        }
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        // Allow common file types including audio
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'text/plain', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/zip', 'application/x-rar-compressed',
            'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/webm', 'audio/m4a'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    }
});

// Enable CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Store connected clients and their user info
const clients = new Map();
const users = new Map();
const messages = new Map(); // Store messages by conversation ID
const conversations = new Map(); // Store conversation metadata

// Generate unique IDs
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Create some default users for testing
const defaultUsers = [
    { id: 'aathi7009@gmail.com', name: 'Athi', email: 'aathi7009@gmail.com', avatar: 'A' },
    { id: 'athiganesh273@gmail.com', name: 'Athiganesh', email: 'athiganesh273@gmail.com', avatar: 'A' },
    { id: 'john@example.com', name: 'John Doe', email: 'john@example.com', avatar: 'J' },
    { id: 'jane@example.com', name: 'Jane Smith', email: 'jane@example.com', avatar: 'J' },
    { id: 'mike@example.com', name: 'Mike Johnson', email: 'mike@example.com', avatar: 'M' },
    { id: 'sarah@example.com', name: 'Sarah Wilson', email: 'sarah@example.com', avatar: 'S' },
    { id: 'david@example.com', name: 'David Brown', email: 'david@example.com', avatar: 'D' }
];

// Initialize default users
defaultUsers.forEach(user => {
    users.set(user.email, user);
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('File upload received:', {
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            destination: req.file.destination
        });

        const fileInfo = {
            originalName: req.file.originalname,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            url: `/uploads/${req.file.mimetype.startsWith('audio/') ? 'voice' : req.file.mimetype.startsWith('image/') && (req.file.originalname.endsWith('.gif') || req.file.mimetype === 'image/gif') ? 'gifs' : 'files'}/${req.file.filename}`
        };

        console.log('File uploaded successfully:', fileInfo);
        res.json(fileInfo);
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ error: 'File upload failed: ' + error.message });
    }
});

// API Routes
app.get('/api/users', (req, res) => {
    res.json(Array.from(users.values()));
});

app.post('/api/users', (req, res) => {
    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }

    if (users.has(email)) {
        return res.status(409).json({ error: 'User already exists' });
    }

    const newUser = {
        id: email, // Use email as the user ID for consistency
        name,
        email,
        avatar: name.charAt(0).toUpperCase()
    };

    users.set(email, newUser);
    res.status(201).json(newUser);
});

app.get('/api/conversations/:userId', (req, res) => {
    const { userId } = req.params;
    const userConversations = Array.from(conversations.values())
        .filter(conv => conv.participants.includes(userId));

    res.json(userConversations);
});

// Debug endpoint to see all conversations
app.get('/api/debug/conversations', (req, res) => {
    const allConversations = Array.from(conversations.entries()).map(([key, conv]) => ({
        key: key,
        conversation: conv
    }));

    res.json({
        totalConversations: conversations.size,
        conversations: allConversations
    });
});

// Clear all active connections
app.post('/api/debug/clear-connections', (req, res) => {
    try {
        const connectionCount = clients.size;
        clients.clear();
        console.log(`🗑️ Cleared ${connectionCount} active connections`);
        res.json({
            message: `Cleared ${connectionCount} active connections`,
            clearedCount: connectionCount
        });
    } catch (error) {
        console.error('Error clearing connections:', error);
        res.status(500).json({ error: 'Failed to clear connections' });
    }
});

// Get active connections info
app.get('/api/debug/connections', (req, res) => {
    const connections = Array.from(clients.entries()).map(([clientId, client]) => ({
        clientId,
        userId: client.user.id,
        userName: client.user.name,
        email: client.user.email,
        readyState: client.ws.readyState
    }));

    res.json({
        totalConnections: clients.size,
        connections: connections
    });
});

// Clear all data (connections, conversations, messages)
app.post('/api/debug/clear-all', (req, res) => {
    try {
        const connectionCount = clients.size;
        const conversationCount = conversations.size;
        const messageCount = messages.size;

        clients.clear();
        conversations.clear();
        messages.clear();

        console.log(`🗑️ Cleared all data: ${connectionCount} connections, ${conversationCount} conversations, ${messageCount} message groups`);

        res.json({
            message: 'All data cleared successfully',
            cleared: {
                connections: connectionCount,
                conversations: conversationCount,
                messages: messageCount
            }
        });
    } catch (error) {
        console.error('Error clearing all data:', error);
        res.status(500).json({ error: 'Failed to clear all data' });
    }
});

app.get('/api/messages/:conversationId', (req, res) => {
    const { conversationId } = req.params;
    const conversationMessages = messages.get(conversationId) || [];
    res.json(conversationMessages);
});

app.delete('/api/conversations/:conversationId', (req, res) => {
    const { conversationId } = req.params;

    console.log('🗑️ Delete request for conversation:', conversationId);
    console.log('🗑️ Available conversations:', Array.from(conversations.keys()));
    console.log('🗑️ Conversations map size:', conversations.size);
    console.log('🗑️ All conversations data:', Array.from(conversations.entries()));

    try {
        // Check if conversation exists
        if (!conversations.has(conversationId)) {
            console.log('🗑️ Conversation not found in map');
            return res.status(404).json({
                error: 'Conversation not found',
                requestedId: conversationId,
                availableIds: Array.from(conversations.keys()),
                availableConversations: Array.from(conversations.values()).map(conv => ({
                    id: conv.id,
                    name: conv.name,
                    participants: conv.participants
                }))
            });
        }

        // Delete conversation
        conversations.delete(conversationId);

        // Delete all messages for this conversation
        messages.delete(conversationId);

        console.log(`🗑️ Conversation ${conversationId} deleted successfully`);

        res.json({ message: 'Conversation deleted successfully' });
    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({ error: 'Failed to delete conversation' });
    }
});

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            handleWebSocketMessage(ws, message);
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    });

    ws.on('close', () => {
        // Remove client from connected clients
        for (const [clientId, client] of clients.entries()) {
            if (client.ws === ws) {
                clients.delete(clientId);
                console.log(`Client ${clientId} (${client.user?.name || 'Unknown'}) disconnected`);
                break;
            }
        }
    });
});

function handleWebSocketMessage(ws, message) {
    console.log('Server: Received WebSocket message:', message);

    switch (message.type) {
        case 'login':
            handleLogin(ws, message);
            break;
        case 'send_message':
            handleSendMessage(ws, message);
            break;
        case 'send_file':
            handleSendFile(ws, message);
            break;
        case 'send_gif':
            handleSendGif(ws, message);
            break;
        case 'send_voice':
            handleSendVoice(ws, message);
            break;
        case 'create_conversation':
            handleCreateConversation(ws, message);
            break;
        case 'direct':
            // Handle direct message creation (same as create_conversation)
            handleCreateConversation(ws, message);
            break;
        case 'join_conversation':
            handleJoinConversation(ws, message);
            break;

        default:
            console.log('Server: Unknown message type:', message.type);
    }
}

function handleLogin(ws, message) {
    const { email } = message;
    let user = users.get(email);

    // If user doesn't exist, create a new user
    if (!user) {
        const name = email.split('@')[0]; // Use email prefix as name
        user = {
            id: email, // Use email as the user ID for consistency
            name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
            email: email,
            avatar: name.charAt(0).toUpperCase()
        };

        users.set(email, user);
        console.log(`Created new user via WebSocket: ${user.name} (${email})`);
    }

    const clientId = generateId();
    clients.set(clientId, { ws, user });

    ws.send(JSON.stringify({
        type: 'login_success',
        user,
        clientId
    }));

    console.log(`User ${user.name} logged in via WebSocket`);

    // Log how many clients this user has
    const userClients = findClientByUserId(user.id);
    console.log(`User ${user.name} now has ${userClients.length} active connections`);
}

function handleSendMessage(ws, message) {
    console.log('Server: Received send_message:', message);
    console.log('Server: Current user ID:', message.senderId);
    console.log('Server: Conversation ID:', message.conversationId);
    console.log('Server: Message content:', message.content);
    const { conversationId, content, senderId } = message;

    const newMessage = {
        id: generateId(),
        conversationId,
        content,
        senderId,
        timestamp: new Date().toISOString(),
        type: 'text'
    };

    console.log('Server: Created new message:', newMessage);

    // Store message
    if (!messages.has(conversationId)) {
        messages.set(conversationId, []);
    }
    messages.get(conversationId).push(newMessage);

    // Broadcast message to all clients in the conversation
    const conversation = conversations.get(conversationId);
    console.log('Server: Found conversation:', conversation);
    if (conversation) {
        console.log('Server: Broadcasting message to conversation participants:', conversation.participants);
        console.log('Server: All connected clients:', Array.from(clients.entries()).map(([id, client]) => ({ clientId: id, userId: client.user.id, userName: client.user.name })));
        broadcastToConversation(conversationId, {
            type: 'new_message',
            message: newMessage
        });
    } else {
        console.log('Server: No conversation found for ID:', conversationId);
        console.log('Server: Available conversations:', Array.from(conversations.keys()));
        console.log('Server: All conversations:', Array.from(conversations.entries()).map(([id, conv]) => ({
            id,
            name: conv.name,
            participants: conv.participants,
            type: conv.type
        })));
    }
}

function handleSendFile(ws, message) {
    console.log('Server: Received send_file:', message);
    const { conversationId, fileInfo, senderId } = message;

    const newMessage = {
        id: generateId(),
        conversationId,
        content: fileInfo.originalName,
        senderId,
        timestamp: new Date().toISOString(),
        type: 'file',
        fileInfo: {
            originalName: fileInfo.originalName,
            filename: fileInfo.filename,
            mimetype: fileInfo.mimetype,
            size: fileInfo.size,
            url: fileInfo.url
        }
    };

    console.log('Server: Created new file message:', newMessage);

    // Store message
    if (!messages.has(conversationId)) {
        messages.set(conversationId, []);
    }
    messages.get(conversationId).push(newMessage);

    // Broadcast message to all clients in the conversation
    const conversation = conversations.get(conversationId);
    if (conversation) {
        broadcastToConversation(conversationId, {
            type: 'new_message',
            message: newMessage
        });
    }
}

function handleSendGif(ws, message) {
    console.log('Server: Received send_gif:', message);
    const { conversationId, gifUrl, senderId } = message;

    const newMessage = {
        id: generateId(),
        conversationId,
        content: gifUrl,
        senderId,
        timestamp: new Date().toISOString(),
        type: 'gif'
    };

    console.log('Server: Created new GIF message:', newMessage);

    // Store message
    if (!messages.has(conversationId)) {
        messages.set(conversationId, []);
    }
    messages.get(conversationId).push(newMessage);

    // Broadcast message to all clients in the conversation
    const conversation = conversations.get(conversationId);
    if (conversation) {
        broadcastToConversation(conversationId, {
            type: 'new_message',
            message: newMessage
        });
    }
}

function handleSendVoice(ws, message) {
    console.log('Server: Received send_voice:', message);
    const { conversationId, voiceInfo, senderId } = message;

    console.log('Server: Voice message details:', {
        conversationId,
        senderId,
        voiceInfo: {
            originalName: voiceInfo.originalName,
            filename: voiceInfo.filename,
            mimetype: voiceInfo.mimetype,
            size: voiceInfo.size,
            url: voiceInfo.url,
            duration: voiceInfo.duration
        }
    });

    const newMessage = {
        id: generateId(),
        conversationId,
        content: voiceInfo.originalName || 'Voice Message',
        senderId,
        timestamp: new Date().toISOString(),
        type: 'voice',
        voiceInfo: {
            originalName: voiceInfo.originalName,
            filename: voiceInfo.filename,
            mimetype: voiceInfo.mimetype,
            size: voiceInfo.size,
            url: voiceInfo.url,
            duration: voiceInfo.duration
        }
    };

    console.log('Server: Created new voice message:', newMessage);

    // Store message
    if (!messages.has(conversationId)) {
        messages.set(conversationId, []);
    }
    messages.get(conversationId).push(newMessage);

    // Broadcast message to all clients in the conversation
    const conversation = conversations.get(conversationId);
    if (conversation) {
        console.log('Server: Broadcasting voice message to conversation:', conversationId);
        broadcastToConversation(conversationId, {
            type: 'new_message',
            message: newMessage
        });
    } else {
        console.log('Server: No conversation found for voice message:', conversationId);
    }
}

function handleCreateConversation(ws, message) {
    console.log('Server: Received create_conversation message:', message);
    console.log('Server: Participants:', message.participants);
    console.log('Server: Name:', message.name);
    console.log('Server: Type:', message.type);
    const { participants, name, type } = message; // type: 'direct' or 'space'

    const conversationId = generateId();
    const conversation = {
        id: conversationId,
        name: name || `Conversation ${conversationId}`,
        participants,
        type,
        createdAt: new Date().toISOString(),
        messages: []
    };

    console.log('Server: Created conversation:', conversation);

    conversations.set(conversationId, conversation);
    messages.set(conversationId, []);

    // Notify all participants about the new conversation
    console.log('Server: Notifying participants:', participants);
    console.log('Server: All connected clients:', Array.from(clients.entries()).map(([id, client]) => ({ clientId: id, userId: client.user.id, userName: client.user.name })));
    participants.forEach(participantId => {
        const userClients = findClientByUserId(participantId);
        console.log(`Server: Looking for clients with user ID ${participantId}:`, userClients.length > 0 ? `Found ${userClients.length} clients` : 'Not found');
        userClients.forEach(client => {
            if (client.ws.readyState === 1) { // WebSocket.OPEN = 1
                console.log(`Server: Sending conversation_created to user ${participantId}`);
                client.ws.send(JSON.stringify({
                    type: 'conversation_created',
                    conversation
                }));
            }
        });
    });
}

function handleJoinConversation(ws, message) {
    const { conversationId, userId } = message;

    const conversation = conversations.get(conversationId);
    if (!conversation) {
        ws.send(JSON.stringify({
            type: 'error',
            error: 'Conversation not found'
        }));
        return;
    }

    if (!conversation.participants.includes(userId)) {
        conversation.participants.push(userId);
    }

    // Send conversation history
    const conversationMessages = messages.get(conversationId) || [];
    ws.send(JSON.stringify({
        type: 'conversation_joined',
        conversation,
        messages: conversationMessages
    }));
}

function broadcastToConversation(conversationId, message) {
    const conversation = conversations.get(conversationId);
    if (!conversation) {
        console.log('Server: No conversation found for broadcasting:', conversationId);
        return;
    }

    console.log('Server: Broadcasting to conversation participants:', conversation.participants);
    console.log('Server: Message to broadcast:', message);

    conversation.participants.forEach(participantId => {
        const userClients = findClientByUserId(participantId);
        console.log(`Server: Looking for clients with user ID ${participantId}:`, userClients.length > 0 ? `Found ${userClients.length} clients` : 'Not found');
        userClients.forEach(client => {
            if (client.ws.readyState === 1) { // WebSocket.OPEN = 1
                console.log(`Server: Sending message to user ${participantId} (${client.user.name})`);
                client.ws.send(JSON.stringify(message));
            } else {
                console.log(`Server: Client not connected for user ${participantId}`);
            }
        });
    });
}

function findClientByUserId(userId) {
    const userClients = [];
    for (const [clientId, client] of clients.entries()) {
        if (client.user.id === userId) {
            userClients.push(client);
        }
    }
    return userClients;
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        connectedClients: clients.size,
        totalUsers: users.size,
        totalConversations: conversations.size
    });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
    console.log(`HTTP server running on port ${PORT}`);
    console.log(`Default users created: ${defaultUsers.length}`);
});
