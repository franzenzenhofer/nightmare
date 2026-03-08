export interface DownloadItem {
  readonly id: string;
  readonly url: string;
  readonly filename: string;
  readonly totalBytes: number;
  readonly receivedBytes: number;
  readonly status: 'downloading' | 'completed' | 'failed' | 'cancelled';
  readonly startedAt: number;
}

type DownloadStatus = DownloadItem['status'];

interface MutableDownload {
  readonly id: string;
  readonly url: string;
  readonly filename: string;
  readonly totalBytes: number;
  receivedBytes: number;
  status: DownloadStatus;
  readonly startedAt: number;
}

export class DownloadsManager {
  private readonly downloads: Map<string, MutableDownload> = new Map();

  startDownload(url: string, filename: string, totalBytes: number): DownloadItem {
    const download: MutableDownload = {
      id: crypto.randomUUID(),
      url,
      filename,
      totalBytes,
      receivedBytes: 0,
      status: 'downloading',
      startedAt: Date.now(),
    };
    this.downloads.set(download.id, download);
    return this.toReadonly(download);
  }

  updateProgress(id: string, receivedBytes: number): void {
    const download = this.requireDownload(id);
    if (download.status !== 'downloading') {
      throw new Error(`Cannot update progress: download ${id} is ${download.status}`);
    }
    download.receivedBytes = receivedBytes;
  }

  complete(id: string): void {
    this.requireDownload(id).status = 'completed';
  }

  fail(id: string): void {
    this.requireDownload(id).status = 'failed';
  }

  cancel(id: string): void {
    this.requireDownload(id).status = 'cancelled';
  }

  getDownload(id: string): DownloadItem | undefined {
    const download = this.downloads.get(id);
    return download ? this.toReadonly(download) : undefined;
  }

  getAllDownloads(): DownloadItem[] {
    return [...this.downloads.values()].map((d) => this.toReadonly(d));
  }

  getActiveDownloads(): DownloadItem[] {
    return [...this.downloads.values()]
      .filter((d) => d.status === 'downloading')
      .map((d) => this.toReadonly(d));
  }

  private requireDownload(id: string): MutableDownload {
    const download = this.downloads.get(id);
    if (!download) {
      throw new Error(`Download not found: ${id}`);
    }
    return download;
  }

  private toReadonly(download: MutableDownload): DownloadItem {
    return { ...download };
  }
}
