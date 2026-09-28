import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../api';
import type { CreateAccountInput, Credentials, User } from '../api/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn(credentials: Credentials): Promise<void>;
  signOut(): Promise<void>;
  createAccount(input: CreateAccountInput): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const USER_STORAGE_KEY = 'schedule-planner:user';

function readStoredUser(): User | null {
  try {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    return storedUser ? (JSON.parse(storedUser) as User) : null;
  } catch {
    return null;
  }
}

function persistUser(user: User | null) {
  try {
    if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // Ignore storage write failures in restricted browser contexts.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const persistedUser = readStoredUser();
    if (persistedUser) setUser(persistedUser);

    api.getCurrentUser()
      .then((currentUser) => {
        if (!active) return;
        setUser(currentUser);
        persistUser(currentUser);
      })
      .catch(() => {
        if (active) {
          setUser(null);
          persistUser(null);
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function signIn(credentials: Credentials) {
    const nextUser = await api.login(credentials);
    setUser(nextUser);
    persistUser(nextUser);
  }

  async function signOut() {
    await api.logout();
    setUser(null);
    persistUser(null);
  }

  async function createAccount(input: CreateAccountInput) {
    const nextUser = await api.createAccount(input);
    setUser(nextUser);
    persistUser(nextUser);
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signOut, createAccount }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}