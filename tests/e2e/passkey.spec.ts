import { expect, test } from "@playwright/test";
import { registerAndOnboard } from "./helpers";

test("passkey: turn on after sign-in → listed in profile → quick sign-in after sign-out", async ({
  page,
  context,
}) => {
  // A virtual platform authenticator stands in for Face ID / fingerprint.
  const cdp = await context.newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  const { authenticatorId } = await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
  const simulateTouch = (enabled: boolean) =>
    cdp.send("WebAuthn.setAutomaticPresenceSimulation", { authenticatorId, enabled });

  await registerAndOnboard(page);
  await expect(page.getByText("Prijavljuj se jednim dodirom")).toBeVisible();
  await page.getByRole("button", { name: "Uključi" }).click();
  await expect(page.getByText("Brza prijava je uključena na ovom uređaju.")).toBeVisible();

  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Brza prijava" })).toBeVisible();
  await expect(page.getByText(/^Dodat /)).toBeVisible();
  // Named after the device (the test projects emulate an iPhone and a Pixel).
  await expect(page.getByText(/^(iPhone|Android)$/)).toBeVisible();

  await page.getByRole("button", { name: "Odjavi se" }).click();
  await page.waitForURL("**/login");
  await page.getByRole("button", { name: /Brza prijava/ }).click();
  await page.waitForURL("**/calendar");
  // The offer is not shown again on this device.
  await expect(page.getByText("Prijavljuj se jednim dodirom")).toBeHidden();

  // A passkey created elsewhere (no button on this device): offered in the email autofill.
  await simulateTouch(false);
  await page.goto("/profile");
  await page.getByRole("button", { name: "Odjavi se" }).click();
  await page.waitForURL("**/login");
  await page.evaluate(() => localStorage.removeItem("mw.passkey"));
  await page.reload();
  await expect(page.getByRole("button", { name: /Brza prijava/ })).toBeHidden();
  await simulateTouch(true); // the virtual authenticator "picks" the suggestion
  await page.waitForURL("**/calendar");
});

test("passkey offer can be dismissed", async ({ page, context }) => {
  const cdp = await context.newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
    },
  });
  await registerAndOnboard(page);
  await page.getByRole("button", { name: "Ne sada" }).click();
  await expect(page.getByText("Prijavljuj se jednim dodirom")).toBeHidden();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Ova nedelja" })).toBeVisible();
  await expect(page.getByText("Prijavljuj se jednim dodirom")).toBeHidden();
});
