// Composer — drag agents from the catalog into gate slots.
// HTML5 native drag-and-drop. Each gate slot accepts agents that match its gate id.

const { useState: cUseState, useMemo: cUseMemo } = React;

const TOOL_STACK = [
  {
    id: "scm",
    label: "Source Code Management",
    sub: "Where the agents read and write code",
    options: [
      { id: "github", name: "GitHub", note: "Dominant SCM · GitHub Actions for CI/CD" },
      { id: "gitlab", name: "GitLab", note: "Full DevOps platform · popular self-hosted" },
      { id: "bitbucket", name: "Bitbucket", note: "Atlassian · tight Jira & Confluence link" },
      { id: "azure-repos", name: "Azure DevOps", note: "Microsoft stack · enterprise .NET shops" },
    ],
  },
  {
    id: "ppm",
    label: "Product / Project Management",
    sub: "Where stories, epics and sprints live",
    options: [
      { id: "jira", name: "Jira", note: "Enterprise standard · Scrum / Kanban" },
      { id: "linear", name: "Linear", note: "Fast, opinionated · modern startups" },
      { id: "asana", name: "Asana", note: "Cross-functional · marketing & ops" },
      { id: "clickup", name: "ClickUp", note: "All-in-one workspace · highly customisable" },
    ],
  },
  {
    id: "docs",
    label: "Docs & Knowledge",
    sub: "Where PRDs, ADRs and runbooks are written",
    options: [
      { id: "confluence", name: "Confluence", note: "Enterprise wiki · pairs with Jira" },
      { id: "notion", name: "Notion", note: "Flexible docs + databases" },
      { id: "gdocs", name: "Google Drive", note: "Real-time collab standard" },
      { id: "m365", name: "OneDrive / SharePoint", note: "Microsoft 365 enterprise" },
    ],
  },
];

// Add "Not applicable" option to PPM + Docs categories at runtime to keep the
// constants above readable.
TOOL_STACK.find((c) => c.id === "ppm").options.push({ id: "none", name: "Not applicable", note: "No project management tool" });
TOOL_STACK.find((c) => c.id === "docs").options.push({ id: "none", name: "Not applicable", note: "No knowledge base in scope" });

const DEFAULT_STACK = { scm: "github", ppm: "jira", docs: "confluence" };

// Sample inventory keyed off the user's selection in Step 1. Switching the
// tool in Step 1 swaps the list shown in Step 2.
const SCM_INVENTORY = {
  github: [
    { name: "abcl/retail-banking-app", branches: 14, last: "12m ago", lang: "TypeScript", visibility: "private" },
    { name: "abcl/payments-core", branches: 8, last: "2h ago", lang: "Go", visibility: "private" },
    { name: "abcl/auth-service", branches: 5, last: "yesterday", lang: "Java", visibility: "private" },
    { name: "abcl/notifications", branches: 3, last: "3d ago", lang: "Python", visibility: "private" },
    { name: "abcl/web-platform", branches: 21, last: "1h ago", lang: "TypeScript", visibility: "internal" },
  ],
  gitlab: [
    { name: "abcl-group/retail-banking", branches: 9, last: "30m ago", lang: "TypeScript", visibility: "private" },
    { name: "abcl-group/risk-engine", branches: 6, last: "5h ago", lang: "Scala", visibility: "private" },
    { name: "abcl-group/cards-platform", branches: 4, last: "2d ago", lang: "Java", visibility: "private" },
  ],
  bitbucket: [
    { name: "abcl/banking-mobile", branches: 11, last: "1h ago", lang: "Swift / Kotlin", visibility: "private" },
    { name: "abcl/loan-origination", branches: 7, last: "yesterday", lang: "C#", visibility: "private" },
  ],
  "azure-repos": [
    { name: "abcl/CRM-Service", branches: 12, last: "45m ago", lang: ".NET 8", visibility: "private" },
    { name: "abcl/Reporting-API", branches: 4, last: "3d ago", lang: ".NET 8", visibility: "private" },
  ],
};

