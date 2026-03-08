export interface CertificateInfo {
  readonly subject: string;
  readonly issuer: string;
  readonly validFrom: string;
  readonly validTo: string;
  readonly protocol: string;
  readonly keyExchange: string;
  readonly cipher: string;
  readonly isValid: boolean;
}

export type SecurityLevel = 'secure' | 'warning' | 'insecure' | 'none';

export class CertificateStore {
  private readonly certs = new Map<string, CertificateInfo>();

  setCertificate(tabId: string, cert: CertificateInfo): void {
    this.certs.set(tabId, cert);
  }

  getCertificate(tabId: string): CertificateInfo | undefined {
    return this.certs.get(tabId);
  }

  removeCertificate(tabId: string): void {
    this.certs.delete(tabId);
  }

  isSecure(tabId: string): boolean {
    const cert = this.certs.get(tabId);
    return cert?.isValid === true;
  }

  getSecurityLevel(tabId: string): SecurityLevel {
    const cert = this.certs.get(tabId);
    if (!cert) return 'none';
    if (!cert.isValid) return 'insecure';
    if (cert.protocol === 'TLS 1.3') return 'secure';
    return 'warning';
  }

  clearAll(): void {
    this.certs.clear();
  }
}
