import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { handleLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await handleLogin(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <div className="bg-surface-container p-8 rounded-3xl w-full max-w-md relative">
        <h2 className="font-display text-4xl font-semibold mb-2 text-center text-on-surface">Sign In</h2>
        <p className="text-tertiary text-center mb-8">Access your Predictive Monolith</p>

        {error && (
          <div className="bg-red-900/20 text-[#ffb4ab] p-4 rounded-lg mb-6 border border-red-900/40">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-xs uppercase tracking-wider text-tertiary mb-2">Email</label>
            <input 
              type="email" 
              className="w-full bg-surface-lowest border border-outline-variant/20 text-on-surface px-4 py-3 rounded-lg focus:outline-none focus:border-primary transition-colors"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-tertiary mb-2">Password</label>
            <input 
              type="password" 
              className="w-full bg-surface-lowest border border-outline-variant/20 text-on-surface px-4 py-3 rounded-lg focus:outline-none focus:border-primary transition-colors"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="w-full py-3 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-display font-bold hover:-translate-y-0.5 hover:shadow-[0_4px_32px_rgba(226,226,232,0.08)] transition-all">
            Login
          </button>
        </form>

        <p className="text-center mt-6 text-on-surface text-sm">
          Don't have an account? <Link to="/register" className="text-primary hover:underline ml-1">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
