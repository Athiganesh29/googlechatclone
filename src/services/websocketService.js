class WebSocketService {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.messageHandlers = new Map(); // Map<type, Set<handler>>
        this.user = null;
        this.clientId = null;
    }

    connect(user) {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket('ws://localhost:3001');
                this.user = user;

                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;

                    // Send login message
                    this.send({
                        type: 'login',
                        email: user.email
                    });

                    // Process any queued messages
                    this.processMessageQueue();

                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        console.log('🔌 WebSocket received message:', message);
                        this.handleMessage(message);
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error);
                    }
                };

                this.ws.onclose = () => {
                    console.log('WebSocket disconnected');
                    this.isConnected = false;
                    this.handleReconnect();
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    reject(error);
                };

            } catch (error) {
                console.error('Error creating WebSocket connection:', error);
                reject(error);
            }
        });
    }

    updateUser(user) {
        console.log('🔌 WebSocket: Updating user data:', user);
        this.user = user;
    }

    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

            setTimeout(() => {
                this.connect(this.user).catch(error => {
                    console.error('Reconnection failed:', error);
                });
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.error('Max reconnection attempts reached');
        }
    }

    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('📤 Sending WebSocket message:', message);
            this.ws.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not connected. ReadyState:', this.ws?.readyState);
            // Queue the message to send when connection is ready
            if (!this.messageQueue) {
                this.messageQueue = [];
            }
            this.messageQueue.push(message);
        }
    }

    handleMessage(message) {
        console.log('🔌 WebSocket handling message type:', message.type);
        const handlers = this.messageHandlers.get(message.type);
        if (handlers) {
            console.log('🔌 WebSocket calling handlers for:', message.type);
            handlers.forEach(handler => {
                try {
                    handler(message);
                } catch (error) {
                    console.error('Error in message handler:', error);
                }
            });
        } else {
            console.log('🔌 WebSocket no handler found for:', message.type);
        }
    }

    onMessage(type, handler) {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, new Set());
        }
        this.messageHandlers.get(type).add(handler);
        console.log(`🔌 Registered handler for ${type}, total handlers: ${this.messageHandlers.get(type).size}`);
    }

    offMessage(type, handler) {
        const handlers = this.messageHandlers.get(type);
        if (handlers && handler) {
            handlers.delete(handler);
            console.log(`🔌 Removed specific handler for ${type}, remaining handlers: ${handlers.size}`);
        } else if (handlers) {
            // Remove all handlers for this type
            this.messageHandlers.delete(type);
            console.log(`🔌 Removed all handlers for ${type}`);
        }
    }

    processMessageQueue() {
        if (this.messageQueue && this.messageQueue.length > 0) {
            console.log(`Processing ${this.messageQueue.length} queued messages`);
            while (this.messageQueue.length > 0) {
                const message = this.messageQueue.shift();
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify(message));
                }
            }
        }
    }

    sendMessage(conversationId, content) {
        this.send({
            type: 'send_message',
            conversationId,
            content,
            senderId: this.user.id
        });
    }

    sendFile(conversationId, fileInfo) {
        this.send({
            type: 'send_file',
            conversationId,
            fileInfo,
            senderId: this.user.id
        });
    }

    sendGif(conversationId, gifUrl) {
        this.send({
            type: 'send_gif',
            conversationId,
            gifUrl,
            senderId: this.user.id
        });
    }

    sendVoiceMessage(conversationId, voiceInfo) {
        this.send({
            type: 'send_voice',
            conversationId,
            voiceInfo,
            senderId: this.user.id
        });
    }

    createConversation(participants, name, type = 'direct') {
        console.log('📝 Creating conversation:', { participants, name, type });
        const message = {
            type: 'create_conversation',
            participants,
            name,
            type
        };
        this.send(message);
    }

    joinConversation(conversationId) {
        this.send({
            type: 'join_conversation',
            conversationId,
            userId: this.user.id
        });
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.messageHandlers.clear();
        this.messageQueue = [];
    }

    isReady() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    getConnectionStatus() {
        if (!this.ws) return 'disconnected';
        switch (this.ws.readyState) {
            case WebSocket.CONNECTING: return 'connecting';
            case WebSocket.OPEN: return 'connected';
            case WebSocket.CLOSING: return 'closing';
            case WebSocket.CLOSED: return 'closed';
            default: return 'unknown';
        }
    }
}

// Create a singleton instance
const websocketService = new WebSocketService();
export default websocketService;
