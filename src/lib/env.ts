export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:5145',
} as const
