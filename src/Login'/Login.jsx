import React, { useState, useEffect } from 'react';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, MessageCircle } from 'lucide-react';
import './Login.css';

const Login = ({ onLoginSuccess, onBackToApp }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [currentStep, setCurrentStep] = useState('email'); // 'email', 'password', 'success'
    const [rememberMe, setRememberMe] = useState(false);
    const [isGuestMode, setIsGuestMode] = useState(false);

    // Google OAuth login
    const googleLogin = useGoogleLogin({
        onSuccess: async (response) => {
            try {
                setIsLoading(true);
                setError('');

                // Get user info from Google
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${response.access_token}` },
                });

                if (!userInfoResponse.ok) {
                    throw new Error('Failed to get user info');
                }

                const userInfo = await userInfoResponse.json();

                // Create user data object
                const userData = {
                    name: userInfo.name,
                    email: userInfo.email,
                    picture: userInfo.picture,
                    sub: userInfo.sub,
                    accessToken: response.access_token
                };

                // Save to localStorage
                localStorage.setItem('googleChatUser', JSON.stringify(userData));
                localStorage.setItem('googleChatAccessToken', response.access_token);

                setSuccess('Login successful! Redirecting...');
                setTimeout(() => {
                    onLoginSuccess(userData);
                }, 1500);

            } catch (error) {
                console.error('Google login error:', error);
                setError('Failed to login with Google. Please try again.');
            } finally {
                setIsLoading(false);
            }
        },
        onError: (error) => {
            console.error('Google login error:', error);
            setError('Google login failed. Please try again.');
            setIsLoading(false);
        },
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/contacts.readonly',
    });

    // Handle credential response (for Google One Tap)
    const handleCredentialResponse = (response) => {
        try {
            setIsLoading(true);
            setError('');

            // Decode the JWT token
            const decoded = JSON.parse(atob(response.credential.split('.')[1]));

            const userData = {
                name: decoded.name,
                email: decoded.email,
                picture: decoded.picture,
                sub: decoded.sub
            };

            // Save to localStorage
            localStorage.setItem('googleChatUser', JSON.stringify(userData));

            setSuccess('Login successful! Redirecting...');
            setTimeout(() => {
                onLoginSuccess(userData);
            }, 1500);

        } catch (error) {
            console.error('Error processing login:', error);
            setError('Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle email form submission
    const handleEmailSubmit = (e) => {
        e.preventDefault();
        if (!email.trim()) {
            setError('Please enter your email address.');
            return;
        }

        if (!isValidEmail(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        setCurrentStep('password');
        setError('');
    };

    // Handle password form submission
    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (!password.trim()) {
            setError('Please enter your password.');
            return;
        }

        // Simulate login process
        setIsLoading(true);
        setError('');

        setTimeout(() => {
            // For demo purposes, accept any password for demo@example.com
            if (email === 'demo@example.com' && password === 'demo123') {
                const userData = {
                    name: 'Demo User',
                    email: email,
                    picture: null,
                    sub: 'demo-user'
                };

                localStorage.setItem('googleChatUser', JSON.stringify(userData));
                setSuccess('Login successful! Redirecting...');
                setTimeout(() => {
                    onLoginSuccess(userData);
                }, 1500);
            } else {
                setError('Invalid email or password. Please try again.');
            }
            setIsLoading(false);
        }, 1000);
    };

    // Email validation
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Handle guest mode
    const handleGuestMode = () => {
        setIsGuestMode(true);
        const guestUser = {
            name: 'Guest User',
            email: 'guest@example.com',
            picture: null,
            sub: 'guest-user'
        };

        localStorage.setItem('googleChatUser', JSON.stringify(guestUser));
        setSuccess('Guest mode activated! Redirecting...');
        setTimeout(() => {
            onLoginSuccess(guestUser);
        }, 1500);
    };

    // Handle back to email step
    const handleBackToEmail = () => {
        setCurrentStep('email');
        setPassword('');
        setError('');
    };

    // Handle forgot password
    const handleForgotPassword = () => {
        setError('Password reset functionality would be implemented here.');
    };

    // Handle create account
    const handleCreateAccount = () => {
        setError('Account creation would redirect to Google account signup.');
    };

    return (
        <div className="login-container">
            <div className="login-card">
                {/* App Logo */}
                <div className="app-logo">
                    <div className="logo-icon">
                        <MessageCircle size={24} />
                    </div>
                    <span className="logo-text">Google Chat</span>
                </div>

                {/* Login Title */}
                <div className="login-title">
                    <h1>Sign in</h1>
                    <p>to continue to Google Chat</p>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="message error">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="message success">
                        <CheckCircle size={16} />
                        <span>{success}</span>
                    </div>
                )}

                {/* Login Forms */}
                {currentStep === 'email' && (
                    <form onSubmit={handleEmailSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email">Email or phone</label>
                            <div className="input-container">
                                <Mail size={20} className="input-icon" />
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    autoFocus
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="create-account-btn" onClick={handleCreateAccount}>
                                Create account
                            </button>
                            <button type="submit" className="next-btn">
                                Next
                            </button>
                        </div>
                    </form>
                )}

                {currentStep === 'password' && (
                    <form onSubmit={handlePasswordSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="password">Enter your password</label>
                            <div className="input-container">
                                <Lock size={20} className="input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    autoFocus
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="back-btn" onClick={handleBackToEmail}>
                                Back
                            </button>
                            <button type="submit" className="signin-btn" disabled={isLoading}>
                                {isLoading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </div>

                        <div className="password-actions">
                            <button type="button" className="forgot-password-btn" onClick={handleForgotPassword}>
                                Forgot password?
                            </button>
                        </div>
                    </form>
                )}

                {/* Divider */}
                <div className="divider">
                    <span>or</span>
                </div>

                {/* Google OAuth Login */}
                <div className="oauth-section">
                    <GoogleLogin
                        onSuccess={handleCredentialResponse}
                        onError={() => setError('Google login failed. Please try again.')}
                        theme="outline"
                        size="large"
                        text="signin_with"
                        shape="rectangular"
                        width="100%"
                        useOneTap={true}
                    />
                </div>

                {/* Guest Mode */}
                <div className="guest-section">
                    <button
                        type="button"
                        className="guest-btn"
                        onClick={handleGuestMode}
                        disabled={isLoading}
                    >
                        Continue as Guest
                    </button>
                </div>


            </div>
        </div>
    );
};

export default Login;
