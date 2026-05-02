// Pipeline view — the AI-augmented SDLC at a glance.
// Hero header + governance shield banner + 7-gate flow + mission control metrics.

const { useState: pUseState, useMemo: pUseMemo } = React;

function PipelineView({ project, onOpenGate, onJumpComposer, tweaks, pipeline, setPipeline, push }) {
  const gates = window.GATES;
  const agents = window.AGENTS;
  const [configGate, setConfigGate] = pUseState(null);
  const metrics = window.METRICS;

  const agentsByGate = pUseMemo(() => {
    const m = {};
    gates.forEach((g) => (m[g.id] = agents.filter((a) => a.gate === g.id)));
    return m;
  }, []);

  return (
    <div style={{ maxWidth: 1440, margin: "0 auto", padding: "28px 28px 80px" }}>
      {/* Hero */}
      <section
        style={{
          position: "relative",
          borderRadius: 20,
          overflow: "hidden",
          background:
            "radial-gradient(120% 140% at 0% 0%, var(--crimson-700) 0%, var(--crimson-800) 45%, #5e0c18 100%)",
          color: "#fff",
          padding: "32px 36px 36px",
          boxShadow: "0 1px 0 rgba(255,255,255,.04) inset, 0 12px 32px rgba(196,30,46,.18)",
        }}
      >
        {/* subtle grid lines */}
        <svg
          aria-hidden="true"
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0, opacity: 0.16 }}
        >
          <defs>
            <pattern id="gridd" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#fff" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gridd)" />
        </svg>

        <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 24 }}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 11px",
                borderRadius: 999,
                background: "rgba(255,255,255,.14)",
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                border: "1px solid rgba(255,255,255,.22)",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "#fff" }} />
              AI-Augmented SDLC · live for {project.team}
            </div>

            <h1
              className="serif"
              style={{
                margin: "16px 0 10px",
                fontSize: 46,
                lineHeight: 1.04,
                letterSpacing: "-0.02em",
                maxWidth: 880,
              }}
            >
              Seven quality gates. <em style={{ fontStyle: "italic", color: "var(--crimson-200)" }}>Twenty-eight</em>{" "}
              specialised agents. One marketplace any team can lease from.
            </h1>
            <p
              style={{
                margin: 0,
                color: "rgba(255,255,255,.78)",
                fontSize: 15,
                maxWidth: 720,
                lineHeight: 1.5,
              }}
            >
              Compose your own pipeline from the catalog. Watch every change move through governance, code,
              testing and rollout — with regulation-ready audit trails baked in.
            </p>

            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button
                onClick={onJumpComposer}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "#fff",
                  color: "var(--crimson-800)",
                  fontWeight: 700,
                  fontSize: 13.5,
                  letterSpacing: "0.01em",
                  boxShadow: "0 1px 0 rgba(255,255,255,.6) inset, 0 6px 14px rgba(0,0,0,.18)",
                }}
              >
                Compose pipeline →
              </button>
              <button
                onClick={() => onOpenGate("plan")}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,.1)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 13.5,
                  border: "1px solid rgba(255,255,255,.22)",
                }}
              >
                Browse marketplace
              </button>
            </div>
          </div>

          {/* sparkline tile */}
          <div
            style={{
              width: 280,
              padding: 18,
              borderRadius: 14,
              background: "rgba(255,255,255,.08)",
              border: "1px solid rgba(255,255,255,.16)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Pipeline health
            </div>
            <div className="serif" style={{ fontSize: 38, marginTop: 4, lineHeight: 1 }}>
              98.4<span style={{ fontSize: 18, opacity: 0.7 }}>%</span>
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              Gate pass-rate, last 30 days
            </div>
            <div style={{ marginTop: 14 }}>
              <Sparkline data={[88, 91, 90, 92, 93, 95, 94, 96, 97, 97, 98, 98]} color="#fff" w={244} h={36} />
            </div>
          </div>
        </div>
      </section>

      {/* Governance */}
      {tweaks.showGovernance && <GovernanceBanner />}

      {/* Gate flow */}
      <section style={{ marginTop: 28 }}>
        <SectionHeader
          eyebrow="The pipeline"
          title="Every change passes through seven gates"
          subtitle="Each gate is a sub-agent. Click into any gate to see the agents in your subscription, swap them, or browse alternatives."
          rightSlot={
            <div style={{ display: "flex", gap: 6 }}>
              <Tag tone="emerald">● live</Tag>
              <Tag>v3.2.0</Tag>
            </div>
          }
        />

        <GateFlow
          gates={gates}
          agentsByGate={agentsByGate}
          onOpenGate={onOpenGate}
          onConfigureGate={(id) => setConfigGate(id)}
          animate={tweaks.animateFlow}
        />
      </section>

      {/* Mission Control */}
      <section style={{ marginTop: 36 }}>
        <SectionHeader
          eyebrow="Mission Control"
          title="Where the gates pay off"
          subtitle="Compounded over the last quarter, across every team that has adopted the AI-SDLC."
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
            marginTop: 18,
          }}
        >
          {metrics.map((m) => (
            <MetricCard key={m.id} m={m} />
          ))}
        </div>
      </section>

      {/* Loops */}
      <section style={{ marginTop: 28 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
          }}
        >
          <LoopCard
            label="Production Feedback Loop"
            from="Operate"
            to="Plan"
            desc="Real-world telemetry feeds risk scoring on the next sprint's tickets."
          />
          <LoopCard
            label="1-Hour Regression Loop"
            from="Operate"
            to="Test"
            desc="Production errors trigger the Regression Curator to generate candidate test cases within 60 minutes."
          />
        </div>
      </section>

      {configGate && (
        <GateConfig
          gateId={configGate}
          onClose={() => setConfigGate(null)}
          pipeline={pipeline}
          setPipeline={setPipeline}
          push={push}
        />
      )}
    </div>
  );
}

