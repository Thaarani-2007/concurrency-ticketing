import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import api from '../api/axios';

export default function Login() {
    const [username, setUserName] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');
    const [isLoading, setLoading] = useState(false);

    const { login, setUser } = useContext(AuthContext); 
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            
            // NOTE: Ensure your AuthContext login() function returns the user object!
            const loggedInUser = await login(username, password);
            console.log("STANDARD LOGIN USER DATA:", loggedInUser);
            // Conditionally route based on role
            if (loggedInUser?.role === 'ORGANIZER') {
                navigate('/dashboard');
            } else {
                navigate('/');
            }

        } catch (err) {
            setError('Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg border border-gray-100">
                
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900">Welcome Back</h2>
                    <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
                </div>

                {error && (
                    <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Username</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUserName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                required
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                    <p className="mt-4 text-center text-sm text-gray-600">
                        Don't have an account? <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">Sign up</Link>
                    </p>
                </form>
                
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-2 text-gray-500">Or continue with</span>
                    </div>
                </div>
                
                <div className="flex justify-center w-full">
                    <GoogleLogin
                        onSuccess={async (credentialResponse) => {
                            setError('');
                            setLoading(true);
                            try {
                                const res = await api.post('auth/google/', {
                                    credential: credentialResponse.credential
                                });
                                console.log("GOOGLE API RESPONSE:", res.data);
                                console.log("ROLE DETECTED AS:", res.data.user?.role);
                                localStorage.setItem('access', res.data.access);
                                localStorage.setItem('refresh', res.data.refresh);
                                localStorage.setItem('user', JSON.stringify(res.data.user)); 
                                
                                if (setUser) {
                                    setUser(res.data.user);
                                }
                                
                                // SMART ROUTING FOR GOOGLE LOGIN
                                setTimeout(() => {
                                    if (res.data.user.role === 'ORGANIZER') {
                                        navigate('/dashboard');
                                    } else {
                                        navigate('/');
                                    }
                                }, 100);

                            }
                            catch (err) {
                                console.error("DJANGO REJECTION REASON:", err.response?.data || err.message);
                                setError('Google authentication failed on our server.');
                            }
                            finally {
                                setLoading(false);
                            }
                        }}
                        onError={() => {
                            setError('Google Login window closed or failed.');
                        }}
                        useOneTap 
                    />
                </div>
            </div>
        </div>
    );
}