import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from '../api/event-bus';
import type { BrowserEvent } from '../api/event-bus';
import { WsBroadcaster } from '../api/ws-broadcaster';
import type { WsClient } from '../api/ws-broadcaster';

function createMockClient(filters?: BrowserEvent['type'][]): WsClient {
  return {
    send: vi.fn(),
    readyState: 1,
    filters: filters ?? null,
  };
}

let bus: EventBus;
let broadcaster: WsBroadcaster;

beforeEach(() => {
  bus = new EventBus();
  broadcaster = new WsBroadcaster(bus);
});

describe('WsBroadcaster', () => {
  describe('addClient', () => {
    it('adds a client and returns an id', () => {
      const client = createMockClient();
      const id = broadcaster.addClient(client);
      expect(id).toBeTruthy();
      expect(broadcaster.clientCount()).toBe(1);
    });

    it('generates unique ids for each client', () => {
      const c1 = createMockClient();
      const c2 = createMockClient();
      const id1 = broadcaster.addClient(c1);
      const id2 = broadcaster.addClient(c2);
      expect(id1).not.toBe(id2);
    });
  });

  describe('removeClient', () => {
    it('removes a client by id', () => {
      const client = createMockClient();
      const id = broadcaster.addClient(client);
      broadcaster.removeClient(id);
      expect(broadcaster.clientCount()).toBe(0);
    });

    it('does nothing for unknown id', () => {
      broadcaster.removeClient('nonexistent');
      expect(broadcaster.clientCount()).toBe(0);
    });
  });

  describe('broadcasting', () => {
    it('broadcasts events to all connected clients', () => {
      const c1 = createMockClient();
      const c2 = createMockClient();
      broadcaster.addClient(c1);
      broadcaster.addClient(c2);

      const event: BrowserEvent = { type: 'tab:closed', tabId: 'x' };
      bus.emit(event);

      expect(c1.send).toHaveBeenCalledWith(JSON.stringify(event));
      expect(c2.send).toHaveBeenCalledWith(JSON.stringify(event));
    });

    it('does not broadcast to removed clients', () => {
      const client = createMockClient();
      const id = broadcaster.addClient(client);
      broadcaster.removeClient(id);

      bus.emit({ type: 'tab:closed', tabId: 'x' });
      expect(client.send).not.toHaveBeenCalled();
    });

    it('skips clients with readyState !== 1', () => {
      const client = createMockClient();
      client.readyState = 3;
      broadcaster.addClient(client);

      bus.emit({ type: 'tab:closed', tabId: 'x' });
      expect(client.send).not.toHaveBeenCalled();
    });

    it('auto-removes clients with readyState !== 1', () => {
      const client = createMockClient();
      client.readyState = 3;
      broadcaster.addClient(client);

      bus.emit({ type: 'tab:closed', tabId: 'x' });
      expect(broadcaster.clientCount()).toBe(0);
    });
  });

  describe('filtering', () => {
    it('sends only matching event types when filters are set', () => {
      const client = createMockClient(['tab:created', 'tab:closed']);
      broadcaster.addClient(client);

      bus.emit({ type: 'tab:closed', tabId: 'x' });
      bus.emit({ type: 'tab:loading', tabId: 'y' });

      expect(client.send).toHaveBeenCalledTimes(1);
      expect(client.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'tab:closed', tabId: 'x' }),
      );
    });

    it('sends all events when filters is null', () => {
      const client = createMockClient();
      broadcaster.addClient(client);

      bus.emit({ type: 'tab:closed', tabId: 'x' });
      bus.emit({ type: 'tab:loading', tabId: 'y' });
      bus.emit({
        type: 'tab:created',
        tab: { id: 't', url: 'u', title: 't', zone: 'LOCAL' },
      });

      expect(client.send).toHaveBeenCalledTimes(3);
    });

    it('updates filters for a client', () => {
      const client = createMockClient();
      const id = broadcaster.addClient(client);

      broadcaster.setFilters(id, ['error']);

      bus.emit({ type: 'tab:closed', tabId: 'x' });
      bus.emit({ type: 'error', tabId: 'y', error: 'fail' });

      expect(client.send).toHaveBeenCalledTimes(1);
      expect(client.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'error', tabId: 'y', error: 'fail' }),
      );
    });

    it('clears filters to receive all events', () => {
      const client = createMockClient(['tab:closed']);
      const id = broadcaster.addClient(client);

      broadcaster.setFilters(id, null);

      bus.emit({ type: 'tab:closed', tabId: 'x' });
      bus.emit({ type: 'tab:loading', tabId: 'y' });

      expect(client.send).toHaveBeenCalledTimes(2);
    });

    it('ignores setFilters for unknown client id', () => {
      broadcaster.setFilters('nonexistent', ['tab:closed']);
      expect(broadcaster.clientCount()).toBe(0);
    });
  });

  describe('destroy', () => {
    it('unsubscribes from EventBus and clears all clients', () => {
      const client = createMockClient();
      broadcaster.addClient(client);
      broadcaster.destroy();

      bus.emit({ type: 'tab:closed', tabId: 'x' });

      expect(client.send).not.toHaveBeenCalled();
      expect(broadcaster.clientCount()).toBe(0);
    });

    it('is safe to call destroy multiple times', () => {
      broadcaster.destroy();
      broadcaster.destroy();
      expect(broadcaster.clientCount()).toBe(0);
    });
  });

  describe('getClientIds', () => {
    it('returns all connected client ids', () => {
      const c1 = createMockClient();
      const c2 = createMockClient();
      const id1 = broadcaster.addClient(c1);
      const id2 = broadcaster.addClient(c2);

      const ids = broadcaster.getClientIds();
      expect(ids).toContain(id1);
      expect(ids).toContain(id2);
      expect(ids).toHaveLength(2);
    });

    it('returns empty array when no clients', () => {
      expect(broadcaster.getClientIds()).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('removes a client whose send throws', () => {
      const client = createMockClient();
      (client.send as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('connection reset');
      });
      broadcaster.addClient(client);

      bus.emit({ type: 'tab:closed', tabId: 'x' });

      expect(broadcaster.clientCount()).toBe(0);
    });

    it('continues broadcasting to other clients when one throws', () => {
      const bad = createMockClient();
      (bad.send as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('dead');
      });
      const good = createMockClient();
      broadcaster.addClient(bad);
      broadcaster.addClient(good);

      bus.emit({ type: 'tab:closed', tabId: 'x' });

      expect(good.send).toHaveBeenCalledTimes(1);
    });
  });
});