// ── Section header ───────────────────────────────────────────────────
function SectionHeader({ eyebrow, title, subtitle, rightSlot }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 24,
      }}
    >
      <div>
        {eyebrow && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--crimson-700)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </div>
        )}
        <h2
          className="serif"
          style={{
            margin: "6px 0 4px",
            fontSize: 30,
            letterSpacing: "-0.015em",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <div style={{ color: "var(--ink-600)", fontSize: 14, maxWidth: 720 }}>
            {subtitle}
          </div>
        )}
      </div>
      {rightSlot}
    </div>
  );
}

// ── Governance banner ────────────────────────────────────────────────
function GovernanceBanner() {
  return (
    <section
      aria-label="Governance & Compliance"
      style={{
        marginTop: 18,
        borderRadius: 16,
        background:
          "linear-gradient(180deg, #fbfcfd 0%, #f6f7f9 100%)",
        border: "1px solid var(--ink-200)",
        padding: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "linear-gradient(135deg, var(--ink-900), var(--ink-700))",
            color: "#fff",
            display: "grid",
            placeItems: "center",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z" />
            <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-500)",
              fontWeight: 600,
            }}
          >
            Governance & Compliance · The Shield Layer
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>
            Always-on overlay across every gate. Audit, security and license checks travel with the change.
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr 1fr",
          gap: 14,
          marginTop: 16,
        }}
      >
        <ShieldCard
          icon="lock"
          title="Continuous Compliance & Security"
          body="An always-on overlay scans every requirement against OWASP Top 10, ISO 27001 and NIST."
          accent="var(--crimson-600)"
        />
        <ShieldCard
          icon="link"
          title="100% Traceability & Audit Trail"
          body="Every action — from requirement hooks to production changes — is tracked in Jira and immutable deployment logs."
          accent="var(--ink-700)"
        />
        <ShieldCard
          icon="building"
          title="Structural Governance"
          body="Enforces WCAG 2.1 AA, secret scanning, and license compliance (e.g. blocking GPL-3.0/AGPL-3.0) at the architectural level."
          accent="var(--ink-700)"
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <ComplianceRow />
      </div>
    </section>
  );
}

function ShieldCard({ title, body, accent, icon }) {
  const icons = {
    lock: "M5 11h14v10H5zM8 11V7a4 4 0 1 1 8 0v4",
    link: "M9 13a5 5 0 0 1 7-7l2 2M15 11a5 5 0 0 1-7 7l-2-2",
    building: "M4 21V5l8-3 8 3v16M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01",
  };
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--ink-200)",
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "var(--ink-50)",
            color: accent,
            display: "grid",
            placeItems: "center",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d={icons[icon]} />
          </svg>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{title}</div>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--ink-600)", lineHeight: 1.5 }}>
        {body}
      </div>
    </div>
  );
}

// ── Gate flow ────────────────────────────────────────────────────────
function GateFlow({ gates, agentsByGate, onOpenGate, onConfigureGate, animate }) {
  return (
    <div
      style={{
        marginTop: 18,
        position: "relative",
        background: "#fff",
        border: "1px solid var(--ink-200)",
        borderRadius: 16,
        padding: "24px 18px 22px",
      }}
    >
      {/* connector line behind cards */}
      <svg
        aria-hidden="true"
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <line
          x1="3.5%"
          y1="86"
          x2="96.5%"
          y2="86"
          stroke="var(--ink-200)"
          strokeWidth="1.5"
          strokeDasharray="2 6"
        />
        {animate && (
          <line
            x1="3.5%"
            y1="86"
            x2="96.5%"
            y2="86"
            stroke="var(--crimson-500)"
            strokeWidth="1.5"
            strokeDasharray="6 18"
            style={{ animation: "flow 1.6s linear infinite" }}
          />
        )}
      </svg>

      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 10,
        }}
      >
        {gates.map((g) => (
          <GateCard
            key={g.id}
            gate={g}
            agentCount={agentsByGate[g.id].length}
            subscribed={agentsByGate[g.id].filter((a) => a.subscribed).length}
            connectorCount={
              window.CONNECTORS && window.CONNECTORS[g.id]
                ? (window.CONNECTORS[g.id].sources.filter(s => s.connected).length +
                   window.CONNECTORS[g.id].actions.filter(a => a.connected).length)
                : null
            }
            onClick={() => onOpenGate(g.id)}
            onConfigure={() => onConfigureGate(g.id)}
          />
        ))}
      </div>
    </div>
  );
}

