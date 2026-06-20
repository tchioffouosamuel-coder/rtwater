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
  return api.request("/me", { method: "GET" });
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
