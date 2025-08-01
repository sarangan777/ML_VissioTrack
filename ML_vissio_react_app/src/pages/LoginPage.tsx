import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as apiService from '../services/api';

const LoginPage: React.FC = () => {
  const [isUserLogin, setIsUserLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await apiService.login(email, password);

      if (!response.success || !response.data) {
        setError(response.message || 'Invalid email or password.');
        return;
      }

      const { user, token } = response.data;
      login(user, token);

      // ✅ Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLoginType = () => {
    setIsUserLogin(!isUserLogin);
    setEmail('');
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#e2e2e2] to-[#c9d6ff] flex items-center justify-center p-5">
      <div className="w-full max-w-[1000px] h-[550px] bg-white rounded-[30px] shadow-lg overflow-hidden relative">
        {/* Panels */}
        <div className="absolute w-full h-full">
          <div className={`absolute w-[300%] h-full bg-[#7494ec] rounded-[150px] z-20 transition-all duration-[1.8s] ease-in-out ${
            isUserLogin ? '-left-[250%]' : 'left-1/2'
          }`}></div>

          {/* Left Panel */}
          <div className={`absolute left-0 w-1/2 h-full flex flex-col justify-center items-center text-white z-20 transition-all duration-600 ease-in-out ${
            isUserLogin ? 'delay-[1.2s]' : 'left-[-50%] delay-[0.6s]'
          }`}>
            <h1 className="text-3xl font-bold mb-2">Hello, User!</h1>
            <p className="text-sm mb-5">Are you an admin?</p>
            <button
              className="w-40 h-[46px] bg-transparent border-2 border-white rounded-lg font-semibold"
              onClick={toggleLoginType}
            >
              Admin Login
            </button>
          </div>

          {/* Right Panel */}
          <div className={`absolute w-1/2 h-full flex flex-col justify-center items-center text-white z-20 transition-all duration-600 ease-in-out ${
            isUserLogin ? 'right-[-50%] delay-[0.6s]' : 'right-0 delay-[1.2s]'
          }`}>
            <h1 className="text-3xl font-bold mb-2">Welcome Admin!</h1>
            <p className="text-sm mb-5">Back to user login?</p>
            <button
              className="w-40 h-[46px] bg-transparent border-2 border-white rounded-lg font-semibold"
              onClick={toggleLoginType}
            >
              User Login
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className={`absolute right-0 w-1/2 h-full bg-white flex items-center text-gray-800 p-10 z-10 transition-all duration-600 ease-in-out delay-[1.2s] ${
          isUserLogin ? '' : 'right-1/2'
        }`}>
          <form onSubmit={handleSubmit} className="w-full">
            <h1 className="text-3xl font-bold mb-10 text-center">
              {isUserLogin ? 'User Login' : 'Admin Login'}
            </h1>

            {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}

            <div className="mb-8">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-3 px-5 bg-gray-100 rounded-lg outline-none"
                placeholder={`${isUserLogin ? 'User' : 'Admin'} Email`}
                required
              />
            </div>

            <div className="mb-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3 px-5 bg-gray-100 rounded-lg outline-none"
                placeholder="Password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#7494ec] rounded-lg text-white font-semibold transition-opacity disabled:opacity-70"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
