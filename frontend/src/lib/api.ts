import { API_BASE_URL } from "./constants";

export interface ApiResponse<T>{
 data: T;
 message: string;
 status: number;
}

export interface ApiError {
 detail: string;
 status: number;
 type: string;
}

class ApiClient {
 private baseUrl: string;
 private token: string | null = null;

 constructor(baseUrl: string) {
  this.baseUrl = baseUrl;
 }

 setToken(token: string | null) {
  this.token = token;
 }

  private async request<T>(
  endpoint: string,
  options: RequestInit = {}
 ): Promise<ApiResponse<T>>{
  const isFormData = typeof window !== "undefined" && options.body instanceof FormData;
  
  const headers: Record<string, string>= {
   ...(isFormData ? {} : { "Content-Type": "application/json" }),
   ...(options.headers as Record<string, string>),
  };

  // If we have custom headers but it's form data, we need to make sure we don't accidentally set Content-Type
  // fetch will automatically add the correct Content-Type with boundary for FormData
  if (isFormData && headers["Content-Type"]) {
    delete headers["Content-Type"];
  }

  // If token not set in memory, try reading from localStorage in browser
  if (!this.token && typeof window !== "undefined") {
   this.token = localStorage.getItem("etransport_token");
  }

  if (this.token) {
   headers["Authorization"] = `Bearer ${this.token}`;
  }

  let response: Response;
  try {
   response = await fetch(`${this.baseUrl}${endpoint}`, {
    ...options,
    headers,
   });
  } catch (netErr: any) {
   const netError: ApiError = {
    detail: "Impossible de joindre le serveur API. Veuillez vérifier votre connexion.",
    status: 0,
    type: "network_error",
   };
   throw netError;
  }

  if (!response.ok) {
   if (response.status === 401 && typeof window !== "undefined") {
     localStorage.removeItem("etransport_token");
     localStorage.removeItem("etransport_user");
     window.location.href = "/login";
     // We return a dummy error to prevent further execution in the current call stack
     throw { detail: "Session expirée", status: 401, type: "unauthorized" };
   }

   let errorData: any = {};
   try {
    errorData = await response.json();
   } catch {
    errorData = { detail: response.statusText || "Une erreur est survenue"};
   }

   let detailMsg = errorData.detail || errorData.message || "Une erreur est survenue sur le serveur";
   
   // Handle Pydantic validation errors which return an array of objects
   if (Array.isArray(detailMsg)) {
     detailMsg = detailMsg.map(e => e.msg).join(", ");
   } else if (typeof detailMsg !== "string") {
     detailMsg = "Une erreur inattendue est survenue";
   }

   const error: ApiError = {
    detail: detailMsg,
    status: response.status,
    type: errorData.type || (response.status === 403 ? "forbidden": "api_error"),
   };
   throw error;
  }

  // Wrap raw backend JSON response in ApiResponse structure { data: T }
  let json: any = null;
  if (response.status !== 204) {
    const text = await response.text();
    if (text) {
      try {
        json = JSON.parse(text);
      } catch (e) {
        // Not JSON
      }
    }
  }

  return {
   data: json as T,
   message: response.statusText,
   status: response.status,
  };
 }

 async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>>{
  const url = params
   ? `${endpoint}?${new URLSearchParams(params).toString()}`
   : endpoint;
  return this.request<T>(url);
 }

 async post<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<ApiResponse<T>>{
  const isFormData = typeof window !== "undefined" && body instanceof FormData;
  return this.request<T>(endpoint, {
   ...options,
   method: "POST",
   body: isFormData ? (body as FormData) : JSON.stringify(body),
  });
 }

 async put<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<ApiResponse<T>>{
  const isFormData = typeof window !== "undefined" && body instanceof FormData;
  return this.request<T>(endpoint, {
   ...options,
   method: "PUT",
   body: isFormData ? (body as FormData) : JSON.stringify(body),
  });
 }

 async patch<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<ApiResponse<T>>{
  const isFormData = typeof window !== "undefined" && body instanceof FormData;
  return this.request<T>(endpoint, {
   ...options,
   method: "PATCH",
   body: isFormData ? (body as FormData) : JSON.stringify(body),
  });
 }

 async delete<T>(endpoint: string): Promise<ApiResponse<T>>{
  return this.request<T>(endpoint, { method: "DELETE"});
 }
}

export const api = new ApiClient(API_BASE_URL);
