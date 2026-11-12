import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { mockDb } from '@/services/mock/mockDb';
import { Plus, CheckSquare, Clock, AlertCircle, User, CheckCircle2 } from 'lucide-react';

const INITIAL_TASKS = [
  {
    id: 'tsk_1',
    title: 'Call Apex Cloud regarding quotation revisions and bulk discounts',
    assignedTo: 'Karthik Raja',
    priority: 'HIGH',
    dueDate: 'Today, 04:00 PM',
    completed: false,
    status: 'IN_PROGRESS',
  },
  {
    id: 'tsk_2',
    title: 'Audit damaged keyboard units with warehouse logistics team',
    assignedTo: 'Sanjay D',
    priority: 'MEDIUM',
    dueDate: 'Tomorrow, 11:00 AM',
    completed: false,
    status: 'TO_DO',
  },
  {
    id: 'tsk_3',
    title: 'Follow up on pending Razorpay refund reconciliation for return #41',
    assignedTo: 'Priya Sundaram',
    priority: 'HIGH',
    dueDate: '14 Nov 2026',
    completed: true,
    status: 'COMPLETED',
  },
];

export function TasksPage() {
  const [tasks, setTasks] = useState(() => {
    return mockDb.get('tasks').length ? mockDb.get('tasks') : INITIAL_TASKS;
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    assignedTo: 'Karthik Raja',
    priority: 'HIGH',
    dueDate: 'Tomorrow, 05:00 PM',
  });

  const toggleTask = (taskId) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, completed: !t.completed, status: !t.completed ? 'COMPLETED' : 'IN_PROGRESS' };
      }
      return t;
    });
    setTasks(updated);
    mockDb.set('tasks', updated);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const entry = {
      id: `tsk_${Date.now()}`,
      title: newTask.title,
      assignedTo: newTask.assignedTo,
      priority: newTask.priority,
      dueDate: newTask.dueDate,
      completed: false,
      status: 'TO_DO',
    };

    const updated = [entry, ...tasks];
    setTasks(updated);
    mockDb.set('tasks', updated);
    setIsCreateModalOpen(false);
    setNewTask({
      title: '',
      assignedTo: 'Karthik Raja',
      priority: 'HIGH',
      dueDate: 'Tomorrow, 05:00 PM',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Employee Tasks & Activity Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Assign team deliverables, follow-up calls, warehouse checks, and monitor deadlines.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Create Task
        </Button>
      </div>

      <div className="space-y-3">
        {tasks.map((t) => (
          <Card
            key={t.id}
            className={`p-4 flex items-center justify-between transition-all duration-150 ${
              t.completed ? 'bg-slate-50/80 border-slate-200 opacity-75' : 'hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <input
                type="checkbox"
                checked={t.completed}
                onChange={() => toggleTask(t.id)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
              />
              <div>
                <h4
                  className={`font-semibold text-xs sm:text-sm ${
                    t.completed ? 'line-through text-slate-400' : 'text-slate-800'
                  }`}
                >
                  {t.title}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                  <span>
                    Assigned to: <strong className="text-slate-600 font-semibold">{t.assignedTo}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{t.dueDate}</span>
                  </span>
                  {t.completed && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold ml-2">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Completed</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                t.priority === 'HIGH'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {t.priority}
            </span>
          </Card>
        ))}
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Assign New Task"
        description="Delegate operational deliverables to team members with target deadlines"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Task Description / Objective"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            placeholder="e.g. Follow up on Wholesale inquiry #104"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assignee</label>
              <select
                value={newTask.assignedTo}
                onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white font-medium"
              >
                <option value="Sanjay D">Sanjay D (Super Admin)</option>
                <option value="Ishwarya R">Ishwarya R (Admin)</option>
                <option value="Karthik Raja">Karthik Raja (Sales Employee)</option>
                <option value="Priya Sundaram">Priya Sundaram (Support Employee)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white font-medium"
              >
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
          </div>

          <Input
            label="Target Due Date & Time"
            value={newTask.dueDate}
            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
            placeholder="e.g. Tomorrow, 04:00 PM"
            leftIcon={<Clock className="w-4 h-4 text-slate-400" />}
            required
          />

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create & Assign Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
