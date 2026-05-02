// Catalog of quality gates + agents for the AL Ops AI-SDLC marketplace.
// 7 gates from the infographic, each with a primary "gate agent" plus
// supporting sub-agents. Total ~28 agents.

const GATES = [
  {
    id: "plan",
    n: 1,
    name: "Plan & Groom",
    gate: "Planning Gate",
    blurb:
      "Ingest requirements from Jira and PRDs. Score risk, baseline performance and accessibility before a sprint starts.",
    color: "#0ea5e9", // sky
    tint: "#f0f9ff",
    icon: "M3 7h18M3 12h12M3 17h18", // simple lines
  },
  {
    id: "design",
    n: 2,
    name: "Design",
    gate: "Design Gate",
    blurb:
      "Generate Architecture Decision Records and Threat Models. Reviewed by humans before a single line of code is written.",
    color: "#7c3aed", // violet
    tint: "#f5f3ff",
    icon: "M4 4h10v16H4zM18 4h2v16h-2z",
  },
  {
    id: "build",
    n: 3,
    name: "DevBox: Code & Build",
    gate: "Pre-Commit Hook",
    blurb:
      "Local dev environment that enforces 80% coverage and lint warnings before any code is pushed.",
    color: "#0f766e", // teal
    tint: "#f0fdfa",
    icon: "M8 7l-4 5 4 5M16 7l4 5-4 5M14 5l-4 14",
  },
  {
    id: "review",
    n: 4,
    name: "Code Review",
    gate: "PR Approval Gate",
    blurb:
      "AI triage on Pull Requests — prioritises critical checks for code-owners and security teams.",
    color: "#000080", // navy
    tint: "#eef0fa",
    icon: "M5 12l4 4 10-10",
  },
  {
    id: "test",
    n: 5,
    name: "Testing",
    gate: "Quality Gate",
    blurb:
      "Automated unit, integration and E2E test generation. 100% pass requirements for critical paths.",
    color: "#ca8a04", // amber-dark
    tint: "#fefce8",
    icon: "M9 3h6v4l4 12-3 2H6l-3-2 4-12V3z",
  },
  {
    id: "deploy",
    n: 6,
    name: "Deploy",
    gate: "Lower Env Gate",
    blurb:
      "Validation in staging with Real User Monitoring and Real-World Monitoring baselines before promotion.",
    color: "#db2777", // rose
    tint: "#fdf2f8",
    icon: "M12 2l4 8 8 1-6 6 1 8-7-4-7 4 1-8-6-6 8-1z",
  },
  {
    id: "operate",
    n: 7,
    name: "Operate & Monitor",
    gate: "Production Monitoring",
    blurb:
      "Blue-green deployments with automated rollbacks if error rates rise more than 0.5%.",
    color: "#059669", // emerald
    tint: "#ecfdf5",
    icon: "M3 17l4-4 4 4 7-9 3 3",
  },
];

