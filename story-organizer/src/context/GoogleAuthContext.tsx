import { createContext, useContext, useState } from "react";
import { initGoogleAuth, signIn as googleSignIn } from "../services/googleAuth";

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}

interface AuthContextType {
  user: GoogleUser | null;
  signIn: () => Promise<void>;
  initialize: (clientId: string) => void;
}

const GoogleAuthContext = createContext<AuthContextType | null>(null);

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);

  function initialize(clientId: string) {
    initGoogleAuth(clientId, (profile: GoogleUser) => {
      setUser(profile);
    });
  }

  function signIn() {
    return googleSignIn();
  }

  return (
    <GoogleAuthContext.Provider value={{ user, signIn, initialize }}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

export function useGoogleAuth() {
  const context = useContext(GoogleAuthContext);
  if (!context) throw new Error("Must use inside GoogleAuthProvider");
  return context;
}