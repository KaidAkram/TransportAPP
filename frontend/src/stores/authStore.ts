import { create } from "zustand";
import { api } from "@/lib/api";

export interface AuthUser {
 id: string;
 username: string;
 email: string;
 role: "admin"| "gestionnaire";
 full_name?: string;
}

interface AuthState {
 user: AuthUser | null;
 token: string | null;
 features: Record<string, boolean>;
 isAuthenticated: boolean;
 isLoading: boolean;
 setUser: (user: AuthUser | null) =>void;
 setToken: (token: string | null) =>void;
 setFeatures: (features: Record<string, boolean>) =>void;
  deniedActionName: string | null;
  setDeniedAction: (actionName: string | null) =>void;
 hasPermission: (featureName: string) =>boolean;
 login: (token: string, user: AuthUser) =>Promise<void>;
 logout: () =>void;
 fetchActiveFeatures: () =>Promise<void>;
 initAuth: () =>Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) =>({
 user: null,
 token: null,
 features: {},
 isAuthenticated: false,
 isLoading: true,
  deniedActionName: null,

 setUser: (user) =>
  set({
   user,
   isAuthenticated: !!user,
  }),

 setToken: (token) =>{
  api.setToken(token);
  set({ token });
 },

 setFeatures: (features) =>set({ features }),
  setDeniedAction: (actionName) =>set({ deniedActionName: actionName }),

 hasPermission: (featureName: string) =>{
  const { user, features } = get();
  if (!user) return false;
  if (user.role === "admin") return true;
  return features[featureName] !== false;
 },

 login: async (token: string, user: AuthUser) =>{
  if (typeof window !== "undefined") {
   localStorage.setItem("etransport_token", token);
   localStorage.setItem("etransport_user", JSON.stringify(user));
  }
  api.setToken(token);
  set({
   token,
   user,
   isAuthenticated: true,
   isLoading: false,
  });
  await get().fetchActiveFeatures();
 },

 logout: () =>{
  if (typeof window !== "undefined") {
   localStorage.removeItem("etransport_token");
   localStorage.removeItem("etransport_user");
  }
  api.setToken(null);
  set({
   user: null,
   token: null,
   features: {},
   isAuthenticated: false,
   isLoading: false,
  });
 },

 fetchActiveFeatures: async () =>{
  try {
   const res = await api.get<{ features: Record<string, boolean>; role: string }>("/features/active");
   if (res.data && res.data.features) {
    set({ features: res.data.features });
   }
  } catch (err) {
   console.warn("Could not fetch active feature toggles:", err);
  }
 },

 initAuth: async () =>{
  if (typeof window === "undefined") {
   set({ isLoading: false });
   return;
  }

  const savedToken = localStorage.getItem("etransport_token");
  const savedUserStr = localStorage.getItem("etransport_user");

  if (savedToken && savedUserStr) {
   try {
    const savedUser: AuthUser = JSON.parse(savedUserStr);
    api.setToken(savedToken);
    set({
     token: savedToken,
     user: savedUser,
     isAuthenticated: true,
     isLoading: false,
    });
    await get().fetchActiveFeatures();
    return;
   } catch (err) {
    console.error("Failed to restore auth session:", err);
   }
  }

  // Default fallback in local dev if not logged in: guest/default
  set({ isLoading: false });
 },
}));
