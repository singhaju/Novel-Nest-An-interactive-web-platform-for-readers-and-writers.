import React, { useState } from 'react';
// import { useAuth } from '../hooks/useAuth'; - No longer needed for login action
import { signIn } from 'next-auth/react';
import { apiService } from '../services/apiService';


const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  // const { login, signup } = useAuth(); - Replaced with NextAuth
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        redirect: false, // Don't redirect, handle result manually
        email,
        password,
      });

      if (result?.error) {
        setError('Failed to log in. Please check your credentials.');
      }
      // If successful, the useSession hook in App.tsx will detect the change and re-render.
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
        setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
    }
    setError('');
    setLoading(true);
    try {
        await apiService.signup(username, email, password);
        // After successful signup, log the user in
        await handleLoginSubmit(e);
    } catch(err: any) {
        setError(err.message || 'Failed to sign up. Please try again.');
    } finally {
        setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white flex items-center justify-center space-x-3">
                <span className="bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 w-10 h-10 flex items-center justify-center rounded-lg font-extrabold">N</span>
                <span>NovelNest</span>
            </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setIsLogin(true)}
              className={`w-1/2 py-4 text-center font-semibold transition-colors duration-300 ${isLogin ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`w-1/2 py-4 text-center font-semibold transition-colors duration-300 ${!isLogin ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
            >
              Sign Up
            </button>
          </div>
          <div className="p-8">
            {isLogin ? (
              <form onSubmit={handleLoginSubmit}>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Welcome Back!</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Login to continue your reading journey.</p>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="login-email">Email or Username</label>
                  <input
                    type="email" id="login-email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required
                    placeholder="you@example.com"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="login-password">Password</label>
                  <input
                    type="password" id="login-password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required
                     placeholder="••••••••"
                  />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300">
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignupSubmit}>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Create Account</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Sign up to start your reading journey.</p>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="signup-username">Username</label>
                  <input
                    type="text" id="signup-username" value={username} onChange={e => setUsername(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="signup-email">Email</label>
                  <input
                    type="email" id="signup-email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="signup-password">Password</label>
                  <input
                    type="password" id="signup-password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required
                  />
                </div>
                 <div className="mb-6">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="signup-confirm-password">Confirm Password</label>
                  <input
                    type="password" id="signup-confirm-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required
                  />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300">
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
