// Plan & Groom workflow — deep-dive workspace for Gate 1.
// Sidebar of agent statuses + horizontal pipeline + stacked detail outputs.

const { useState: pgUseState } = React;

const PLAN_AGENTS = [
  {
    id: "ingestion",
    name: "Ingestion Agent",
    role: "Pulls sources",
    status: "completed",
    confidence: 94,
    runtime: "1m 12s",
  },
  {
    id: "risk",
    name: "Risk & Scoring Agent",
    role: "Tech / Biz / Sec",
    status: "completed",
    confidence: 91,
    runtime: "2m 04s",
  },
  {
    id: "metrics",
    name: "Metrics & A11y Agent",
    role: "Baselines + WCAG",
    status: "completed",
    confidence: 89,
    runtime: "1m 38s",
  },
  {
    id: "reviewer",
    name: "Reviewer Agent",
    role: "Quality + gaps",
    status: "running",
    confidence: null,
    runtime: "00:42",
  },
];

const RISK_ROWS = [
  { story: "BANK-124", tech: 9, biz: 4, sec: 8, overall: "High", reco: "Split biometric step" },
  { story: "BANK-125", tech: 3, biz: 2, sec: 2, overall: "Low", reco: "Ready to groom" },
  { story: "BANK-127", tech: 7, biz: 6, sec: 5, overall: "Medium", reco: "Add dependency check" },
  { story: "BANK-131", tech: 4, biz: 5, sec: 3, overall: "Low", reco: "Ready to groom" },
  { story: "BANK-134", tech: 8, biz: 7, sec: 7, overall: "High", reco: "Split + spike" },
];

