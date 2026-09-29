import { expect, type Page } from "@playwright/test";

export function uniqueEmail(prefix = "e2e") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`;
}

/** Registers a new user, completes onboarding with the starter program, lands on the calendar. */
export async function registerAndOnboard(page: Page, opts: { starter?: boolean } = {}) {
  const email = uniqueEmail();
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Lozinka").fill("password123");
  await page.getByRole("button", { name: "Napravi nalog" }).click();
  await page.waitForURL("**/onboarding");
  await page.getByRole("button", { name: "Dalje" }).click();
  await page.getByText("Snaga").click();
  await page.getByRole("button", { name: "Dalje" }).click();
  if (opts.starter === false) await page.getByText("Ne, napraviću svoj").click();
  await page.getByRole("button", { name: "Dalje" }).click();
  await page.getByText("Pročitao/la sam obaveštenje").click();
  await page.getByRole("button", { name: "Završi" }).click();
  await page.waitForURL("**/calendar");
  await expect(page.getByRole("heading", { name: "Ova nedelja" })).toBeVisible();
  return email;
}
