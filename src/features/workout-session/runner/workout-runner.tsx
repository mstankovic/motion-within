"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  CopyCheck,
  ListOrdered,
  Minus,
  Plus,
  SkipForward,
  Undo2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/states";
import { StatusIcon } from "@/features/calendar/status";
import { formatRecord } from "@/features/progress/format-record";
import type { PersonalRecord } from "@/features/progress/records";
import { PlanSummary } from "@/features/programs/plan-summary";
import { cn } from "@/lib/cn";
import { finalizeSession } from "../actions";
import { formatSetsSummary } from "../format";
import { progress } from "../reducer";
import type { LocalExercise, LocalSession, Performance } from "../types";
import { useWorkoutSession } from "../use-workout-session";
import { FinishPanel, type FinishValues } from "./finish-panel";
import { SetRow } from "./set-row";
import { SyncIndicator } from "./sync-indicator";

type Props = {
  initial: LocalSession;
  lastPerformances: Record<string, Performance>;
  bests: Record<string, PersonalRecord[]>;
  dateLabel: string;
  mode: "active" | "edit";
};

export function WorkoutRunner({ initial, lastPerformances, bests, dateLabel, mode }: Props) {
  const t = useTranslations("workout");
  const tp = useTranslations("progress");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { state, dispatch, sync, retry, waitForSync, forget } = useWorkoutSession(initial);
  const [index, setIndex] = useState(() => {
    const firstOpen = initial.exercises.findIndex((e) => e.status === "pending");
    return mode === "active" && firstOpen >= 0 ? firstOpen : 0;
  });
  const [view, setView] = useState<"exercise" | "overview" | "finish">("exercise");
  const [finishing, setFinishing] = useState(false);
  const [queued, setQueued] = useState(false);
  const finalized = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const { done, total } = progress(state);
  const exercise: LocalExercise | undefined = state.exercises[index];
  const sessionId = state.session.id;

  // A completion queued offline is finalized as soon as it has synced.
  useEffect(() => {
    if (
      mode !== "active" ||
      state.session.status !== "completed" ||
      sync !== "saved" ||
      finalized.current
    )
      return;
    finalized.current = true;
    void (async () => {
      await finalizeSession(sessionId);
      await forget();
      router.replace(`/sessions/${sessionId}`);
      router.refresh();
    })();
  }, [mode, state.session.status, sync, sessionId, forget, router]);

  function go(next: number) {
    setIndex(Math.max(0, Math.min(total - 1, next)));
    setView("exercise");
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0 });
      headingRef.current?.focus();
    });
  }

  async function submitFinish(values: FinishValues) {
    setFinishing(true);
    for (const ex of state.exercises) {
      const flagged = ex.id === values.painExerciseId;
      if (flagged || ex.pain_flag) {
        dispatch({
          type: "updateExercise",
          exerciseId: ex.id,
          patch: { pain_flag: flagged, pain_note: flagged ? values.painNote || null : null },
        });
      }
    }
    dispatch({
      type: "updateSession",
      patch: {
        session_rpe: values.session_rpe,
        energy_after: values.energy_after,
        recovery_rating: values.recovery_rating,
        notes: values.notes || null,
      },
    });
    if (mode === "active") dispatch({ type: "complete", completedAt: new Date().toISOString() });

    const synced = await waitForSync();
    if (!synced) {
      setQueued(true);
      setFinishing(false);
      return;
    }
    finalized.current = true;
    await finalizeSession(sessionId);
    await forget();
    router.replace(`/sessions/${sessionId}`);
    router.refresh();
  }

  const exitHref = mode === "edit" ? `/sessions/${sessionId}` : "/calendar";

  return (
    <div className="mx-auto min-h-dvh w-full max-w-xl pb-32">
      <header className="pt-safe border-border bg-bg/95 sticky top-0 z-20 border-b px-4 pb-2 backdrop-blur">
        <div className="flex items-center gap-2 pt-2">
          <Link
            href={exitHref}
            className="text-ink-muted active:bg-surface-muted -ml-2 flex min-h-11 items-center gap-1 rounded-full pr-3 pl-2 text-sm font-semibold transition-colors duration-(--dur-fast)"
          >
            <X aria-hidden="true" className="size-5" />
            <span className="max-w-[9rem] truncate sm:max-w-none">
              {mode === "edit" ? t("backToSummary") : t("exit")}
            </span>
          </Link>
          <div className="ml-auto">
            <SyncIndicator state={sync} onRetry={() => void retry()} />
          </div>
        </div>
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold">
              {mode === "edit" ? `${t("editTitle")} · ` : ""}
              {state.session.title_snapshot}
            </p>
            <p className="text-ink-muted text-xs">{dateLabel}</p>
          </div>
          <p className="text-brand shrink-0 text-sm font-bold">{t("progress", { done, total })}</p>
        </div>
        <div
          className="bg-surface-muted mt-2 h-1.5 overflow-hidden rounded-full"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-label={t("progress", { done, total })}
        >
          <div
            className="bg-brand h-full transition-[width]"
            style={{ width: `${total ? (done / total) * 100 : 0}%` }}
          />
        </div>
      </header>

      <div className="px-4 pt-4">
        {sync === "conflict" ? (
          <Notice tone="danger" className="mb-4">
            {t("sync.conflict")}
          </Notice>
        ) : null}
        {queued ? (
          <Notice tone="warning" className="mb-4">
            {t("finishQueued")}
          </Notice>
        ) : null}

        {view === "overview" ? (
          <>
            <Overview state={state} current={index} onPick={go} />
            <Button
              size="lg"
              variant="secondary"
              className="mt-4"
              onClick={() => setView("finish")}
            >
              {mode === "edit" ? tc("save") : t("finish")}
            </Button>
          </>
        ) : view === "finish" ? (
          <FinishPanel
            state={state}
            pending={finishing}
            submitLabel={mode === "edit" ? tc("save") : t("saveFinish")}
            onSubmit={(v) => void submitFinish(v)}
          />
        ) : exercise ? (
          <ExerciseView
            key={exercise.id}
            exercise={exercise}
            position={index + 1}
            total={total}
            headingRef={headingRef}
            last={lastPerformances[exercise.source_exercise_id ?? ""]}
            best={bests[exercise.source_exercise_id ?? ""] ?? []}
            dispatch={dispatch}
            onNext={() => (index < total - 1 ? go(index + 1) : setView("finish"))}
            formatBest={(r) => formatRecord(r, tp, locale)}
          />
        ) : (
          <Notice>{t("notStartable")}</Notice>
        )}
      </div>

      <nav
        aria-label={t("overview")}
        className="pb-safe border-border bg-surface/95 fixed inset-x-0 bottom-0 z-20 border-t px-4 pt-2 backdrop-blur"
      >
        <div className="mx-auto flex max-w-xl items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            aria-label={t("prevExercise")}
            disabled={index === 0 && view === "exercise"}
            onClick={() => go(view === "exercise" ? index - 1 : index)}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            variant={view === "overview" ? "secondary" : "outline"}
            aria-pressed={view === "overview"}
            onClick={() => setView(view === "overview" ? "exercise" : "overview")}
          >
            <ListOrdered aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{t("overview")}</span>
          </Button>
          {view !== "finish" && index < total - 1 ? (
            <Button className="flex-1" onClick={() => go(index + 1)}>
              {t("nextExercise")}
              <ChevronRight aria-hidden="true" />
            </Button>
          ) : (
            <Button
              className="flex-1"
              variant={view === "finish" ? "secondary" : "primary"}
              onClick={() => setView("finish")}
              disabled={view === "finish"}
            >
              {mode === "edit" ? tc("save") : t("finish")}
            </Button>
          )}
        </div>
      </nav>
    </div>
  );
}

