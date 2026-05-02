// GateConfig — modal that lets the user edit which agents are on a gate
// AND which connectors (Jira, Confluence, Linear, GitHub, …) feed each gate.
// Opens from any gate card on the Pipeline view.

const { useState: gcUseState } = React;

function GateConfig({ gateId, onClose, pipeline, setPipeline, push }) {
  if (!gateId) return null;
  const gate = window.GATES.find((g) => g.id === gateId);
  const conn = window.CONNECTORS[gateId];
  const allAgents = window.AGENTS.filter((a) => a.gate === gateId);

  const inGate = pipeline[gateId] || [];
  const [tab, setTab] = gcUseState("agents"); // agents | sources | actions
  const [connState, setConnState] = gcUseState(() => {
    const m = {};
    [...(conn.sources || []), ...(conn.actions || [])].forEach((c) => {
      m[c.id] = !!c.connected;
    });
    return m;
  });

  const toggleAgent = (id) => {
    const has = inGate.includes(id);
    setPipeline({
      ...pipeline,
      [gateId]: has ? inGate.filter((x) => x !== id) : [...inGate, id],
    });
    const a = window.AGENTS.find((x) => x.id === id);
    push(`${has ? "Removed" : "Added"} ${a.name}`, has ? "ink" : "emerald");
  };

  const toggleConn = (cid, name) => {
    setConnState((s) => {
      const next = { ...s, [cid]: !s[cid] };
      push(`${next[cid] ? "Connected" : "Disconnected"} ${name}`, next[cid] ? "emerald" : "ink");
      return next;
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 95,
        background: "rgba(12,13,16,.42)",
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 96vw)",
          height: "100vh",
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-12px 0 40px rgba(0,0,0,.18)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 22px 14px", background: gate.tint, borderBottom: `1px solid ${gate.color}22`, position: "relative" }}>
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 14, right: 14, width: 28, height: 28,
              borderRadius: 999, background: "#fff", border: "1px solid var(--ink-200)", fontSize: 14, color: "var(--ink-600)",
            }}
          >✕</button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff", border: `1px solid ${gate.color}33`, color: gate.color, display: "grid", placeItems: "center" }}>
              <GateIcon gate={gate} size={22} />
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: gate.color, fontWeight: 700 }}>
                Configure Gate {gate.n}
              </div>
              <h2 className="serif" style={{ margin: "4px 0 0", fontSize: 24 }}>{gate.name}</h2>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginTop: 14 }}>
            {[
              { id: "agents", label: `Agents · ${inGate.length}/${allAgents.length}` },
              { id: "sources", label: `Sources · ${conn.sources.length}` },
              { id: "actions", label: `Actions · ${conn.actions.length}` },
            ].map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 600,
                    background: active ? "#fff" : "transparent",
                    border: active ? "1px solid var(--ink-200)" : "1px solid transparent",
                    color: active ? "var(--ink-900)" : "var(--ink-600)",
                  }}
                >{t.label}</button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto", padding: "18px 22px", background: "var(--surface-tinted)" }}>
          {tab === "agents" && (
            <div>
              <Helper>Pick which agents run on this gate. Gate Agents are starred — they own the pass/fail signal.</Helper>
              <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                {allAgents.map((a) => {
                  const on = inGate.includes(a.id);
                  return (
                    <div
                      key={a.id}
                      style={{
                        background: "#fff",
                        border: "1px solid var(--ink-200)",
                        borderRadius: 10,
                        padding: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <strong style={{ fontSize: 13.5 }}>{a.name}</strong>
                          {a.role === "Gate Agent" && (
                            <span style={{ fontSize: 10, color: gate.color, fontWeight: 700, letterSpacing: "0.08em" }}>★ GATE</span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--ink-600)", marginTop: 3, lineHeight: 1.45 }}>{a.summary}</div>
                      </div>
                      <Toggle on={on} onClick={() => toggleAgent(a.id)} />
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 12, padding: 12, border: "1px dashed var(--ink-300)", borderRadius: 10, background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12.5, color: "var(--ink-600)" }}>Need a new agent? Create one or browse the marketplace.</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={btnSecondary}>+ New custom agent</button>
                  <button style={btnSecondary}>Browse marketplace</button>
                </div>
              </div>
            </div>
          )}

          {tab === "sources" && (
            <div>
              <Helper>Where this gate's agents pull context from. Toggle to (dis)connect — connections persist across runs.</Helper>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                {conn.sources.map((c) => (
                  <ConnectorCard key={c.id} c={c} on={connState[c.id]} onToggle={() => toggleConn(c.id, c.name)} color={gate.color} />
                ))}
              </div>
              <ToolBlock tools={conn.tools} color={gate.color} />
            </div>
          )}

          {tab === "actions" && (
            <div>
              <Helper>Where this gate's agents write outputs back. Each action is auditable in the trace log.</Helper>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                {conn.actions.map((c) => (
                  <ConnectorCard key={c.id} c={c} on={connState[c.id]} onToggle={() => toggleConn(c.id, c.name)} color={gate.color} kind="action" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 22px", borderTop: "1px solid var(--ink-200)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" }}>
          <div style={{ fontSize: 12, color: "var(--ink-500)" }}>
            Changes saved automatically · audit trail in <span className="mono">alops://gates/{gate.id}</span>
          </div>
          <button onClick={onClose} style={btnPrimary}>Done</button>
        </div>
      </div>
    </div>
  );
}

function Helper({ children }) {
  return <div style={{ fontSize: 12.5, color: "var(--ink-600)", lineHeight: 1.55 }}>{children}</div>;
}

function ConnectorCard({ c, on, onToggle, color, kind = "source" }) {
  return (
    <div style={{
      background: "#fff",
      border: on ? `1px solid ${color}` : "1px solid var(--ink-200)",
      borderRadius: 10,
      padding: 12,
      display: "flex",
      gap: 10,
      alignItems: "flex-start",
      transition: "border-color .12s",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: on ? `${color}1a` : "var(--ink-50)",
        color: on ? color : "var(--ink-500)",
        display: "grid", placeItems: "center", flexShrink: 0,
        fontSize: 11, fontWeight: 700,
        border: on ? `1px solid ${color}33` : "1px solid var(--ink-200)",
      }}>
        {c.name.slice(0, 2).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <strong style={{ fontSize: 13 }}>{c.name}</strong>
          {c.type && <span style={{ fontSize: 10, color: "var(--ink-500)" }}>· {c.type}</span>}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--ink-600)", marginTop: 3, lineHeight: 1.45 }}>{c.desc}</div>
        <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
            color: on ? "var(--emerald-600)" : "var(--ink-500)",
          }}>
            {on ? "● connected" : "○ available"}
          </span>
          <Toggle on={on} onClick={onToggle} small />
        </div>
      </div>
    </div>
  );
}

