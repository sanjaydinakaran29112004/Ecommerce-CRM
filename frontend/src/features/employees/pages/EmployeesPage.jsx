import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { mockDb } from '@/services/mock/mockDb';
import { SEED_USERS } from '@/services/mock/data/seedUsers';
import { ROLES, ROLE_LABELS, ROLE_PERMISSIONS } from '@/config/permissions.config';
import { Plus, Mail, User, CheckCircle2 } from 'lucide-react';

export function EmployeesPage() {
  const [employees, setEmployees] = useState(() => {
    return mockDb.get('users').length ? mockDb.get('users') : SEED_USERS;
  });

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    role: ROLES.SALES_EMPLOYEE,
    department: 'Sales & BD',
  });
  const [toastMessage, setToastMessage] = useState('');

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
    const entry = {
      id: `usr_${Date.now()}`,
      name: newEmployee.name,
      email: newEmployee.email.toLowerCase(),
      role: newEmployee.role,
      department: newEmployee.department,
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 500)}?w=150`,
      permissions: ROLE_PERMISSIONS[newEmployee.role],
      status: 'ACTIVE',
      token: `jwt_mock_token_${Date.now()}`,
    };

    const updated = [entry, ...employees];
    setEmployees(updated);
    mockDb.set('users', updated);
    setIsInviteModalOpen(false);
    setToastMessage(`Invitation dispatched to ${newEmployee.email} with ${ROLE_LABELS[newEmployee.role]} role!`);
    setNewEmployee({
      name: '',
      email: '',
      role: ROLES.SALES_EMPLOYEE,
      department: 'Sales & BD',
    });

    setTimeout(() => setToastMessage(''), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Employee Provisioning & RBAC Roles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage staff accounts, departments, security permissions, and operational scopes.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsInviteModalOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Invite Employee
        </Button>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {employees.map((u) => (
          <Card key={u.id} className="p-5 bg-white">
            <div className="flex items-center gap-3.5">
              <img
                src={u.avatar}
                alt={u.name}
                className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs"
              />
              <div className="overflow-hidden">
                <h4 className="font-bold text-slate-900 text-sm truncate">{u.name}</h4>
                <p className="text-xs text-slate-500 truncate">{u.department}</p>
                <p className="text-[11px] text-slate-400 font-mono truncate">{u.email}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono text-brand-600 font-semibold">
                {ROLE_LABELS[u.role] || u.role.replace(/_/g, ' ')}
              </span>
              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {u.status}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Invite Employee Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Provision New Employee Profile"
        description="Invite a team member and grant access permissions under the 4 system roles"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={newEmployee.name}
            onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
            placeholder="e.g. Santhosh Kumar"
            leftIcon={<User className="w-4 h-4 text-slate-400" />}
            required
          />

          <Input
            label="Corporate Email Address"
            type="email"
            value={newEmployee.email}
            onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
            placeholder="santhosh@entrykode.com"
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assigned Role</label>
              <select
                value={newEmployee.role}
                onChange={handleRoleChange}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white font-medium"
              >
                <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
                <option value={ROLES.ADMIN}>Admin</option>
                <option value={ROLES.SALES_EMPLOYEE}>Sales Employee</option>
                <option value={ROLES.SUPPORT_EMPLOYEE}>Support Employee</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department</label>
              <input
                type="text"
                value={newEmployee.department}
                onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white font-medium"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Send Provisioning Invite
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