function PlanGroomView({ project, onBack, onOpenComposer }) {
  const gate = window.GATES.find((g) => g.id === "plan");
  const [active, setActive] = pgUseState("ingestion");

  const overallProgress = 87;

  return (
    <div style={{ maxWidth: 1440, margin: "0 auto", padding: "20px 28px 80px" }}>
      {/* Breadcrumb / header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button
          onClick={onBack}
          style={{
            fontSize: 12,
            color: "var(--ink-600)",
            padding: "5px 10px",
            borderRadius: 8,
            border: "1px solid var(--ink-200)",
            background: "#fff",
            fontWeight: 600,
          }}
        >
          ← Pipeline
        </button>
        <span style={{ fontSize: 12, color: "var(--ink-400)" }}>/</span>
        <span style={{ fontSize: 12, color: "var(--ink-600)" }}>Gate 1 · Planning</span>
      </div>

      <div
        style={{
          background: "linear-gradient(135deg, #f0f9ff 0%, #ffffff 60%)",
          border: "1px solid var(--ink-200)",
          borderRadius: 16,
          padding: "20px 22px",
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 11,
            background: gate.tint,
            color: gate.color,
            border: `1px solid ${gate.color}33`,
            display: "grid",
            placeItems: "center",
          }}
        >
          <GateIcon gate={gate} size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: gate.color, fontWeight: 700 }}>
            Multi-Agent Planning & Grooming Workflow
          </div>
          <h1 className="serif" style={{ margin: "4px 0 0", fontSize: 28, letterSpacing: "-0.015em" }}>
            {project.name} <span style={{ color: "var(--ink-400)", fontWeight: 400 }}>— sprint kickoff</span>
          </h1>
          <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 4 }}>
            Pipeline status · <strong style={{ color: "var(--ink-800)" }}>{overallProgress}% complete</strong>
            {"  ·  "}Last run · 12 mins ago{"  ·  "}Run id <span className="mono">pln-7b21f</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onOpenComposer}
            style={{
              padding: "9px 14px",
              borderRadius: 9,
              border: "1px solid var(--ink-200)",
              background: "#fff",
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            Edit gate agents
          </button>
          <button
            style={{
              padding: "9px 14px",
              borderRadius: 9,
              background: "linear-gradient(180deg, var(--crimson-600), var(--crimson-700))",
              color: "#fff",
              fontSize: 12.5,
              fontWeight: 700,
              border: "1px solid var(--crimson-700)",
            }}
          >
            Trigger full pipeline ▸
          </button>
        </div>
      </div>

      {/* Body grid */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 18, marginTop: 18 }}>
        {/* Sidebar — Agent status */}
        <aside
          style={{
            background: "#fff",
            border: "1px solid var(--ink-200)",
            borderRadius: 14,
            padding: 14,
            position: "sticky",
            top: 84,
            alignSelf: "start",
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ink-500)",
              marginBottom: 10,
            }}
          >
            Agent Status · Real-time
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {PLAN_AGENTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setActive(a.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 10px",
                  borderRadius: 9,
                  background: active === a.id ? gate.tint : "transparent",
                  border: active === a.id ? `1px solid ${gate.color}33` : "1px solid transparent",
                  textAlign: "left",
                }}
              >
                <StatusDot status={a.status} color={gate.color} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{a.name}</div>
                  <div style={{ fontSize: 10.5, color: "var(--ink-500)", marginTop: 2 }}>
                    {a.status === "completed" ? `✓ ${a.runtime} · ${a.confidence}% conf` : `○ in progress · ${a.runtime}`}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 10,
              background: "var(--surface-tinted)",
              border: "1px solid var(--ink-200)",
            }}
          >
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-500)" }}>
              Run summary
            </div>
            <div style={{ fontSize: 12.5, marginTop: 6, color: "var(--ink-700)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span>Stories ingested</span><strong>24</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span>High-risk</span><strong style={{ color: "var(--crimson-700)" }}>2</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span>Quality score</span><strong style={{ color: "var(--emerald-600)" }}>82/100</strong>
              </div>
            </div>
          </div>
        </aside>

        {/* Main area */}
        <div style={{ display: "grid", gap: 14 }}>
          {/* Horizontal pipeline */}
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--ink-200)",
              borderRadius: 14,
              padding: "16px 14px",
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink-500)",
                marginBottom: 10,
              }}
            >
              Workflow Pipeline · left to right
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, alignItems: "center" }}>
              {PLAN_AGENTS.map((a, i) => (
                <React.Fragment key={a.id}>
                  <FlowStep
                    n={i + 1}
                    a={a}
                    isActive={active === a.id}
                    onClick={() => setActive(a.id)}
                    color={gate.color}
                    tint={gate.tint}
                  />
                  {i < PLAN_AGENTS.length - 1 && (
                    <div style={{ position: "relative", height: 2, gridColumn: "auto", marginTop: 0 }}>
                      <div
                        style={{
                          position: "absolute",
                          left: -28,
                          right: -28,
                          top: 0,
                          height: 2,
                          background: a.status === "completed" ? gate.color : "var(--ink-200)",
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Detail outputs */}
          <SectionTitle eyebrow="Detailed agent outputs" title="What each agent produced this run" />

          <OutputCard
            n={1}
            title="Ingestion Agent Output"
            color={gate.color}
            tint={gate.tint}
            rightChip={{ label: "Confidence 94%", tone: "emerald" }}
            actions={["View raw extract", "Fix issues"]}
          >
            <KvList
              items={[
                ["Sources ingested", <span><span className="mono">JIRA: BANK-124 → BANK-138</span> + <span className="mono">PRD_v2.3.pdf</span></span>],
                ["Stories extracted", <span><strong>15</strong> functional · <strong>9</strong> non-functional</span>],
                ["Issues detected", <span><span style={{ color: "var(--crimson-700)" }}>3 duplicates</span>, <span style={{ color: "var(--amber-500)" }}>2 missing edge cases</span></span>],
              ]}
            />
          </OutputCard>

          <OutputCard
            n={2}
            title="Risk & Scoring Agent Output"
            color={gate.color}
            tint={gate.tint}
            rightChip={{ label: "Project risk · Medium-High", tone: "amber" }}
          >
            <RiskTable rows={RISK_ROWS} />
          </OutputCard>

          <OutputCard
            n={3}
            title="Metrics & Accessibility Agent Output"
            color={gate.color}
            tint={gate.tint}
            rightChip={{ label: "Confidence 89%", tone: "emerald" }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <SubBlock title="Performance baselines suggested">
                <ul style={ulStyle}>
                  <li>Login screen · <strong>&lt; 180 ms</strong> <span style={{ color: "var(--ink-500)" }}>(based on 6 similar stories)</span></li>
                  <li>Fund Transfer success rate · <strong>99.95%</strong></li>
                  <li>p95 cold-start · <strong>&lt; 2.4 s</strong> on iOS, <strong>&lt; 2.8 s</strong> on Android</li>
                </ul>
              </SubBlock>
              <SubBlock title="Accessibility recommendations">
                <ul style={ulStyle}>
                  <li><strong>WCAG 2.2 AA</strong> compliance required for this domain</li>
                  <li>Auto-added criteria: keyboard nav, ARIA labels, contrast 4.5:1</li>
                  <li>Add screen-reader test in <span className="mono">e2e/login.spec</span></li>
                </ul>
              </SubBlock>
            </div>
          </OutputCard>

          <OutputCard
            n={4}
            title="Reviewer Agent Output"
            color={gate.color}
            tint={gate.tint}
            rightChip={{ label: "Running…", tone: "sky" }}
            actions={["Generate grooming summary", "Export to Jira"]}
          >
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 18, alignItems: "center" }}>
              <ScoreRing score={82} color={gate.color} />
              <div>
                <SubBlock title="Gaps identified">
                  <ul style={ulStyle}>
                    <li>2 stories missing performance SLAs (BANK-127, BANK-131)</li>
                    <li>1 story has no acceptance criteria (BANK-134)</li>
                  </ul>
                </SubBlock>
                <SubBlock title="Suggestions">
                  <ul style={ulStyle}>
                    <li>→ Split BANK-124 into 2 stories (biometric + fallback)</li>
                    <li>→ Prioritise BANK-125 for this sprint (low risk, ready to groom)</li>
                    <li>→ Spike BANK-134 before commit</li>
                  </ul>
                </SubBlock>
              </div>
            </div>
          </OutputCard>

          {/* Bottom action bar */}
          <div
            style={{
              position: "sticky",
              bottom: 16,
              background: "#fff",
              border: "1px solid var(--ink-200)",
              borderRadius: 12,
              padding: "10px 12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 12px 28px rgba(12,13,16,.08)",
            }}
          >
            <div style={{ fontSize: 12, color: "var(--ink-600)" }}>
              4 agent outputs ready · awaiting Reviewer Agent to finish
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <BtnSecondary>Reject specific agent</BtnSecondary>
              <BtnSecondary>Export pipeline report</BtnSecondary>
              <BtnSecondary>Send to grooming meeting</BtnSecondary>
              <BtnPrimary>Approve all agent outputs ✓</BtnPrimary>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── pieces ────────────────────────────────────────────────────────────
function StatusDot({ status, color }) {
  if (status === "completed") {
    return (
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 999,
          background: "var(--emerald-50)",
          color: "var(--emerald-600)",
          display: "grid",
          placeItems: "center",
          fontSize: 11,
          border: "1px solid #a7f3d0",
          flexShrink: 0,
        }}
      >
        ✓
      </span>
    );
  }
  return (
    <span
      style={{
        width: 18,
        height: 18,
        borderRadius: 999,
        background: "#fff",
        border: `2px solid ${color}`,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: 999, background: color }} />
    </span>
  );
}

function FlowStep({ n, a, isActive, onClick, color, tint }) {
  const done = a.status === "completed";
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left",
        padding: 12,
        borderRadius: 12,
        border: isActive ? `1.5px solid ${color}` : `1px solid var(--ink-200)`,
        background: isActive ? tint : "#fff",
        transition: "all .12s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            background: done ? color : "var(--ink-50)",
            color: done ? "#fff" : "var(--ink-600)",
            display: "grid",
            placeItems: "center",
            fontSize: 11,
            fontWeight: 700,
            border: done ? `1px solid ${color}` : "1px solid var(--ink-200)",
          }}
        >
          {done ? "✓" : n}
        </span>
        <div style={{ fontSize: 12.5, fontWeight: 700 }}>{a.name}</div>
      </div>
      <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 6 }}>
        {a.role}
      </div>
    </button>
  );
}

