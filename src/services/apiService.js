const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
    async getUsers() {
        try {
            const response = await fetch(`${API_BASE_URL}/users`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }

    async createUser(name, email) {
        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    async getConversations(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/conversations/${userId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching conversations:', error);
            throw error;
        }
    }

    async getMessages(conversationId) {
        try {
            const response = await fetch(`${API_BASE_URL}/messages/${conversationId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    }

    async deleteConversation(conversationId) {
        try {
            const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting conversation:', error);
            throw error;
        }
    }

    async checkServerHealth() {
        try {
            console.log('Checking server health at:', `${API_BASE_URL.replace('/api', '')}/health`);
            const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
            console.log('Health check response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Server health check successful:', result);
            return result;
        } catch (error) {
            console.error('Error checking server health:', error);
            console.error('This usually means the server is not running on port 3001');
            throw error;
        }
    }

    async testServerConnection() {
        try {
            console.log('Testing server connection...');
            const health = await this.checkServerHealth();
            return { success: true, data: health };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                suggestion: 'Make sure to run "npm run server" in the chat directory'
            };
        }
    }

    async uploadFile(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            console.log('Attempting to upload file to:', `${API_BASE_URL}/upload`);
            console.log('File details:', {
                name: file.name,
                size: file.size,
                type: file.type
            });

            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                body: formData,
            });

            console.log('Upload response status:', response.status);
            console.log('Upload response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                // Try to get error details
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (jsonError) {
                    // If response is not JSON, try to get text
                    try {
                        const textResponse = await response.text();
                        console.error('Non-JSON response received:', textResponse.substring(0, 200));
                        errorMessage = `Server returned non-JSON response: ${response.status}`;
                    } catch (textError) {
                        errorMessage = `Server error: ${response.status}`;
                    }
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('Upload successful:', result);
            return result;
        } catch (error) {
            console.error('Error uploading file:', error);
            console.error('Full error details:', {
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

const apiService = new ApiService();
export default apiService;
