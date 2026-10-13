import api from "./api";

export async function login(email: string, password: string) {
  const res = await api.request("/login", {
    method: "POST",
    body: { email, password },
  });
  return res;
}

export async function loginAsUser(email: string, password: string) {
  const res = await login(email, password);
  if (res?.token) localStorage.setItem("userToken", res.token);
  return res;
}

export async function loginAsAdmin(email: string, password: string) {
  const res = await login(email, password);
  if (res?.token) localStorage.setItem("adminToken", res.token);
  return res;
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}) {
  const res = await api.request("/register", {
    method: "POST",
    body: payload,
  });
  if (res?.token) localStorage.setItem("userToken", res.token);
  return res;
}

export async function me() {
  return api.request("/me", { method: "GET", silent: true });
}

export async function logout() {
  try {
    await api.request("/logout", { method: "POST" });
  } catch (e) {
    // ignore
  }
  localStorage.removeItem("userToken");
  localStorage.removeItem("adminToken");
}

export default { login, register, me, logout };

// ── Mot de passe oublié ─────────────────────────────────────
export async function forgotPassword(email: string) {
  return api.request("/forgot-password", { method: "POST", body: { email }, silent: true });
}

export async function resetPassword(payload: {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}) {
  return api.request("/reset-password", { method: "POST", body: payload, silent: true });
}

// ── Espace client ───────────────────────────────────────────
export async function updateProfile(payload: { name: string; email: string; phone?: string | null; address?: string | null }) {
  return api.request("/me", { method: "PUT", body: payload, silent: true });
}

export async function updatePassword(payload: {
  current_password: string;
  password: string;
  password_confirmation: string;
}) {
  return api.request("/me/password", { method: "PUT", body: payload, silent: true });
}

export async function myQuotes() {
  return api.request("/me/quotes", { method: "GET" });
}
