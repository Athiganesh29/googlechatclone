# Voice Messages Feature

This document describes the voice message functionality implemented in the Google Chat clone.

## Features

- **Real-time Voice Recording**: Users can record voice messages directly in the chat interface
- **WebSocket Integration**: Voice messages are sent in real-time via WebSocket without database storage
- **Multer File Handling**: Audio files are uploaded and stored using Multer middleware
- **Cross-browser Support**: Fallback support for different audio formats and browsers
- **Audio Player**: Built-in audio player for playing received voice messages

## How It Works

### Frontend (React)
1. **Voice Recording**: Uses the Web Audio API (MediaRecorder) to capture audio from the user's microphone
2. **File Upload**: Converts the recorded audio to a file and uploads it via the existing file upload API
3. **WebSocket Communication**: Sends voice message metadata via WebSocket to other participants
4. **Real-time Display**: Shows voice messages with an embedded audio player

### Backend (Node.js/Express)
1. **File Storage**: Uses Multer to handle audio file uploads to the `uploads/voice/` directory
2. **WebSocket Broadcasting**: Broadcasts voice messages to all participants in the conversation
3. **No Database**: Messages are stored in memory and broadcasted in real-time

## Technical Implementation

### Audio Format Support
- Primary: `audio/webm;codecs=opus` (best quality/size ratio)
- Fallback: `audio/webm`, `audio/mp4`, or browser default
- File extensions: `.webm`, `.m4a`, `.wav`

### File Structure
```
uploads/
├── files/          # Regular files
├── gifs/           # GIF images
└── voice/          # Voice messages
```

### API Endpoints
- `POST /api/upload` - Handles voice file uploads (same as regular files)
- WebSocket `send_voice` - Sends voice message metadata

### WebSocket Messages
```javascript
// Sending voice message
{
  type: 'send_voice',
  conversationId: 'conversation_id',
  voiceInfo: {
    originalName: 'voice-message-1234567890.webm',
    filename: 'file-1234567890-123456789.webm',
    mimetype: 'audio/webm',
    size: 12345,
    url: '/uploads/voice/file-1234567890-123456789.webm',
    duration: 30
  },
  senderId: 'user_id'
}
```

## Usage

1. **Start Recording**: Click the microphone button in the chat input
2. **Record**: Speak into your microphone (recording time is displayed)
3. **Stop Recording**: Click the microphone button again to stop
4. **Send**: The voice message is automatically uploaded and sent
5. **Play**: Recipients can play the voice message using the embedded audio player

## Browser Requirements

- Modern browser with MediaRecorder API support
- Microphone permission granted
- HTTPS connection (required for microphone access in production)

## Security Considerations

- Audio files are stored locally on the server
- No audio processing or transcription
- Files are served statically via Express
- Consider implementing file size limits and cleanup procedures for production

## Future Enhancements

- Voice message transcription
- Audio compression for better file sizes
- Voice message search
- Voice message reactions
- Audio waveform visualization
