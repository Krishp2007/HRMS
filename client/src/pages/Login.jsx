import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building, Mail, Lock, LogIn as LogInIcon, ShieldCheck, AlertCircle } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    setLoading(true);

    try {
      await login(demoEmail, demoPass);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed demo login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-50/60 p-4 font-sans selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
            <Building className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">AppTrait HRMS Portal</h1>
          <p className="text-xs font-semibold text-slate-500">Corporate Staff & Operations Management</p>
        </div>

        {/* Login Form Card */}
        <div className="rounded-3xl border border-blue-100 bg-white p-8 shadow-xl shadow-blue-500/5 space-y-6">
          <h2 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">Sign In to Your Account</h2>

          {error && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Corporate Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hr@apptrait.com"
                  className="w-full rounded-xl border border-blue-100 bg-sky-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-blue-100 bg-sky-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              <LogInIcon className="h-4 w-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>

          {/* 1-Click Demo Logins */}
          <div className="border-t border-slate-100 pt-6 space-y-3">
            <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[11px]">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>1-Click Assessment Demo Roles</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <button
                type="button"
                onClick={() => handleDemoLogin('hr@apptrait.com', 'password123')}
                className="rounded-xl border border-blue-200 bg-blue-50 p-2 text-blue-800 font-extrabold hover:bg-blue-100 transition-all text-center"
              >
                HR Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('manager.eng@apptrait.com', 'password123')}
                className="rounded-xl border border-sky-200 bg-sky-50 p-2 text-sky-800 font-extrabold hover:bg-sky-100 transition-all text-center"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('employee.dev1@apptrait.com', 'password123')}
                className="rounded-xl border border-indigo-200 bg-indigo-50 p-2 text-indigo-800 font-extrabold hover:bg-indigo-100 transition-all text-center"
              >
                Employee
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
