// Per-gate connector catalog. Each gate gets:
// - sources (where context flows IN, e.g. Jira → Ingestion)
// - actions (where outputs flow OUT, e.g. Reviewer → Jira comment)
// - tools (utilities the agents wield)
// Tone aligned with the navy brand. Reasoning per gate is intentional —
// not just generic "connect to X".

const CONNECTORS = {
  plan: {
    label: "Plan & Groom",
    sources: [
      { id: "jira", name: "Jira", type: "Issue tracker", desc: "Pull epics, stories, sub-tasks, custom fields and ranking.", connected: true },
      { id: "confluence", name: "Confluence", type: "Wiki", desc: "Read PRDs, RFCs and product briefs from product spaces.", connected: true },
      { id: "linear", name: "Linear", type: "Issue tracker", desc: "Alternative to Jira — sync cycles, projects and labels.", connected: false },
      { id: "notion", name: "Notion", type: "Wiki", desc: "Pull PRD pages and product strategy databases.", connected: false },
      { id: "drive", name: "Google Drive", type: "Docs", desc: "Source of truth for stakeholder briefs and PDFs.", connected: true },
      { id: "figma", name: "Figma", type: "Design", desc: "Read flows + spec annotations to baseline a11y from prototypes.", connected: false },
      { id: "slack", name: "Slack threads", type: "Chat", desc: "Pull customer feedback / support threads tagged #voc.", connected: true },
      { id: "datadog-rum", name: "Datadog RUM", type: "Telemetry", desc: "Production usage data feeds risk scoring on next sprint.", connected: false },
    ],
    actions: [
      { id: "jira-write", name: "Jira", desc: "Write back risk scores, split stories, add acceptance criteria.", connected: true },
      { id: "confluence-write", name: "Confluence", desc: "Publish grooming summary as a page in the sprint space.", connected: false },
      { id: "slack-notify", name: "Slack", desc: "Post grooming digest into the team channel before standup.", connected: true },
    ],
    tools: ["Risk scoring (STRIDE-lite)", "WCAG baseline lookup", "Story splitter (S/M/L)", "Performance baseline DB"],
  },
  design: {
    label: "Design",
    sources: [
      { id: "figma", name: "Figma", type: "Design", desc: "Read frames, components and tokens for ADR cross-checks.", connected: true },
      { id: "github", name: "GitHub", type: "Repo", desc: "Read existing module structure and ADR folder.", connected: true },
      { id: "miro", name: "Miro", type: "Whiteboard", desc: "Pull architecture sketches and threat-model boards.", connected: false },
      { id: "lucid", name: "Lucidchart", type: "Diagrams", desc: "Source ER diagrams and sequence flows.", connected: false },
      { id: "ms-tmt", name: "MS Threat Modeling Tool", type: "Security", desc: "Import existing STRIDE models and DFDs.", connected: false },
      { id: "design-tokens", name: "Design Tokens (Style Dictionary)", type: "Design", desc: "Validate token usage in ADRs.", connected: true },
    ],
    actions: [
      { id: "github-pr", name: "GitHub", desc: "Open PR with new ADR + threat model diagram.", connected: true },
      { id: "jira-link", name: "Jira", desc: "Attach ADR id back to the story for traceability.", connected: true },
      { id: "confluence-pub", name: "Confluence", desc: "Publish ADR to architecture space.", connected: false },
    ],
    tools: ["STRIDE generator", "ADR template (MADR)", "Token-drift checker", "ER diagram generator"],
  },
  build: {
    label: "DevBox: Code & Build",
    sources: [
      { id: "github", name: "GitHub", type: "Repo", desc: "Clone repo, read CODEOWNERS, branch policies.", connected: true },
      { id: "gitlab", name: "GitLab", type: "Repo", desc: "Alternative to GitHub.", connected: false },
      { id: "bitbucket", name: "Bitbucket", type: "Repo", desc: "Read repos and pipelines.", connected: false },
      { id: "vscode", name: "VS Code", type: "IDE", desc: "Inline pair-programming via the AL Ops VS Code extension.", connected: true },
      { id: "jb-ides", name: "JetBrains IDEs", type: "IDE", desc: "Inline coding agent support via plugin.", connected: false },
      { id: "openapi", name: "OpenAPI / Swagger", type: "Spec", desc: "Generate stubs and typed clients from spec.", connected: true },
      { id: "registry", name: "NPM / PyPI / Maven", type: "Package", desc: "Pull dependency metadata for boilerplate.", connected: true },
    ],
    actions: [
      { id: "github-commit", name: "GitHub commit", desc: "Push generated code, tests and docs to a branch.", connected: true },
      { id: "precommit", name: "Pre-commit hook", desc: "Block push if coverage < 80% or lint warnings exist.", connected: true },
      { id: "ci", name: "CI (GitHub Actions / Jenkins)", desc: "Trigger build on push.", connected: true },
    ],
    tools: ["TDD harness", "Lint auto-fixer", "Coverage gate (≥80%)", "Stack-trace explainer"],
  },
  review: {
    label: "Code Review",
    sources: [
      { id: "github-pr", name: "GitHub PRs", type: "Repo", desc: "Read diff, comments, CODEOWNERS, status checks.", connected: true },
      { id: "gitlab-mr", name: "GitLab MRs", type: "Repo", desc: "Read merge requests and approvals.", connected: false },
      { id: "snyk", name: "Snyk", type: "Security", desc: "Pull CVE / dep advisories to weight review priority.", connected: true },
      { id: "sonarqube", name: "SonarQube", type: "Quality", desc: "Quality gate metrics fed into review priority.", connected: true },
      { id: "checkmarx", name: "Checkmarx SAST", type: "Security", desc: "Static analysis findings for triage.", connected: false },
      { id: "fossa", name: "FOSSA", type: "License", desc: "License obligations and SBOM.", connected: true },
    ],
    actions: [
      { id: "pr-comment", name: "PR comment", desc: "Suggest changes inline; never auto-merge.", connected: true },
      { id: "blocker", name: "Block merge", desc: "Hard-fail on GPL-3.0/AGPL-3.0 or critical SAST.", connected: true },
      { id: "slack", name: "Slack DM", desc: "Ping code-owner with summarised review.", connected: true },
      { id: "jira-write", name: "Jira", desc: "Open ticket for follow-up advisories.", connected: false },
    ],
    tools: ["SAST policy pack", "License policy pack", "Blast-radius scorer", "Auto-summary"],
  },
  test: {
    label: "Testing",
    sources: [
      { id: "github", name: "GitHub", type: "Repo", desc: "Read source + existing tests for coverage and flake.", connected: true },
      { id: "playwright", name: "Playwright", type: "E2E", desc: "Run end-to-end tests in headless browsers.", connected: true },
      { id: "cypress", name: "Cypress", type: "E2E", desc: "Alternative E2E runner.", connected: false },
      { id: "junit", name: "JUnit / pytest / vitest", type: "Unit", desc: "Run language-native unit suites.", connected: true },
      { id: "k6", name: "k6", type: "Perf", desc: "Run load and perf tests against the SLO baselines.", connected: false },
      { id: "axe", name: "axe-core", type: "A11y", desc: "Automated WCAG checks.", connected: true },
      { id: "browserstack", name: "BrowserStack", type: "Cloud lab", desc: "Cross-browser regression coverage.", connected: false },
    ],
    actions: [
      { id: "github-pr", name: "GitHub", desc: "Push generated tests to the PR branch.", connected: true },
      { id: "ci-fail", name: "CI", desc: "Fail the build if critical-path tests don't reach 100%.", connected: true },
      { id: "jira-bug", name: "Jira", desc: "File bugs with stack-trace + minimised counter-example.", connected: true },
    ],
    tools: ["Test generator", "Flake quarantine", "Coverage diff", "Property fuzzer"],
  },
  deploy: {
    label: "Deploy",
    sources: [
      { id: "argocd", name: "Argo CD", type: "GitOps", desc: "Read application manifests and sync status.", connected: true },
      { id: "spinnaker", name: "Spinnaker", type: "CD", desc: "Alternative deploy orchestrator.", connected: false },
      { id: "k8s", name: "Kubernetes", type: "Runtime", desc: "Apply rollouts, watch pod health.", connected: true },
      { id: "tf", name: "Terraform Cloud", type: "IaC", desc: "Plan/apply infra changes with cost preview.", connected: true },
      { id: "vault", name: "HashiCorp Vault", type: "Secrets", desc: "Rotate secrets at deploy.", connected: true },
      { id: "datadog", name: "Datadog", type: "Telemetry", desc: "Read RUM + synthetics for staging baselines.", connected: true },
      { id: "newrelic", name: "New Relic", type: "Telemetry", desc: "Alternative APM.", connected: false },
      { id: "ld", name: "LaunchDarkly", type: "Flags", desc: "Stage canary rollout via flags.", connected: false },
    ],
    actions: [
      { id: "k8s-apply", name: "Kubernetes apply", desc: "Blue-green or canary rollout.", connected: true },
      { id: "rollback", name: "Auto-rollback", desc: "Revert if error rate rises >0.5% over baseline.", connected: true },
      { id: "statuspage", name: "Statuspage", desc: "Update status component during canary.", connected: false },
    ],
    tools: ["Canary planner", "Cost-delta predictor", "Drift detector", "Secret rotator"],
  },
  operate: {
    label: "Operate & Monitor",
    sources: [
      { id: "datadog", name: "Datadog", type: "Telemetry", desc: "RUM, APM, logs and synthetics.", connected: true },
      { id: "newrelic", name: "New Relic", type: "Telemetry", desc: "APM and infra.", connected: false },
      { id: "sentry", name: "Sentry", type: "Errors", desc: "Error tracking and release health.", connected: true },
      { id: "cloudwatch", name: "AWS CloudWatch", type: "Cloud", desc: "Cloud-native metrics and alarms.", connected: true },
      { id: "pagerduty", name: "PagerDuty", type: "On-call", desc: "Page the right responder, run playbooks.", connected: true },
      { id: "opsgenie", name: "Opsgenie", type: "On-call", desc: "Alternative paging.", connected: false },
      { id: "splunk", name: "Splunk", type: "Logs", desc: "Search logs to draft RCAs.", connected: false },
    ],
    actions: [
      { id: "rollback", name: "Auto-rollback", desc: "Trigger blue-green flip on regression.", connected: true },
      { id: "rca", name: "RCA doc", desc: "Draft incident timeline + post-mortem in Confluence.", connected: true },
      { id: "statuspage", name: "Statuspage", desc: "Customer-facing updates.", connected: true },
      { id: "jira-bug", name: "Jira", desc: "File regression ticket; link to 1-hr Regression Loop.", connected: true },
    ],
    tools: ["RCA writer", "Runbook executor", "SLO burn-down", "Auto-docs sync"],
  },
};

Object.assign(window, { CONNECTORS });
