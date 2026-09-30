import { expect, type Page } from "@playwright/test";

export function uniqueEmail(prefix = "e2e") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`;
}

const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

/** Reads the latest sign-in code sent to `email` from the local Mailpit inbox. */
export async function readOtp(email: string) {
  const query = encodeURIComponent(`to:"${email}"`);
  for (let i = 0; i < 40; i++) {
    const res = await fetch(`${MAILPIT_URL}/api/v1/search?query=${query}&limit=1`);
    const { messages } = (await res.json()) as { messages?: { ID: string }[] };
    if (messages?.length) {
      const msg = (await (
        await fetch(`${MAILPIT_URL}/api/v1/message/${messages[0].ID}`)
      ).json()) as {
        Text: string;
      };
      const code = msg.Text.match(/\b(\d{6})\b/)?.[1];
      if (code) return code;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No sign-in code for ${email}`);
}

/** Signs in with an emailed code (creates the account on first use). */
export async function signInWithCode(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Nastavi" }).click();
  await page.getByLabel("Kod iz emaila").fill(await readOtp(email));
}

/** Signs up a new user, completes onboarding with the starter program, lands on the calendar. */
export async function registerAndOnboard(page: Page, opts: { starter?: boolean } = {}) {
  const email = uniqueEmail();
  await signInWithCode(page, email);
  await page.waitForURL("**/onboarding");
  await page.getByRole("button", { name: "Dalje" }).click();
  await page.getByText("Snaga").click();
  await page.getByRole("button", { name: "Dalje" }).click();
  if (opts.starter === false) await page.getByText("Ne, napraviću svoj").click();
  await page.getByRole("button", { name: "Dalje" }).click();
  await page.getByText("Pročitao/la sam obaveštenje").click();
  await page.getByRole("button", { name: "Završi" }).click();
  await page.waitForURL("**/today");
  // The greeting is present in every Today state (the week card is hidden without a program).
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  return email;
}
