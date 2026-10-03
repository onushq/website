// The manifesto's example pull request: "Text customers when their order ships."
// Every changed file is tied to the change in meaning it produces, so the hero can
// show which lines sit behind each row of the report. Totals match the manifesto.

export type Meaning = "vendor" | "contract" | "event" | "internal";

export interface ChangedFile {
  path: string;
  add: number;
  del: number;
  meaning: Meaning;
}

export const prTitle = "Text customers when their order ships";

export const files: ChangedFile[] = [
  { path: "services/user-preferences/src/types.ts", add: 2, del: 0, meaning: "contract" },
  { path: "services/notifications/package.json", add: 1, del: 0, meaning: "vendor" },
  { path: "services/notifications/src/sms/client.ts", add: 38, del: 0, meaning: "vendor" },
  { path: "services/notifications/src/config.ts", add: 14, del: 0, meaning: "vendor" },
  { path: "services/notifications/src/index.ts", add: 3, del: 1, meaning: "event" },
  { path: "services/notifications/src/handlers/order-shipped.ts", add: 31, del: 0, meaning: "event" },
  { path: "services/notifications/src/templates/shipped.ts", add: 22, del: 0, meaning: "internal" },
  { path: "services/notifications/src/i18n/en.json", add: 8, del: 0, meaning: "internal" },
  { path: "services/notifications/src/i18n/es.json", add: 8, del: 0, meaning: "internal" },
  { path: "services/notifications/src/i18n/de.json", add: 8, del: 0, meaning: "internal" },
  { path: "services/notifications/src/i18n/fr.json", add: 8, del: 0, meaning: "internal" },
  { path: "services/notifications/src/sms/retry.ts", add: 140, del: 6, meaning: "internal" },
  { path: "services/notifications/src/sms/rate-limit.ts", add: 96, del: 0, meaning: "internal" },
  { path: "services/notifications/src/sms/phone.ts", add: 88, del: 0, meaning: "internal" },
  { path: "services/notifications/src/metrics.ts", add: 47, del: 9, meaning: "internal" },
  { path: "services/notifications/src/logger.ts", add: 12, del: 8, meaning: "internal" },
  { path: "services/notifications/test/order-shipped.test.ts", add: 190, del: 0, meaning: "internal" },
  { path: "services/notifications/test/sms-client.test.ts", add: 230, del: 0, meaning: "internal" },
  { path: "services/notifications/test/retry.test.ts", add: 121, del: 0, meaning: "internal" },
  { path: "services/notifications/test/rate-limit.test.ts", add: 109, del: 0, meaning: "internal" },
  { path: "services/notifications/test/phone.test.ts", add: 117, del: 0, meaning: "internal" },
  { path: "services/notifications/test/fixtures.ts", add: 62, del: 10, meaning: "internal" },
  { path: "services/notifications/docs/sms.md", add: 57, del: 4, meaning: "internal" },
];

export const totals = files.reduce(
  (t, f) => ({ add: t.add + f.add, del: t.del + f.del, files: t.files + 1 }),
  { add: 0, del: 0, files: 0 },
);

export interface Change {
  id: Meaning;
  change: string;
  kind: string;
  why: string;
  person?: boolean;
}

export const changes: Change[] = [
  {
    id: "vendor",
    change: "notifications now calls an external SMS provider",
    kind: "New external dependency",
    why: "Customer phone numbers leave the system",
    person: true,
  },
  {
    id: "contract",
    change: "UserPreferences gains an optional phoneVerified field",
    kind: "Contract change, additive",
    why: "Shared contract; existing callers unaffected",
  },
  {
    id: "event",
    change: "notifications subscribes to the OrderShipped event",
    kind: "New event consumer",
    why: "Additive; orders itself is unchanged",
  },
  {
    id: "internal",
    change: "About 1,400 lines of new code and tests inside notifications",
    kind: "Internal",
    why: "No other component touched",
  },
];

export const linesFor = (id: Meaning) =>
  files.filter((f) => f.meaning === id).reduce((n, f) => n + f.add + f.del, 0);
