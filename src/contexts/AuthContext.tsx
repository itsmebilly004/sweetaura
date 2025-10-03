import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true);
        if (session) {
          const { data, error } = await supabase.rpc('get_user_role', { p_user_id: session.user.id });
          if (error) {
            console.error("Error fetching user role:", error);
            setRole(null);
          } else {
            setRole(data);
          }
          setSession(session);
          setUser(session.user);
        } else {
          setSession(null);
          setUser(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    // Initial check for session
    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data, error } = await supabase.rpc('get_user_role', { p_user_id: session.user.id });
            if (error) {
              console.error("Error fetching user role on initial load:", error);
              setRole(null);
            } else {
              setRole(data);
            }
            setSession(session);
            setUser(session.user);
        }
        setLoading(false);
    };
    checkUser();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, role, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};