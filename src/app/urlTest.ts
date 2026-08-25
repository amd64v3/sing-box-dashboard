import type { DaemonApi } from "../api/daemon";
import { loadStoredString, removeStoredValue, saveStoredString } from "../lib/storage";

const URL_TEST_URL_KEY = "url-test-url";

export interface URLTestURLPreference {
  url: string;
  persistent: boolean;
}

export type URLTestURLValidationError = "invalid" | "https";

function loadLocalURLTestURL(): string {
  return loadStoredString(URL_TEST_URL_KEY) ?? "";
}

function saveLocalURLTestURL(url: string): void {
  if (url === "") {
    removeStoredValue(URL_TEST_URL_KEY);
  } else {
    saveStoredString(URL_TEST_URL_KEY, url);
  }
}

export function loadURLTestURL(api: DaemonApi): URLTestURLPreference {
  const groups = api.groups.getSnapshot().data;
  if (groups.loaded && groups.urlTestUrlPersistent) {
    return { url: groups.urlTestUrl, persistent: true };
  }
  return { url: loadLocalURLTestURL(), persistent: false };
}

export async function saveURLTestURL(api: DaemonApi, value: string): Promise<void> {
  const url = value.trim();
  if (loadURLTestURL(api).persistent) {
    await api.storeURLTestURL(url);
    return;
  }
  saveLocalURLTestURL(url);
}

export function validateURLTestURL(value: string): URLTestURLValidationError | null {
  const url = value.trim();
  if (url === "") {
    return null;
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "invalid";
  }
  if (parsed.hostname === "") {
    return "invalid";
  }
  if (parsed.protocol !== "https:") {
    return "https";
  }
  return null;
}

export function runURLTest(api: DaemonApi, outboundTag: string): Promise<void> {
  return api.urlTest(outboundTag, loadURLTestURL(api).url);
}
