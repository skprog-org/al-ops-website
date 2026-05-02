// Agent detail drawer/modal — opened from marketplace cards or pipeline gates.

const { useState: dUseState } = React;

function AgentDetail({ agentId, onClose, toggleSubscribe }) {
  if (!agentId) return null;
  const a = window.AGENTS.find((x) => x.id === agentId);
  if (!a) return null;
  const gate = window.GATES.find((g) => g.id === a.gate);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        background: "rgba(12,13,16,.42)",
        display: "flex",
        justifyContent: "flex-end",
        animation: "fadeUp .15s ease",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(640px, 96vw)",
          height: "100vh",
          background: "#fff",
          overflow: "auto",
          boxShadow: "-12px 0 40px rgba(0,0,0,.18)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header strip */}
        <div
          style={{
            position: "relative",
            padding: "22px 24px 18px",
            background: gate.tint,
            borderBottom: `1px solid ${gate.color}22`,
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              width: 28,
              height: 28,
              borderRadius: 999,
              background: "#fff",
              border: "1px solid var(--ink-200)",
              fontSize: 14,
              color: "var(--ink-600)",
            }}
          >
            ✕
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "#fff",
                border: `1px solid ${gate.color}33`,
                color: gate.color,
                display: "grid",
                placeItems: "center",
                boxShadow: "0 1px 2px rgba(0,0,0,.05)",
              }}
            >
              <GateIcon gate={gate} size={26} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: gate.color,
                  fontWeight: 700,
                }}
              >
                {a.role} · Gate {gate.n} {gate.name}
              </div>
              <h2
                className="serif"
                style={{ margin: "4px 0 0", fontSize: 30, letterSpacing: "-0.015em" }}
              >
                {a.name}
              </h2>
            </div>
          </div>

          <p style={{ marginTop: 14, color: "var(--ink-700)", fontSize: 14, lineHeight: 1.55 }}>
            {a.summary}
          </p>

          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            {(a.tags || []).map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", display: "grid", gap: 18 }}>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            <Kpi label="Performance" value={`${a.perf}%`} />
            <Kpi label="Runs / 30d" value={a.runs || "—"} />
            <Kpi label="SLA p95" value={a.sla || "≤ 8 min"} />
          </div>

          <Block title="Inputs">
            <ListPills items={a.inputs || ["Pull Request diff", "Repo metadata", "Project policy"]} />
          </Block>

          <Block title="Outputs">
            <ListPills items={a.outputs || ["Structured report", "Pass/Fail signal", "Audit log entry"]} tone="emerald" />
          </Block>

          <Block title="Sample run">
            <pre
              style={{
                background: "var(--ink-950)",
                color: "#e3e5ea",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                lineHeight: 1.55,
                padding: 14,
                borderRadius: 10,
                overflow: "auto",
                margin: 0,
              }}
            >
{`$ alops run ${a.id} --project ${a.gate} --pr 4421
▸ pulling context (PR diff, CODEOWNERS, repo policy)
▸ ${a.name} thinking…
✓ ${a.role === "Gate Agent" ? "PASS" : "ok"}  ${a.perf}% confidence
   • critical paths: 0 violations
   • advisory: 2 suggestions queued for code-owner
↳ audit:  alops://audit/${a.id}/run-${(Math.random() * 9999 | 0)}`}
            </pre>
          </Block>

          <Block title="Governance">
            <ComplianceRow items={window.COMPLIANCE.slice(0, 4)} />
          </Block>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "auto",
            padding: "14px 24px",
            borderTop: "1px solid var(--ink-200)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--surface-tinted)",
          }}
        >
          <div style={{ fontSize: 12, color: "var(--ink-500)" }}>
            Owner · <strong style={{ color: "var(--ink-700)" }}>{a.owner || "Platform Eng"}</strong>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: "9px 14px",
                borderRadius: 9,
                border: "1px solid var(--ink-200)",
                background: "#fff",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Close
            </button>
            <button
              onClick={() => toggleSubscribe(a.id)}
              style={{
                padding: "9px 16px",
                borderRadius: 9,
                background: a.subscribed
                  ? "var(--ink-100)"
                  : "linear-gradient(180deg, var(--crimson-600), var(--crimson-700))",
                color: a.subscribed ? "var(--ink-800)" : "#fff",
                border: a.subscribed ? "1px solid var(--ink-200)" : "1px solid var(--crimson-700)",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {a.subscribed ? "Unsubscribe" : "Subscribe & add to pipeline"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <div
      style={{
        background: "var(--surface-tinted)",
        border: "1px solid var(--ink-200)",
        borderRadius: 10,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 11, color: "var(--ink-500)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div className="serif" style={{ fontSize: 26, marginTop: 2, letterSpacing: "-0.015em" }}>
        {value}
      </div>
    </div>
  );
}

function Block({ title, children }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--ink-500)",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function ListPills({ items, tone }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {items.map((i) => (
        <Tag key={i} tone={tone}>{i}</Tag>
      ))}
    </div>
  );
}

Object.assign(window, { AgentDetail });
