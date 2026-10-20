import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { AppState, Demand } from "./types";
import { seed, timestamp } from "./data";
import { withManagementDemo } from "./operations";
import { withReferences } from "./mail-reference";
import { withInboxDemo } from "./inbox-model";
import { withProductionDemo } from "./production-model";
import { withChannelsDemo } from "./channels";
import { withOrganization } from "./organization";
const KEY = "adviser-demo-v1";
const prepare = (s: AppState) =>
  withOrganization(
    withChannelsDemo(
      withProductionDemo(withInboxDemo(withReferences(withManagementDemo(s)))),
    ),
  );
type Context = {
  state: AppState;
  setState: (f: (s: AppState) => AppState) => void;
  updateDemand: (
    id: string,
    p: Partial<Demand> | ((d: Demand) => Demand),
    log?: string,
  ) => void;
  notify: (message: string) => void;
  toast: string;
  clearToast: () => void;
  reset: () => void;
};
const C = createContext<Context | null>(null);
export function Store({ children }: { children: ReactNode }) {
  const [state, setRaw] = useState<AppState>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.schema === 1 && Array.isArray(parsed.demands))
          return prepare(parsed);
      }
    } catch {}
    return prepare(seed());
  });
  const [toast, setToast] = useState("");
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== KEY || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed.schema === 1 && Array.isArray(parsed.demands))
          setRaw(prepare(parsed));
      } catch {
        /* Preserve the current state if a different tab wrote invalid data. */
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      setToast(
        "Não foi possível salvar neste navegador. Exporte seus dados antes de sair.",
      );
    }
  }, [state]);
  const setState = useCallback(
    (f: (s: AppState) => AppState) => setRaw((prev) => withReferences(f(prev))),
    [],
  );
  const updateDemand = useCallback(
    (id: string, p: Partial<Demand> | ((d: Demand) => Demand), log?: string) =>
      setState((s) => ({
        ...s,
        demands: s.demands.map((d) => {
          if (d.id !== id) return d;
          const changed = typeof p === "function" ? p(d) : { ...d, ...p };
          const now = new Date().toISOString();
          const next = {
            ...changed,
            reference: d.reference,
            updatedAt: now,
            stageEnteredAt: changed.stage !== d.stage ? now : d.stageEnteredAt,
            quotes: changed.quotes.map((q) => {
              const previous = d.quotes.find((old) => old.id === q.id);
              return q.status === "received" && previous?.status !== "received"
                ? { ...q, receivedAt: now }
                : q;
            }),
          };
          return log
            ? {
                ...next,
                history: [{ at: timestamp(), text: log }, ...next.history],
              }
            : next;
        }),
      })),
    [setState],
  );
  return (
    <C.Provider
      value={{
        state,
        setState,
        updateDemand,
        notify: setToast,
        toast,
        clearToast: () => setToast(""),
        reset: () => {
          setState(() => prepare(seed()));
          setToast("Demonstração reiniciada com os exemplos fictícios.");
        },
      }}
    >
      {children}
    </C.Provider>
  );
}
export const useStore = () => {
  const c = useContext(C);
  if (!c) throw new Error("Store unavailable");
  return c;
};
export const go = (path: string) => {
  window.location.hash = path;
};
export const download = (
  name: string,
  content: string,
  type = "text/plain;charset=utf-8",
) => {
  const u = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
};
export async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