function GateCard({ gate, agentCount, subscribed, onClick, onConfigure, connectorCount }) {
  return (
    <div
      style={{
        textAlign: "left",
        padding: 14,
        borderRadius: 12,
        border: "1px solid var(--ink-200)",
        background: "#fff",
        cursor: "pointer",
        position: "relative",
        transition: "transform .12s ease, box-shadow .12s ease, border-color .12s ease",
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(12,13,16,.06)";
        e.currentTarget.style.borderColor = gate.color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "var(--ink-200)";
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onConfigure && onConfigure(); }}
        title="Configure agents & connectors"
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          width: 26,
          height: 26,
          borderRadius: 7,
          background: "var(--ink-50)",
          border: "1px solid var(--ink-200)",
          color: "var(--ink-600)",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--ink-500)",
        }}
      >
        Gate {gate.n}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: gate.tint,
            color: gate.color,
            display: "grid",
            placeItems: "center",
            border: `1px solid ${gate.color}22`,
          }}
        >
          <GateIcon gate={gate} />
        </span>
        <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.15 }}>
          {gate.name}
        </div>
      </div>

      <div style={{ marginTop: 14, height: 26 }}>
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* Stacked agent dots */}
          {Array.from({ length: Math.min(4, agentCount) }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                background: i === 0 ? gate.color : gate.tint,
                color: i === 0 ? "#fff" : gate.color,
                border: `1.5px solid #fff`,
                marginLeft: i === 0 ? 0 : -6,
                fontSize: 9,
                fontWeight: 700,
                display: "grid",
                placeItems: "center",
                boxShadow: "0 1px 2px rgba(0,0,0,.08)",
              }}
            >
              {i === 0 ? "★" : ""}
            </span>
          ))}
          {agentCount > 4 && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 11,
                color: "var(--ink-500)",
              }}
            >
              +{agentCount - 4}
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          fontSize: 11.5,
          color: "var(--ink-500)",
          marginTop: 8,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{gate.gate}</span>
        <span style={{ color: "var(--emerald-600)", fontWeight: 600 }}>
          {subscribed}/{agentCount}
        </span>
      </div>

      {connectorCount != null && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1px dashed var(--ink-200)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 11,
            color: "var(--ink-500)",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: gate.color }} />
            {connectorCount} connector{connectorCount === 1 ? "" : "s"}
          </span>
          <span
            onClick={(e) => { e.stopPropagation(); onConfigure && onConfigure(); }}
            style={{ color: gate.color, fontWeight: 600, cursor: "pointer" }}
          >
            Edit →
          </span>
        </div>
      )}
    </div>
  );
}

// ── Metric card ──────────────────────────────────────────────────────
function MetricCard({ m }) {
  const up = m.trend === "up";
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--ink-200)",
        borderRadius: 14,
        padding: 18,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 500 }}>
          {m.label}
        </div>
        <span
          className="pill"
          style={{
            background: up ? "var(--emerald-50)" : "var(--crimson-50)",
            color: up ? "var(--emerald-600)" : "var(--crimson-700)",
            fontSize: 10.5,
          }}
        >
          {up ? "↑" : "↓"} target
        </span>
      </div>
      <div
        className="serif"
        style={{ fontSize: 44, marginTop: 6, lineHeight: 1, letterSpacing: "-0.02em" }}
      >
        {m.value}
      </div>
      <div style={{ fontSize: 12, color: "var(--ink-600)", marginTop: 4 }}>
        {m.sub}
      </div>
      <div style={{ marginTop: 12 }}>
        <Sparkline
          data={m.spark}
          color={up ? "var(--emerald-500)" : "var(--crimson-600)"}
          w={232}
          h={34}
        />
      </div>
    </div>
  );
}

// ── Loop card ────────────────────────────────────────────────────────
function LoopCard({ label, from, to, desc }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--ink-200)",
        borderRadius: 14,
        padding: 16,
        display: "flex",
        gap: 14,
        alignItems: "center",
      }}
    >
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="16" fill="none" stroke="var(--crimson-500)" strokeWidth="1.5" strokeDasharray="3 4" />
        <path d="M30 14l4 0 0 4" stroke="var(--crimson-600)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M14 30l-4 0 0-4" stroke="var(--crimson-600)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11.5, color: "var(--ink-500)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {label}
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 2 }}>
          {from} <span style={{ color: "var(--ink-400)" }}>→</span> {to}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-600)", marginTop: 4, lineHeight: 1.5 }}>
          {desc}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PipelineView });
