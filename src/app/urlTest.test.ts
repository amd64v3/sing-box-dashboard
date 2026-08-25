import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DaemonApi } from "../api/daemon";
import {
  loadURLTestURL,
  runURLTest,
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

function createApi(url = "", persistent = false) {
  const storeURLTestURL = vi.fn().mockResolvedValue(undefined);
  const urlTest = vi.fn().mockResolvedValue(undefined);
  const api = {
    groups: {
      getSnapshot: () => ({
        phase: "active",
        data: {
          groups: [],
          loaded: true,
          urlTestUrl: url,
          urlTestUrlPersistent: persistent,
        },
      }),
    },
    storeURLTestURL,
    urlTest,
  } as unknown as DaemonApi;
  return { api, storeURLTestURL, urlTest };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", new MemoryStorage());
});

describe("URL test URL preference", () => {
  it("uses browser storage when server persistence is unavailable", async () => {
    const { api } = createApi();
    expect(loadURLTestURL(api)).toEqual({ url: "", persistent: false });
    await saveURLTestURL(api, "  https://example.com/generate_204  ");
    expect(loadURLTestURL(api)).toEqual({
      url: "https://example.com/generate_204",
      persistent: false,
    });
  });

  it("prefers server persistence and does not write browser storage", async () => {
    const localApi = createApi().api;
    await saveURLTestURL(localApi, "https://local.example/generate_204");

    const { api, storeURLTestURL } = createApi("https://server.example/generate_204", true);
    expect(loadURLTestURL(api)).toEqual({
      url: "https://server.example/generate_204",
      persistent: true,
    });
    await saveURLTestURL(api, "  https://new.example/generate_204  ");
    expect(storeURLTestURL).toHaveBeenCalledWith("https://new.example/generate_204");
    expect(loadURLTestURL(localApi).url).toBe("https://local.example/generate_204");
  });

  it("passes the resolved preference to manual URL tests", async () => {
    const { api, urlTest } = createApi("https://server.example/generate_204", true);
    await runURLTest(api, "proxy");
    expect(urlTest).toHaveBeenCalledWith("proxy", "https://server.example/generate_204");
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
