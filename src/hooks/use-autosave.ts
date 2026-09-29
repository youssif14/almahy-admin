"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export interface Draft<T> {
  values: T;
  step: number;
  savedAt: string;
}

type Status = "idle" | "saving" | "saved" | "error";

/**
 * Debounced draft persistence to localStorage. Drafts stay on this device
 * only (client data shouldn't sit on a server before the case exists), and
 * are versioned by key so a schema change can't load an incompatible draft.
 */
export function useAutosave<T>(key: string, values: T, step: number, { enabled = true, delay = 800 } = {}) {
  const [status, setStatus] = useState<Status>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const first = useRef(true);
  const serialized = JSON.stringify(values);

  useEffect(() => {
    if (!enabled) return;
    if (first.current) {
      first.current = false; // don't overwrite a stored draft with the empty initial form
      return;
    }
    setStatus("saving");
    const t = setTimeout(() => {
      try {
        const at = new Date().toISOString();
        localStorage.setItem(key, JSON.stringify({ values: JSON.parse(serialized), step, savedAt: at } satisfies Draft<T>));
        setSavedAt(at);
        setStatus("saved");
      } catch {
        setStatus("error"); // quota exceeded or storage disabled (private mode)
      }
    }, delay);
    return () => clearTimeout(t);
  }, [key, serialized, step, enabled, delay]);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* storage unavailable: nothing to clear */
    }
    setStatus("idle");
    setSavedAt(null);
  }, [key]);

  return { status, savedAt, clear };
}

export function readDraft<T>(key: string): Draft<T> | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Draft<T>) : null;
  } catch {
    return null;
  }
}