function ToolBlock({ tools, color }) {
  if (!tools || !tools.length) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-500)", marginBottom: 8 }}>
        Built-in tools
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {tools.map((t) => (
          <span key={t} style={{
            padding: "4px 10px", borderRadius: 999, background: "#fff", border: `1px solid ${color}33`,
            color, fontSize: 11.5, fontWeight: 600,
          }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function Toggle({ on, onClick, small }) {
  const w = small ? 30 : 36;
  const h = small ? 18 : 20;
  const k = small ? 12 : 14;
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={on}
      style={{
        width: w, height: h, borderRadius: 999,
        background: on ? "var(--crimson-700)" : "var(--ink-200)",
        position: "relative", transition: "background .15s",
        flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: on ? w - k - 3 : 3,
        width: k, height: k, borderRadius: 999, background: "#fff",
        transition: "left .15s",
        boxShadow: "0 1px 2px rgba(0,0,0,.18)",
      }} />
    </button>
  );
}

const btnPrimary = {
  padding: "8px 14px",
  borderRadius: 9,
  background: "linear-gradient(180deg, var(--crimson-600), var(--crimson-700))",
  color: "#fff",
  fontSize: 12.5,
  fontWeight: 700,
  border: "1px solid var(--crimson-700)",
};
const btnSecondary = {
  padding: "7px 11px",
  borderRadius: 8,
  background: "#fff",
  color: "var(--ink-700)",
  fontSize: 12,
  fontWeight: 600,
  border: "1px solid var(--ink-200)",
};

Object.assign(window, { GateConfig });
