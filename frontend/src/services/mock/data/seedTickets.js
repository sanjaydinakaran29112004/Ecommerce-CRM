export const SEED_TICKETS = [
  {
    id: 'tkt_701',
    ticketNumber: 'TKT-2026-1044',
    customer: {
      id: 'cust_101',
      name: 'Ananya Krishnan',
      email: 'ananya.k@gmail.com',
    },
    orderNumber: 'ORD-2026-9041',
    subject: 'Request for GST Invoice copy with Company PAN',
    category: 'ACCOUNT', // ORDER | PAYMENT | DELIVERY | PRODUCT | RETURN | REFUND | ACCOUNT | GENERAL
    priority: 'MEDIUM', // LOW | MEDIUM | HIGH | URGENT
    status: 'IN_PROGRESS', // OPEN | IN_PROGRESS | WAITING | RESOLVED | CLOSED
    assignee: 'Priya Sundaram',
    createdAt: '2026-03-05T08:30:00Z',
    messages: [
      {
        id: 'msg_1',
        sender: 'CUSTOMER',
        name: 'Ananya Krishnan',
        text: 'Hello, I need the updated B2B tax invoice with our registered GSTIN for our tax audit.',
        createdAt: '2026-03-05T08:30:00Z',
      },
      {
        id: 'msg_2',
        sender: 'AGENT',
        name: 'Priya Sundaram',
        text: 'Hi Ananya, thank you for reaching out. We have received your request. Generating the revised invoice now.',
        createdAt: '2026-03-05T09:15:00Z',
      }
    ],
  },
  {
    id: 'tkt_702',
    ticketNumber: 'TKT-2026-1045',
    customer: {
      id: 'cust_103',
      name: 'Meenakshi Ramasamy',
      email: 'meenakshi.r@yahoo.com',
    },
    orderNumber: 'ORD-2026-9043',
    subject: 'Expedite delivery for anniversary gift',
    category: 'DELIVERY',
    priority: 'HIGH',
    status: 'OPEN',
    assignee: 'Priya Sundaram',
    createdAt: '2026-03-08T11:00:00Z',
    messages: [
      {
        id: 'msg_3',
        sender: 'CUSTOMER',
        name: 'Meenakshi Ramasamy',
        text: 'Can this order be delivered by Friday? It is an anniversary present.',
        createdAt: '2026-03-08T11:00:00Z',
      }
    ],
  },
];

