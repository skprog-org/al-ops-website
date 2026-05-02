// Marketplace browse view — filterable catalog of all 28 agents.

const { useState: mUseState, useMemo: mUseMemo } = React;

function MarketplaceView({ openDetail, toggleSubscribe, tweaks, focusGate, setFocusGate }) {
  const gates = window.GATES;
  const agents = window.AGENTS;

  const [query, setQuery] = mUseState("");
  const [sort, setSort] = mUseState("popular"); // popular|new|alpha

  const filtered = mUseMemo(() => {
    let list = agents.slice();
    if (focusGate && focusGate !== "all") list = list.filter((a) => a.gate === focusGate);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          (a.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    if (sort === "popular") list.sort((a, b) => b.perf - a.perf);
    if (sort === "alpha") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [query, sort, focusGate]);

  const pinned = filtered.filter((a) => a.pinned);
  const others = filtered.filter((a) => !a.pinned);

  return (
    <div style={{ maxWidth: 1440, margin: "0 auto" }}>
      {/* Crimson hero */}
      <div
        style={{
          background:
            "linear-gradient(135deg, var(--crimson-700), var(--crimson-800) 60%, #5e0c18)",
          color: "#fff",
          padding: "32px 36px 30px",
          margin: "0",
        }}
      >
        <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.78, fontWeight: 600 }}>
              ABCL AI Marketplace · Enterprise Agent Hub
            </div>
            <h1 className="serif" style={{ margin: "10px 0 6px", fontSize: 40, letterSpacing: "-0.02em" }}>
              Lease quality-gate agents for any product
            </h1>
            <div style={{ opacity: 0.82, fontSize: 14, maxWidth: 700 }}>
              Every agent is sandboxed, observable and chargeable to your team's cost-centre. Subscribe one at a time, or build a full pipeline.
            </div>
          </div>
          <div
            style={{
              width: 360,
              padding: "10px 14px",
              borderRadius: 999,
              background: "rgba(255,255,255,.12)",
              border: "1px solid rgba(255,255,255,.22)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3-3" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search agents, tags, or capabilities…"
              style={{
                flex: 1,
                background: "transparent",
                border: 0,
                outline: 0,
                color: "#fff",
                fontSize: 13.5,
              }}
            />
            {query && (
              <button onClick={() => setQuery("")} style={{ color: "rgba(255,255,255,.7)", fontSize: 12 }}>
                clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 28px 80px" }}>
        {/* Filters */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 22,
          }}
        >
          <div className="hide-scroll" style={{ display: "flex", gap: 6, overflowX: "auto" }}>
            <FilterChip
              active={!focusGate || focusGate === "all"}
              onClick={() => setFocusGate("all")}
              label={`All · ${agents.length}`}
            />
            {gates.map((g) => (
              <FilterChip
                key={g.id}
                active={focusGate === g.id}
                onClick={() => setFocusGate(g.id)}
                label={g.name}
                color={g.color}
                tint={g.tint}
              />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "var(--ink-500)" }}>Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid var(--ink-200)",
                background: "#fff",
                fontSize: 12.5,
              }}
            >
              <option value="popular">Most run</option>
              <option value="alpha">A → Z</option>
              <option value="new">Newest</option>
            </select>
          </div>
        </div>

        {pinned.length > 0 && (
          <Section
            title="Featured Gate Agents"
            count={pinned.length}
            agents={pinned}
            openDetail={openDetail}
            toggleSubscribe={toggleSubscribe}
            tweaks={tweaks}
          />
        )}
        <div style={{ height: 22 }} />
        <Section
          title="All Specialised Agents"
          count={others.length}
          agents={others}
          openDetail={openDetail}
          toggleSubscribe={toggleSubscribe}
          tweaks={tweaks}
        />

        {filtered.length === 0 && (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              color: "var(--ink-500)",
              border: "1px dashed var(--ink-300)",
              borderRadius: 14,
              background: "#fff",
            }}
          >
            No agents match that filter.
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, label, color, tint }) {
  return (
    <button
      onClick={onClick}
      style={{
        whiteSpace: "nowrap",
        padding: "7px 14px",
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 600,
        background: active
          ? "linear-gradient(180deg, var(--crimson-600), var(--crimson-700))"
          : "#fff",
        color: active ? "#fff" : "var(--ink-700)",
        border: active ? "1px solid var(--crimson-700)" : "1px solid var(--ink-200)",
        boxShadow: active ? "0 1px 2px rgba(196,30,46,.25)" : "none",
      }}
    >
      {color && !active && (
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: 999,
            background: color,
            marginRight: 7,
            verticalAlign: "middle",
          }}
        />
      )}
      {label}
    </button>
  );
}

