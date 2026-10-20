import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { AppState, Demand } from "./types";
import { seed, timestamp } from "./data";
const KEY = "adviser-demo-v1";
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
        if (parsed.schema === 1 && Array.isArray(parsed.demands)) return parsed;
      }
    } catch {}
    return seed();
  });
  const [toast, setToast] = useState("");
  const setState = useCallback(
    (f: (s: AppState) => AppState) =>
      setRaw((prev) => {
        const next = f(prev);
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          setToast(
            "Não foi possível salvar neste navegador. Exporte seus dados antes de sair.",
          );
        }
        return next;
      }),
    [],
  );
  const updateDemand = useCallback(
    (id: string, p: Partial<Demand> | ((d: Demand) => Demand), log?: string) =>
      setState((s) => ({
        ...s,
        demands: s.demands.map((d) => {
          if (d.id !== id) return d;
          const next = typeof p === "function" ? p(d) : { ...d, ...p };
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
          setState(() => seed());
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