const PPM_INVENTORY = {
  jira: [
    { key: "BANK", name: "Retail Banking 2026", type: "Epic", stories: 24, status: "In Progress" },
    { key: "PAY", name: "Instant Payments Rail", type: "Epic", stories: 17, status: "In Progress" },
    { key: "AUTH", name: "Step-up Authentication", type: "Epic", stories: 9, status: "Ready" },
    { key: "ONBD", name: "Customer Onboarding v3", type: "Epic", stories: 14, status: "In Progress" },
    { key: "CARDS", name: "Virtual Cards Launch", type: "Epic", stories: 11, status: "Backlog" },
  ],
  linear: [
    { key: "ENG", name: "Q2 — Banking app revamp", type: "Project", stories: 19, status: "Active" },
    { key: "PAY", name: "Q2 — Payment latency", type: "Project", stories: 8, status: "Active" },
    { key: "OPS", name: "On-call hygiene", type: "Project", stories: 6, status: "Planned" },
  ],
  asana: [
    { key: "MKT", name: "Banking GTM Q2", type: "Portfolio", stories: 22, status: "Active" },
    { key: "OPS", name: "Operations excellence", type: "Portfolio", stories: 14, status: "Active" },
  ],
  clickup: [
    { key: "WS", name: "Banking workspace", type: "Space", stories: 31, status: "Active" },
    { key: "OPS", name: "DevOps workspace", type: "Space", stories: 18, status: "Active" },
  ],
};

const DOCS_INVENTORY = {
  confluence: [
    { space: "BANK", title: "Retail Banking — PRD v2.3", type: "PRD", updated: "2 days ago" },
    { space: "BANK", title: "Login redesign — RFC", type: "RFC", updated: "5 days ago" },
    { space: "ARCH", title: "ADR-014 · Step-up auth", type: "ADR", updated: "1 week ago" },
    { space: "OPS", title: "Incident runbook · payments", type: "Runbook", updated: "3 days ago" },
    { space: "BANK", title: "Customer journey map", type: "Spec", updated: "2 weeks ago" },
  ],
  notion: [
    { space: "Product", title: "Banking app — North star", type: "Strategy", updated: "yesterday" },
    { space: "Eng", title: "Service catalog", type: "DB", updated: "today" },
    { space: "Eng", title: "Test strategy v2", type: "Spec", updated: "1 week ago" },
  ],
  gdocs: [
    { space: "Drive", title: "PRD_Banking_v2.3.pdf", type: "PRD", updated: "yesterday" },
    { space: "Drive", title: "Stakeholder brief — payments", type: "Brief", updated: "3 days ago" },
  ],
  m365: [
    { space: "SharePoint", title: "Architecture review · Q2", type: "Deck", updated: "2 days ago" },
    { space: "SharePoint", title: "Compliance handbook 2026", type: "Policy", updated: "1 week ago" },
  ],
};

