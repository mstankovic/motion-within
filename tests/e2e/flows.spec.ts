import { expect, test } from "@playwright/test";
import { registerAndOnboard } from "./helpers";

test("create a program → add a day with an exercise → schedule it", async ({ page }) => {
  await registerAndOnboard(page, { starter: false });
  await page.goto("/programs/new");
  await page.getByLabel("Naziv").fill("Moj program");
  await page.getByRole("button", { name: "Sačuvaj" }).click();
  await page.waitForURL(/\/programs\/.+\/edit/);

  await page.getByRole("button", { name: "Dodaj dan treninga" }).click();
  await page.getByLabel("Naziv dana").last().fill("Snaga");
  await page.getByRole("button", { name: "Dodaj", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Snaga" })).toBeVisible();

  await page.getByRole("button", { name: "Pojedinačna vežba" }).click();
  await page.getByRole("button", { name: "Dodaj vežbu" }).click();
  await page.getByRole("searchbox").fill("sklek");
  await page.getByRole("button", { name: /^Sklek Ponavljanja/ }).click();
  await expect(page.getByText("3 serije · 8–12 pon.")).toBeVisible();

  // Activate and schedule.
  await page.goto("/programs");
  await page.getByRole("button", { name: "Aktiviraj" }).click();
  await expect(page.getByText("Aktivni program")).toBeVisible();
  const today = new Date().toISOString().slice(0, 10);
  await page.goto(`/calendar/${today}`);
  await page.getByRole("button", { name: "Dodaj", exact: true }).click();
  await expect(page.getByText("Trening je dodat.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Započni trening" })).toBeVisible();
});

test("log body weight → chart and history", async ({ page }) => {
  await registerAndOnboard(page);
  await page.goto("/progress/body");
  const date = page.getByLabel("Datum");
  for (const [d, w] of [
    ["2026-09-01", "82,5"],
    ["2026-09-15", "81"],
  ]) {
    await date.fill(d);
    await page.getByLabel("Težina (kg)").fill(w);
    await page.getByRole("button", { name: "Sačuvaj merenje" }).click();
    await expect(page.getByText("Merenje je sačuvano.")).toBeVisible();
  }
  await expect(page.getByText("Od 82,5 kg do 81 kg kroz 2 unosa.")).toBeVisible();
  await expect(page.getByRole("img", { name: /Težina/ })).toBeVisible();
});

test("user A cannot open user B's session", async ({ browser }) => {
  const ctxB = await browser.newContext();
  const pageB = await ctxB.newPage();
  await registerAndOnboard(pageB);
  const start = pageB.getByRole("link", { name: "Započni trening" });
  if (!(await start.count())) {
    await pageB.goto("/calendar/" + new Date().toISOString().slice(0, 10));
    await pageB.getByRole("button", { name: "Dodaj", exact: true }).click();
  }
  await pageB.getByRole("link", { name: "Započni trening" }).first().click();
  await pageB.getByRole("button", { name: "Započni trening" }).click();
  await pageB.waitForURL(/\/sessions\//);
  const sessionUrl = new URL(pageB.url()).pathname;

  const ctxA = await browser.newContext();
  const pageA = await ctxA.newPage();
  await registerAndOnboard(pageA);
  await pageA.goto(sessionUrl);
  await expect(pageA.getByRole("heading", { name: "Nije pronađeno" })).toBeVisible();
  await ctxA.close();
  await ctxB.close();
});
