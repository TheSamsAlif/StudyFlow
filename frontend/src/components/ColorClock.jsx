import { useEffect, useState } from "react";

const COLORS = ["#E07A5F", "#F2CC8F", "#81B29A", "#3D7DCA", "#9B5DE5", "#FF6B9D"];

export default function ColorClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  let h = time.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const hh = String(h).padStart(2, "0");
  const mm = String(time.getMinutes()).padStart(2, "0");
  const ss = String(time.getSeconds()).padStart(2, "0");

  const c1 = COLORS[time.getSeconds() % COLORS.length];
  const c2 = COLORS[(time.getSeconds() + 2) % COLORS.length];

  const gradStyle = (a, b) => ({
    backgroundImage: `linear-gradient(135deg, ${a}, ${b})`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: "transparent",
  });

  return (
    <div
      className="relative rounded-3xl overflow-hidden p-6"
      style={{
        backgroundImage: `linear-gradient(135deg, ${c1}22, ${c2}22)`,
        boxShadow: `0 0 60px ${c1}33`,
      }}
    >
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 20%, ${c1}, transparent 60%), radial-gradient(circle at 80% 80%, ${c2}, transparent 60%)`,
        }}
      />
      <div className="relative z-10">
        <div className="text-[10px] uppercase tracking-[0.3em] text-ink-muted mb-2">সময়</div>
        <div className="flex items-baseline gap-1 flex-wrap">
          <span className="font-mono tabular text-5xl md:text-6xl font-bold" style={gradStyle(c1, c2)}>
            {hh}
          </span>
          <span className="font-mono text-4xl text-ink-muted animate-pulse">:</span>
          <span className="font-mono tabular text-5xl md:text-6xl font-bold" style={gradStyle(c2, c1)}>
            {mm}
          </span>
          <span className="font-mono tabular text-2xl text-ink-muted ml-1">:{ss}</span>
          <span
            className="ml-2 px-2 py-0.5 rounded-md text-xs font-bold text-white"
            style={{ backgroundColor: c1 }}
          >
            {ampm}
          </span>
        </div>
        <div className="mt-2 text-sm text-ink-muted">
          {time.toLocaleDateString("bn-BD", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>
    </div>
  );
}
