import { ROLES, ROLE_PERMISSIONS } from '@/config/permissions.config';

export const SEED_USERS = [
  {
    id: 'usr_001',
    name: 'Sanjay D',
    email: 'sanjay@entrykode.com',
    password: 'superadmin@123',
    role: ROLES.SUPER_ADMIN,
    department: 'Engineering & Leadership',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    permissions: ROLE_PERMISSIONS[ROLES.SUPER_ADMIN],
    status: 'ACTIVE',
    token: 'jwt_mock_token_sanjay_superadmin',
  },
  {
    id: 'usr_002',
    name: 'Ishwarya R',
    email: 'ishwarya@entrykode.com',
    password: 'admin@123',
    role: ROLES.ADMIN,
    department: 'Backend & Operations',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    permissions: ROLE_PERMISSIONS[ROLES.ADMIN],
    status: 'ACTIVE',
    token: 'jwt_mock_token_ishwarya_admin',
  },
];
