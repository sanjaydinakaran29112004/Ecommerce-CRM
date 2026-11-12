import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { SEED_USERS } from '@/services/mock/data/seedUsers';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Lock, Mail, AlertCircle, ArrowRight, UserPlus, KeyRound } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    const result = await login({ email: email.trim(), password });
    if (result.success) {
      navigate('/dashboard');
    }
  };

  const handleSelectRoleAccount = (user) => {
    setEmail(user.email);
    setPassword(user.password);
  };

  return (
    <Card className="border-slate-200/90 shadow-xl bg-white">
      <CardHeader
        title="Sign in to your CRM workspace"
        subtitle="Enter your assigned employee email and password to access your role-specific portal"
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
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. sanjay@entrykode.com"
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Input
            label="Account Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter role password..."
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600">
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
              <span>Remember this session</span>
            </label>
            <span className="text-slate-400">Secure 256-bit JWT Session</span>
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

        {/* 4 Official Role Access Credentials Cards */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2.5">
            <KeyRound className="w-3.5 h-3.5 text-brand-600" />
            <span>Official 4 Role Credentials (Click to Autofill):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SEED_USERS.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSelectRoleAccount(u)}
                className={`text-left p-2.5 rounded-xl border transition-all duration-150 text-xs ${
                  email === u.email
                    ? 'border-brand-500 bg-brand-50/70 shadow-xs ring-1 ring-brand-500'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{u.name}</span>
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                      u.role === 'SUPER_ADMIN'
                        ? 'bg-purple-100 text-purple-700'
                        : u.role === 'ADMIN'
                        ? 'bg-indigo-100 text-indigo-700'
                        : u.role === 'SALES_EMPLOYEE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {u.role.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 font-mono mt-1">
                  ID: <span className="text-slate-800 font-semibold">{u.email}</span>
                </div>
                <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                  PWD: <span className="text-brand-700 font-semibold">{u.password}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
