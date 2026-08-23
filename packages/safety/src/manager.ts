export interface ExceptionEntry {
  readonly domain: string;
  readonly expires?: number; // undefined = permanent
}

export class ExceptionManager {
  private readonly exceptions = new Map<string, number | undefined>();

  addException(domain: string, durationMinutes?: number): void {
    const expires = durationMinutes ? Date.now() + durationMinutes * 60 * 1000 : undefined;
    this.exceptions.set(domain.toLowerCase(), expires);
  }

  removeException(domain: string): void {
    this.exceptions.delete(domain.toLowerCase());
  }

  isException(domain: string): boolean {
    const lower = domain.toLowerCase();
    const expires = this.exceptions.get(lower);
    if (expires === undefined && this.exceptions.has(lower)) {
      return true; // Permanent
    }
    if (expires && Date.now() < expires) {
      return true; // Temporary active
    }
    if (expires && Date.now() >= expires) {
      this.exceptions.delete(lower); // Expired
    }
    return false;
  }

  getExceptions(): ExceptionEntry[] {
    const list: ExceptionEntry[] = [];
    for (const [domain, expires] of this.exceptions.entries()) {
      if (!expires || Date.now() < expires) {
        list.push({ domain, expires });
      }
    }
    return list;
  }
}
