import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { mockDb } from '@/services/mock/mockDb';
import { ENDPOINTS } from '@/services/api/endpoints';
import { axiosClient } from '@/services/api/axiosClient';
import { Plus, Clock, CheckCircle2, Circle, AlertCircle, Check, Filter } from 'lucide-react';

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
    status: 'TODO',
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
  const queryClient = useQueryClient();
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'COMPLETED'
  const [toastMessage, setToastMessage] = useState('');

  const { data: rawTasksData, isLoading } = useQuery({
    queryKey: ['tasks-list'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get(ENDPOINTS.TASKS.LIST);
        const list = Array.isArray(res) ? res : res?.tasks || res?.data?.tasks || [];
        if (list.length > 0) return list;
      } catch (err) {
        console.warn('API tasks fetch fallback to local store:', err);
      }
      return mockDb.get('tasks').length ? mockDb.get('tasks') : INITIAL_TASKS;
    },
    staleTime: 30 * 1000,
  });

  // Local state for 0ms instantaneous optimistic UI updates
  const [localTasks, setLocalTasks] = useState(() => {
    const fromMock = mockDb.get('tasks');
    return fromMock && fromMock.length > 0 ? fromMock : INITIAL_TASKS;
  });

  // Sync query data into local state whenever fresh data arrives
  useEffect(() => {
    if (rawTasksData && rawTasksData.length > 0) {
      setLocalTasks(rawTasksData);
      mockDb.set('tasks', rawTasksData);
    }
  }, [rawTasksData]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    assignedTo: 'Karthik Raja',
    priority: 'HIGH',
    dueDate: 'Tomorrow, 05:00 PM',
  });

  const createTaskMutation = useMutation({
    mutationFn: async (payload) => {
      try {
        const res = await axiosClient.post(ENDPOINTS.TASKS.CREATE, payload);
        return res?.task || res?.data?.task || res;
      } catch (err) {
        console.warn('Failed to save task to backend, using local store:', err);
        return payload;
      }
    },
    onSuccess: (savedTask) => {
      const entry = {
        id: savedTask._id || savedTask.id || `tsk_${Date.now()}`,
        title: newTask.title,
        assignedTo: newTask.assignedTo,
        priority: newTask.priority,
        dueDate: newTask.dueDate,
        completed: false,
        status: 'TODO',
      };
      const updated = [entry, ...localTasks];
      setLocalTasks(updated);
      mockDb.set('tasks', updated);
      queryClient.setQueryData(['tasks-list'], updated);
      queryClient.invalidateQueries({ queryKey: ['tasks-list'] });

      setIsCreateModalOpen(false);
      setNewTask({
        title: '',
        assignedTo: 'Karthik Raja',
        priority: 'HIGH',
        dueDate: 'Tomorrow, 05:00 PM',
      });
      showToast('New operational task created successfully!');
    },
  });

  // Instantaneous optimistic checkbox toggle handler
  const handleToggleTask = async (task, e) => {
    if (e) {
      e.stopPropagation();
    }

    const targetId = String(task.id || task._id);
    const isCurrentlyCompleted = Boolean(task.completed || task.status === 'COMPLETED');
    const nextCompleted = !isCurrentlyCompleted;
    const nextStatus = nextCompleted ? 'COMPLETED' : 'IN_PROGRESS';

    // 1. Immediate optimistic UI update (0ms delay)
    const updated = localTasks.map((t) => {
      const currentId = String(t.id || t._id);
      if (currentId === targetId) {
        return {
          ...t,
          completed: nextCompleted,
          status: nextStatus,
          completedAt: nextCompleted ? new Date().toISOString() : null,
        };
      }
      return t;
    });

    setLocalTasks(updated);
    mockDb.set('tasks', updated);
    queryClient.setQueryData(['tasks-list'], updated);

    // 2. Feedback toast
    showToast(
      nextCompleted
        ? `"${task.title.slice(0, 36)}..." marked as Completed!`
        : `"${task.title.slice(0, 36)}..." reopened as In Progress!`
    );

    // 3. Asynchronous backend persistence
    try {
      if (!targetId.startsWith('tsk_')) {
        await axiosClient.put(ENDPOINTS.TASKS.UPDATE(targetId), {
          status: nextStatus,
        });
      }
    } catch (err) {
      console.warn('Backend update fallback recorded:', err);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createTaskMutation.mutate({
      title: newTask.title,
      assignedTo: newTask.assignedTo,
      priority: newTask.priority,
      status: 'TODO',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
    });
  };

  // Filter tasks based on active tab
  const filteredTasks = localTasks.filter((t) => {
    const isCompleted = Boolean(t.completed || t.status === 'COMPLETED');
    if (filterTab === 'PENDING') return !isCompleted;
    if (filterTab === 'COMPLETED') return isCompleted;
    return true;
  });

  const completedCount = localTasks.filter((t) => Boolean(t.completed || t.status === 'COMPLETED')).length;
  const pendingCount = localTasks.length - completedCount;

  return (
    <div className="space-y-6">
      {/* Page Header */}
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

      {/* Floating Status Toast */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage('')}
            className="text-emerald-600 hover:text-emerald-800 text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs & Summary Counter */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              filterTab === 'ALL'
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Tasks ({localTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('PENDING')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              filterTab === 'PENDING'
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Pending / In Progress ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('COMPLETED')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              filterTab === 'COMPLETED'
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Click any checkbox to immediately toggle status</span>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
            No tasks found in this view.
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isCompleted = Boolean(t.completed || t.status === 'COMPLETED');
            return (
              <Card
                key={t.id || t._id}
                onClick={(e) => handleToggleTask(t, e)}
                className={`p-3.5 sm:p-4 flex items-center justify-between transition-all duration-150 cursor-pointer select-none ${
                  isCompleted
                    ? 'bg-slate-50/90 border-slate-200 opacity-80'
                    : 'bg-white hover:border-brand-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-3">
                  {/* Interactive Custom Checkbox */}
                  <div
                    onClick={(e) => handleToggleTask(t, e)}
                    className="shrink-0 flex items-center justify-center cursor-pointer p-0.5"
                    role="checkbox"
                    aria-checked={isCompleted}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggleTask(t, e);
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={(e) => handleToggleTask(t, e)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer transition-transform active:scale-95"
                    />
                  </div>

                  {/* Task Content */}
                  <div className="min-w-0">
                    <h4
                      className={`font-semibold text-xs sm:text-sm leading-snug transition-colors ${
                        isCompleted
                          ? 'line-through text-slate-400 font-normal'
                          : 'text-slate-800'
                      }`}
                    >
                      {t.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span>
                        Assigned to:{' '}
                        <strong className="text-slate-600 font-semibold">
                          {typeof t.assignedTo === 'object' && t.assignedTo !== null
                            ? `${t.assignedTo.firstName || ''} ${t.assignedTo.lastName || ''}`.trim() || t.assignedTo.email || 'Staff Member'
                            : t.assignedTo || 'Staff Member'}
                        </strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{t.dueDate}</span>
                      </span>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded text-[10px] border border-emerald-200 ml-1">
                          <Check className="w-3 h-3" />
                          <span>Done</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Priority Badge */}
                <div className="shrink-0 flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      t.priority === 'HIGH' || t.priority === 'URGENT'
                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                        : t.priority === 'MEDIUM'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>
              </Card>
            );
          })
        )}
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
            <Button type="submit" variant="primary" size="sm" isLoading={createTaskMutation.isPending}>
              Create & Assign Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
