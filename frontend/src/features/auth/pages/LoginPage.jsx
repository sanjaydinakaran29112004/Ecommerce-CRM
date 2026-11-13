import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { SEED_USERS } from '@/services/mock/data/seedUsers';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Lock, Mail, AlertCircle, ArrowRight, UserPlus, Shield, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleUser, setSelectedRoleUser] = useState(null);
  const passwordInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    const result = await login({ email: email.trim(), password });
    if (result.success) {
      navigate('/dashboard');
    }
  };

  const handleSelectRoleAccount = (user) => {
    setEmail(user.email);
    setPassword(''); // Security strict: Password is never auto-filled and must be entered by authorized personnel
    setSelectedRoleUser(user);
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 100);
  };

  return (
    <Card className="border-slate-200/90 shadow-xl bg-white">
      <CardHeader
        title="Sign in to your CRM workspace"
        subtitle="Select your assigned role or enter your credentials. Password must be entered manually."
      />

      <CardContent className="space-y-4 pt-2">
        {error && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-700 text-xs font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Corporate Email ID"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              const matched = SEED_USERS.find((u) => u.email.toLowerCase() === e.target.value.toLowerCase());
              setSelectedRoleUser(matched || null);
            }}
            placeholder="e.g. sanjay@entrykode.com"
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <div className="relative">
            <Input
              ref={passwordInputRef}
              label="Account Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your authorized password..."
              leftIcon={<Lock className="w-4 h-4" />}
              helperText={
                selectedRoleUser
                  ? `Authorized role: ${selectedRoleUser.name} (${selectedRoleUser.role.replace(/_/g, ' ')}). Please enter password.`
                  : undefined
              }
              rightIcon={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-hidden p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600">
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
              <span>Remember this session</span>
            </label>
            <span className="text-slate-400 flex items-center gap-1 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              256-bit JWT Encrypted
            </span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Authenticate & Proceed
          </Button>
        </form>

        {/* Dedicated Link to Signup Page */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-600">
          <span>New staff member?</span>
          <Link
            to="/signup"
            className="font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 underline"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create an Account / Sign Up</span>
          </Link>
        </div>

        {/* Leadership Role Access Profile Selectors (Passwords are Protected) */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2.5">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-brand-600" />
              <span>Leadership Workspaces (Super Admin & Admin):</span>
            </div>
            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Manual PWD Entry
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SEED_USERS.filter((u) => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN').map((u) => {
              const isSelected = email.toLowerCase() === u.email.toLowerCase();
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelectRoleAccount(u)}
                  className={`text-left p-2.5 rounded-xl border transition-all duration-150 text-xs cursor-pointer ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/70 shadow-xs ring-1 ring-brand-500'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/60 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{u.name}</span>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                        u.role === 'SUPER_ADMIN'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {u.role.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono mt-1 truncate">
                    ID: <span className="text-slate-800 font-semibold">{u.email}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5 text-slate-400" />
                    <span>Password: •••••••• (Protected)</span>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            Staff employees (Sales & Support) are provisioned directly by Admin inside the <strong>Employees</strong> module.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