function Section({ title, count, agents, openDetail, toggleSubscribe, tweaks }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{title}</h3>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--crimson-700)",
            background: "var(--crimson-50)",
            border: "1px solid var(--crimson-100)",
            padding: "3px 8px",
            borderRadius: 999,
          }}
        >
          {count} agents
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            tweaks.marketplaceLayout === "list"
              ? "1fr"
              : "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 14,
        }}
      >
        {agents.map((a) => (
          <AgentCard
            key={a.id}
            a={a}
            onOpen={() => openDetail(a.id)}
            onToggle={(e) => {
              e.stopPropagation();
              toggleSubscribe(a.id);
            }}
            tweaks={tweaks}
          />
        ))}
      </div>
    </div>
  );
}

function AgentCard({ a, onOpen, onToggle, tweaks }) {
  const gate = window.GATES.find((g) => g.id === a.gate);
  const dotted = tweaks.cardStyle === "dotted";
  const isList = tweaks.marketplaceLayout === "list";
  return (
    <div
      onClick={onOpen}
      style={{
        cursor: "pointer",
        background: "#fff",
        border: dotted ? "1px dashed var(--ink-300)" : "1px solid var(--ink-200)",
        borderRadius: 14,
        padding: tweaks.density === "compact" ? 14 : 18,
        display: isList ? "grid" : "block",
        gridTemplateColumns: isList ? "auto 1fr auto auto" : undefined,
        gap: isList ? 16 : 0,
        alignItems: isList ? "center" : "stretch",
        transition: "border-color .12s, transform .12s, box-shadow .12s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = gate.color;
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(12,13,16,.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = dotted ? "var(--ink-300)" : "var(--ink-200)";
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: gate.tint,
            border: `1px solid ${gate.color}33`,
            color: gate.color,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <GateIcon gate={gate} size={20} />
        </div>
        {!isList && <div style={{ flex: 1 }} />}
        {a.subscribed ? (
          <span
            className="pill"
            style={{
              background: "var(--emerald-50)",
              color: "var(--emerald-600)",
              border: "1px solid #a7f3d0",
              fontSize: 10.5,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            ● Subscribed
          </span>
        ) : (
          <span
            className="pill"
            style={{
              background: "var(--ink-50)",
              color: "var(--ink-600)",
              border: "1px solid var(--ink-200)",
              fontSize: 10.5,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Available
          </span>
        )}
      </div>

      <div style={{ marginTop: isList ? 0 : 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{a.name}</h4>
          {a.role === "Gate Agent" && (
            <span
              style={{
                fontSize: 9.5,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: gate.color,
                fontWeight: 700,
              }}
            >
              ★ Gate
            </span>
          )}
        </div>
        <div
          style={{
            color: "var(--ink-600)",
            fontSize: 12.5,
            lineHeight: 1.5,
            marginTop: 6,
            display: "-webkit-box",
            WebkitLineClamp: tweaks.density === "compact" ? 2 : 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {a.summary}
        </div>
      </div>

      {!isList && tweaks.showTags && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {a.tags.slice(0, 4).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      )}

      {tweaks.showPerf && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: isList ? 0 : 14,
            paddingTop: isList ? 0 : 12,
            borderTop: isList ? "none" : "1px dashed var(--ink-200)",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-500)" strokeWidth="1.8">
              <path d="M3 17l4-4 4 4 7-9 3 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 12, color: "var(--ink-600)" }}>Performance</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <strong style={{ fontSize: 14 }}>{a.perf}%</strong>
            <button
              onClick={onToggle}
              style={{
                padding: "5px 10px",
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 600,
                background: a.subscribed ? "var(--ink-50)" : "var(--crimson-600)",
                color: a.subscribed ? "var(--ink-700)" : "#fff",
                border: a.subscribed ? "1px solid var(--ink-200)" : "1px solid var(--crimson-700)",
              }}
            >
              {a.subscribed ? "Unsubscribe" : "Subscribe"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { MarketplaceView });
