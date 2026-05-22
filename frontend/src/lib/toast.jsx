import { createContext, useCallback, useContext, useState } from "react";

const Ctx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = "info") => {
    const id = Math.random().toString(36).slice(2);
    let safe = msg;
    if (typeof msg !== "string") {
      try {
        if (Array.isArray(msg)) safe = msg.map((m) => m?.msg || JSON.stringify(m)).join(", ");
        else if (msg && typeof msg === "object") safe = msg.msg || msg.detail || JSON.stringify(msg);
        else safe = String(msg);
      } catch { safe = "Error"; }
    }
    setToasts((t) => [...t, { id, msg: safe, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <Ctx.Provider value={{ toast: push }}>
      {children}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            data-testid="toast"
            className={`pointer-events-auto px-4 py-3 rounded-2xl shadow-lg border text-sm animate-fadeUp max-w-xs ${
              t.type === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : t.type === "success"
                ? "bg-secondary text-white border-secondary"
                : "bg-bg-card border-outline text-ink"
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