function ToolSelection({ stack, setStack }) {
  return (
    <section
      style={{
        marginTop: 22,
        background: "#fff",
        border: "1px solid var(--ink-200)",
        borderRadius: 14,
        padding: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--crimson-700)" }}>
            Step 1 · Tool Selection
          </div>
          <h2 className="serif" style={{ margin: "4px 0 2px", fontSize: 22, letterSpacing: "-0.01em" }}>
            Pick your team's stack
          </h2>
          <div style={{ fontSize: 13, color: "var(--ink-600)", maxWidth: 640 }}>
            Agents inherit the connectors they need from this selection. You can override per-gate later.
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {Object.entries(stack).map(([k, v]) => {
            const cat = TOOL_STACK.find((c) => c.id === k);
            const opt = cat.options.find((o) => o.id === v);
            return (
              <span key={k} className="pill" style={{
                background: "var(--ink-50)", color: "var(--ink-700)",
                border: "1px solid var(--ink-200)", fontSize: 11,
              }}>
                {cat.label.split(" ")[0]} · <strong>{opt?.name || "—"}</strong>
              </span>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {TOOL_STACK.map((cat) => (
          <div key={cat.id}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-800)" }}>{cat.label}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-500)" }}>· {cat.sub}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {cat.options.map((o) => {
                const active = stack[cat.id] === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => setStack({ ...stack, [cat.id]: o.id })}
                    style={{
                      textAlign: "left",
                      padding: 12,
                      borderRadius: 10,
                      border: active ? "1.5px solid var(--crimson-700)" : "1px solid var(--ink-200)",
                      background: active ? "var(--crimson-50)" : "#fff",
                      cursor: "pointer",
                      transition: "all .12s",
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: 7,
                      background: active ? "var(--crimson-700)" : "var(--ink-50)",
                      color: active ? "#fff" : "var(--ink-700)",
                      border: active ? "1px solid var(--crimson-700)" : "1px solid var(--ink-200)",
                      display: "grid", placeItems: "center",
                      fontSize: 11, fontWeight: 800, letterSpacing: "0.02em",
                      flexShrink: 0,
                    }}>
                      {o.name.replace(/[^A-Z0-9]/gi, "").slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <strong style={{ fontSize: 13 }}>{o.name}</strong>
                        {active && (
                          <span style={{
                            fontSize: 9, fontWeight: 800, letterSpacing: "0.08em",
                            color: "var(--crimson-700)",
                          }}>● SELECTED</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--ink-600)", marginTop: 3, lineHeight: 1.4 }}>
                        {o.note}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContextSelection({ stack, selected, setSelected }) {
  const items = [];
  const scmList = SCM_INVENTORY[stack.scm] || [];
  const ppmList = stack.ppm !== "none" ? (PPM_INVENTORY[stack.ppm] || []) : [];
  const docsList = stack.docs !== "none" ? (DOCS_INVENTORY[stack.docs] || []) : [];

  const ppmCat = TOOL_STACK.find((c) => c.id === "ppm").options.find((o) => o.id === stack.ppm);
  const scmCat = TOOL_STACK.find((c) => c.id === "scm").options.find((o) => o.id === stack.scm);
  const docsCat = TOOL_STACK.find((c) => c.id === "docs").options.find((o) => o.id === stack.docs);

  const Toggle = (id, on) => (
    <span
      role="checkbox"
      aria-checked={on}
      style={{
        width: 18, height: 18, borderRadius: 5,
        border: on ? "1.5px solid var(--crimson-700)" : "1.5px solid var(--ink-300)",
        background: on ? "var(--crimson-700)" : "#fff",
        display: "grid", placeItems: "center", flexShrink: 0,
        color: "#fff", fontSize: 11, fontWeight: 800,
      }}
    >{on ? "✓" : ""}</span>
  );

  const toggle = (key, id) => {
    const set = new Set(selected[key] || []);
    set.has(id) ? set.delete(id) : set.add(id);
    setSelected({ ...selected, [key]: Array.from(set) });
  };

  const Row = ({ left, right, on, onClick }) => (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        width: "100%", textAlign: "left",
        padding: "10px 12px",
        borderRadius: 10,
        background: on ? "var(--crimson-50)" : "#fff",
        border: on ? "1px solid var(--crimson-200)" : "1px solid var(--ink-200)",
        cursor: "pointer",
      }}
    >
      {Toggle(null, on)}
      <div style={{ flex: 1, minWidth: 0 }}>{left}</div>
      <div style={{ fontSize: 11, color: "var(--ink-500)", whiteSpace: "nowrap" }}>{right}</div>
    </button>
  );

  return (
    <section
      style={{
        marginTop: 14,
        background: "#fff",
        border: "1px solid var(--ink-200)",
        borderRadius: 14,
        padding: 18,
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--crimson-700)" }}>
          Step 2 · Pick context to feed the pipeline
        </div>
        <h2 className="serif" style={{ margin: "4px 0 2px", fontSize: 22, letterSpacing: "-0.01em" }}>
          What should the agents read from your stack?
        </h2>
        <div style={{ fontSize: 13, color: "var(--ink-600)", maxWidth: 720 }}>
          We pulled live inventory from your selected tools. Pick the repos, epics and docs to scope this run.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: stack.ppm === "none" && stack.docs === "none" ? "1fr" : (stack.ppm === "none" || stack.docs === "none" ? "1fr 1fr" : "1fr 1fr 1fr"), gap: 14 }}>
        {/* SCM */}
        <Column
          title="Repositories"
          source={scmCat?.name || "—"}
          count={`${(selected.scm || []).length}/${scmList.length} selected`}
        >
          {scmList.map((r) => (
            <Row
              key={r.name}
              on={(selected.scm || []).includes(r.name)}
              onClick={() => toggle("scm", r.name)}
              left={
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-mono)" }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 2 }}>
                    {r.lang} · {r.branches} branches · {r.visibility}
                  </div>
                </div>
              }
              right={r.last}
            />
          ))}
        </Column>

        {/* PPM */}
        {stack.ppm !== "none" && (
          <Column
            title={stack.ppm === "jira" ? "Epics" : "Projects"}
            source={ppmCat?.name || "—"}
            count={`${(selected.ppm || []).length}/${ppmList.length} selected`}
          >
            {ppmList.map((e) => (
              <Row
                key={e.key + e.name}
                on={(selected.ppm || []).includes(e.key)}
                onClick={() => toggle("ppm", e.key)}
                left={
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--crimson-700)" }}>{e.key}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{e.name}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 2 }}>
                      {e.type} · {e.stories} stories · {e.status}
                    </div>
                  </div>
                }
                right=""
              />
            ))}
          </Column>
        )}

        {/* Docs */}
        {stack.docs !== "none" && (
          <Column
            title="Documents"
            source={docsCat?.name || "—"}
            count={`${(selected.docs || []).length}/${docsList.length} selected`}
          >
            {docsList.map((d) => (
              <Row
                key={d.title}
                on={(selected.docs || []).includes(d.title)}
                onClick={() => toggle("docs", d.title)}
                left={
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>{d.title}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 2 }}>
                      {d.space} · {d.type}
                    </div>
                  </div>
                }
                right={d.updated}
              />
            ))}
          </Column>
        )}
      </div>
    </section>
  );
}

function Column({ title, source, count, children }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-800)" }}>
          {title} <span style={{ color: "var(--ink-500)", fontWeight: 500 }}>· {source}</span>
        </div>
        <div style={{ fontSize: 10.5, color: "var(--ink-500)" }}>{count}</div>
      </div>
      <div style={{ display: "grid", gap: 6 }}>{children}</div>
    </div>
  );
}

function ComposerView({ pipeline, setPipeline, openDetail, push }) {
  const gates = window.GATES;
  const agents = window.AGENTS;

  const [stack, setStack] = cUseState(DEFAULT_STACK);
  const [contextSel, setContextSel] = cUseState({ scm: [], ppm: [], docs: [] });
  const [filter, setFilter] = cUseState("all"); // gate id or 'all'
  const [draggingId, setDraggingId] = cUseState(null);
  const [hoverGate, setHoverGate] = cUseState(null);

  const palette = cUseMemo(() => {
    if (filter === "all") return agents;
    return agents.filter((a) => a.gate === filter);
  }, [filter]);

  const onDragStart = (id) => (e) => {
    setDraggingId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "copy";
  };
  const onDragEnd = () => {
    setDraggingId(null);
    setHoverGate(null);
  };
  const onDropOnGate = (gateId) => (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    if (!id) return;
    const agent = agents.find((a) => a.id === id);
    if (!agent) return;
    if (agent.gate !== gateId) {
      push(`${agent.name} doesn't belong to this gate`, "crimson");
      return;
    }
    if ((pipeline[gateId] || []).includes(id)) {
      push(`${agent.name} is already on this gate`);
      return;
    }
    setPipeline({ ...pipeline, [gateId]: [...(pipeline[gateId] || []), id] });
    push(`Added ${agent.name} → ${gates.find((g) => g.id === gateId).name}`, "emerald");
    setHoverGate(null);
  };
  const removeFromGate = (gateId, id) => {
    setPipeline({
      ...pipeline,
      [gateId]: (pipeline[gateId] || []).filter((x) => x !== id),
    });
  };

  const totalSlots = Object.values(pipeline).reduce((s, a) => s + a.length, 0);

  return (
    <div style={{ maxWidth: 1440, margin: "0 auto", padding: "24px 28px 80px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--crimson-700)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Pipeline composer
          </div>
          <h1 className="serif" style={{ margin: "6px 0 4px", fontSize: 32, letterSpacing: "-0.015em" }}>
            Drag agents into the seven gates
          </h1>
          <div style={{ color: "var(--ink-600)", fontSize: 14, maxWidth: 720 }}>
            Build the pipeline that fits your team. Each gate must have at least one agent before you can ship.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 12.5, color: "var(--ink-600)" }}>
            <strong>{totalSlots}</strong> agents in pipeline
          </span>
          <button
            onClick={() => {
              const next = {};
              gates.forEach((g) => {
                next[g.id] = agents.filter((a) => a.gate === g.id && a.subscribed).map((a) => a.id);
              });
              setPipeline(next);
              push("Pipeline reset to your subscriptions", "ink");
            }}
            style={{
              padding: "8px 14px",
              borderRadius: 9,
              border: "1px solid var(--ink-200)",
              background: "#fff",
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            Reset to subscriptions
          </button>
        </div>
      </div>

      <ToolSelection stack={stack} setStack={(s) => { setStack(s); push("Stack updated", "ink"); }} />

      <ContextSelection stack={stack} selected={contextSel} setSelected={setContextSel} />

      <div style={{ marginTop: 22, marginBottom: 6, display: "flex", alignItems: "baseline", gap: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--crimson-700)" }}>
          Step 3 · Compose pipeline
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-500)" }}>· drag agents from the catalog into the seven gates</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18, marginTop: 8 }}>
        {/* Palette */}
        <aside
          style={{
            position: "sticky",
            top: 84,
            alignSelf: "start",
            maxHeight: "calc(100vh - 110px)",
            overflow: "auto",
            background: "#fff",
            border: "1px solid var(--ink-200)",
            borderRadius: 14,
            padding: 14,
          }}
          className="hide-scroll"
        >
          <div style={{ fontSize: 11, color: "var(--ink-500)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
            Catalog
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
            <ChipMini active={filter === "all"} onClick={() => setFilter("all")} label="All" />
            {gates.map((g) => (
              <ChipMini
                key={g.id}
                active={filter === g.id}
                onClick={() => setFilter(g.id)}
                label={g.name}
                color={g.color}
              />
            ))}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {palette.map((a) => {
              const gate = gates.find((g) => g.id === a.gate);
              const inPipeline = (pipeline[a.gate] || []).includes(a.id);
              return (
                <div
                  key={a.id}
                  draggable
                  onDragStart={onDragStart(a.id)}
                  onDragEnd={onDragEnd}
                  onClick={() => openDetail(a.id)}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid var(--ink-200)",
                    background: draggingId === a.id ? gate.tint : "#fff",
                    cursor: "grab",
                    opacity: inPipeline ? 0.5 : 1,
                    transition: "background .12s",
                  }}
                  title="Drag onto a gate, or click for details"
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: gate.tint,
                      color: gate.color,
                      border: `1px solid ${gate.color}33`,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <GateIcon gate={gate} size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {a.name}
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--ink-500)", marginTop: 1 }}>
                      {a.role} · {a.perf}%
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-400)" strokeWidth="2">
                    <circle cx="9" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="18" r="1" />
                    <circle cx="15" cy="6" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="18" r="1" />
                  </svg>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Gate columns */}
        <div style={{ display: "grid", gap: 12 }}>
          {gates.map((g) => {
            const inGate = (pipeline[g.id] || []).map((id) => agents.find((a) => a.id === id)).filter(Boolean);
            const isHover = hoverGate === g.id;
            return (
              <div
                key={g.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (hoverGate !== g.id) setHoverGate(g.id);
                }}
                onDragLeave={() => setHoverGate((h) => (h === g.id ? null : h))}
                onDrop={onDropOnGate(g.id)}
                style={{
                  background: isHover ? g.tint : "#fff",
                  border: isHover ? `2px dashed ${g.color}` : "1px solid var(--ink-200)",
                  borderRadius: 14,
                  padding: 14,
                  transition: "background .12s, border-color .12s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
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
                      <div style={{ fontSize: 10.5, color: "var(--ink-500)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Gate {g.n} · {g.gate}
                      </div>
                      <div style={{ fontSize: 14.5, fontWeight: 700 }}>{g.name}</div>
                    </div>
                  </div>
                  <span
                    className="pill"
                    style={{
                      background: inGate.length === 0 ? "var(--crimson-50)" : "var(--emerald-50)",
                      color: inGate.length === 0 ? "var(--crimson-700)" : "var(--emerald-600)",
                      fontSize: 10.5,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      border: `1px solid ${inGate.length === 0 ? "var(--crimson-100)" : "#a7f3d0"}`,
                    }}
                  >
                    {inGate.length === 0 ? "● empty" : `● ${inGate.length} active`}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", minHeight: 56 }}>
                  {inGate.length === 0 ? (
                    <div
                      style={{
                        flex: 1,
                        border: "1px dashed var(--ink-300)",
                        borderRadius: 10,
                        padding: 14,
                        textAlign: "center",
                        color: "var(--ink-500)",
                        fontSize: 12.5,
                        background: "var(--surface-tinted)",
                      }}
                    >
                      Drop a {g.name} agent here
                    </div>
                  ) : (
                    inGate.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => openDetail(a.id)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "7px 8px 7px 10px",
                          borderRadius: 999,
                          background: g.tint,
                          border: `1px solid ${g.color}33`,
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-800)" }}>
                          {a.name}
                        </span>
                        {a.role === "Gate Agent" && (
                          <span style={{ fontSize: 9, color: g.color, fontWeight: 700, letterSpacing: "0.08em" }}>
                            ★
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromGate(g.id, a.id);
                          }}
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 999,
                            background: "rgba(255,255,255,.7)",
                            color: "var(--ink-600)",
                            fontSize: 11,
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ChipMini({ active, onClick, label, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: active ? "var(--ink-900)" : "var(--ink-50)",
        color: active ? "#fff" : "var(--ink-700)",
        border: "1px solid " + (active ? "var(--ink-900)" : "var(--ink-200)"),
      }}
    >
      {color && !active && (
        <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 999, background: color, marginRight: 6 }} />
      )}
      {label}
    </button>
  );
}

Object.assign(window, { ComposerView });