const AGENTS = [
  // ── Plan ───────────────────────────────────────────────────────────
  {
    id: "req-architect",
    gate: "plan",
    name: "Requirements Architect",
    role: "Gate Agent",
    summary:
      "Ingests PRDs and Jira epics; emits structured requirements with risk scores and acceptance criteria.",
    tags: ["Jira", "PRD", "Risk"],
    perf: 92,
    runs: "12.4k",
    subscribed: true,
    pinned: true,
    inputs: ["PRD.pdf", "Jira epic", "Stakeholder notes"],
    outputs: ["Requirements doc", "Risk matrix", "Acceptance criteria"],
    sla: "≤ 4 min",
    owner: "Platform Eng",
  },
  {
    id: "story-splitter",
    gate: "plan",
    name: "Story Splitter (S/M/L)",
    role: "Sub-agent",
    summary:
      "Classifies stories by complexity and recommends Human-in-the-Loop level: Simple, Medium, or Complex.",
    tags: ["Estimation", "HITL"],
    perf: 88,
    runs: "9.1k",
    subscribed: true,
  },
  {
    id: "a11y-baseliner",
    gate: "plan",
    name: "Accessibility Baseliner",
    role: "Sub-agent",
    summary:
      "Captures the WCAG 2.1 AA baseline before development so regressions are detectable from day one.",
    tags: ["WCAG", "A11y"],
    perf: 95,
    runs: "3.2k",
    subscribed: false,
  },
  {
    id: "perf-baseliner",
    gate: "plan",
    name: "Performance Baseliner",
    role: "Sub-agent",
    summary:
      "Captures p50/p95 latency and throughput baselines for the affected service prior to changes.",
    tags: ["SLO", "Latency"],
    perf: 89,
    runs: "2.7k",
    subscribed: false,
  },

  // ── Design ─────────────────────────────────────────────────────────
  {
    id: "adr-author",
    gate: "design",
    name: "ADR Author",
    role: "Gate Agent",
    summary:
      "Drafts Architecture Decision Records from the requirement context; co-authored with the human architect.",
    tags: ["ADR", "Architecture"],
    perf: 91,
    runs: "5.6k",
    subscribed: true,
    pinned: true,
  },
  {
    id: "threat-modeler",
    gate: "design",
    name: "Threat Modeler (TMDS)",
    role: "Sub-agent",
    summary:
      "Generates STRIDE threat models for new components and links them to mitigations in your security backlog.",
    tags: ["STRIDE", "Security"],
    perf: 87,
    runs: "4.0k",
    subscribed: true,
  },
  {
    id: "figma-bridge",
    gate: "design",
    name: "Figma Bridge",
    role: "Sub-agent",
    summary:
      "Compares Figma frames against shipped components and flags drift, missing tokens, and contrast issues.",
    tags: ["Figma", "Tokens"],
    perf: 84,
    runs: "6.8k",
    subscribed: false,
  },
  {
    id: "data-model-agent",
    gate: "design",
    name: "Data Model Agent",
    role: "Sub-agent",
    summary:
      "Proposes ER diagrams, migration plans and rollback scripts; flags PII columns automatically.",
    tags: ["Schema", "PII"],
    perf: 86,
    runs: "1.9k",
    subscribed: false,
  },

  // ── Build ──────────────────────────────────────────────────────────
  {
    id: "petras-coder",
    gate: "build",
    name: "PETRAS Coding Agent",
    role: "Gate Agent",
    summary:
      "Test-Driven coding agent. Writes failing tests first, then implementation. Hits 80%+ coverage by default.",
    tags: ["TDD", "Coverage"],
    perf: 93,
    runs: "47.2k",
    subscribed: true,
    pinned: true,
  },
  {
    id: "boilerplate",
    gate: "build",
    name: "Boilerplate & Docs",
    role: "Sub-agent",
    summary:
      "Scaffolds modules, fixtures and API stubs from the ADR — including JSDoc and OpenAPI fragments.",
    tags: ["Scaffolding", "OpenAPI"],
    perf: 90,
    runs: "11.0k",
    subscribed: true,
  },
  {
    id: "lint-fixer",
    gate: "build",
    name: "Lint Auto-fixer",
    role: "Sub-agent",
    summary:
      "Runs in the pre-commit hook. Fixes lint violations and formats code to repo standards.",
    tags: ["Lint", "Pre-commit"],
    perf: 97,
    runs: "62.4k",
    subscribed: true,
  },
  {
    id: "ai-debugger",
    gate: "build",
    name: "AI Debugger",
    role: "Sub-agent",
    summary:
      "Pairs with the dev to bisect failures, propose fixes and explain stack traces in plain English.",
    tags: ["Debug", "RCA"],
    perf: 85,
    runs: "8.7k",
    subscribed: false,
  },

  // ── Review ─────────────────────────────────────────────────────────
  {
    id: "pr-triage",
    gate: "review",
    name: "PR Triage",
    role: "Gate Agent",
    summary:
      "Routes pull requests to the right code-owners. Prioritises critical checks and surfaces blast radius.",
    tags: ["CODEOWNERS", "Routing"],
    perf: 94,
    runs: "21.0k",
    subscribed: true,
    pinned: true,
  },
  {
    id: "sast",
    gate: "review",
    name: "SAST Scanner",
    role: "Sub-agent",
    summary:
      "Static Application Security Testing — flags injection, secrets, unsafe deserialisation, and CVE-tagged deps.",
    tags: ["Security", "Secrets"],
    perf: 96,
    runs: "18.3k",
    subscribed: true,
  },
  {
    id: "license-cop",
    gate: "review",
    name: "License Compliance",
    role: "Sub-agent",
    summary:
      "Blocks GPL-3.0 / AGPL-3.0 (and configurable list) at the architectural level. Generates SBOM diff.",
    tags: ["SBOM", "OSS"],
    perf: 99,
    runs: "14.8k",
    subscribed: true,
  },
  {
    id: "review-coach",
    gate: "review",
    name: "Review Coach",
    role: "Sub-agent",
    summary:
      "Suggests review comments to the code-owner — never auto-posts. Keeps the human in the loop.",
    tags: ["HITL", "Coaching"],
    perf: 82,
    runs: "5.2k",
    subscribed: false,
  },

  // ── Test ───────────────────────────────────────────────────────────
  {
    id: "test-author",
    gate: "test",
    name: "Test Author",
    role: "Gate Agent",
    summary:
      "Generates unit, integration and end-to-end tests. Critical-path coverage is enforced at 100%.",
    tags: ["Unit", "E2E", "Integration"],
    perf: 91,
    runs: "16.4k",
    subscribed: true,
    pinned: true,
  },
  {
    id: "regression-curator",
    gate: "test",
    name: "Regression Curator",
    role: "Sub-agent",
    summary:
      "Maintains the regression suite. Detects flaky tests and quarantines them with an ownership ticket.",
    tags: ["Regression", "Flake"],
    perf: 88,
    runs: "7.6k",
    subscribed: true,
  },
  {
    id: "fuzzer",
    gate: "test",
    name: "Property Fuzzer",
    role: "Sub-agent",
    summary:
      "Generates property-based test cases and minimised counter-examples for parsers, validators and serialisers.",
    tags: ["Fuzz", "Property"],
    perf: 79,
    runs: "1.3k",
    subscribed: false,
  },
  {
    id: "a11y-tester",
    gate: "test",
    name: "Accessibility Tester",
    role: "Sub-agent",
    summary:
      "Drives keyboard-only and screen-reader passes; fails the gate on WCAG 2.1 AA contrast or focus issues.",
    tags: ["WCAG", "Keyboard"],
    perf: 90,
    runs: "3.9k",
    subscribed: true,
  },

  // ── Deploy ─────────────────────────────────────────────────────────
  {
    id: "deploy-orchestrator",
    gate: "deploy",
    name: "Deploy Orchestrator",
    role: "Gate Agent",
    summary:
      "Manages staging promotions, RUM checks and Real-World Monitoring baselines before production unlock.",
    tags: ["Staging", "RUM"],
    perf: 92,
    runs: "9.8k",
    subscribed: true,
    pinned: true,
  },
  {
    id: "canary-pilot",
    gate: "deploy",
    name: "Canary Pilot",
    role: "Sub-agent",
    summary:
      "Routes 1%/5%/25% canary traffic and auto-aborts on golden-signal regressions.",
    tags: ["Canary", "SLO"],
    perf: 93,
    runs: "4.4k",
    subscribed: true,
  },
  {
    id: "iac-validator",
    gate: "deploy",
    name: "IaC Validator",
    role: "Sub-agent",
    summary:
      "Plans and lints Terraform/Kubernetes manifests; predicts drift and cost delta before apply.",
    tags: ["Terraform", "K8s", "Cost"],
    perf: 89,
    runs: "6.1k",
    subscribed: false,
  },
  {
    id: "secrets-rotator",
    gate: "deploy",
    name: "Secrets Rotator",
    role: "Sub-agent",
    summary:
      "Rotates API keys and DB credentials at deploy time — coordinated with the Vault and runtime restarts.",
    tags: ["Secrets", "Vault"],
    perf: 96,
    runs: "2.8k",
    subscribed: false,
  },

  // ── Operate ────────────────────────────────────────────────────────
  {
    id: "ops-sentinel",
    gate: "operate",
    name: "Ops Sentinel",
    role: "Gate Agent",
    summary:
      "Watches blue-green deployments. Auto-rolls back when error rate exceeds 0.5% over baseline.",
    tags: ["Rollback", "Blue-Green"],
    perf: 95,
    runs: "13.6k",
    subscribed: true,
    pinned: true,
  },
  {
    id: "incident-writer",
    gate: "operate",
    name: "Incident Writer",
    role: "Sub-agent",
    summary:
      "Drafts incident timelines, RCAs and customer-facing post-mortems within 60 minutes of resolve.",
    tags: ["RCA", "Postmortem"],
    perf: 87,
    runs: "1.4k",
    subscribed: false,
  },
  {
    id: "instant-response",
    gate: "operate",
    name: "Instant Response AI",
    role: "Sub-agent",
    summary:
      "Pages the right on-call, summarises dashboards and runs first-line remediation playbooks.",
    tags: ["On-call", "Playbooks"],
    perf: 90,
    runs: "5.0k",
    subscribed: true,
  },
  {
    id: "auto-docs",
    gate: "operate",
    name: "Auto-Docs",
    role: "Sub-agent",
    summary:
      "Keeps runbooks, status pages and architecture docs in sync with what's actually deployed.",
    tags: ["Docs", "Status"],
    perf: 86,
    runs: "8.2k",
    subscribed: true,
  },
];

