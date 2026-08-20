import "@testing-library/jest-dom/vitest";

import Dexie from "dexie";
import { cleanup } from "@testing-library/react";
import { IDBFactory, IDBKeyRange } from "fake-indexeddb";
import { afterEach, beforeEach } from "vitest";

beforeEach(() => {
  const indexedDatabase = new IDBFactory();
  Object.defineProperty(globalThis, "indexedDB", {
    configurable: true,
    value: indexedDatabase,
  });
  Object.defineProperty(globalThis, "IDBKeyRange", {
    configurable: true,
    value: IDBKeyRange,
  });
  Dexie.dependencies.indexedDB = indexedDatabase;
  Dexie.dependencies.IDBKeyRange = IDBKeyRange;

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      addEventListener: () => undefined,
      dispatchEvent: () => false,
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: () => undefined,
    }),
  });

  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: () => undefined,
  });
});

afterEach(() => {
  cleanup();
  window.localStorage?.clear();
});
