import { describe, it, expect, vi } from 'vitest';
import { Router } from '../api/router';

describe('Router', () => {
  it('matches GET route', () => {
    const router = new Router();
    const handler = vi.fn().mockReturnValue({ status: 200, body: { ok: true } });
    router.get('/api/tabs', handler);
    const result = router.handle('GET', '/api/tabs');
    expect(handler).toHaveBeenCalled();
    expect(result?.status).toBe(200);
  });

  it('matches POST route', () => {
    const router = new Router();
    const handler = vi.fn().mockReturnValue({ status: 201, body: {} });
    router.post('/api/tabs', handler);
    const result = router.handle('POST', '/api/tabs', { url: 'test' });
    expect(handler).toHaveBeenCalledWith({}, { url: 'test' });
    expect(result?.status).toBe(201);
  });

  it('matches DELETE route', () => {
    const router = new Router();
    const handler = vi.fn().mockReturnValue({ status: 204, body: null });
    router.delete('/api/tabs/:id', handler);
    const result = router.handle('DELETE', '/api/tabs/abc123');
    expect(handler).toHaveBeenCalledWith({ id: 'abc123' }, undefined);
    expect(result?.status).toBe(204);
  });

  it('extracts path parameters', () => {
    const router = new Router();
    const handler = vi.fn().mockReturnValue({ status: 200, body: {} });
    router.get('/api/tabs/:id/console', handler);
    router.handle('GET', '/api/tabs/xyz/console');
    expect(handler).toHaveBeenCalledWith({ id: 'xyz' }, undefined);
  });

  it('returns null for unmatched route', () => {
    const router = new Router();
    const result = router.handle('GET', '/api/nonexistent');
    expect(result).toBeNull();
  });

  it('returns null for wrong method', () => {
    const router = new Router();
    router.get('/api/tabs', vi.fn());
    const result = router.handle('POST', '/api/tabs');
    expect(result).toBeNull();
  });

  it('matches multiple path params', () => {
    const router = new Router();
    const handler = vi.fn().mockReturnValue({ status: 200, body: {} });
    router.get('/api/:resource/:id', handler);
    router.handle('GET', '/api/tabs/123');
    expect(handler).toHaveBeenCalledWith({ resource: 'tabs', id: '123' }, undefined);
  });

  it('matches exact paths over parameterized ones', () => {
    const router = new Router();
    const specific = vi.fn().mockReturnValue({ status: 200, body: 'specific' });
    const generic = vi.fn().mockReturnValue({ status: 200, body: 'generic' });
    router.get('/api/state', specific);
    router.get('/api/:id', generic);
    const result = router.handle('GET', '/api/state');
    expect(specific).toHaveBeenCalled();
    expect(result?.body).toBe('specific');
  });
});
