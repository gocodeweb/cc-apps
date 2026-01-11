#!/usr/bin/env bun
// GitHub Issues Kanban - Fetches issues and displays in kanban, shows full issue on selection

import { $ } from "bun";

interface GitHubIssue {
  number: number;
  title: string;
  labels: string[];
  state: string;
  author: string;
  body: string;
}

interface KanbanCard {
  id: string;
  title: string;
  body?: string; // Full issue content for preview
  priority?: "low" | "medium" | "high" | "urgent";
  labels?: string[];
  meta?: { issueNumber: number; repo: string };
}

interface KanbanColumn {
  id: string;
  title: string;
  color?: string;
  cards: KanbanCard[];
}

// Parse command line args
const args = process.argv.slice(2);
const repoArg = args.find(a => a.startsWith("--repo="))?.split("=")[1] || "anthropics/claude-code";
const limitArg = args.find(a => a.startsWith("--limit="))?.split("=")[1] || "30";

async function fetchIssues(repo: string, limit: number): Promise<GitHubIssue[]> {
  const result = await $`gh issue list --repo ${repo} --limit ${limit} --json number,title,labels,state,author,body`.text();
  const issues = JSON.parse(result);
  return issues.map((issue: any) => ({
    number: issue.number,
    title: issue.title,
    labels: issue.labels.map((l: any) => l.name),
    state: issue.state,
    author: issue.author?.login || "unknown",
    body: issue.body || "",
  }));
}

function getPriority(labels: string[]): "low" | "medium" | "high" | "urgent" | undefined {
  if (labels.some(l => l.includes("urgent") || l.includes("critical"))) return "urgent";
  if (labels.some(l => l.includes("high") || l.includes("important"))) return "high";
  if (labels.some(l => l.includes("low"))) return "low";
  return "medium";
}

function formatIssueBody(issue: GitHubIssue, repo: string): string {
  const labels = issue.labels.length > 0 ? issue.labels.join(", ") : "none";
  return `# #${issue.number} ${issue.title}

Author: ${issue.author} | State: ${issue.state}
Labels: ${labels}
Repo: ${repo}

---

${issue.body || "No description provided."}`;
}

function categorizeIssues(issues: GitHubIssue[], repo: string): KanbanColumn[] {
  const bugs: KanbanCard[] = [];
  const features: KanbanCard[] = [];
  const docs: KanbanCard[] = [];
  const other: KanbanCard[] = [];

  for (const issue of issues) {
    const card: KanbanCard = {
      id: String(issue.number),
      title: `#${issue.number} ${issue.title}`,
      body: formatIssueBody(issue, repo),
      priority: getPriority(issue.labels),
      labels: issue.labels.slice(0, 3),
      meta: { issueNumber: issue.number, repo },
    };

    if (issue.labels.some(l => l === "bug")) {
      bugs.push(card);
    } else if (issue.labels.some(l => l === "enhancement" || l.includes("feature"))) {
      features.push(card);
    } else if (issue.labels.some(l => l === "documentation" || l === "docs")) {
      docs.push(card);
    } else {
      other.push(card);
    }
  }

  const columns: KanbanColumn[] = [];
  if (bugs.length > 0) columns.push({ id: "bugs", title: "Bugs", color: "red", cards: bugs });
  if (features.length > 0) columns.push({ id: "features", title: "Features", color: "green", cards: features });
  if (docs.length > 0) columns.push({ id: "docs", title: "Docs", color: "blue", cards: docs });
  if (other.length > 0) columns.push({ id: "other", title: "Other", color: "gray", cards: other });

  return columns;
}

async function main() {
  const repo = repoArg;
  const limit = parseInt(limitArg, 10);

  console.log(`Fetching issues from ${repo}...`);

  const issues = await fetchIssues(repo, limit);
  const columns = categorizeIssues(issues, repo);

  const totalIssues = columns.reduce((sum, col) => sum + col.cards.length, 0);
  console.log(`Found ${totalIssues} issues. Launching kanban...`);
  console.log(`Controls: Space=preview issue, Enter=select and return to chat, q=quit\n`);

  const config = {
    title: `GitHub Issues: ${repo}`,
    columns,
  };

  // Use the canvas API to spawn with IPC
  const { spawnCanvasWithIPC } = await import("../api/canvas-api");

  try {
    // Spawn kanban - Space shows preview inside kanban, Enter selects
    const result = await spawnCanvasWithIPC("kanban", "select", config);

    if (result.success && !result.cancelled && result.data?.selection?.card?.id) {
      // Enter was pressed - output the selected issue for Claude Code
      const issueNumber = parseInt(result.data.selection.card.id, 10);
      console.log(`\nSelected issue #${issueNumber}`);

      // Output selection as JSON for IPC back to Claude Code
      const output = {
        type: "issue-selected",
        repo,
        issueNumber,
        card: result.data.selection.card,
      };
      console.log(JSON.stringify(output));
    } else {
      console.log("Done.");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

main().catch(console.error);
