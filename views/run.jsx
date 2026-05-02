// Live Run view — watch a project's commit/PR move through every gate.
// Auto-advances; users can also pause / step / restart.

const { useState: rUseState, useEffect: rUseEffect, useRef: rUseRef } = React;

function RunView({ project, pipeline, openDetail }) {
  const gates = window.GATES;
  const agents = window.AGENTS;

  // Build the active run timeline from pipeline
  const timeline = gates.map((g) => ({
    gate: g,
    agents: (pipeline[g.id] || []).map((id) => agents.find((a) => a.id === id)).filter(Boolean),
  }));

  const [currentIdx, setCurrentIdx] = rUseState(0);
  const [progress, setProgress] = rUseState(0); // 0..1 within current gate
  const [paused, setPaused] = rUseState(false);
  const [logs, setLogs] = rUseState([{ t: "00:00", msg: `Build started · ${project.name} @ ${project.sha}`, tone: "ink" }]);
  const elapsed = rUseRef(0);

  rUseEffect(() => {
    if (paused) return;
    if (currentIdx >= timeline.length) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(1, p + 0.025);
        if (next >= 1) {
          // advance gate
          setCurrentIdx((i) => i + 1);
          const g = timeline[currentIdx]?.gate;
          if (g) {
            elapsed.current += Math.round(8 + Math.random() * 30);
            const m = String(Math.floor(elapsed.current / 60)).padStart(2, "0");
            const s = String(elapsed.current % 60).padStart(2, "0");
            setLogs((L) => [
              ...L,
              { t: `${m}:${s}`, msg: `✓ ${g.name} passed (${timeline[currentIdx].agents.length} agents)`, tone: "emerald" },
            ]);
          }
          return 0;
        }
        return next;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [paused, currentIdx]);

  const restart = () => {
    setCurrentIdx(0);
    setProgress(0);
    setPaused(false);
    elapsed.current = 0;
    setLogs([{ t: "00:00", msg: `Build started · ${project.name} @ ${project.sha}`, tone: "ink" }]);
  };

  const finished = currentIdx >= timeline.length;
  const currentGate = timeline[currentIdx]?.gate;

  return (
    <div style={{ maxWidth: 1440, margin: "0 auto", padding: "24px 28px 80px" }}>
      {/* Header bar */}
      <div
        style={{
          background: "linear-gradient(180deg, #0f1218, #16181d)",
          color: "#fff",
          borderRadius: 16,
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.6, fontWeight: 600 }}>
            Live build · {project.team}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 4 }}>
            <h2 className="serif" style={{ margin: 0, fontSize: 28, letterSpacing: "-0.015em" }}>
              {project.name}
            </h2>
            <span className="mono" style={{ color: "rgba(255,255,255,.5)", fontSize: 13 }}>
              {project.sha} · main
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10.5, opacity: 0.6, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Status
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2, color: finished ? "#34d399" : "#fbbf24" }}>
              {finished ? "● Passed all gates" : `● Running · ${currentGate?.name || "queued"}`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <PillBtn onClick={() => setPaused((p) => !p)} disabled={finished}>
              {paused ? "▶ Resume" : "⏸ Pause"}
            </PillBtn>
            <PillBtn onClick={restart}>↻ Restart</PillBtn>
          </div>
        </div>
      </div>

      {/* Gate strip */}
      <div
        style={{
          marginTop: 16,
          background: "#fff",
          border: "1px solid var(--ink-200)",
          borderRadius: 14,
          padding: "20px 18px 18px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${timeline.length}, 1fr)`,
            gap: 10,
            position: "relative",
          }}
        >
          {timeline.map((row, i) => {
            const status = i < currentIdx ? "passed" : i === currentIdx ? "running" : "queued";
            return (
              <RunGateCard
                key={row.gate.id}
                row={row}
                status={status}
                progress={status === "running" ? progress : status === "passed" ? 1 : 0}
                openDetail={openDetail}
              />
            );
          })}
        </div>
      </div>

      {/* Detail panel: current/last gate */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginTop: 14 }}>
        <RunDetailPanel
          row={timeline[Math.min(currentIdx, timeline.length - 1)]}
          finished={finished}
          openDetail={openDetail}
        />
        <LogPanel logs={logs} />
      </div>
    </div>
  );
}

