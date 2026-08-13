"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithCustomToken,
  signInWithPopup,
  signOut as fbSignOut,
  updateEmail,
  updatePassword,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db, googleProvider, initAnalytics } from "@/lib/firebase";
import type { UserDoc } from "@/types";

type AuthCtx = {
  user: User | null;
  userDoc: UserDoc | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  changeEmail: (currentPassword: string, newEmail: string) => Promise<void>;
  changeDisplayName: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

// Thrown by signInWithEmail/signUpWithEmail instead of a raw Firebase error —
// both now go through our own API routes (server-side rate limiting/lockout),
// so we synthesize a Firebase-style code for authErrorKey plus whatever
// lockout/rate-limit metadata the UI needs to show a countdown.
export class AuthApiError extends Error {
  code: string;
  retryAfterSeconds?: number;
  attemptsRemaining?: number;
  constructor(
    code: string,
    opts?: { retryAfterSeconds?: number; attemptsRemaining?: number },
  ) {
    super(code);
    this.code = code;
    this.retryAfterSeconds = opts?.retryAfterSeconds;
    this.attemptsRemaining = opts?.attemptsRemaining;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAnalytics();
    const unsubAuth = onAuthStateChanged(auth(), async (fbUser) => {
      setUser(fbUser);
      if (!fbUser) {
        setUserDoc(null);
        setLoading(false);
        return;
      }
      try {
        const ref = doc(db(), "users", fbUser.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          const fresh: UserDoc = {
            id: fbUser.uid,
            fullName: fbUser.displayName ?? "",
            preferredLocale: "ka",
            district: null,
            carePoints: 0,
            level: 1,
            reputationScore: 50,
            elderMode: false,
            consentLeaderboard: true,
            consentSpotlight: true,
            photoURL: fbUser.photoURL ?? null,
            createdAt: Date.now(),
            currentStreak: 0,
            longestStreak: 0,
            lastDeedDate: null,
          };
          await setDoc(ref, { ...fresh, createdAt: serverTimestamp() });
          // Send welcome email for all new users (email/password + Google)
          if (fbUser.email) {
            fetch("/api/auth/welcome-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: fbUser.email,
                name: fbUser.displayName ?? "",
              }),
            }).catch((e) => console.error("[welcome-email]", e));
          }
        }
      } catch (err) {
        console.error("[auth] failed to load user doc", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setUserDoc(null);
      return;
    }
    const unsub = onSnapshot(
      doc(db(), "users", user.uid),
      (snap) => {
        if (snap.exists()) setUserDoc(snap.data() as UserDoc);
      },
      () => {},
    );
    return () => unsub();
  }, [user]);

  const reauth = async (currentPassword: string) => {
    const u = auth().currentUser;
    if (!u || !u.email) throw new Error("not signed in");
    const cred = EmailAuthProvider.credential(u.email, currentPassword);
    await reauthenticateWithCredential(u, cred);
  };

  const value: AuthCtx = {
    user,
    userDoc,
    loading,
    signInWithGoogle: async () => {
      await signInWithPopup(auth(), googleProvider);
    },
    signInWithEmail: async (email, password) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === "locked") {
          throw new AuthApiError("auth/lockout", { retryAfterSeconds: data.retryAfterSeconds });
        }
        if (data.error === "TOO_MANY_ATTEMPTS_TRY_LATER") {
          throw new AuthApiError("auth/too-many-requests");
        }
        throw new AuthApiError("auth/wrong-password", { attemptsRemaining: data.attemptsRemaining });
      }
      await signInWithCustomToken(auth(), data.customToken);
    },
    signUpWithEmail: async (email, password, displayName) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: displayName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === "rate_limited") {
          throw new AuthApiError("auth/rate-limited", { retryAfterSeconds: data.retryAfterSeconds });
        }
        if (data.error === "email_in_use") throw new AuthApiError("auth/email-already-in-use");
        if (data.error === "invalid-email") throw new AuthApiError("auth/invalid-email");
        if (data.error === "weak_password" || data.error === "invalid-password") {
          throw new AuthApiError("auth/weak-password");
        }
        throw new AuthApiError("auth/generic");
      }
      await signInWithCustomToken(auth(), data.customToken);
    },
    resetPassword: async (email) => {
      await sendPasswordResetEmail(auth(), email);
    },
    changePassword: async (currentPassword, newPassword) => {
      await reauth(currentPassword);
      const u = auth().currentUser;
      if (!u) throw new Error("not signed in");
      await updatePassword(u, newPassword);
    },
    changeEmail: async (currentPassword, newEmail) => {
      await reauth(currentPassword);
      const u = auth().currentUser;
      if (!u) throw new Error("not signed in");
      await updateEmail(u, newEmail);
    },
    changeDisplayName: async (name) => {
      const u = auth().currentUser;
      if (!u) throw new Error("not signed in");
      await updateProfile(u, { displayName: name });
      await updateDoc(doc(db(), "users", u.uid), { fullName: name });
    },
    signOut: async () => {
      await fbSignOut(auth());
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}

// Map Firebase auth error codes to translation keys.
export function authErrorKey(err: unknown): string {
  const e = err as { code?: string };
  switch (e.code) {
    case "auth/email-already-in-use":
      return "auth.error.emailInUse";
    case "auth/invalid-email":
      return "auth.error.invalidEmail";
    case "auth/weak-password":
      return "auth.error.weakPassword";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "auth.error.wrongPassword";
    case "auth/user-not-found":
      return "auth.error.userNotFound";
    case "auth/requires-recent-login":
      return "auth.error.requiresRecent";
    case "auth/operation-not-allowed":
      return "auth.error.disabled";
    case "auth/lockout":
      return "auth.error.lockout";
    case "auth/rate-limited":
      return "auth.error.rateLimited";
    case "auth/too-many-requests":
      return "auth.error.tooMany";
    default:
      return "auth.error.generic";
  }
}
