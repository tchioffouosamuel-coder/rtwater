export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://rtwater.campusflow.fr/public/api";

type RequestInitLike = RequestInit & { params?: Record<string, any> };

async function request(path: string, init: RequestInitLike = {}) {
  const url = new URL(API_BASE + path);
  if (init.params) {
    Object.entries(init.params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.append(k, String(v));
    });
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((init.headers as Record<string, string>) || {}),
  };

  const token = localStorage.getItem("adminToken") || localStorage.getItem("userToken");
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const body = init.body;
  const finalInit: RequestInit = {
    ...init,
    headers,
  };

  if (body && typeof body === "object" && !(body instanceof FormData)) {
    finalInit.body = JSON.stringify(body);
    finalInit.headers = {
      ...headers,
      "Content-Type": "application/json",
    };
  }

  try {
    const res = await fetch(url.toString(), finalInit);
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      const err = new Error(
        data?.message || res.statusText || "Request failed",
      );
      (err as any).status = res.status;
      (err as any).data = data;
      throw err;
    }

    return data;
  } catch (e: any) {
    try {
      // lazy import toast to avoid cycles
      const { toast } = await import("../app/components/ui/sonner");
      const message = e?.message || "Erreur réseau";
      toast(message, { icon: "⚠️" });
    } catch {
      // ignore
    }
    throw e;
  }
}

export default { request };
