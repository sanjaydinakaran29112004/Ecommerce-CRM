import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure, logout } from '../slices/authSlice';
import { axiosClient } from '@/services/api/axiosClient';
import { ENDPOINTS } from '@/services/api/endpoints';
import { storage } from '@/utils/storage';

export function useAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);

  const login = async (credentials) => {
    try {
      dispatch(loginStart());
      const response = await axiosClient.post(ENDPOINTS.AUTH.LOGIN, credentials);
      dispatch(loginSuccess(response));
      return { success: true, user: response.user };
    } catch (error) {
      dispatch(loginFailure(error.message));
      return { success: false, error: error.message };
    }
  };

  const signup = async (userData) => {
    try {
      dispatch(loginStart());
      const response = await axiosClient.post(ENDPOINTS.AUTH.REGISTER, userData);
      dispatch(loginSuccess(response));
      return { success: true, user: response.user };
    } catch (error) {
      dispatch(loginFailure(error.message));
      return { success: false, error: error.message };
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    storage.remove('crm_user');
    storage.remove('crm_access_token');
    navigate('/login', { replace: true });
  };

  const hasPermission = (permissionKey) => {
    if (!auth.user || !auth.user.permissions) return false;
    return auth.user.permissions.includes(permissionKey);
  };

  const hasRole = (role) => {
    if (!auth.user) return false;
    const currentRole = auth.user.role;
    if (Array.isArray(role)) return role.includes(currentRole);
    return currentRole === role;
  };

  return {
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,
    login,
    signup,
    logout: handleLogout,
    hasPermission,
    hasRole,
  };
}
