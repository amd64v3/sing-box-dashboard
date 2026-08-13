import type { DaemonApi } from "../api/daemon";
import { loadStoredString, removeStoredValue, saveStoredString } from "../lib/storage";

const URL_TEST_URL_KEY = "url-test-url";

export type URLTestURLValidationError = "invalid" | "https";

export function loadURLTestURL(): string {
  return loadStoredString(URL_TEST_URL_KEY) ?? "";
}

export function saveURLTestURL(value: string): void {
  const url = value.trim();
  if (url === "") {
    removeStoredValue(URL_TEST_URL_KEY);
  } else {
    saveStoredString(URL_TEST_URL_KEY, url);
  }
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
  return api.urlTest(outboundTag, loadURLTestURL());
}
