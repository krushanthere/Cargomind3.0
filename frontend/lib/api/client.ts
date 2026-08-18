import type { APIErrorResponse } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api";

export interface APIRequestOptions
  extends RequestInit {
  token?: string;
  tenantId?: string;
  tenantRole?: string;
}

function getAuthHeaders(
  options: APIRequestOptions,
): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const token =
    options.token ||
    (typeof window !== "undefined"
      ? localStorage.getItem("cargomind_token")
      : null);

  const tenantId =
    options.tenantId ||
    (typeof window !== "undefined"
      ? localStorage.getItem("cargomind_tenant_id")
      : null);

  const tenantRole =
    options.tenantRole ||
    (typeof window !== "undefined"
      ? localStorage.getItem("cargomind_tenant_role")
      : null);

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  /*
   * Development authentication supported
   * by the backend.
   */
  if (tenantId) {
    headers["X-Tenant-ID"] = tenantId;
  }

  if (tenantRole) {
    headers["X-Tenant-Role"] = tenantRole;
  }

  return headers;
}

function buildUrl(
  path: string,
  params?: Record<
    string,
    string | number | boolean | null | undefined
  >,
) {
  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  const url = new URL(
    `${API_BASE_URL}${normalizedPath}`,
  );

  if (params) {
    Object.entries(params).forEach(
      ([key, value]) => {
        if (
          value !== undefined &&
          value !== null
        ) {
          url.searchParams.set(
            key,
            String(value),
          );
        }
      },
    );
  }

  return url.toString();
}

async function parseResponse<T>(
  response: Response,
): Promise<T> {
  const contentType =
    response.headers.get("content-type") || "";

  const isJson =
    contentType.includes("application/json");

  const data = isJson
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error =
      data as APIErrorResponse;

    throw new Error(
      error?.detail ||
        error?.message ||
        `API request failed with status ${response.status}`,
    );
  }

  return data as T;
}

export async function apiRequest<T>(
  path: string,
  options: APIRequestOptions = {},
  params?: Record<
    string,
    string | number | boolean | null | undefined
  >,
): Promise<T> {
  const {
    token,
    tenantId,
    tenantRole,
    ...fetchOptions
  } = options;

  const url = buildUrl(path, params);

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      ...getAuthHeaders({
        token,
        tenantId,
        tenantRole,
        ...fetchOptions,
      }),
      ...(fetchOptions.headers || {}),
    },
    cache: "no-store",
  });

  return parseResponse<T>(response);
}

export async function apiGet<T>(
  path: string,
  params?: Record<
    string,
    string | number | boolean | null | undefined
  >,
): Promise<T> {
  return apiRequest<T>(
    path,
    {
      method: "GET",
    },
    params,
  );
}

export async function apiPost<
  TResponse,
  TBody = unknown,
>(
  path: string,
  body?: TBody,
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    method: "POST",
    body:
      body !== undefined
        ? JSON.stringify(body)
        : undefined,
  });
}

export async function apiPut<
  TResponse,
  TBody = unknown,
>(
  path: string,
  body?: TBody,
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    method: "PUT",
    body:
      body !== undefined
        ? JSON.stringify(body)
        : undefined,
  });
}

export async function apiDelete<T>(
  path: string,
): Promise<T> {
  return apiRequest<T>(path, {
    method: "DELETE",
  });
}

export async function apiPostFormData<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  return apiRequest<T>(path, {
    method: "POST",
    body: formData,
  });
}

export const API_BASE = API_BASE_URL;