function Overview({
  state,
  current,
  onPick,
}: {
  state: LocalSession;
  current: number;
  onPick: (i: number) => void;
}) {
  const t = useTranslations("workout");
  const ts = useTranslations("status");
  return (
    <Card className="p-2">
      <h2 className="px-2 pt-2 pb-1 text-lg font-bold">{t("overview")}</h2>
      <ol>
        {state.exercises.map((e, i) => {
          const status =
            e.status === "completed" ? "completed" : e.status === "skipped" ? "skipped" : "planned";
          return (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => onPick(i)}
                aria-current={i === current ? "step" : undefined}
                className={cn(
                  "active:bg-surface-muted flex min-h-12 w-full items-center gap-3 rounded-[var(--radius-control)] px-2 text-left transition-colors duration-(--dur-fast)",
                  i === current && "bg-brand-soft",
                )}
              >
                <StatusIcon status={status} />
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {e.exercise_name_snapshot}
                </span>
                <span className="sr-only">{ts(status)}</span>
                {e.block_type_snapshot !== "single" ? (
                  <Badge>{t(e.block_type_snapshot)}</Badge>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function ExerciseView({
  exercise: ex,
  position,
  total,
  headingRef,
  last,
  best,
  dispatch,
  onNext,
  formatBest,
}: {
  exercise: LocalExercise;
  position: number;
  total: number;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  last?: Performance;
  best: PersonalRecord[];
  dispatch: ReturnType<typeof useWorkoutSession>["dispatch"];
  onNext: () => void;
  formatBest: (r: PersonalRecord) => string;
}) {
  const t = useTranslations("workout");
  const locale = useLocale();
  const [showInfo, setShowInfo] = useState(false);
  const mode = ex.tracking_mode_snapshot;
  const lastUnfinished = ex.sets.at(-1);
  const firstSet = ex.sets[0];

  return (
    <article aria-labelledby={`ex-${ex.id}`} className="space-y-3">
      <div>
        <p className="text-ink-muted text-xs font-bold tracking-wide uppercase">
          {t("exercise", { current: position, total })}
          {ex.block_type_snapshot !== "single"
            ? ` · ${ex.block_title_snapshot ? t("blockPart", { type: t(ex.block_type_snapshot), title: ex.block_title_snapshot }) : t(ex.block_type_snapshot)}`
            : ""}
        </p>
        <h1
          id={`ex-${ex.id}`}
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl leading-tight font-extrabold tracking-tight focus:outline-none"
        >
          {ex.exercise_name_snapshot}
        </h1>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {ex.status === "completed" ? <Badge tone="success">{t("exerciseDone")}</Badge> : null}
          {ex.status === "skipped" ? <Badge>{t("exerciseSkipped")}</Badge> : null}
          {ex.pain_flag ? <Badge tone="danger">{t("painFlag")}</Badge> : null}
        </div>
        {ex.instructions_snapshot ? (
          <div className="mt-1">
            <p className={cn("text-ink-muted text-sm", !showInfo && "line-clamp-2")}>
              {ex.instructions_snapshot}
            </p>
            <button
              type="button"
              className="text-brand min-h-8 text-sm font-semibold"
              aria-expanded={showInfo}
              onClick={() => setShowInfo((s) => !s)}
            >
              {showInfo ? "−" : "+"}
            </button>
          </div>
        ) : null}
      </div>

      <Card className="grid gap-2 p-3 text-sm">
        <div>
          <span className="font-bold">{t("plan")}: </span>
          <PlanSummary
            className="inline"
            plan={{
              trackingMode: mode,
              blockType: ex.block_type_snapshot,
              rounds: ex.rounds_snapshot,
              targetSets: ex.target_sets_snapshot,
              targetRepsMin: ex.target_reps_min_snapshot,
              targetRepsMax: ex.target_reps_max_snapshot,
              targetDurationSeconds: ex.target_duration_seconds_snapshot,
              targetWeightKg: ex.target_weight_kg_snapshot,
              targetBandLabel: ex.target_band_label_snapshot,
              targetTrxPosition: ex.target_trx_position_snapshot,
              tempo: ex.tempo_snapshot,
              restSeconds: ex.rest_seconds_snapshot,
            }}
          />
          {ex.plan_notes_snapshot ? (
            <p className="text-ink-muted italic">{ex.plan_notes_snapshot}</p>
          ) : null}
        </div>
        <div>
          <span className="font-bold">{t("last")}: </span>
          {last ? (
            formatSetsSummary(last.sets, mode, locale)
          ) : (
            <span className="text-ink-muted">{t("lastNone")}</span>
          )}
        </div>
        {best.length ? (
          <div>
            <span className="font-bold">{t("best")}: </span>
            {best.slice(0, 3).map(formatBest).join(" · ")}
          </div>
        ) : null}
      </Card>

      <ol className="space-y-2">
        {ex.sets.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            mode={mode}
            placeholderReps={ex.target_reps_max_snapshot ?? ex.target_reps_min_snapshot}
            placeholderDuration={ex.target_duration_seconds_snapshot}
            onChange={(patch) =>
              dispatch({ type: "updateSet", exerciseId: ex.id, setId: set.id, patch })
            }
            onToggle={() => {
              // Tapping "done" on an empty set records the planned target.
              if (!set.completed) {
                const patch: Record<string, number> = {};
                if (set.reps == null && mode !== "duration") {
                  const target = ex.target_reps_max_snapshot ?? ex.target_reps_min_snapshot;
                  if (target != null) patch.reps = target;
                }
                if (
                  set.duration_seconds == null &&
                  (mode === "duration" || mode === "reps_duration")
                ) {
                  if (ex.target_duration_seconds_snapshot != null)
                    patch.duration_seconds = ex.target_duration_seconds_snapshot;
                }
                if (Object.keys(patch).length)
                  dispatch({ type: "updateSet", exerciseId: ex.id, setId: set.id, patch });
              }
              dispatch({ type: "toggleSetDone", exerciseId: ex.id, setId: set.id });
            }}
          />
        ))}
      </ol>

      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={!last}
          onClick={() =>
            last && dispatch({ type: "copyPrevious", exerciseId: ex.id, previous: last.sets })
          }
        >
          <Copy aria-hidden="true" />
          {t("copyPrevious")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!firstSet || ex.sets.length < 2}
          onClick={() =>
            firstSet && dispatch({ type: "applyToAll", exerciseId: ex.id, fromSetId: firstSet.id })
          }
        >
          <CopyCheck aria-hidden="true" />
          {t("applyAll")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            dispatch({ type: "addSet", exerciseId: ex.id, newId: crypto.randomUUID() })
          }
        >
          <Plus aria-hidden="true" />
          {t("addSet")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!lastUnfinished || lastUnfinished.completed || ex.sets.length <= 1}
          onClick={() => dispatch({ type: "removeLastSet", exerciseId: ex.id })}
        >
          <Minus aria-hidden="true" />
          {t("removeSet")}
        </Button>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">{t("notes")}</span>
        <Textarea
          value={ex.notes ?? ""}
          placeholder={t("notesPlaceholder")}
          maxLength={1000}
          onChange={(e) =>
            dispatch({
              type: "updateExercise",
              exerciseId: ex.id,
              patch: { notes: e.target.value || null },
            })
          }
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        {ex.status === "skipped" ? (
          <Button
            variant="outline"
            onClick={() =>
              dispatch({ type: "setExerciseStatus", exerciseId: ex.id, status: "pending" })
            }
          >
            <Undo2 aria-hidden="true" />
            {t("unskip")}
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => {
              dispatch({ type: "setExerciseStatus", exerciseId: ex.id, status: "skipped" });
              onNext();
            }}
          >
            <SkipForward aria-hidden="true" />
            {t("skip")}
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={() => {
            if (ex.status !== "completed")
              dispatch({ type: "setExerciseStatus", exerciseId: ex.id, status: "completed" });
            onNext();
          }}
        >
          {t("markDone")}
        </Button>
      </div>
    </article>
  );
}
