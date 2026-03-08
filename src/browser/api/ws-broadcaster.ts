import type { EventBus, BrowserEvent } from './event-bus';

export interface WsClient {
  send: (data: string) => void;
  readyState: number;
  filters: BrowserEvent['type'][] | null;
}

const WS_OPEN = 1;

export class WsBroadcaster {
  private readonly clients = new Map<string, WsClient>();
  private readonly unsubscribe: () => void;
  private nextId = 0;

  constructor(eventBus: EventBus) {
    this.unsubscribe = eventBus.onAll((event) => {
      this.broadcast(event);
    });
  }

  addClient(client: WsClient): string {
    const id = `ws-${String(this.nextId++)}`;
    this.clients.set(id, client);
    return id;
  }

  removeClient(id: string): void {
    this.clients.delete(id);
  }

  setFilters(id: string, filters: BrowserEvent['type'][] | null): void {
    const client = this.clients.get(id);
    if (client === undefined) {
      return;
    }
    client.filters = filters;
  }

  clientCount(): number {
    return this.clients.size;
  }

  getClientIds(): string[] {
    return [...this.clients.keys()];
  }

  destroy(): void {
    this.unsubscribe();
    this.clients.clear();
  }

  private broadcast(event: BrowserEvent): void {
    const payload = JSON.stringify(event);
    const toRemove: string[] = [];

    for (const [id, client] of this.clients) {
      if (client.readyState !== WS_OPEN) {
        toRemove.push(id);
        continue;
      }

      if (!this.passesFilter(client, event)) {
        continue;
      }

      try {
        client.send(payload);
      } catch {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.clients.delete(id);
    }
  }

  private passesFilter(client: WsClient, event: BrowserEvent): boolean {
    if (client.filters === null) {
      return true;
    }
    return client.filters.includes(event.type);
  }
}
