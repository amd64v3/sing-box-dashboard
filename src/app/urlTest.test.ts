import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  loadURLTestURL,
  saveURLTestURL,
  validateURLTestURL,
} from "./urlTest";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

beforeEach(() => {
  vi.stubGlobal("localStorage", new MemoryStorage());
});

describe("URL test URL preference", () => {
  it("uses an empty string for the core default", () => {
    expect(loadURLTestURL()).toBe("");
    saveURLTestURL("   ");
    expect(loadURLTestURL()).toBe("");
  });

  it("trims and stores a custom URL", () => {
    saveURLTestURL("  https://example.com/generate_204  ");
    expect(loadURLTestURL()).toBe("https://example.com/generate_204");
  });

  it("accepts only absolute HTTPS URLs", () => {
    expect(validateURLTestURL("")).toBeNull();
    expect(validateURLTestURL("https://example.com/generate_204")).toBeNull();
    expect(validateURLTestURL("https://example.com:8443/generate_204?source=test")).toBeNull();
    expect(validateURLTestURL("http://example.com/generate_204")).toBe("https");
    expect(validateURLTestURL("ftp://example.com/resource")).toBe("https");
    expect(validateURLTestURL("example.com/generate_204")).toBe("invalid");
    expect(validateURLTestURL("https://")).toBe("invalid");
    expect(validateURLTestURL("abc")).toBe("invalid");
  });
});
