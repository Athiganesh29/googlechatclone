# Google Chat Clone with WebSocket Messaging

A real-time messaging application built with React, WebSocket, and Express.js that allows users to send and receive messages internally.

## Features

- **Real-time Messaging**: WebSocket-based messaging system for instant message delivery
- **User Management**: Simple user registration and authentication system
- **Direct Messages**: One-on-one conversations between users
- **Spaces**: Group conversations with multiple participants
- **Modern UI**: Google Chat-inspired interface with responsive design
- **Message Types**: Support for text, files, GIFs, and emojis
- **Task Management**: Built-in task management system for spaces

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chat
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev:full
```

This will start both the WebSocket server (port 3001) and the React development server (port 5173).

## Usage

### Starting the Application

1. **Start both server and client**:
```bash
npm run dev:full
```

2. **Start only the server**:
```bash
npm run server
```

3. **Start only the client**:
```bash
npm run dev
```

### Default Users

The system comes with pre-configured users for testing:

- **John Doe** - john@example.com
- **Jane Smith** - jane@example.com
- **Mike Johnson** - mike@example.com
- **Sarah Wilson** - sarah@example.com
- **David Brown** - david@example.com
- **Athi** - athi@example.com

### How to Use

1. **Login**: Use any of the default email addresses or create a new account
2. **Start a Chat**: Click "New chat" and search for users by name or email
3. **Send Messages**: Type your message and press Enter or click the send button
4. **Create Spaces**: Use "Create a space" to start group conversations
5. **Real-time Updates**: Messages appear instantly for all participants

## Architecture

### Backend (WebSocket Server)

- **Express.js**: HTTP server for API endpoints
- **WebSocket**: Real-time communication
- **In-memory Storage**: Users, conversations, and messages stored in memory
- **REST API**: User management and conversation history

### Frontend (React)

- **React**: UI framework
- **WebSocket Client**: Real-time messaging
- **API Service**: HTTP requests to backend
- **Responsive Design**: Mobile-friendly interface

## API Endpoints

### HTTP API (Port 3001)

- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `GET /api/conversations/:userId` - Get user's conversations
- `GET /api/messages/:conversationId` - Get conversation messages
- `GET /health` - Server health check

### WebSocket Events

- `login` - User authentication
- `send_message` - Send a message
- `create_conversation` - Create new conversation
- `join_conversation` - Join existing conversation

## File Structure

```
chat/
├── server.js                 # WebSocket server
├── package.json             # Dependencies and scripts
├── src/
│   ├── App.jsx             # Main application component
│   ├── DirectMessageView.jsx # Direct message interface
│   ├── SpaceView.jsx       # Space/group chat interface
│   ├── Login'/Login.jsx    # Login component
│   ├── services/
│   │   ├── websocketService.js # WebSocket client
│   │   └── apiService.js   # HTTP API client
│   └── index.css           # Global styles
└── README.md               # This file
```

## Development

### Adding New Features

1. **New Message Types**: Extend the WebSocket message handling in `server.js`
2. **User Authentication**: Modify the login system in `Login.jsx`
3. **UI Components**: Add new React components in the `src/` directory
4. **API Endpoints**: Add new routes in `server.js`

### Testing

1. **Multiple Users**: Open multiple browser windows/tabs
2. **Real-time Testing**: Send messages between different users
3. **Network Testing**: Test WebSocket reconnection by disconnecting network

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**:
   - Ensure the server is running on port 3001
   - Check firewall settings
   - Verify CORS configuration

2. **Messages Not Sending**:
   - Check browser console for errors
   - Verify WebSocket connection status
   - Ensure user is logged in

3. **Server Won't Start**:
   - Check if port 3001 is already in use
   - Verify all dependencies are installed
   - Check Node.js version

### Debug Mode

Enable debug logging by adding to `server.js`:
```javascript
console.log('Debug mode enabled');
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes. Feel free to use and modify as needed.
