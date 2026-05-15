import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('api interceptors', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    });
  });

  describe('request interceptor', () => {
    it('adds Authorization header when token exists in localStorage', async () => {
      localStorage.setItem('access_token', 'test-token-abc');
      const { api } = await import('@/lib/api');

      const interceptors = (api.interceptors.request as unknown as { handlers: { fulfilled: (config: { headers: Record<string, string> }) => { headers: Record<string, string> } }[] }).handlers;
      const handler = interceptors[0]?.fulfilled;

      const config = { headers: {} as Record<string, string> };
      const result = handler(config);

      expect(result.headers.Authorization).toBe('Bearer test-token-abc');
    });

    it('does not add Authorization header when no token', async () => {
      localStorage.removeItem('access_token');
      const { api } = await import('@/lib/api');

      const interceptors = (api.interceptors.request as unknown as { handlers: { fulfilled: (config: { headers: Record<string, string> }) => { headers: Record<string, string> } }[] }).handlers;
      const handler = interceptors[0]?.fulfilled;

      const config = { headers: {} as Record<string, string> };
      const result = handler(config);

      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('response error interceptor', () => {
    it('removes access_token and redirects on 401', async () => {
      localStorage.setItem('access_token', 'old-token');
      const { api } = await import('@/lib/api');

      const interceptors = (api.interceptors.response as unknown as { handlers: { rejected: (error: unknown) => Promise<never> }[] }).handlers;
      const errorHandler = interceptors[0]?.rejected;

      const error = { response: { status: 401 } };

      await errorHandler(error).catch(() => {});

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(window.location.href).toBe('/login');
    });

    it('does not redirect on non-401 errors', async () => {
      const { api } = await import('@/lib/api');

      const interceptors = (api.interceptors.response as unknown as { handlers: { rejected: (error: unknown) => Promise<never> }[] }).handlers;
      const errorHandler = interceptors[0]?.rejected;

      const error = { response: { status: 500 } };
      window.location.href = '/current-page';

      await errorHandler(error).catch(() => {});

      expect(window.location.href).toBe('/current-page');
    });
  });
});
