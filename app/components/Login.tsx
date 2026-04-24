'use client'

import { useState } from 'react';
import Image from 'next/image';
import { Eye, EyeOff, AlertCircle, User, Lock } from 'lucide-react';
import { authAPI } from '@/lib/api';

interface LoginProps {
  onLogin: (username: string, userData: any) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.login(formData.username.trim(), formData.password);
      if (response.success && response.user) {
        onLogin(response.user.username, response.user);
      } else {
        setError('Invalid username or password');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex bg-[#1a0604]">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-14 overflow-hidden
                      bg-[radial-gradient(1200px_600px_at_-10%_-20%,rgba(212,175,55,0.18),transparent_60%),radial-gradient(900px_500px_at_110%_120%,rgba(212,175,55,0.12),transparent_55%),linear-gradient(135deg,#4D140B_0%,#661B0F_45%,#3a0f08_100%)]">
        {/* Marble vein overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.09] mix-blend-screen" viewBox="0 0 800 800" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="vein" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M-50 120 C 200 60, 350 260, 600 180 S 900 300, 1050 220" stroke="url(#vein)" strokeWidth="1.2" fill="none" />
          <path d="M-50 360 C 180 300, 420 520, 620 420 S 900 500, 1050 460" stroke="url(#vein)" strokeWidth="0.8" fill="none" />
          <path d="M-50 620 C 220 560, 360 740, 640 660 S 900 780, 1050 720" stroke="url(#vein)" strokeWidth="1" fill="none" />
          <path d="M100 -20 C 180 200, 60 380, 220 560 S 340 820, 420 900" stroke="url(#vein)" strokeWidth="0.6" fill="none" />
        </svg>

        {/* Soft ambient blobs */}
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 w-[32rem] h-[32rem] rounded-full bg-black/30 blur-3xl" />

        {/* Top brand row */}
        <div className="relative z-10 flex items-center gap-3">
          <span className="h-px w-10 bg-[#D4AF37]" />
          <span className="text-[11px] uppercase tracking-[0.35em] text-[#E8C76A] font-medium">Haqeeq Marbles</span>
        </div>

        {/* Center hero */}
        <div className="relative z-10 flex flex-col items-center text-center -mt-8">
          <Image
            src="/images/haqeeq-logo.png"
            alt="Haqeeq Marbles"
            width={720}
            height={320}
            className="h-80 xl:h-96 w-auto object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
            priority
          />
          <div className="-mt-10 flex items-center gap-4">
            <span className="h-px w-12 bg-[#D4AF37]/70" />
            <span className="text-[10px] uppercase tracking-[0.5em] text-[#E8C76A]/90">Since 1984</span>
            <span className="h-px w-12 bg-[#D4AF37]/70" />
          </div>
          <p className="mt-3 font-serif italic text-2xl text-white/95 leading-snug">
            “Where stone turns precious.”
          </p>
          <p className="mt-2 text-[13px] text-red-100/70 max-w-sm">
            The inventory suite crafted for the finest marble merchants.
          </p>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 grid grid-cols-3 gap-6 pt-6 border-t border-[#D4AF37]/20">
          {[
            { label: 'Marble Types', value: 'Multi' },
            { label: 'Shade Grades', value: 'AA–B−' },
            { label: 'Tracking', value: 'Real-time' },
          ].map(stat => (
            <div key={stat.label}>
              <p className="text-[#E8C76A] font-semibold text-lg tracking-wide">{stat.value}</p>
              <p className="text-red-100/60 text-[11px] uppercase tracking-[0.2em] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#FAF7F2] relative overflow-hidden">
        {/* subtle stone speckle */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.5]
                        bg-[radial-gradient(circle_at_20%_10%,rgba(102,27,15,0.05),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(212,175,55,0.08),transparent_45%)]" />

        <div className="relative w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="mb-4 flex justify-center">
              <Image
                src="/images/haqeeq-logo.png"
                alt="Haqeeq Marbles"
                width={480}
                height={200}
                className="h-40 w-auto max-w-full object-contain"
                priority
              />
            </div>
            <p className="font-serif italic text-[#661B0F] text-lg">“Where stone turns precious.”</p>
          </div>

          {/* Card */}
          <div className="relative bg-white rounded-2xl shadow-[0_20px_60px_-20px_rgba(102,27,15,0.25)] border border-black/5 p-8">
            {/* Gold top accent */}
            <div className="absolute top-0 left-8 right-8 h-[3px] rounded-b-full bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

            <div className="mb-8">
              <p className="text-[11px] uppercase tracking-[0.3em] text-[#B8922F] font-semibold">Secure Sign-in</p>
              <h2 className="text-[28px] font-bold text-gray-900 mt-2 leading-tight">Welcome back</h2>
              <p className="text-gray-500 text-sm mt-1.5">Enter your credentials to access the inventory suite.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Username</label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#661B0F] transition-colors" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder="Enter your username"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#661B0F]/25 focus:border-[#661B0F] transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#661B0F] transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#661B0F]/25 focus:border-[#661B0F] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#661B0F] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full py-3 rounded-xl font-semibold text-sm text-white mt-2
                           bg-gradient-to-r from-[#4D140B] via-[#661B0F] to-[#4D140B]
                           shadow-lg shadow-[#661B0F]/30 hover:shadow-[#661B0F]/50
                           ring-1 ring-[#D4AF37]/30 hover:ring-[#D4AF37]/60
                           transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Signing in…
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-6">
              Contact an administrator to create an account.
            </p>
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">
            © 2026 Haqeeq Marbles · Where stone turns precious.
          </p>
        </div>
      </div>
    </div>
  );
}
