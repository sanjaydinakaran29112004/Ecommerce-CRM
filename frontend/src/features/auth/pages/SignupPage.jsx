import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLES, ROLE_LABELS } from '@/config/permissions.config';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Lock, Mail, User, Shield, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export function SignupPage() {
  const navigate = useNavigate();
  const { signup, isLoading, error } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: ROLES.SALES_EMPLOYEE,
    department: 'Sales & BD',
    password: '',
    confirmPassword: '',
  });

  const [validationError, setValidationError] = useState('');

  const handleRoleChange = (e) => {
    const role = e.target.value;
    let dept = 'Operations';
    if (role === ROLES.SUPER_ADMIN) dept = 'Leadership & Engineering';
    else if (role === ROLES.ADMIN) dept = 'Management & Admin';
    else if (role === ROLES.SALES_EMPLOYEE) dept = 'Sales & Business Development';
    else if (role === ROLES.SUPPORT_EMPLOYEE) dept = 'Customer Support & Success';

    setFormData((prev) => ({ ...prev, role, department: dept }));
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (validationError) setValidationError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setValidationError('Please enter your full name.');
      return;
    }
    if (!formData.email.trim()) {
      setValidationError('Please enter your company email address.');
      return;
    }
    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    const result = await signup({
      name: formData.name,
      email: formData.email,
      role: formData.role,
      department: formData.department,
      password: formData.password,
    });

    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <Card className="border-slate-200/90 shadow-lg">
      <CardHeader
        title="Create your employee account"
        subtitle="Register your staff profile to access the CRM with your assigned role"
      />

      <CardContent className="space-y-4 pt-2">
        {(validationError || error) && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Santhosh Kumar"
            leftIcon={<User className="w-4 h-4" />}
            required
          />

          <Input
            label="Corporate Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="santhosh@entrykode.com"
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          {/* Role Selection (Strictly 4 Roles) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-brand-600" />
              <span>Assigned Role & System Scope *</span>
            </label>
            <select
              value={formData.role}
              onChange={handleRoleChange}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white font-medium text-slate-800 focus:outline-hidden focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value={ROLES.SUPER_ADMIN}>Super Admin (Full Access to All 12 Modules)</option>
              <option value={ROLES.ADMIN}>Admin (Operations, Inventory, Team & Reports)</option>
              <option value={ROLES.SALES_EMPLOYEE}>Sales Employee (Customers, Leads, Orders, Tasks)</option>
              <option value={ROLES.SUPPORT_EMPLOYEE}>Support Employee (Tickets, Orders, Customers, Returns)</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              Department: <strong className="text-slate-600">{formData.department}</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-2"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create Account & Enter CRM
          </Button>
        </form>

        <div className="pt-3 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 underline">
              Sign In here
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

