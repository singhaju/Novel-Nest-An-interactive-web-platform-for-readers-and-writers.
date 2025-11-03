import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { apiService } from '../services/apiService';
// Import NextAuth hooks
import { signIn, signOut, useSession } from 'next-auth/react';


interface AuthContextType {
  user: User | null;
  // login: (email: string, pass: string) => Promise<User | null>; // Handled by NextAuth
  // signup: (username: string, email: string, pass: string) => Promise<User | null>; // Handled by NextAuth
  // logout: () => void; // Handled by NextAuth
  // setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

// NOTE: This context is now simplified. Most of its original functionality
// (login, logout, user state) is now managed by NextAuth's `SessionProvider` and `useSession` hook.
// You might not even need this custom context anymore, but we'll keep it for structure.
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  
  // You can map the session user to your app's User type
  const user: User | null = session ? (session.user as User) : null;
  
  // The login, signup, and logout functions are now handled by NextAuth
  // e.g., calling `signIn('credentials', { email, password })` or `signOut()` from your components.
  // The original functions in this file are no longer needed.

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
};
