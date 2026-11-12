import { createSlice } from '@reduxjs/toolkit';
import { storage } from '@/utils/storage';
import { SEED_USERS } from '@/services/mock/data/seedUsers';

const storedUser = storage.get('crm_user', SEED_USERS[0]); // Default to Super Admin for smooth preview
const storedToken = storage.get('crm_access_token', storedUser?.token || null);

const initialState = {
  user: storedUser,
  token: storedToken,
  isAuthenticated: !!storedToken,
  isLoading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      state.error = null;

      storage.set('crm_user', action.payload.user);
      storage.set('crm_access_token', action.payload.accessToken);
    },
    loginFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;

      storage.remove('crm_user');
      storage.remove('crm_access_token');
    },
    switchRolePreview: (state, action) => {
      const targetUser = SEED_USERS.find(u => u.role === action.payload);
      if (targetUser) {
        state.user = targetUser;
        state.token = targetUser.token;
        storage.set('crm_user', targetUser);
        storage.set('crm_access_token', targetUser.token);
      }
    }
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, switchRolePreview } = authSlice.actions;
export default authSlice.reducer;

