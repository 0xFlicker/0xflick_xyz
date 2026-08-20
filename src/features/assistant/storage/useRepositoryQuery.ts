"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

import type { Unsubscribe } from "@/features/assistant/storage/repository";

export function useRepositoryQuery<Value>(
  initialValue: Value,
  subscribe: (listener: (value: Value) => void) => Unsubscribe,
): Value {
  const snapshotRef = useRef(initialValue);
  const subscribeRef = useRef(subscribe);
  subscribeRef.current = subscribe;

  const getSnapshot = useCallback(() => snapshotRef.current, []);
  const subscribeToStore = useCallback((notify: () => void) => {
    return subscribeRef.current((nextValue) => {
      if (Object.is(snapshotRef.current, nextValue)) return;
      snapshotRef.current = nextValue;
      notify();
    });
  }, []);

  return useSyncExternalStore(subscribeToStore, getSnapshot, getSnapshot);
}
