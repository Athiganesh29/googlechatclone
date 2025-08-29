import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, MessageCircle } from 'lucide-react';
import './Login.css';
import apiService from '../services/apiService';

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

    // Handle Google sign in
    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            setError('');

            // For demo purposes, create a demo Google user
            const demoUser = {
                name: 'Demo Google User',
                email: 'demo.google@example.com'
            };

            // Try to find existing user or create new one
            let userData;
            try {
                // Try to create user (will fail if user already exists)
                userData = await apiService.createUser(demoUser.name, demoUser.email);
            } catch (error) {
                if (error.message.includes('already exists')) {
                    // User exists, get user data from available users
                    const users = await apiService.getUsers();
                    userData = users.find(u => u.email === demoUser.email);
                } else {
                    throw error;
                }
            }

            if (!userData) {
                throw new Error('Failed to get or create user');
            }

            // Save to localStorage
            localStorage.setItem('googleChatUser', JSON.stringify(userData));

            setSuccess('Google login successful! Redirecting...');
            setTimeout(() => {
                onLoginSuccess(userData);
            }, 1500);

        } catch (error) {
            console.error('Error processing Google login:', error);
            setError('Google login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Athi login
    const handleAthiLogin = async () => {
        try {
            setIsLoading(true);
            setError('');

            const athiUser = {
                name: 'Athi',
                email: 'aathi7009@gmail.com'
            };

            // Try to find existing user or create new one
            let userData;
            try {
                userData = await apiService.createUser(athiUser.name, athiUser.email);
            } catch (error) {
                if (error.message.includes('already exists')) {
                    const users = await apiService.getUsers();
                    userData = users.find(u => u.email === athiUser.email);
                } else {
                    throw error;
                }
            }

            if (!userData) {
                throw new Error('Failed to get or create user');
            }

            localStorage.setItem('googleChatUser', JSON.stringify(userData));
            setSuccess('Athi login successful! Redirecting...');
            setTimeout(() => {
                onLoginSuccess(userData);
            }, 1500);

        } catch (error) {
            console.error('Error processing Athi login:', error);
            setError('Athi login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Athiganesh login
    const handleAthiganeshLogin = async () => {
        try {
            setIsLoading(true);
            setError('');

            const athiganeshUser = {
                name: 'Athiganesh',
                email: 'athiganesh273@gmail.com'
            };

            // Try to find existing user or create new one
            let userData;
            try {
                userData = await apiService.createUser(athiganeshUser.name, athiganeshUser.email);
            } catch (error) {
                if (error.message.includes('already exists')) {
                    const users = await apiService.getUsers();
                    userData = users.find(u => u.email === athiganeshUser.email);
                } else {
                    throw error;
                }
            }

            if (!userData) {
                throw new Error('Failed to get or create user');
            }

            localStorage.setItem('googleChatUser', JSON.stringify(userData));
            setSuccess('Athiganesh login successful! Redirecting...');
            setTimeout(() => {
                onLoginSuccess(userData);
            }, 1500);

        } catch (error) {
            console.error('Error processing Athiganesh login:', error);
            setError('Athiganesh login failed. Please try again.');
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
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (!password.trim()) {
            setError('Please enter your password.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // For demo purposes, accept any password for existing users
            const users = await apiService.getUsers();
            const existingUser = users.find(u => u.email === email);

            if (existingUser) {
                // User exists, proceed with login
                localStorage.setItem('googleChatUser', JSON.stringify(existingUser));
                setSuccess('Login successful! Redirecting...');
                setTimeout(() => {
                    onLoginSuccess(existingUser);
                }, 1500);
            } else {
                // Create new user
                const newUser = await apiService.createUser(email.split('@')[0], email);
                localStorage.setItem('googleChatUser', JSON.stringify(newUser));
                setSuccess('Account created and login successful! Redirecting...');
                setTimeout(() => {
                    onLoginSuccess(newUser);
                }, 1500);
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Email validation
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Handle guest mode
    const handleGuestMode = async () => {
        setIsGuestMode(true);
        setIsLoading(true);

        try {
            // Create or get guest user
            let guestUser;
            try {
                guestUser = await apiService.createUser('Guest User', 'guest@example.com');
            } catch (error) {
                if (error.message.includes('already exists')) {
                    const users = await apiService.getUsers();
                    guestUser = users.find(u => u.email === 'guest@example.com');
                } else {
                    throw error;
                }
            }

            localStorage.setItem('googleChatUser', JSON.stringify(guestUser));
            setSuccess('Guest mode activated! Redirecting...');
            setTimeout(() => {
                onLoginSuccess(guestUser);
            }, 1500);
        } catch (error) {
            console.error('Guest mode error:', error);
            setError('Failed to activate guest mode. Please try again.');
        } finally {
            setIsLoading(false);
        }
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

                {/* Gmail Login Buttons */}
                <div className="gmail-section">
                    <button
                        type="button"
                        className="gmail-signin-button athi-btn"
                        onClick={handleAthiLogin}
                        disabled={isLoading}
                    >
                        <div className="gmail-signin-content">
                            <div className="gmail-icon">A</div>
                            <span>Sign in as Athi (aathi7009@gmail.com)</span>
                        </div>
                    </button>

                    <button
                        type="button"
                        className="gmail-signin-button athiganesh-btn"
                        onClick={handleAthiganeshLogin}
                        disabled={isLoading}
                    >
                        <div className="gmail-signin-content">
                            <div className="gmail-icon">A</div>
                            <span>Sign in as Athiganesh (athiganesh273@gmail.com)</span>
                        </div>
                    </button>
                </div>

                {/* Google OAuth Login */}
                <div className="oauth-section">
                    <button
                        type="button"
                        className="google-signin-button"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                    >
                        <div className="google-signin-content">
                            <div className="google-icon">G</div>
                            <span>Sign in with Google (Demo)</span>
                        </div>
                    </button>
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
