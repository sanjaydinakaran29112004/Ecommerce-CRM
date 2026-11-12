import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '@/services/api/axiosClient';
import { ENDPOINTS } from '@/services/api/endpoints';
import { DataTable } from '@/components/data-display/DataTable';
import { StatusChip } from '@/components/data-display/StatusChip';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils/formatDate';
import { mockDb } from '@/services/mock/mockDb';
import { MessageSquare, Send, ShieldAlert, CheckCircle, Clock, Plus, User, Mail, Tag } from 'lucide-react';

export function SupportTicketsPage() {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  
  // Create Ticket Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    customerName: '',
    customerEmail: '',
    orderNumber: '',
    subject: '',
    category: 'DELIVERY',
    priority: 'MEDIUM',
    initialMessage: '',
  });

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets-list'],
    queryFn: () => axiosClient.get(ENDPOINTS.TICKETS.LIST),
  });

  const sendReplyMutation = useMutation({
    mutationFn: async ({ ticketId, text }) => {
      const existing = mockDb.get('tickets');
      const updated = existing.map((t) => {
        if (t.id === ticketId) {
          const newMsg = {
            id: `msg_${Date.now()}`,
            sender: 'AGENT',
            name: 'Priya Sundaram',
            text,
            createdAt: new Date().toISOString(),
          };
          return { ...t, messages: [...t.messages, newMsg], status: 'WAITING' };
        }
        return t;
      });
      mockDb.set('tickets', updated);
      return { ticketId, text };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tickets-list']);
      if (selectedTicket) {
        setSelectedTicket((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: `msg_${Date.now()}`,
              sender: 'AGENT',
              name: 'Priya Sundaram',
              text: replyText,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      }
      setReplyText('');
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (ticketData) => {
      const existing = mockDb.get('tickets');
      const ticketEntry = {
        id: `tkt_${Date.now()}`,
        ticketNumber: `TKT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        customer: {
          id: `cust_${Date.now()}`,
          name: ticketData.customerName,
          email: ticketData.customerEmail,
        },
        orderNumber: ticketData.orderNumber || 'None',
        subject: ticketData.subject,
        category: ticketData.category,
        priority: ticketData.priority,
        status: 'OPEN',
        assignee: 'Priya Sundaram',
        createdAt: new Date().toISOString(),
        messages: [
          {
            id: `msg_${Date.now()}`,
            sender: 'CUSTOMER',
            name: ticketData.customerName,
            text: ticketData.initialMessage || ticketData.subject,
            createdAt: new Date().toISOString(),
          },
        ],
      };
      mockDb.set('tickets', [ticketEntry, ...existing]);
      return ticketEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tickets-list']);
      setIsCreateModalOpen(false);
      setNewTicket({
        customerName: '',
        customerEmail: '',
        orderNumber: '',
        subject: '',
        category: 'DELIVERY',
        priority: 'MEDIUM',
        initialMessage: '',
      });
    },
  });

  const handleSendReply = (e) => {
    e.preventDefault();
    if (replyText.trim() && selectedTicket) {
      sendReplyMutation.mutate({ ticketId: selectedTicket.id, text: replyText });
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createTicketMutation.mutate(newTicket);
  };

  const columns = [
    {
      header: 'Ticket ID & Priority',
      accessor: 'ticketNumber',
      render: (val, row) => (
        <div>
          <span className="font-mono font-bold text-brand-600">{val}</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                row.priority === 'HIGH' || row.priority === 'URGENT'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {row.priority}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">{row.category}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customer',
      render: (cust) => (
        <div>
          <div className="font-semibold text-slate-900">{cust.name}</div>
          <div className="text-[10px] text-slate-400">{cust.email}</div>
        </div>
      ),
    },
    {
      header: 'Subject',
      accessor: 'subject',
      render: (val, row) => (
        <div className="max-w-xs">
          <p className="font-semibold text-slate-800 truncate">{val}</p>
          <p className="text-[10px] text-slate-400">Order Ref: {row.orderNumber || 'None'}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val) => <StatusChip status={val} type="ticket" />,
    },
    {
      header: 'Assignee',
      accessor: 'assignee',
      render: (val) => <span className="font-medium text-slate-700 text-xs">{val}</span>,
    },
    {
      header: 'Action',
      align: 'right',
      render: (_, row) => (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTicket(row);
          }}
          className="text-xs py-1"
        >
          Open Thread
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Customer Support & SLA Escalations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Omnichannel service desk tickets, message threads, order resolution, and agent SLAs.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Create Ticket
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={tickets}
        isLoading={isLoading}
        onRowClick={(row) => setSelectedTicket(row)}
      />

      {/* Create Ticket Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Raise Support Escalation Ticket"
        description="Log an inbound customer issue, order inquiry, or delivery escalation"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Customer Full Name"
              value={newTicket.customerName}
              onChange={(e) => setNewTicket({ ...newTicket, customerName: e.target.value })}
              placeholder="e.g. Ramesh V"
              leftIcon={<User className="w-4 h-4 text-slate-400" />}
              required
            />
            <Input
              label="Customer Email"
              type="email"
              value={newTicket.customerEmail}
              onChange={(e) => setNewTicket({ ...newTicket, customerEmail: e.target.value })}
              placeholder="ramesh@example.com"
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Order Number (Optional)"
              value={newTicket.orderNumber}
              onChange={(e) => setNewTicket({ ...newTicket, orderNumber: e.target.value })}
              placeholder="ORD-2026-9041"
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
              <select
                value={newTicket.category}
                onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white font-medium"
              >
                <option value="DELIVERY">Delivery Delay</option>
                <option value="PAYMENT">Payment / Transaction</option>
                <option value="PRODUCT">Product Defect / Warranty</option>
                <option value="RETURN">Return / Exchange</option>
                <option value="ACCOUNT">Account / Invoice</option>
                <option value="GENERAL">General Inquiry</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ticket Subject"
              value={newTicket.subject}
              onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
              placeholder="e.g. Courier tracking link shows incorrect city"
              required
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Priority</label>
              <select
                value={newTicket.priority}
                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white font-medium"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High (SLA: 4h)</option>
                <option value="URGENT">Urgent (SLA: 1h)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Initial Customer Note / Message</label>
            <textarea
              rows={3}
              value={newTicket.initialMessage}
              onChange={(e) => setNewTicket({ ...newTicket, initialMessage: e.target.value })}
              placeholder="Describe the customer's exact issue and request..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:outline-hidden focus:border-brand-500 font-sans"
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={createTicketMutation.isLoading}>
              Open Ticket
            </Button>
          </div>
        </form>
      </Modal>

      {/* Ticket Conversation Drawer */}
      <Drawer
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={`Ticket Thread — ${selectedTicket?.ticketNumber}`}
        subtitle={selectedTicket?.subject}
        width="max-w-2xl"
      >
        {selectedTicket && (
          <div className="flex flex-col h-full space-y-4">
            {/* Meta info */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500">Customer: </span>
                <span className="font-semibold text-slate-800">{selectedTicket.customer.name}</span>
              </div>
              <StatusChip status={selectedTicket.status} type="ticket" />
            </div>

            {/* Conversation Feed */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 max-h-[50vh]">
              {selectedTicket.messages.map((msg) => {
                const isCustomer = msg.sender === 'CUSTOMER';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                  >
                    <div className="text-[10px] text-slate-400 mb-1">
                      {msg.name} • {formatDate(msg.createdAt, 'hh:mm a')}
                    </div>
                    <div
                      className={`p-3.5 rounded-2xl max-w-md text-xs leading-relaxed ${
                        isCustomer
                          ? 'bg-slate-100 text-slate-800 rounded-tl-xs'
                          : 'bg-brand-600 text-white rounded-tr-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Box */}
            <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-200 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type customer reply..."
                className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-brand-500"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={sendReplyMutation.isLoading}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Send
              </Button>
            </form>
          </div>
        )}
      </Drawer>
    </div>
  );
}
