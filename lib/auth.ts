let authToken: string | null = null;

export function isAuthenticated() {
  // In-memory auth ensures the user must log in again after a full refresh.
  return Boolean(authToken);
}

export function login(token: string) {
  authToken = token;
}

export function logout() {
  authToken = null;
}
