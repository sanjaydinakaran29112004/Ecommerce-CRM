import { useSelector, useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure, logout, switchRolePreview } from '../slices/authSlice';
import { axiosClient } from '@/services/api/axiosClient';
import { ENDPOINTS } from '@/services/api/endpoints';

export function useAuth() {
  const dispatch = useDispatch();
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
  };

  const hasPermission = (permissionKey) => {
    if (!auth.user || !auth.user.permissions) return false;
    return auth.user.permissions.includes(permissionKey);
  };

  const hasRole = (role) => {
    if (!auth.user) return false;
    if (Array.isArray(role)) return role.includes(auth.user.role);
    return auth.user.role === role;
  };

  const switchRole = (role) => {
    dispatch(switchRolePreview(role));
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
    switchRole,
  };
}
