
"use client";

import type { User as FirebaseUser, AuthError } from "firebase/auth";
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth";
import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import type { LoginFormData, SignupFormData } from "@/types";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  login: (data: LoginFormData) => Promise<FirebaseUser | null>;
  signup: (data: SignupFormData) => Promise<FirebaseUser | null>;
  loginWithGoogle: () => Promise<FirebaseUser | null>;
  logout: () => Promise<void>;
  error: AuthError | null;
  clearError: () => void;
  verificationEmailSent: boolean;
  setVerificationEmailSent: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser?.emailVerified) {
        setUser(firebaseUser);
      } else {
        setUser(null);
        if (firebaseUser) { // User exists but email is not verified
           firebaseSignOut(auth); // Sign them out
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (data: LoginFormData): Promise<FirebaseUser | null> => {
    setLoading(true);
    setError(null);
    setVerificationEmailSent(false);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      if (!userCredential.user.emailVerified) {
        await firebaseSignOut(auth);
        throw { code: "auth/email-not-verified", message: "Your email has not been verified. Please check your inbox for the verification link." } as AuthError;
      }
      setUser(userCredential.user);
      router.push("/dashboard"); 
      return userCredential.user;
    } catch (err) {
      setError(err as AuthError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: SignupFormData): Promise<FirebaseUser | null> => {
    setLoading(true);
    setError(null);
    setVerificationEmailSent(false);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await sendEmailVerification(userCredential.user);
      await firebaseSignOut(auth); // Sign out immediately after registration
      setVerificationEmailSent(true);
      return userCredential.user; // Return user object on success for UI updates
    } catch (err) {
      setError(err as AuthError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<FirebaseUser | null> => {
    setLoading(true);
    setError(null);
    setVerificationEmailSent(false);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      setUser(userCredential.user);
      router.push("/dashboard");
      return userCredential.user;
    } catch (err) {
      setError(err as AuthError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      router.push("/login");
    } catch (err) {
      setError(err as AuthError);
    } finally {
      setLoading(false);
    }
  };
  
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, loginWithGoogle, logout, error, clearError, verificationEmailSent, setVerificationEmailSent }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