const COMPLIANCE = [
  { id: "owasp", label: "OWASP Top 10", tone: "crimson" },
  { id: "iso", label: "ISO 27001", tone: "ink" },
  { id: "soc2", label: "SOC 2 Type II", tone: "ink" },
  { id: "wcag", label: "WCAG 2.1 AA", tone: "ink" },
  { id: "fda", label: "FDA 21 CFR Part 11", tone: "ink" },
  { id: "dora", label: "DORA", tone: "ink" },
  { id: "gxp", label: "GxP", tone: "ink" },
];

const METRICS = [
  {
    id: "velocity",
    label: "Coding Speed",
    value: "+43%",
    sub: "AI-augmented + TDD",
    trend: "up",
    spark: [3, 4, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15],
  },
  {
    id: "bugs",
    label: "Bug Detection",
    value: "+40%",
    sub: "Pre-prod, via SAST",
    trend: "up",
    spark: [4, 5, 5, 6, 7, 7, 9, 10, 11, 12, 13, 14],
  },
  {
    id: "admin",
    label: "Reporting Time",
    value: "−80%",
    sub: "Auto-Docs AI",
    trend: "down",
    spark: [14, 13, 11, 10, 9, 7, 7, 6, 5, 5, 4, 3],
  },
  {
    id: "mttr",
    label: "Mean Time to Recovery",
    value: "<4h",
    sub: "Auto-rollback + RCA",
    trend: "down",
    spark: [12, 11, 10, 9, 9, 7, 6, 6, 5, 5, 4, 4],
  },
];

const PROJECTS = [
  {
    id: "checkout-2026",
    name: "Checkout Service v3",
    team: "Payments",
    sha: "f1c8a92",
    status: "running",
  },
  {
    id: "kyc-onboarding",
    name: "KYC Onboarding Flow",
    team: "Risk",
    sha: "a3b271d",
    status: "queued",
  },
  {
    id: "ml-feedstore",
    name: "ML Feature Store",
    team: "Data Platform",
    sha: "9e2740c",
    status: "passed",
  },
];

Object.assign(window, { GATES, AGENTS, COMPLIANCE, METRICS, PROJECTS });
