import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SEED_USERS } from '@/services/mock/data/seedUsers';
import { Plus, Shield, Mail } from 'lucide-react';

export function EmployeesPage() {
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

        <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
          Invite Employee
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SEED_USERS.map((u) => (
          <Card key={u.id} className="p-5">
            <div className="flex items-center gap-3.5">
              <img src={u.avatar} alt={u.name} className="w-11 h-11 rounded-full object-cover border border-slate-200" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{u.name}</h4>
                <p className="text-xs text-slate-500">{u.department}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono text-brand-600 font-semibold">{u.role.replace(/_/g, ' ')}</span>
              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {u.status}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
