
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
import React, { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import type { LoginFormData, SignupFormData, UserProfile } from "@/types";
import { getUserProfile, createUserProfile, updateUserProfile } from "@/services/user-service";


interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  fetchUserProfile: () => Promise<void>;
  login: (data: LoginFormData) => Promise<FirebaseUser | null>;
  signup: (data: SignupFormData) => Promise<FirebaseUser | null>;
  loginWithGoogle: () => Promise<FirebaseUser | null>;
  logout: () => Promise<void>;
  updateUserPlan: (plan: 'free' | 'premium') => Promise<void>;
  error: AuthError | null;
  clearError: () => void;
  verificationEmailSent: boolean;
  setVerificationEmailSent: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const router = useRouter();

  const fetchUserProfile = useCallback(async () => {
    if (auth.currentUser) {
        const profile = await getUserProfile(auth.currentUser.uid);
        setUserProfile(profile);
    }
  }, []);

  const handleUserAuth = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser?.emailVerified) {
      setUser(firebaseUser);
      let profile = await getUserProfile(firebaseUser.uid);
      if (!profile) {
        // Create a profile if it doesn't exist (e.g., first-time Google sign-in)
        const newProfileData: UserProfile = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            plan: 'free',
            createdAt: new Date(),
        };
        await createUserProfile(newProfileData);
        profile = await getUserProfile(firebaseUser.uid); // Re-fetch to get server defaults
      }
      setUserProfile(profile);
    } else {
      setUser(null);
      setUserProfile(null);
      if (firebaseUser) { // User exists but email is not verified
         await firebaseSignOut(auth); // Sign them out
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleUserAuth);
    return () => unsubscribe();
  }, [handleUserAuth]);

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
      // onAuthStateChanged will handle setting user and profile
      router.push("/dashboard"); 
      return userCredential.user;
    } catch (err) {
      setError(err as AuthError);
      setLoading(false);
      return null;
    } 
  };

  const signup = async (data: SignupFormData): Promise<FirebaseUser | null> => {
    setLoading(true);
    setError(null);
    setVerificationEmailSent(false);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const { user: newUser } = userCredential;
      
      // Create user profile in Firestore
      const newProfile: UserProfile = {
          id: newUser.uid,
          email: newUser.email || '',
          displayName: newUser.displayName || '',
          plan: 'free',
          createdAt: new Date(),
      };
      await createUserProfile(newProfile);

      await sendEmailVerification(newUser);
      await firebaseSignOut(auth); // Sign out immediately after registration
      setVerificationEmailSent(true);
      return newUser;
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
      // onAuthStateChanged will handle setting user and profile
      router.push("/dashboard");
      return userCredential.user;
    } catch (err) {
      setError(err as AuthError);
      setLoading(false);
      return null;
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
      router.push("/login");
    } catch (err) {
      setError(err as AuthError);
    } finally {
      setLoading(false);
    }
  };
  
  const updateUserPlan = async (plan: 'free' | 'premium') => {
      if (!user?.uid) throw new Error("User not authenticated");
      await updateUserProfile(user.uid, { plan });
      setUserProfile(prev => prev ? { ...prev, plan } : null);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, fetchUserProfile, login, signup, loginWithGoogle, logout, updateUserPlan, error, clearError, verificationEmailSent, setVerificationEmailSent }}>
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
