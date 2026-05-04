import { User } from "@/components/auth/UserContext";

let authToken: string | null = null;
let currentUser: User | null = null;

export function isAuthenticated() {
  // In-memory auth ensures the user must log in again after a full refresh.
  return Boolean(authToken);
}

export function login(token: string, user?: User) {
  authToken = token;
  if (user) {
    currentUser = user;
  }
}

export function logout() {
  authToken = null;
  currentUser = null;
}

export function getCurrentUser(): User | null {
  return currentUser;
}

export function setCurrentUser(user: User | null) {
  currentUser = user;
}
