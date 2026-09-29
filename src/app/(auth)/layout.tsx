/** Full-bleed welcome surface; the page puts the hero on top and the form in a bottom sheet. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="group from-hero to-hero-deep flex min-h-dvh flex-col bg-linear-to-b">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">{children}</div>
    </main>
  );
}
