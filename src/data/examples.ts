// Real reports: `onus report --base <merge>^1 --head <merge>` (Onus 0.10.0) on merged pull
// requests of Twenty (twentyhq/twenty), the open-source CRM used in Onus's evaluations.
// Row text is Onus's output; long lists (files, tests, what changed) are shortened.
// The notes come from the report-accuracy evaluation (docs/evaluation/2026-10-08-m7-replay.md).

export interface ExampleRow {
  flag: boolean; // ● needs a person
  kind: string;
  title: string;
  why: string;
}

export interface Example {
  pr: number;
  title: string;
  short: string;
  files: number;
  add: number;
  del: number;
  rows: ExampleRow[];
  more: number; // quiet rows not shown
  note: string;
}

export const examplesRepo = "https://github.com/twentyhq/twenty";

export const examples: Example[] = [
  {
    pr: 27430,
    title: "Inbox: chat subscriptions and server-side mentions",
    short: "Chat subscriptions",
    files: 68,
    add: 1711,
    del: 337,
    rows: [
      {
        flag: true,
        kind: "Contract change, unverified",
        title: "`STANDARD_OBJECT_FIELDS` changes its `agentChatThreadParticipant` value",
        why: "Shared contract used in 14 files across 4 components; Onus cannot prove the change is compatible, so it is treated as breaking",
      },
      {
        flag: true,
        kind: "Migration",
        title: "New migration `2-46-workspace-command-…-add-agent-chat-thread-subscriptions.command.ts`",
        why: "It changes stored data: deploy it before code that relies on the new shape, and check it can be rolled back",
      },
      {
        flag: true,
        kind: "Public API",
        title: "New GraphQL mutations `subscribeToAgentChatThread` and `unsubscribeFromAgentChatThread`",
        why: "New public API: check who may call each operation and what it reads or writes",
      },
      {
        flag: false,
        kind: "Generated code",
        title: "Generated code changed in `twenty-client-sdk` (3 files, 56 changed lines)",
        why: "Written by a tool; review the schema or generator change it mirrors",
      },
      {
        flag: false,
        kind: "Internal",
        title: "878 changed lines of code and tests inside `twenty-server`",
        why: "Stays inside `twenty-server`; no other component depends on it; adds 12 test cases",
      },
    ],
    more: 8,
    note: "Before the accuracy work, the migration and the two new mutations were buried in a changed-lines row. Now each one asks for a person.",
  },
  {
    pr: 27420,
    title: "Resolve how an object is shared in one place",
    short: "Sharing permissions",
    files: 24,
    add: 291,
    del: 417,
    rows: [
      {
        flag: true,
        kind: "Auth code",
        title: "Authentication or authorization code changed in `twenty-server`: `record-access-policy.service.ts`, `permissions.utils.ts` and 3 more",
        why: "71 changed lines in files whose names say they decide who may do what; even a refactor here needs a person to check that access stays the same",
      },
      {
        flag: false,
        kind: "Tests removed with code",
        title: "Tests in `twenty-server` removed with the code they tested",
        why: "Each used code this change deletes; if the logic moved elsewhere, check that its tests moved too",
      },
      {
        flag: false,
        kind: "Internal",
        title: "637 changed lines of code and tests inside `twenty-server`",
        why: "Stays inside `twenty-server`; no other component depends on it; adds 5 test cases",
      },
    ],
    more: 0,
    note: "A permission refactor across the ORM used to be one row: “697 changed lines”. Now it goes to a person, and the deleted tests are explained instead of flagged as weakened.",
  },
  {
    pr: 27434,
    title: "Remove unused NestJS module imports in twenty-server",
    short: "48,000-line cleanup",
    files: 183,
    add: 23718,
    del: 24519,
    rows: [
      {
        flag: true,
        kind: "Auth code",
        title: "Authentication or authorization code changed in `twenty-server`: `application-oauth.module.ts`, `token.module.ts` and 12 more",
        why: "45 changed lines in files whose names say they decide who may do what; even a refactor here needs a person to check that access stays the same",
      },
      {
        flag: false,
        kind: "Generated code",
        title: "Generated code changed in `twenty-client-sdk` (3 files, 47,359 changed lines)",
        why: "Written by a tool; review the schema or generator change it mirrors",
      },
      {
        flag: false,
        kind: "Internal",
        title: "823 changed lines of code inside `twenty-server`",
        why: "Stays inside `twenty-server`; no other component depends on it",
      },
    ],
    more: 1,
    note: "47,359 regenerated lines fold into one quiet row; they used to raise four false “contract changed” alarms. Reviewers called the auth row borderline: these files only wire modules together.",
  },
  {
    pr: 27482,
    title: "Allow grouping charts by Created by",
    short: "Nothing to flag",
    files: 14,
    add: 562,
    del: 56,
    rows: [
      {
        flag: false,
        kind: "Moved",
        title: "`isCompositePropertySupportedInGroupBy` moved from `twenty-server` to `twenty-shared`",
        why: "Identical definitions; every reference in this repository now points at `twenty-shared`",
      },
      {
        flag: false,
        kind: "Internal",
        title: "74 changed lines of code and tests inside `twenty-shared`",
        why: "Stays inside `twenty-shared`, which `twenty-cli` and 13 more depend on; adds 4 test cases",
      },
      {
        flag: false,
        kind: "Internal",
        title: "506 changed lines of code and tests inside `twenty-server`",
        why: "Stays inside `twenty-server`; no other component depends on it; adds 2 test cases",
      },
    ],
    more: 2,
    note: "No row needs a person. The tests that disappeared moved word for word with the function they test; Onus used to call them weakened.",
  },
];
