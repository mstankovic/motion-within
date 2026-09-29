"use client";

import { Dialog } from "radix-ui";
import type { ReactNode } from "react";
import { X } from "lucide-react";

/** Bottom sheet: slides up on open, leaves faster on close. */
export function Sheet({
  open,
  onOpenChange,
  title,
  closeLabel,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-scrim data-[state=closed]:animate-scrim-out data-[state=open]:animate-scrim-in fixed inset-0 z-40" />
        <Dialog.Content
          aria-describedby={undefined}
          className="pb-safe bg-bg data-[state=closed]:animate-sheet-out data-[state=open]:animate-sheet-in fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] w-full max-w-[430px] flex-col rounded-t-[var(--radius-sheet)] shadow-(--shadow-sheet)"
        >
          <div aria-hidden="true" className="bg-border mx-auto mt-2 h-1.25 w-9 rounded-full" />
          <div className="flex items-center gap-2 py-1 pr-2 pl-5">
            <Dialog.Title className="flex-1 text-xl leading-[1.625rem] font-bold">
              {title}
            </Dialog.Title>
            <Dialog.Close
              aria-label={closeLabel}
              className="pressable-sm active:bg-surface-muted flex size-12 items-center justify-center rounded-full"
            >
              <X aria-hidden="true" className="size-5" />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-2 pb-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
