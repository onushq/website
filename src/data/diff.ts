// An illustrative slice of the manifesto's example pull request:
// "Text customers when their order ships." Kept consistent with the
// four-row semantic report shown beside it.

export const prTitle = "Text customers when their order ships";
export const totals = { added: 1412, removed: 38, files: 23 };

const raw = String.raw`
diff --git services/user-preferences/src/types.ts
@@ -9,10 +9,12 @@ export interface UserPreferences {
   userId: string;
   email: string;
   phone?: string;
+  /** True once the customer has confirmed the number with an SMS code. */
+  phoneVerified?: boolean;
   locale: string;
   notifications: {
     email: boolean;
     sms: boolean;
   };
 }
diff --git services/notifications/package.json
@@ -8,6 +8,7 @@
   "dependencies": {
     "@shop/events": "workspace:*",
     "@shop/user-preferences": "workspace:*",
+    "@acme/sms": "^4.2.0",
     "pino": "^9.4.0"
   }
diff --git services/notifications/src/index.ts
@@ -1,12 +1,15 @@
 import { bus } from "@shop/events";
 import { onOrderPlaced } from "./handlers/order-placed";
+import { onOrderShipped } from "./handlers/order-shipped";
 import { logger } from "./logger";

 export function start(): void {
   bus.subscribe("OrderPlaced", onOrderPlaced);
-  logger.info("notifications started");
+  bus.subscribe("OrderShipped", onOrderShipped);
+  logger.info({ handlers: 2 }, "notifications started");
 }
diff --git services/notifications/src/sms/client.ts
@@ -0,0 +1,38 @@
+import { SmsClient } from "@acme/sms";
+import { config } from "../config";
+import { logger } from "../logger";
+
+const client = new SmsClient({
+  apiKey: config.sms.apiKey,
+  baseUrl: config.sms.baseUrl,
+  timeoutMs: 5_000,
+});
+
+export interface SendSmsInput {
+  to: string; // E.164
+  body: string;
+  idempotencyKey: string;
+}
+
+export async function sendSms(input: SendSmsInput): Promise<void> {
+  const started = Date.now();
+  try {
+    await client.messages.create({
+      to: input.to,
+      body: input.body,
+      idempotencyKey: input.idempotencyKey,
+    });
+    logger.info(
+      { to: redact(input.to), ms: Date.now() - started },
+      "sms sent",
+    );
+  } catch (err) {
+    logger.error({ err, to: redact(input.to) }, "sms failed");
+    throw err;
+  }
+}
+
+function redact(phone: string): string {
+  return phone.slice(0, 3) + "***" + phone.slice(-2);
+}
diff --git services/notifications/src/handlers/order-shipped.ts
@@ -0,0 +1,31 @@
+import type { OrderShipped } from "@shop/events";
+import { getPreferences } from "@shop/user-preferences";
+import { sendSms } from "../sms/client";
+import { renderShippedText } from "../templates/shipped";
+import { logger } from "../logger";
+
+export async function onOrderShipped(event: OrderShipped): Promise<void> {
+  const prefs = await getPreferences(event.customerId);
+
+  if (!prefs.notifications.sms) {
+    logger.debug({ orderId: event.orderId }, "sms opted out");
+    return;
+  }
+  if (!prefs.phone || !prefs.phoneVerified) {
+    logger.debug({ orderId: event.orderId }, "no verified phone");
+    return;
+  }
+
+  await sendSms({
+    to: prefs.phone,
+    body: renderShippedText({
+      orderNumber: event.orderNumber,
+      carrier: event.carrier,
+      trackingUrl: event.trackingUrl,
+      locale: prefs.locale,
+    }),
+    idempotencyKey: "order-shipped:" + event.orderId,
+  });
+}
diff --git services/notifications/src/templates/shipped.ts
@@ -0,0 +1,22 @@
+import { t } from "../i18n";
+
+export interface ShippedTextInput {
+  orderNumber: string;
+  carrier: string;
+  trackingUrl: string;
+  locale: string;
+}
+
+const MAX_SMS_LENGTH = 160;
+
+export function renderShippedText(input: ShippedTextInput): string {
+  const text = t(input.locale, "sms.shipped", {
+    order: input.orderNumber,
+    carrier: input.carrier,
+    link: input.trackingUrl,
+  });
+  return text.length <= MAX_SMS_LENGTH
+    ? text
+    : text.slice(0, MAX_SMS_LENGTH - 1) + "…";
+}
diff --git services/notifications/test/order-shipped.test.ts
@@ -0,0 +1,64 @@
+import { beforeEach, describe, expect, it, vi } from "vitest";
+import * as prefs from "@shop/user-preferences";
+import { onOrderShipped } from "../src/handlers/order-shipped";
+import * as sms from "../src/sms/client";
+import { fakeCustomer, fakeShipment } from "./fixtures";
+
+vi.mock("../src/sms/client");
+vi.mock("@shop/user-preferences");
+
+describe("onOrderShipped", () => {
+  beforeEach(() => vi.resetAllMocks());
+
+  it("texts a verified number that has not opted out", async () => {
+    vi.mocked(prefs.getPreferences).mockResolvedValue(
+      fakeCustomer({ phone: "+14155550134", phoneVerified: true }),
+    );
+    await onOrderShipped(fakeShipment({ orderId: "o_123" }));
+    expect(sms.sendSms).toHaveBeenCalledWith(
+      expect.objectContaining({
+        to: "+14155550134",
+        idempotencyKey: "order-shipped:o_123",
+      }),
+    );
+  });
+
+  it("respects an SMS opt-out", async () => {
+    vi.mocked(prefs.getPreferences).mockResolvedValue(
+      fakeCustomer({
+        phoneVerified: true,
+        notifications: { email: true, sms: false },
+      }),
+    );
+    await onOrderShipped(fakeShipment());
+    expect(sms.sendSms).not.toHaveBeenCalled();
+  });
+
+  it("never texts an unverified number", async () => {
+    vi.mocked(prefs.getPreferences).mockResolvedValue(
+      fakeCustomer({ phone: "+14155550134", phoneVerified: false }),
+    );
+    await onOrderShipped(fakeShipment());
+    expect(sms.sendSms).not.toHaveBeenCalled();
+  });
+
+  it("sends one message per order, even on redelivery", async () => {
+    vi.mocked(prefs.getPreferences).mockResolvedValue(
+      fakeCustomer({ phone: "+14155550134", phoneVerified: true }),
+    );
+    const event = fakeShipment({ orderId: "o_456" });
+    await onOrderShipped(event);
+    await onOrderShipped(event);
+    const keys = vi
+      .mocked(sms.sendSms)
+      .mock.calls.map(([input]) => input.idempotencyKey);
+    expect(new Set(keys).size).toBe(1);
+  });
+});
`;

export type DiffLine =
  | { kind: "file"; text: string }
  | { kind: "hunk"; text: string }
  | { kind: "add" | "del" | "ctx"; text: string };

export const diffLines: DiffLine[] = raw
  .trim()
  .split("\n")
  .map((line): DiffLine => {
    if (line.startsWith("diff --git ")) return { kind: "file", text: line.slice(11) };
    if (line.startsWith("@@")) return { kind: "hunk", text: line };
    if (line.startsWith("+")) return { kind: "add", text: line.slice(1) };
    if (line.startsWith("-")) return { kind: "del", text: line.slice(1) };
    return { kind: "ctx", text: line.slice(1) };
  });

const shownFiles = diffLines.filter((l) => l.kind === "file").length;
const shownChanged = diffLines.filter((l) => l.kind === "add" || l.kind === "del").length;

export const remaining = {
  files: totals.files - shownFiles,
  lines: totals.added + totals.removed - shownChanged,
};
