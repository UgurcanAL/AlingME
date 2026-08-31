/**
 * Kaynak bazli hiz siniri. Taslak Bolum 8: havayolunun tarama trafigini
 * engellemesi kritik risk; pilot agresif sinirla calisir.
 */
export class RateLimiter {
  constructor({ perMinute, now = () => Date.now() }) {
    this.perMinute = perMinute;
    this.now = now;
    this.hits = [];
  }

  #prune() {
    const cutoff = this.now() - 60_000;
    while (this.hits.length && this.hits[0] <= cutoff) this.hits.shift();
  }

  tryAcquire() {
    this.#prune();
    if (this.hits.length >= this.perMinute) return false;
    this.hits.push(this.now());
    return true;
  }

  /** Bir sonraki izin verilen ana kalan sure (ms). */
  retryAfterMs() {
    this.#prune();
    if (this.hits.length < this.perMinute) return 0;
    return Math.max(0, this.hits[0] + 60_000 - this.now());
  }
}
