// AL Ops — root app shell. Routes between views, owns subscription + pipeline state.

const { useState: aUseState, useEffect: aUseEffect } = React;

function App() {
  const [t, setTweak] = useTweaks(window.__TWEAKS__);
  const [view, setView] = aUseState("pipeline");
  const [project, setProject] = aUseState(window.PROJECTS[0]);
  const [detailId, setDetailId] = aUseState(null);
  const [focusGate, setFocusGate] = aUseState("all");

  const [subs, setSubs] = aUseState(() =>
    Object.fromEntries(window.AGENTS.map((a) => [a.id, !!a.subscribed]))
  );
  aUseEffect(() => {
    window.AGENTS.forEach((a) => (a.subscribed = !!subs[a.id]));
  }, [subs]);

  const [pipeline, setPipeline] = aUseState(() => {
    const next = {};
    window.GATES.forEach((g) => {
      next[g.id] = window.AGENTS.filter((a) => a.gate === g.id && a.subscribed).map((a) => a.id);
    });
    return next;
  });

  const toast = useToast();

  const toggleSubscribe = (id) => {
    const a = window.AGENTS.find((x) => x.id === id);
    const nowSubscribed = !subs[id];
    setSubs((s) => ({ ...s, [id]: !s[id] }));
    setPipeline((p) => {
      const inP = (p[a.gate] || []).includes(id);
      if (!nowSubscribed && inP) {
        return { ...p, [a.gate]: p[a.gate].filter((x) => x !== id) };
      } else if (nowSubscribed && !inP) {
        return { ...p, [a.gate]: [...(p[a.gate] || []), id] };
      }
      return p;
    });
    toast.push(
      `${a.name} · ${nowSubscribed ? "Subscribed" : "Unsubscribed"}`,
      nowSubscribed ? "emerald" : "ink"
    );
  };

  const openDetail = (id) => setDetailId(id);
  const closeDetail = () => setDetailId(null);
  const onOpenGate = (gateId) => {
    if (gateId === "plan") {
      setView("plan-groom");
      return;
    }
    setFocusGate(gateId);
    setView("marketplace");
  };

  return (
    <div>
      <TopNav view={view} setView={setView} project={project} setProject={setProject} />

      {view === "pipeline" && (
        <PipelineView
          project={project}
          tweaks={t}
          onOpenGate={onOpenGate}
          onJumpComposer={() => setView("composer")}
          pipeline={pipeline}
          setPipeline={setPipeline}
          push={toast.push}
        />
      )}
      {view === "marketplace" && (
        <MarketplaceView
          openDetail={openDetail}
          toggleSubscribe={toggleSubscribe}
          tweaks={t}
          focusGate={focusGate}
          setFocusGate={setFocusGate}
        />
      )}
      {view === "composer" && (
        <ComposerView
          pipeline={pipeline}
          setPipeline={setPipeline}
          openDetail={openDetail}
          push={toast.push}
        />
      )}
      {view === "run" && (
        <RunView project={project} pipeline={pipeline} openDetail={openDetail} />
      )}
      {view === "plan-groom" && (
        <PlanGroomView
          project={project}
          onBack={() => setView("pipeline")}
          onOpenComposer={() => setView("composer")}
        />
      )}

      <AgentDetail
        agentId={detailId}
        onClose={closeDetail}
        toggleSubscribe={(id) => { toggleSubscribe(id); closeDetail(); }}
      />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Brand & density">
          <TweakRadio
            label="Density"
            value={t.density}
            options={[
              { value: "comfortable", label: "Cozy" },
              { value: "compact", label: "Dense" },
            ]}
            onChange={(v) => setTweak("density", v)}
          />
          <TweakRadio
            label="Card style"
            value={t.cardStyle}
            options={[
              { value: "dotted", label: "Dotted" },
              { value: "solid", label: "Solid" },
            ]}
            onChange={(v) => setTweak("cardStyle", v)}
          />
        </TweakSection>

        <TweakSection label="Marketplace">
          <TweakRadio
            label="Layout"
            value={t.marketplaceLayout}
            options={[
              { value: "grid", label: "Grid" },
              { value: "list", label: "List" },
            ]}
            onChange={(v) => setTweak("marketplaceLayout", v)}
          />
          <TweakToggle
            label="Show tags"
            value={t.showTags}
            onChange={(v) => setTweak("showTags", v)}
          />
          <TweakToggle
            label="Show performance"
            value={t.showPerf}
            onChange={(v) => setTweak("showPerf", v)}
          />
        </TweakSection>

        <TweakSection label="Pipeline">
          <TweakToggle
            label="Governance banner"
            value={t.showGovernance}
            onChange={(v) => setTweak("showGovernance", v)}
          />
          <TweakToggle
            label="Animate flow"
            value={t.animateFlow}
            onChange={(v) => setTweak("animateFlow", v)}
          />
        </TweakSection>
      </TweaksPanel>

      {toast.node}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