function SectionTitle({ eyebrow, title }) {
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--crimson-700)" }}>
        {eyebrow}
      </div>
      <h3 className="serif" style={{ margin: "4px 0 0", fontSize: 22, letterSpacing: "-0.01em" }}>{title}</h3>
    </div>
  );
}

function OutputCard({ n, title, color, tint, rightChip, actions, children }) {
  const toneMap = {
    emerald: { bg: "var(--emerald-50)", fg: "var(--emerald-600)", bd: "#a7f3d0" },
    amber: { bg: "var(--amber-50)", fg: "#92400e", bd: "#fde68a" },
    sky: { bg: "var(--sky-50)", fg: "#075985", bd: "#bae6fd" },
  };
  const t = rightChip ? toneMap[rightChip.tone] || toneMap.emerald : null;
  return (
    <div style={{ background: "#fff", border: "1px solid var(--ink-200)", borderRadius: 14, overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          borderBottom: "1px solid var(--ink-100)",
          background: tint,
        }}
      >
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            background: "#fff",
            border: `1px solid ${color}33`,
            color,
            fontWeight: 700,
            fontSize: 11,
            display: "grid",
            placeItems: "center",
          }}
        >
          {n}
        </span>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{title}</div>
        {rightChip && (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "3px 9px",
              borderRadius: 999,
              background: t.bg,
              color: t.fg,
              border: `1px solid ${t.bd}`,
            }}
          >
            {rightChip.label}
          </span>
        )}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
      {actions && (
        <div style={{ padding: "10px 16px", borderTop: "1px solid var(--ink-100)", background: "var(--surface-tinted)", display: "flex", gap: 8 }}>
          {actions.map((a) => (
            <button
              key={a}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 11px",
                borderRadius: 8,
                border: "1px solid var(--ink-200)",
                background: "#fff",
                color: "var(--ink-700)",
              }}
            >
              {a}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function KvList({ items }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {items.map(([k, v], i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr",
            gap: 16,
            fontSize: 13,
            paddingBottom: 8,
            borderBottom: i < items.length - 1 ? "1px dashed var(--ink-200)" : "none",
          }}
        >
          <div style={{ color: "var(--ink-500)", fontWeight: 600 }}>{k}</div>
          <div style={{ color: "var(--ink-800)" }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

function RiskTable({ rows }) {
  const overallTone = (v) =>
    v === "High" ? { bg: "var(--crimson-50)", fg: "var(--crimson-700)", bd: "var(--crimson-200)" } :
    v === "Medium" ? { bg: "var(--amber-50)", fg: "#92400e", bd: "#fde68a" } :
    { bg: "var(--emerald-50)", fg: "var(--emerald-600)", bd: "#a7f3d0" };
  return (
    <div style={{ overflow: "auto", borderRadius: 10, border: "1px solid var(--ink-200)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead>
          <tr style={{ background: "var(--surface-tinted)", textAlign: "left" }}>
            {["Story", "Tech", "Biz", "Security", "Overall", "Recommendation"].map((h) => (
              <th key={h} style={{ padding: "9px 12px", fontWeight: 700, color: "var(--ink-600)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid var(--ink-200)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const t = overallTone(r.overall);
            return (
              <tr key={r.story} style={{ borderTop: i > 0 ? "1px solid var(--ink-100)" : "none" }}>
                <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{r.story}</td>
                <td style={{ padding: "10px 12px" }}><MiniBar value={r.tech} max={10} /></td>
                <td style={{ padding: "10px 12px" }}><MiniBar value={r.biz} max={10} /></td>
                <td style={{ padding: "10px 12px" }}><MiniBar value={r.sec} max={10} /></td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: t.bg, color: t.fg, border: `1px solid ${t.bd}` }}>
                    {r.overall}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", color: "var(--ink-700)" }}>{r.reco}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MiniBar({ value, max }) {
  const pct = (value / max) * 100;
  const color = value >= 7 ? "var(--crimson-500)" : value >= 4 ? "var(--amber-500)" : "var(--emerald-500)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 80 }}>
      <div style={{ width: 56, height: 6, borderRadius: 6, background: "var(--ink-100)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color }} />
      </div>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-700)" }}>{value}/{max}</span>
    </div>
  );
}

const ulStyle = { margin: "4px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 6, fontSize: 12.5, color: "var(--ink-700)", lineHeight: 1.55 };

function SubBlock({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-500)" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ScoreRing({ score, color }) {
  const C = 2 * Math.PI * 30;
  const off = C * (1 - score / 100);
  return (
    <div style={{ width: 100, height: 100, position: "relative" }}>
      <svg width="100" height="100" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="30" fill="none" stroke="var(--ink-100)" strokeWidth="8" />
        <circle
          cx="40" cy="40" r="30" fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={off}
          transform="rotate(-90 40 40)"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
        }}
      >
        <div>
          <div className="serif" style={{ fontSize: 28, lineHeight: 1, letterSpacing: "-0.02em" }}>{score}</div>
          <div style={{ fontSize: 9.5, color: "var(--ink-500)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>
            / 100
          </div>
        </div>
      </div>
    </div>
  );
}

function BtnSecondary({ children }) {
  return (
    <button
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid var(--ink-200)",
        background: "#fff",
        fontSize: 12.5,
        fontWeight: 600,
        color: "var(--ink-700)",
      }}
    >
      {children}
    </button>
  );
}
function BtnPrimary({ children }) {
  return (
    <button
      style={{
        padding: "8px 14px",
        borderRadius: 8,
        background: "linear-gradient(180deg, var(--crimson-600), var(--crimson-700))",
        color: "#fff",
        fontSize: 12.5,
        fontWeight: 700,
        border: "1px solid var(--crimson-700)",
      }}
    >
      {children}
    </button>
  );
}

Object.assign(window, { PlanGroomView });
