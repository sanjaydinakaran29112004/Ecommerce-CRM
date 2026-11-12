import React from 'react';
import { Outlet } from 'react-router-dom';
import { ShieldCheck, BarChart3, Users } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Left Marketing Panel (Hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">EntryKode CRM</h1>
              <p className="text-xs text-brand-300">Enterprise E-Commerce Operations</p>
            </div>
          </div>

          <div className="mt-16 space-y-6 max-w-md">
            <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
              One centralized command center for your entire e-commerce business.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Manage customers 360, track real-time orders, accelerate sales pipelines, automate support SLAs, and gain operational clarity through one unified dashboard.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 max-w-md">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <BarChart3 className="w-5 h-5 text-brand-400 mb-2" />
              <h4 className="text-sm font-semibold text-white">Actionable Analytics</h4>
              <p className="text-xs text-slate-400 mt-1">Real-time revenue, orders & cohorts</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <Users className="w-5 h-5 text-brand-400 mb-2" />
              <h4 className="text-sm font-semibold text-white">Customer 360</h4>
              <p className="text-xs text-slate-400 mt-1">Complete omnichannel profile history</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-slate-800 text-xs text-slate-500 flex justify-between">
          <span>&copy; {new Date().getFullYear()} EntryKode Systems</span>
          <span>v1.0 Production Ready</span>
        </div>

        {/* Ambient Glow */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Right Form Area */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

