import { useErrorStore } from "@/store/useErrorStore";

/**
 * A reusable wrapper for fetch requests that automatically handles:
 * 1. Connection errors (Backend down)
 * 2. API error responses (4xx, 5xx)
 * 3. JSON parsing
 * 4. Global error modal state
 */
export async function apiRequest<T>(
  url: string,
  options?: RequestInit,
  defaultErrorMessage: string = "An error occurred."
): Promise<T> {
  const headers = new Headers(options?.headers);
  if (options?.body && !headers.has("Content-Type")) {
    headers.append("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(url, { ...options, headers });
  } catch (error) {
    // Handle network/connection errors
    useErrorStore
      .getState()
      .showError(
        "Could not connect to the backend service. Please ensure the server is running.",
        "Connection Error",
        true
      );
    throw error;
  }

  if (!response.ok) {
    let errorMessage = defaultErrorMessage;

    // Try to extract detail from FastAPI error response
    if (response.status >= 400 && response.status < 500) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
        if (typeof errorMessage !== "string") {
          errorMessage = JSON.stringify(errorMessage);
        }
      } catch {
        // If not JSON, we keep the default message
      }
    }

    useErrorStore.getState().showError(errorMessage, "Service Error", true);
    throw new Error(errorMessage);
  }

  return await response.json();
}