function PillBtn({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "7px 12px",
        borderRadius: 999,
        background: "rgba(255,255,255,.08)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,.16)",
        fontSize: 12,
        fontWeight: 600,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

function RunGateCard({ row, status, progress, openDetail }) {
  const g = row.gate;
  const palette = {
    queued: { bd: "var(--ink-200)", bg: "#fff", icon: "var(--ink-400)", label: "queued", labelColor: "var(--ink-500)" },
    running: { bd: g.color, bg: g.tint, icon: g.color, label: "running", labelColor: g.color },
    passed: { bd: "#a7f3d0", bg: "var(--emerald-50)", icon: "var(--emerald-600)", label: "passed", labelColor: "var(--emerald-600)" },
  }[status];

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        border: `1px solid ${palette.bd}`,
        background: palette.bg,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {status === "running" && (
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            height: 3,
            width: `${progress * 100}%`,
            background: g.color,
            transition: "width .12s linear",
          }}
        />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: 7,
            background: status === "queued" ? "var(--ink-50)" : "#fff",
            color: palette.icon,
            display: "grid",
            placeItems: "center",
            border: `1px solid ${palette.bd}`,
            position: "relative",
          }}
        >
          {status === "passed" ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 12l4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : status === "running" ? (
            <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: 999, background: g.color }} />
          ) : (
            <GateIcon gate={g} size={13} color="var(--ink-400)" />
          )}
        </span>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: palette.labelColor }}>
          {palette.label}
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6, lineHeight: 1.2 }}>
        Gate {g.n} · {g.name}
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
        {row.agents.slice(0, 3).map((a, i) => (
          <span
            key={a.id}
            title={a.name}
            onClick={(e) => {
              e.stopPropagation();
              openDetail(a.id);
            }}
            style={{
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 999,
              background: "#fff",
              border: "1px solid var(--ink-200)",
              color: "var(--ink-700)",
              cursor: "pointer",
              maxWidth: 90,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {a.name}
          </span>
        ))}
        {row.agents.length > 3 && (
          <span style={{ fontSize: 10.5, color: "var(--ink-500)" }}>+{row.agents.length - 3}</span>
        )}
        {row.agents.length === 0 && (
          <span style={{ fontSize: 10.5, color: "var(--crimson-700)" }}>● no agents</span>
        )}
      </div>
    </div>
  );
}

function RunDetailPanel({ row, finished, openDetail }) {
  if (!row) return null;
  const g = row.gate;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--ink-200)",
        borderRadius: 14,
        padding: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: g.tint,
            color: g.color,
            border: `1px solid ${g.color}33`,
            display: "grid",
            placeItems: "center",
          }}
        >
          <GateIcon gate={g} size={18} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--ink-500)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {finished ? "Last gate" : "Now running"}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>
            Gate {g.n} · {g.name}
          </div>
        </div>
      </div>
      <p style={{ color: "var(--ink-600)", fontSize: 13, marginTop: 12, lineHeight: 1.55 }}>
        {g.blurb}
      </p>

      <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
        {row.agents.map((a, i) => (
          <div
            key={a.id}
            onClick={() => openDetail(a.id)}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid var(--ink-200)",
              cursor: "pointer",
              background: "var(--surface-tinted)",
            }}
          >
            <span
              className="pulse-dot"
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: g.color,
                animationDelay: `${i * 0.2}s`,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 2 }}>
                {a.role} · {a.tags?.slice(0, 2).join(" · ")}
              </div>
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--emerald-600)" }}>
              {a.perf}%
            </span>
          </div>
        ))}
        {row.agents.length === 0 && (
          <div
            style={{
              padding: 16,
              border: "1px dashed var(--crimson-300)",
              background: "var(--crimson-50)",
              borderRadius: 10,
              fontSize: 13,
              color: "var(--crimson-700)",
            }}
          >
            This gate has no agents subscribed. Add at least one in the Composer.
          </div>
        )}
      </div>
    </div>
  );
}

function LogPanel({ logs }) {
  return (
    <div
      style={{
        background: "var(--ink-950)",
        color: "#cbd1de",
        borderRadius: 14,
        padding: 14,
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        lineHeight: 1.65,
        border: "1px solid var(--ink-900)",
        overflow: "auto",
        maxHeight: 380,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          paddingBottom: 8,
          borderBottom: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 999, background: "#ef4444" }} />
        <span style={{ width: 8, height: 8, borderRadius: 999, background: "#f59e0b" }} />
        <span style={{ width: 8, height: 8, borderRadius: 999, background: "#10b981" }} />
        <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.6 }}>alops · build log</span>
      </div>
      {logs.map((l, i) => (
        <div key={i}>
          <span style={{ color: "rgba(255,255,255,.4)" }}>[{l.t}]</span>{" "}
          <span style={{ color: l.tone === "emerald" ? "#34d399" : l.tone === "crimson" ? "#fca5a5" : "#cbd1de" }}>
            {l.msg}
          </span>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { RunView });
