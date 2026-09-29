import { expect, test } from "@playwright/test";
import { registerAndOnboard } from "./helpers";

test("register → onboarding → calendar shows the starter plan", async ({ page }) => {
  await registerAndOnboard(page);
  await expect(page.getByText(/od 3 treninga završeno/)).toBeVisible();
  await expect(
    page
      .getByRole("link", { name: "Započni trening" })
      .or(page.getByText("Danas nema planiranog treninga")),
  ).toBeVisible();
});

test("start workout → log three sets (with a network drop) → finish → history", async ({
  page,
  context,
}) => {
  await registerAndOnboard(page);
  await page.goto("/calendar/" + new Date().toISOString().slice(0, 10));
  // Make sure there is a workout today regardless of the weekday.
  const start = page.getByRole("link", { name: "Započni trening" });
  if (!(await start.count())) {
    await page.getByRole("button", { name: "Dodaj", exact: true }).click();
    await expect(page.getByText("Trening je dodat.")).toBeVisible();
  }
  await page.getByRole("link", { name: "Započni trening" }).first().click();
  await page.getByRole("button", { name: "Započni trening" }).click();
  await page.waitForURL(/\/sessions\//);

  // Jump to the first multi-set exercise via the overview.
  await page.getByRole("button", { name: "Sve vežbe" }).click();
  await page
    .getByRole("button", { name: /^(Čučanj|Iskorak unazad)/ })
    .first()
    .click();

  await page.getByLabel("Serija 1 Pon.", { exact: true }).fill("12");
  await page.getByLabel("Serija 1 RPE").selectOption("7");
  await page.getByRole("button", { name: "Označi seriju kao završenu" }).first().click();

  await context.setOffline(true);
  await page.getByLabel("Serija 2 Pon.", { exact: true }).fill("11");
  await page.getByRole("button", { name: "Označi seriju kao završenu" }).first().click();
  await expect(page.getByText("Van mreže — sačuvano na uređaju")).toBeVisible();

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(page.getByText("Sačuvano", { exact: true })).toBeVisible();

  // The server has the offline edits.
  await page.reload();
  await page.getByRole("button", { name: "Sve vežbe" }).click();
  await page
    .getByRole("button", { name: /^(Čučanj|Iskorak unazad)/ })
    .first()
    .click();
  await expect(page.getByLabel("Serija 2 Pon.", { exact: true })).toHaveValue("11");
  await expect(page.getByRole("button", { name: "Serija završena" })).toHaveCount(2);

  await page.getByLabel("Serija 3 Pon.", { exact: true }).fill("10");
  await page.getByRole("button", { name: "Označi seriju kao završenu" }).first().click();
  const exerciseName = (await page.locator("h1").first().textContent())!.trim();

  await page.getByRole("button", { name: "Sve vežbe" }).click();
  await page.getByRole("button", { name: "Završi trening" }).last().click();
  await page
    .getByRole("group", { name: "Ukupan napor (1–10)" })
    .getByText("6", { exact: true })
    .click();
  await page.getByRole("button", { name: "Sačuvaj i završi" }).click();

  await expect(page.getByRole("heading", { name: "Rezime treninga" })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("12, 11, 10")).toBeVisible();

  // Exercise history shows the session.
  await page.goto("/progress");
  await page
    .getByRole("link", { name: new RegExp(`^${exerciseName}`) })
    .first()
    .click();
  await expect(page.getByRole("heading", { name: exerciseName })).toBeVisible();
  await expect(page.getByText("Lični rekord")).toBeVisible();
  await expect(page.getByText(/^12 pon\./).first()).toBeVisible();
});
