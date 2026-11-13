import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { mockDb } from '@/services/mock/mockDb';
import { SEED_USERS } from '@/services/mock/data/seedUsers';
import { ROLES, ROLE_LABELS, ROLE_PERMISSIONS } from '@/config/permissions.config';
import { ENDPOINTS } from '@/services/api/endpoints';
import { axiosClient } from '@/services/api/axiosClient';
import { Plus, Mail, User, CheckCircle2, Upload, Camera, Image, Shield, Sparkles } from 'lucide-react';
import { FieldRequirementsBox } from '@/components/feedback/FieldRequirementsBox';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
];

export function EmployeesPage() {
  const queryClient = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get(ENDPOINTS.USERS.LIST);
        const list = Array.isArray(res) ? res : res?.users || res?.data?.users || [];
        if (list.length > 0) return list;
      } catch (err) {
        console.warn('API users fetch fallback to local store:', err);
      }
      return mockDb.get('users').length ? mockDb.get('users') : SEED_USERS;
    },
    staleTime: 60 * 1000,
  });

  const employees = usersData || (mockDb.get('users').length ? mockDb.get('users') : SEED_USERS);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    phone: '',
    role: ROLES.SALES_EMPLOYEE,
    department: 'Sales & Business Development',
    password: 'Password@123',
    avatar: '',
  });
  const [toastMessage, setToastMessage] = useState('');

  // Handle local image file upload & convert to Data URL for instant preview and persistence
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image file size must be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewEmployee((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const inviteMutation = useMutation({
    mutationFn: async (payload) => {
      try {
        const res = await axiosClient.post(ENDPOINTS.USERS.CREATE, payload);
        return res?.user || res?.data?.user || res;
      } catch (err) {
        console.warn('Failed to invite via backend, persisting locally:', err);
        return payload;
      }
    },
    onSuccess: (savedUser) => {
      const generatedAvatar =
        newEmployee.avatar ||
        savedUser.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(newEmployee.name || 'Staff')}&background=4f46e5&color=fff&bold=true`;

      const entry = {
        id: savedUser._id || savedUser.id || `usr_${Date.now()}`,
        name: newEmployee.name,
        email: newEmployee.email.toLowerCase(),
        phone: newEmployee.phone || '+91 98401 23456',
        role: newEmployee.role,
        department: newEmployee.department,
        avatar: generatedAvatar,
        permissions: ROLE_PERMISSIONS[newEmployee.role] || [],
        status: 'ACTIVE',
      };

      const currentList = Array.isArray(employees) ? employees : [];
      const updated = [entry, ...currentList.filter((u) => u.email !== entry.email)];
      mockDb.set('users', updated);
      queryClient.setQueryData(['users-list'], updated);
      queryClient.invalidateQueries({ queryKey: ['users-list'] });

      setIsInviteModalOpen(false);
      setToastMessage(
        `Employee profile for ${newEmployee.name} (${newEmployee.email}) successfully created with password: ${newEmployee.password}!`
      );

      setNewEmployee({
        name: '',
        email: '',
        phone: '',
        role: ROLES.SALES_EMPLOYEE,
        department: 'Sales & Business Development',
        password: 'Password@123',
        avatar: '',
      });

      setTimeout(() => setToastMessage(''), 6000);
    },
  });

  const handleRoleChange = (e) => {
    const role = e.target.value;
    let dept = 'Operations';
    if (role === ROLES.SUPER_ADMIN) dept = 'Leadership & Engineering';
    else if (role === ROLES.ADMIN) dept = 'Backend & Operations';
    else if (role === ROLES.SALES_EMPLOYEE) dept = 'Sales & Business Development';
    else if (role === ROLES.SUPPORT_EMPLOYEE) dept = 'Customer Support & Success';

    setNewEmployee({ ...newEmployee, role, department: dept });
  };

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    const finalAvatar =
      newEmployee.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(newEmployee.name || 'Staff')}&background=4f46e5&color=fff&bold=true`;

    inviteMutation.mutate({
      name: newEmployee.name.trim(),
      email: newEmployee.email.toLowerCase().trim(),
      phone: newEmployee.phone.trim() || '+91 98401 23456',
      role: newEmployee.role,
      department: newEmployee.department,
      password: newEmployee.password || 'Password@123',
      avatar: finalAvatar,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Employee Provisioning & RBAC Roles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Admin command center to provision staff accounts, assign profile images, passwords, and role permissions.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsInviteModalOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="cursor-pointer"
        >
          Add / Invite Employee
        </Button>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {employees.map((u) => {
          const avatarSrc =
            u.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Staff')}&background=4f46e5&color=fff&bold=true`;
          const displayName = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;

          return (
            <Card key={u.id || u._id} className="p-5 bg-white hover:border-slate-300 transition-all shadow-xs">
              <div className="flex items-center gap-3.5">
                <img
                  src={avatarSrc}
                  alt={displayName}
                  className="w-13 h-13 rounded-full object-cover border-2 border-slate-200 shrink-0 shadow-xs"
                />
                <div className="overflow-hidden flex-1">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{displayName}</h4>
                  <p className="text-xs text-slate-500 truncate">{u.department || 'Operations'}</p>
                  <p className="text-[11px] text-slate-400 font-mono truncate">{u.email}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-mono text-brand-600 font-semibold text-[11px]">
                  {ROLE_LABELS[u.role] || u.role.replace(/_/g, ' ')}
                </span>
                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {u.status || 'ACTIVE'}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Provision New Employee Modal with Image Upload */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Provision New Staff Employee Profile"
        description="Admin & Super Admin authorization to register staff profiles, upload photo, and set role credentials"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          {/* Employee Avatar / Image Upload Section */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <label className="block text-xs font-semibold text-slate-800">
              Employee Profile Picture (Image Upload) *
            </label>

            <div className="flex items-center gap-4">
              <div className="relative group">
                <img
                  src={
                    newEmployee.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(newEmployee.name || 'Staff')}&background=4f46e5&color=fff&bold=true`
                  }
                  alt="Employee Preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-brand-500 shadow-xs shrink-0 bg-white"
                />
                <label className="absolute inset-0 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-5 h-5" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors">
                    <Upload className="w-3.5 h-3.5 text-brand-600" />
                    <span>Upload Image File</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>

                  {newEmployee.avatar && (
                    <button
                      type="button"
                      onClick={() => setNewEmployee((prev) => ({ ...prev, avatar: '' }))}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Upload staff portrait (JPG, PNG, WebP &lt; 2MB) or pick from presets below.
                </p>
              </div>
            </div>

            {/* Quick Avatar Presets */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Or Quick Pick Profile Preset:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewEmployee((prev) => ({ ...prev, avatar: url }))}
                    className={`relative rounded-full border-2 transition-all p-0.5 cursor-pointer shrink-0 ${
                      newEmployee.avatar === url ? 'border-brand-600 ring-2 ring-brand-300' : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img src={url} alt={`Preset ${idx}`} className="w-8 h-8 rounded-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                label="Full Name"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                placeholder="e.g. Anand Kumar"
                leftIcon={<User className="w-4 h-4 text-slate-400" />}
                required
              />
              {newEmployee.name && (newEmployee.name.trim().length < 3 || !/^[A-Za-z\s.]+$/.test(newEmployee.name)) && (
                <div className="mt-1.5">
                  <FieldRequirementsBox type="name" value={newEmployee.name} />
                </div>
              )}
            </div>

            <div>
              <Input
                label="Contact Phone"
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
              {newEmployee.phone && newEmployee.phone.replace(/[\s\-\+]/g, '').slice(-10).length !== 10 && (
                <div className="mt-1.5">
                  <FieldRequirementsBox type="phone" value={newEmployee.phone} />
                </div>
              )}
            </div>
          </div>

          <div>
            <Input
              label="Corporate Email Address"
              type="email"
              value={newEmployee.email}
              onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
              placeholder="anand@entrykode.com"
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              required
            />
            {newEmployee.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmployee.email) && (
              <div className="mt-1.5">
                <FieldRequirementsBox type="email" value={newEmployee.email} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-brand-600" />
                <span>Assigned Role</span>
              </label>
              <select
                value={newEmployee.role}
                onChange={handleRoleChange}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white font-medium cursor-pointer focus:outline-hidden focus:border-brand-500"
              >
                <option value={ROLES.SALES_EMPLOYEE}>Sales Employee (Deals & Leads)</option>
                <option value={ROLES.SUPPORT_EMPLOYEE}>Support Employee (Tickets & Desk)</option>
                <option value={ROLES.ADMIN}>Admin (Operations & Stock)</option>
                <option value={ROLES.SUPER_ADMIN}>Super Admin (Full Access)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department</label>
              <input
                type="text"
                value={newEmployee.department}
                onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white font-medium focus:outline-hidden focus:border-brand-500"
                required
              />
            </div>
          </div>

          <div>
            <Input
              label="Account Initial Password (Mandatory)"
              type="text"
              value={newEmployee.password}
              onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
              placeholder="e.g. Staff@123"
              helperText="Employee can use this password to sign in to their assigned portal"
              required
            />
            {newEmployee.password && (
              <div className="mt-1.5">
                <FieldRequirementsBox type="password" value={newEmployee.password} />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsInviteModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={inviteMutation.isPending}>
              Create & Provision Employee
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
