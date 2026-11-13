import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '@/config/permissions.config';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Lock, Mail, User, Shield, AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Info } from 'lucide-react';
import { FieldRequirementsBox } from '@/components/feedback/FieldRequirementsBox';

export function SignupPage() {
  const navigate = useNavigate();
  const { signup, isLoading, error } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: ROLES.ADMIN, // Default to Admin; staff accounts must be created inside portal
    department: 'Management & Operations',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({});

  // Field validation checks matching enterprise security criteria
  const isNameValid = formData.name.trim().length >= 3 && /^[A-Za-z\s.]+$/.test(formData.name.trim());
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
  const isPasswordValid =
    formData.password.length >= 8 &&
    formData.password.length <= 18 &&
    /[A-Z]/.test(formData.password) &&
    /[a-z]/.test(formData.password) &&
    /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) &&
    /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(formData.password);
  const isConfirmMatch = formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;
  const isStaffRoleRestricted = formData.role === ROLES.SALES_EMPLOYEE || formData.role === ROLES.SUPPORT_EMPLOYEE;

  const isFormValid = isNameValid && isEmailValid && isPasswordValid && isConfirmMatch && !isStaffRoleRestricted;

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    let dept = 'Operations';
    if (role === ROLES.SUPER_ADMIN) dept = 'Leadership & Engineering';
    else if (role === ROLES.ADMIN) dept = 'Management & Operations';
    else if (role === ROLES.SALES_EMPLOYEE) dept = 'Sales & Business Development';
    else if (role === ROLES.SUPPORT_EMPLOYEE) dept = 'Customer Support & Success';

    setFormData((prev) => ({ ...prev, role, department: dept }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (!touched[name]) {
      setTouched((prev) => ({ ...prev, [name]: true }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const result = await signup({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      role: formData.role,
      department: formData.department,
      password: formData.password,
    });

    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <Card className="border-slate-200/90 shadow-xl bg-white max-w-xl mx-auto">
      <CardHeader
        title="CRM Admin Account Registration"
        subtitle="Only Admin & Super Admin can be registered here. Staff employees must be created inside the portal."
      />

      <CardContent className="space-y-4 pt-2">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-700 text-xs font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-brand-50/70 border border-brand-200 rounded-xl text-xs text-brand-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Enterprise Security Policy:</span>
            <p className="text-[11px] text-brand-800 mt-0.5">
              General staff members (Sales & Support) cannot self-register. Super Admin or Admin must provision employee accounts from the <strong>Employees & Roles</strong> module.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Full Name Field */}
          <div>
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={() => handleBlur('name')}
              placeholder="e.g. Sanjay D"
              leftIcon={<User className="w-4 h-4" />}
              required
            />
            {/* Real-time Requirement Helper for Name */}
            {touched.name && !isNameValid && (
              <div className="mt-2">
                <FieldRequirementsBox type="name" value={formData.name} />
              </div>
            )}
            {isNameValid && (
              <span className="text-emerald-600 font-medium flex items-center gap-1 text-[11px] mt-1">
                <CheckCircle2 className="w-3 h-3" />
                Full Name meets requirements ✓
              </span>
            )}
          </div>

          {/* 2. Corporate Email Field */}
          <div>
            <Input
              label="Corporate Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => handleBlur('email')}
              placeholder="sanjay@entrykode.com"
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />
            {/* Real-time Requirement Helper for Email */}
            {touched.email && !isEmailValid && (
              <div className="mt-2">
                <FieldRequirementsBox type="email" value={formData.email} />
              </div>
            )}
            {isEmailValid && (
              <span className="text-emerald-600 font-medium flex items-center gap-1 text-[11px] mt-1">
                <CheckCircle2 className="w-3 h-3" />
                Valid corporate email format ✓
              </span>
            )}
          </div>

          {/* 3. Role Selection (Restricted to Admin & Super Admin) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-brand-600" />
                <span>Leadership Role Scope (Mandatory) *</span>
              </span>
              <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-bold">
                Admin Auth Required
              </span>
            </label>
            <select
              value={formData.role}
              onChange={handleRoleChange}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white font-medium text-slate-800 focus:outline-hidden focus:border-brand-500 focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value={ROLES.SUPER_ADMIN}>Super Admin (Full Access to Entire System)</option>
              <option value={ROLES.ADMIN}>Admin (Operations, Inventory, Employees & Reports)</option>
              <option value={ROLES.SALES_EMPLOYEE}>Sales Employee (Restricted - Must be added by Admin)</option>
              <option value={ROLES.SUPPORT_EMPLOYEE}>Support Employee (Restricted - Must be added by Admin)</option>
            </select>

            {isStaffRoleRestricted ? (
              <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Restricted: Staff accounts must be created by Admin inside the portal. Please select Admin or Super Admin.</span>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 mt-1">
                Assigned Department: <strong className="text-slate-700">{formData.department}</strong>
              </p>
            )}
          </div>

          {/* 4. Password Field with 6-digit Real-Time Tracker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  placeholder="At least 6 digits..."
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((p) => !p)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-hidden p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  }
                  required
                />
              </div>

              {/* Reference Image Style Requirements Callout Box */}
              {(touched.password || formData.password.length > 0) && (
                <div className="mt-2">
                  <FieldRequirementsBox type="password" value={formData.password} />
                </div>
              )}
            </div>

            {/* 5. Confirm Password Field */}
            <div>
              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => handleBlur('confirmPassword')}
                  placeholder="Re-enter password..."
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-hidden p-1 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  }
                  required
                />
              </div>

              {/* Confirm Password Helper */}
              <div className="mt-1.5 text-[11px]">
                {formData.confirmPassword.length > 0 && !isConfirmMatch ? (
                  <span className="text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Passwords do not match (Mandatory)
                  </span>
                ) : isConfirmMatch ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Passwords match ✓
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Must match password (Mandatory)</span>
                )}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-3"
            isLoading={isLoading}
            disabled={!isFormValid}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create Admin Account & Enter CRM
          </Button>
        </form>

        <div className="pt-3 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 underline">
              Sign In here
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
