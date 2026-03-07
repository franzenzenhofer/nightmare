import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from '../api/event-bus';
import type { BrowserEvent } from '../api/event-bus';

let bus: EventBus;

beforeEach(() => {
  bus = new EventBus();
});

describe('EventBus', () => {
  it('emits and receives typed events', () => {
    const handler = vi.fn();
    bus.on('tab:created', handler);
    const event: BrowserEvent = {
      type: 'tab:created',
      tab: { id: 'test', url: 'file:///a.html', title: 'Test', zone: 'LOCAL' },
    };
    bus.emit(event);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('supports multiple subscribers', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on('tab:closed', h1);
    bus.on('tab:closed', h2);
    bus.emit({ type: 'tab:closed', tabId: 'x' });
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes a handler', () => {
    const handler = vi.fn();
    const unsub = bus.on('tab:loaded', handler);
    unsub();
    bus.emit({ type: 'tab:loaded', tabId: 'x', title: 'Test' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('supports wildcard subscriptions via onAll', () => {
    const handler = vi.fn();
    bus.onAll(handler);
    bus.emit({ type: 'tab:created', tab: { id: 't', url: 'u', title: 't', zone: 'LOCAL' } });
    bus.emit({ type: 'tab:closed', tabId: 'x' });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('does not call handlers for wrong event type', () => {
    const handler = vi.fn();
    bus.on('tab:created', handler);
    bus.emit({ type: 'tab:closed', tabId: 'x' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('stores event history', () => {
    bus.emit({ type: 'tab:closed', tabId: 'x' });
    bus.emit({ type: 'tab:closed', tabId: 'y' });
    const history = bus.getHistory();
    expect(history).toHaveLength(2);
  });

  it('limits history to maxHistory entries', () => {
    const smallBus = new EventBus(3);
    for (let i = 0; i < 5; i++) {
      smallBus.emit({ type: 'tab:closed', tabId: `t${String(i)}` });
    }
    expect(smallBus.getHistory()).toHaveLength(3);
  });

  it('clears history', () => {
    bus.emit({ type: 'tab:closed', tabId: 'x' });
    bus.clearHistory();
    expect(bus.getHistory()).toHaveLength(0);
  });
});
