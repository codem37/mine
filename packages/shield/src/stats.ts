export class BlockedCounter {
  #total = 0;

  increment(amount = 1): void {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new Error(`invalid block count increment: ${amount}`);
    }
    this.#total += amount;
  }

  get total(): number {
    return this.#total;
  }
}
