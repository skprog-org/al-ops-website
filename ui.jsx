// Shared UI primitives: header, icons, sparkline, badges, gate icons.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ── Brand mark ────────────────────────────────────────────────────────
function BrandMark({ size = 32 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background:
          "linear-gradient(135deg, var(--crimson-600), var(--crimson-800))",
        color: "#fff",
        display: "grid",
        placeItems: "center",
        fontFamily: "var(--font-sans)",
        fontWeight: 800,
        fontSize: size * 0.42,
        letterSpacing: "0.02em",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,.18), 0 1px 2px rgba(0,0,0,.08)",
      }}
    >
      AL
    </div>
  );
}

// ── Top nav ───────────────────────────────────────────────────────────
function TopNav({ view, setView, project, setProject }) {
  const tabs = [
    { id: "pipeline", label: "Pipeline" },
    { id: "marketplace", label: "Marketplace" },
    { id: "composer", label: "Composer" },
    { id: "run", label: "Live Run" },
  ];
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "saturate(160%) blur(10px)",
        WebkitBackdropFilter: "saturate(160%) blur(10px)",
        borderBottom: "1px solid var(--ink-200)",
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "12px 28px",
          display: "flex",
          alignItems: "center",
          gap: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BrandMark />
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>AL Ops</div>
            <div style={{ color: "var(--ink-500)", fontSize: 11.5 }}>
              Enterprise AI-SDLC
            </div>
          </div>
        </div>

        <nav
          style={{
            display: "flex",
            gap: 4,
            padding: 4,
            background: "var(--ink-50)",
            border: "1px solid var(--ink-200)",
            borderRadius: 999,
          }}
        >
          {tabs.map((t) => {
            const active = view === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  color: active ? "#fff" : "var(--ink-700)",
                  background: active
                    ? "linear-gradient(180deg, var(--crimson-600), var(--crimson-700))"
                    : "transparent",
                  boxShadow: active
                    ? "0 1px 0 rgba(255,255,255,0.15) inset, 0 1px 2px rgba(196,30,46,.25)"
                    : "none",
                  transition: "all .15s ease",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "5px 10px 5px 12px",
            border: "1px solid var(--ink-200)",
            borderRadius: 999,
            background: "#fff",
          }}
        >
          <span
            className="pulse-dot"
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "var(--emerald-500)",
            }}
          />
          <span style={{ fontSize: 12.5, color: "var(--ink-700)" }}>
            <strong style={{ fontWeight: 600 }}>{project.name}</strong>
            <span className="mono" style={{ color: "var(--ink-500)", marginLeft: 8 }}>
              {project.sha}
            </span>
          </span>
          <button
            onClick={() => {
              const i = window.PROJECTS.findIndex((p) => p.id === project.id);
              setProject(window.PROJECTS[(i + 1) % window.PROJECTS.length]);
            }}
            style={{
              padding: "3px 8px",
              borderRadius: 999,
              fontSize: 11,
              color: "var(--ink-600)",
              background: "var(--ink-50)",
            }}
            title="Switch project"
          >
            switch
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "4px 12px 4px 4px",
            borderRadius: 999,
            border: "1px solid var(--ink-200)",
            background: "#fff",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              background: "var(--ink-100)",
              color: "var(--ink-700)",
              display: "grid",
              placeItems: "center",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            SP
          </div>
          <div style={{ lineHeight: 1.05 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>SK Prog</div>
            <div style={{ fontSize: 10.5, color: "var(--ink-500)" }}>
              Super Admin
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ── Gate icon (uses path from data) ───────────────────────────────────
function GateIcon({ gate, size = 18, color }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || gate.color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={gate.icon} />
    </svg>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────
function Sparkline({ data, color = "var(--crimson-600)", w = 96, h = 28 }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / span) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const last = data[data.length - 1];
  const lx = (data.length - 1) * step;
  const ly = h - ((last - min) / span) * (h - 4) - 2;
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lx} cy={ly} r="2.5" fill={color} />
    </svg>
  );
}

// ── Tag pill ──────────────────────────────────────────────────────────
function Tag({ children, tone = "ink" }) {
  const tones = {
    ink: { bg: "var(--ink-50)", fg: "var(--ink-700)", bd: "var(--ink-200)" },
    crimson: {
      bg: "var(--crimson-50)",
      fg: "var(--crimson-700)",
      bd: "var(--crimson-200)",
    },
    emerald: {
      bg: "var(--emerald-50)",
      fg: "var(--emerald-600)",
      bd: "#a7f3d0",
    },
    amber: { bg: "var(--amber-50)", fg: "#92400e", bd: "#fde68a" },
    violet: { bg: "var(--violet-50)", fg: "#5b21b6", bd: "#ddd6fe" },
    sky: { bg: "var(--sky-50)", fg: "#075985", bd: "#bae6fd" },
  };
  const t = tones[tone] || tones.ink;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 500,
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.bd}`,
      }}
    >
      {children}
    </span>
  );
}

// ── Compliance badge row ──────────────────────────────────────────────
function ComplianceRow({ items = window.COMPLIANCE }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {items.map((c) => (
        <span
          key={c.id}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 10px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            border: "1px solid var(--ink-200)",
            background: "#fff",
            color: "var(--ink-700)",
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z" />
          </svg>
          {c.label}
        </span>
      ))}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, tone = "ink") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);
  const node = (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: "var(--ink-900)",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: "0 8px 24px rgba(0,0,0,.18)",
            animation: "fadeUp .25s ease",
          }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
  return { push, node };
}

Object.assign(window, {
  BrandMark,
  TopNav,
  GateIcon,
  Sparkline,
  Tag,
  ComplianceRow,
  useToast,
});
