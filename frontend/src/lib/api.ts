import { clearSession, getToken } from "./auth";
import type {
  ApiErrorBody,
  DocumentShare,
  DocumentSummary,
  LoginResponse,
  User,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.auth !== false) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 401) {
    clearSession();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.assign("/login");
    }
    throw new ApiError(401, "Unauthorized");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json().catch(() => ({}))) as T & ApiErrorBody;

  if (!response.ok) {
    throw new ApiError(response.status, data.error ?? "Request failed");
  }

  return data;
}

export const api = {
  login(email: string, password: string) {
    return request<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
  },

  me() {
    return request<{ user: User }>("/auth/me");
  },

  listOwnedDocuments() {
    return request<{ documents: DocumentSummary[] }>("/documents");
  },

  listSharedDocuments() {
    return request<{ documents: DocumentSummary[] }>("/documents/shared");
  },

  createDocument(input?: { title?: string; content?: unknown }) {
    return request<{ document: DocumentSummary }>("/documents", {
      method: "POST",
      body: input ?? {},
    });
  },

  getDocument(id: string) {
    return request<{ document: DocumentSummary }>(`/documents/${id}`);
  },

  updateDocument(id: string, input: { title?: string; content?: unknown }) {
    return request<{ document: DocumentSummary }>(`/documents/${id}`, {
      method: "PATCH",
      body: input,
    });
  },

  deleteDocument(id: string) {
    return request<void>(`/documents/${id}`, { method: "DELETE" });
  },

  listShares(documentId: string) {
    return request<{ shares: DocumentShare[] }>(`/documents/${documentId}/shares`);
  },

  shareDocument(documentId: string, email: string, permission: "VIEW" | "EDIT") {
    return request<{ share: DocumentShare }>(`/documents/${documentId}/shares`, {
      method: "POST",
      body: { email, permission },
    });
  },

  removeShare(documentId: string, shareId: string) {
    return request<void>(`/documents/${documentId}/shares/${shareId}`, {
      method: "DELETE",
    });
  },
};
