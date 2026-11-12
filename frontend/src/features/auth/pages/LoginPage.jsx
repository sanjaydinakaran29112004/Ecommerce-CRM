import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { SEED_USERS } from '@/services/mock/data/seedUsers';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Lock, Mail, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();

  const [email, setEmail] = useState('sanjay@entrykode.com');
  const [password, setPassword] = useState('password123');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login({ email, password });
    if (result.success) {
      navigate('/dashboard');
    }
  };

  const handleQuickLogin = async (user) => {
    setEmail(user.email);
    setPassword('password123');
    const result = await login({ email: user.email, password: 'password123' });
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <Card className="border-slate-200/90 shadow-lg">
      <CardHeader
        title="Sign in to your account"
        subtitle="Enter your employee credentials to access the CRM portal"
      />

      <CardContent className="space-y-5 pt-2">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Corporate Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@entrykode.com"
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600">
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
              <span>Remember this device</span>
            </label>
            <a href="#" className="font-medium text-brand-600 hover:text-brand-700">
              Forgot password?
            </a>
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

        {/* Quick Demo Credentials helper */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Quick Login Demo Profiles:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SEED_USERS.slice(0, 4).map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickLogin(u)}
                className="text-left p-2 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-colors text-xs"
              >
                <div className="font-semibold text-slate-800 truncate">{u.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{u.role.replace(/_/g, ' ')}</div>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
