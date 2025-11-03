import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
// Note: For getting the current user session and status, 
// you should now prefer using `useSession` from `next-auth/react` directly in your components.
// This hook is kept for compatibility with existing structure.

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
