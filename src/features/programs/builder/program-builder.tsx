"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { NumberInput } from "@/components/ui/number-input";
import { EmptyState, Notice } from "@/components/ui/states";
import { FormMessage } from "@/components/app/form-message";
import { useServerAction } from "@/lib/hooks/use-server-action";
import { exerciseName } from "@/features/exercises/model";
import type { BlockType } from "@/features/workout-session/types";
import { PlanSummary } from "../plan-summary";
import type { ProgramBlock, ProgramBlockExercise, ProgramDay, ProgramTree } from "../queries";
import * as actions from "../actions";
import { ExercisePicker } from "./exercise-picker";

type Intensity = "light" | "strong" | "mobility" | "custom";
const INTENSITIES: Intensity[] = ["light", "strong", "mobility", "custom"];
const BLOCK_TYPES: BlockType[] = ["single", "superset", "circuit"];

function useErrorText(error: string | null) {
  const tc = useTranslations("common");
  const tp = useTranslations("programs");
  if (!error) return null;
  if (error === "repsRange") return tp("errors.repsRange");
  return tc("errorBody");
}

function MoveButtons({
  onUp,
  onDown,
  disabled,
  first,
  last,
}: {
  onUp: () => void;
  onDown: () => void;
  disabled?: boolean;
  first: boolean;
  last: boolean;
}) {
  const tc = useTranslations("common");
  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        aria-label={tc("moveUp")}
        onClick={onUp}
        disabled={disabled || first}
      >
        <ArrowUp aria-hidden="true" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        aria-label={tc("moveDown")}
        onClick={onDown}
        disabled={disabled || last}
      >
        <ArrowDown aria-hidden="true" />
      </Button>
    </>
  );
}

export function ProgramBuilder({ program }: { program: ProgramTree }) {
  const t = useTranslations("programs");
  return (
    <div className="space-y-5">
      <ProgramDetails program={program} />
      {program.program_days.length === 0 ? <EmptyState title={t("noDays")} /> : null}
      {program.program_days.map((day, i) => (
        <DayEditor
          key={day.id}
          programId={program.id}
          day={day}
          first={i === 0}
          last={i === program.program_days.length - 1}
        />
      ))}
      <AddDay programId={program.id} nextIndex={program.program_days.length} />
    </div>
  );
}

function ProgramDetails({ program }: { program: ProgramTree }) {
  const t = useTranslations("programs");
  const tc = useTranslations("common");
  const { run, pending, error } = useServerAction();
  const [name, setName] = useState(program.name);
  const [description, setDescription] = useState(program.description ?? "");
  const [saved, setSaved] = useState(false);
  return (
    <Card>
      <FormMessage error={useErrorText(error)} success={saved ? t("detailsSaved") : null} />
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(false);
          run(
            () => actions.updateProgramDetails(program.id, { name, description }),
            () => setSaved(true),
          );
        }}
      >
        <Field label={t("name")}>
          {({ id }) => (
            <Input
              id={id}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
            />
          )}
        </Field>
        <Field label={`${t("description")} · ${tc("optional")}`}>
          {({ id }) => (
            <Textarea
              id={id}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
            />
          )}
        </Field>
        <Button type="submit" variant="secondary" disabled={pending}>
          {t("saveDetails")}
        </Button>
      </form>
    </Card>
  );
}

function DayFields({
  title,
  setTitle,
  intensity,
  setIntensity,
  weekday,
  setWeekday,
}: {
  title: string;
  setTitle: (v: string) => void;
  intensity: Intensity;
  setIntensity: (v: Intensity) => void;
  weekday: number | null;
  setWeekday: (v: number | null) => void;
}) {
  const t = useTranslations();
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label={t("programs.dayTitle")} className="col-span-2">
        {({ id }) => (
          <Input
            id={id}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={120}
          />
        )}
      </Field>
      <Field label={t("programs.intensityLabel")}>
        {({ id }) => (
          <Select
            id={id}
            value={intensity}
            onChange={(e) => setIntensity(e.target.value as Intensity)}
          >
            {INTENSITIES.map((i) => (
              <option key={i} value={i}>
                {t(`intensity.${i}`)}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label={t("programs.preferredWeekday")}>
        {({ id }) => (
          <Select
            id={id}
            value={weekday ?? ""}
            onChange={(e) => setWeekday(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{t("programs.noWeekday")}</option>
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <option key={d} value={d}>
                {t(`weekdays.${String(d) as "1"}`)}
              </option>
            ))}
          </Select>
        )}
      </Field>
    </div>
  );
}

function AddDay({ programId, nextIndex }: { programId: string; nextIndex: number }) {
  const t = useTranslations("programs");
  const tc = useTranslations("common");
  const { run, pending, error } = useServerAction();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [intensity, setIntensity] = useState<Intensity>("custom");
  const [weekday, setWeekday] = useState<number | null>(null);
  const errorText = useErrorText(error);

  if (!open) {
    return (
      <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        {t("addDay")}
      </Button>
    );
  }
  return (
    <Card>
      <FormMessage error={errorText} />
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(
            () =>
              actions.addDay(programId, {
                title: title || `${t("addDay")} ${nextIndex + 1}`,
                intensity,
                preferredWeekday: weekday,
              }),
            () => {
              setOpen(false);
              setTitle("");
            },
          );
        }}
      >
        <DayFields
          title={title}
          setTitle={setTitle}
          intensity={intensity}
          setIntensity={setIntensity}
          weekday={weekday}
          setWeekday={setWeekday}
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {tc("add")}
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {tc("cancel")}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function DayEditor({
  programId,
  day,
  first,
  last,
}: {
  programId: string;
  day: ProgramDay;
  first: boolean;
  last: boolean;
}) {
  const t = useTranslations("programs");
  const tc = useTranslations("common");
  const { run, pending, error } = useServerAction();
  const [title, setTitle] = useState(day.title);
  const [intensity, setIntensity] = useState<Intensity>(day.intensity);
  const [weekday, setWeekday] = useState<number | null>(day.preferred_weekday);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dirty =
    title !== day.title || intensity !== day.intensity || weekday !== day.preferred_weekday;

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-1">
        <h2 className="min-w-0 flex-1 truncate text-lg font-bold">{day.title}</h2>
        <MoveButtons
          first={first}
          last={last}
          disabled={pending}
          onUp={() => run(() => actions.moveDay(programId, day.id, -1))}
          onDown={() => run(() => actions.moveDay(programId, day.id, 1))}
        />
      </div>
      <FormMessage error={useErrorText(error)} />
      <DayFields
        title={title}
        setTitle={setTitle}
        intensity={intensity}
        setIntensity={setIntensity}
        weekday={weekday}
        setWeekday={setWeekday}
      />
      <div className="flex flex-wrap gap-2">
        {dirty ? (
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              run(() =>
                actions.updateDay(programId, day.id, {
                  title,
                  intensity,
                  preferredWeekday: weekday,
                }),
              )
            }
          >
            {tc("save")}
          </Button>
        ) : null}
        {confirmDelete ? (
          <>
            <span className="self-center text-sm">{t("deleteDayConfirm")}</span>
            <Button
              size="sm"
              variant="danger"
              disabled={pending}
              onClick={() => run(() => actions.deleteDay(programId, day.id))}
            >
              {tc("delete")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
              {tc("cancel")}
            </Button>
          </>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)}>
            <Trash2 aria-hidden="true" />
            {t("deleteDay")}
          </Button>
        )}
      </div>

      <section aria-label={t("blocks")} className="space-y-3">
        {day.workout_blocks.length === 0 ? (
          <p className="text-ink-muted text-sm">{t("noBlocks")}</p>
        ) : null}
        {day.workout_blocks.map((block, i) => (
          <BlockEditor
            key={block.id}
            programId={programId}
            block={block}
            first={i === 0}
            last={i === day.workout_blocks.length - 1}
          />
        ))}
        <div className="flex flex-wrap gap-2">
          {BLOCK_TYPES.map((type) => (
            <Button
              key={type}
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => run(() => actions.addBlock(programId, day.id, type))}
            >
              <Plus aria-hidden="true" />
              {t(`blockType.${type}`)}
            </Button>
          ))}
        </div>
      </section>
    </Card>
  );
}

function BlockEditor({
  programId,
  block,
  first,
  last,
}: {
  programId: string;
  block: ProgramBlock;
  first: boolean;
  last: boolean;
}) {
  const t = useTranslations("programs");
  const tc = useTranslations("common");
  const { run, pending, error } = useServerAction();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [blockType, setBlockType] = useState<BlockType>(block.block_type);
  const [title, setTitle] = useState(block.title ?? "");
  const [rounds, setRounds] = useState<number | null>(block.rounds);
  const dirty =
    blockType !== block.block_type || title !== (block.title ?? "") || rounds !== block.rounds;

  return (
    <div className="border-border bg-bg rounded-[var(--radius-control)] border p-3">
      <div className="mb-2 flex items-center gap-1">
        <p className="text-accent min-w-0 flex-1 text-xs font-bold tracking-wide uppercase">
          {t(`blockType.${block.block_type}`)}
          {block.title ? ` · ${block.title}` : ""}
        </p>
        <MoveButtons
          first={first}
          last={last}
          disabled={pending}
          onUp={() => run(() => actions.moveBlock(programId, block.id, -1))}
          onDown={() => run(() => actions.moveBlock(programId, block.id, 1))}
        />
        <Button
          size="icon"
          variant="ghost"
          aria-label={t("deleteBlock")}
          disabled={pending}
          onClick={() => run(() => actions.deleteBlock(programId, block.id))}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
      <FormMessage error={useErrorText(error)} />
      <div className="mb-3 grid grid-cols-2 gap-2">
        <Field label={t("intensityLabel")}>
          {({ id }) => (
            <Select
              id={id}
              value={blockType}
              onChange={(e) => setBlockType(e.target.value as BlockType)}
            >
              {BLOCK_TYPES.map((b) => (
                <option key={b} value={b}>
                  {t(`blockType.${b}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {blockType === "circuit" ? (
          <Field label={t("blockRounds")}>
            {({ id }) => <NumberInput id={id} value={rounds} onValueChange={setRounds} />}
          </Field>
        ) : null}
        <Field label={`${t("blockTitle")} · ${tc("optional")}`} className="col-span-2">
          {({ id }) => (
            <Input
              id={id}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
          )}
        </Field>
      </div>
      {dirty ? (
        <Button
          size="sm"
          className="mb-3"
          disabled={pending}
          onClick={() =>
            run(() =>
              actions.updateBlock(programId, block.id, { blockType, title, rounds: rounds ?? 1 }),
            )
          }
        >
          {tc("save")}
        </Button>
      ) : null}

      <ul className="space-y-2">
        {block.block_exercises.map((be, i) => (
          <BlockExerciseEditor
            key={be.id}
            programId={programId}
            block={block}
            item={be}
            first={i === 0}
            last={i === block.block_exercises.length - 1}
          />
        ))}
      </ul>
      <Button
        size="sm"
        variant="outline"
        className="mt-2"
        disabled={pending}
        onClick={() => setPickerOpen(true)}
      >
        <Plus aria-hidden="true" />
        {t("addExercise")}
      </Button>
      <ExercisePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={(exerciseId) =>
          run(() => actions.addBlockExercise(programId, block.id, exerciseId))
        }
      />
    </div>
  );
}

function BlockExerciseEditor({
  programId,
  block,
  item,
  first,
  last,
}: {
  programId: string;
  block: ProgramBlock;
  item: ProgramBlockExercise;
  first: boolean;
  last: boolean;
}) {
  const t = useTranslations("programs");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { run, pending, error } = useServerAction();
  const [open, setOpen] = useState(false);
  const mode = item.exercises?.tracking_mode ?? "reps";
  const [v, setV] = useState({
    targetSets: item.target_sets as number | null,
    targetRepsMin: item.target_reps_min,
    targetRepsMax: item.target_reps_max,
    targetDurationSeconds: item.target_duration_seconds,
    targetWeightKg: item.target_weight_kg,
    targetBandLabel: item.target_band_label ?? "",
    targetTrxPosition: item.target_trx_position ?? "",
    tempo: item.tempo ?? "",
    restSeconds: item.rest_seconds,
    progressionStepKg: item.progression_step_kg,
    notes: item.notes ?? "",
  });
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) =>
    setV((s) => ({ ...s, [k]: value }));
  const hasReps = mode !== "duration";
  const hasDuration = mode === "duration" || mode === "reps_duration";
  const errorText = useErrorText(error);

  return (
    <li className="bg-surface rounded-[var(--radius-control)] p-3">
      <div className="flex items-start gap-1">
        <button
          type="button"
          className="min-h-11 min-w-0 flex-1 text-left"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="flex items-center gap-1 font-semibold">
            {item.exercises ? exerciseName(item.exercises, locale) : "—"}
            {open ? (
              <ChevronUp aria-hidden="true" className="size-4" />
            ) : (
              <ChevronDown aria-hidden="true" className="size-4" />
            )}
          </span>
          <PlanSummary
            className="text-ink-muted text-sm"
            plan={{
              trackingMode: mode,
              blockType: block.block_type,
              rounds: block.rounds,
              targetSets: item.target_sets,
              targetRepsMin: item.target_reps_min,
              targetRepsMax: item.target_reps_max,
              targetDurationSeconds: item.target_duration_seconds,
              targetWeightKg: item.target_weight_kg,
              targetBandLabel: item.target_band_label,
              targetTrxPosition: item.target_trx_position,
              tempo: item.tempo,
              restSeconds: item.rest_seconds,
            }}
          />
        </button>
        <MoveButtons
          first={first}
          last={last}
          disabled={pending}
          onUp={() => run(() => actions.moveBlockExercise(programId, item.id, -1))}
          onDown={() => run(() => actions.moveBlockExercise(programId, item.id, 1))}
        />
      </div>

      {open ? (
        <form
          className="border-border mt-3 space-y-3 border-t pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () =>
                actions.updateBlockExercise(programId, item.id, {
                  ...v,
                  targetSets: v.targetSets ?? 1,
                  targetBandLabel: v.targetBandLabel,
                  targetTrxPosition: v.targetTrxPosition,
                  tempo: v.tempo,
                  notes: v.notes,
                }),
              () => setOpen(false),
            );
          }}
        >
          {errorText ? <Notice tone="danger">{errorText}</Notice> : null}
          <div className="grid grid-cols-2 gap-2">
            {block.block_type !== "circuit" ? (
              <Field label={t("target.sets")}>
                {({ id }) => (
                  <NumberInput
                    id={id}
                    value={v.targetSets}
                    onValueChange={(n) => set("targetSets", n)}
                  />
                )}
              </Field>
            ) : null}
            {hasReps ? (
              <>
                <Field label={t("target.repsMin")}>
                  {({ id }) => (
                    <NumberInput
                      id={id}
                      value={v.targetRepsMin}
                      onValueChange={(n) => set("targetRepsMin", n)}
                    />
                  )}
                </Field>
                <Field label={t("target.repsMax")}>
                  {({ id }) => (
                    <NumberInput
                      id={id}
                      value={v.targetRepsMax}
                      onValueChange={(n) => set("targetRepsMax", n)}
                    />
                  )}
                </Field>
              </>
            ) : null}
            {hasDuration ? (
              <Field label={t("target.duration")}>
                {({ id }) => (
                  <NumberInput
                    id={id}
                    value={v.targetDurationSeconds}
                    onValueChange={(n) => set("targetDurationSeconds", n)}
                  />
                )}
              </Field>
            ) : null}
            {mode === "reps_weight" ? (
              <>
                <Field label={t("target.weight")}>
                  {({ id }) => (
                    <NumberInput
                      id={id}
                      decimal
                      value={v.targetWeightKg}
                      onValueChange={(n) => set("targetWeightKg", n)}
                    />
                  )}
                </Field>
                <Field label={t("target.step")}>
                  {({ id }) => (
                    <NumberInput
                      id={id}
                      decimal
                      placeholder="2.5"
                      value={v.progressionStepKg}
                      onValueChange={(n) => set("progressionStepKg", n)}
                    />
                  )}
                </Field>
              </>
            ) : null}
            {mode === "reps_band" ? (
              <Field label={t("target.band")} className="col-span-2">
                {({ id }) => (
                  <Input
                    id={id}
                    value={v.targetBandLabel}
                    placeholder={t("target.bandPlaceholder")}
                    maxLength={60}
                    onChange={(e) => set("targetBandLabel", e.target.value)}
                  />
                )}
              </Field>
            ) : null}
            {mode === "reps_trx" ? (
              <Field label={t("target.trx")} className="col-span-2">
                {({ id }) => (
                  <Input
                    id={id}
                    value={v.targetTrxPosition}
                    placeholder={t("target.trxPlaceholder")}
                    maxLength={60}
                    onChange={(e) => set("targetTrxPosition", e.target.value)}
                  />
                )}
              </Field>
            ) : null}
            <Field label={t("target.tempo")}>
              {({ id }) => (
                <Input
                  id={id}
                  value={v.tempo}
                  placeholder={t("target.tempoPlaceholder")}
                  maxLength={20}
                  onChange={(e) => set("tempo", e.target.value)}
                />
              )}
            </Field>
            <Field label={t("target.rest")}>
              {({ id }) => (
                <NumberInput
                  id={id}
                  value={v.restSeconds}
                  onValueChange={(n) => set("restSeconds", n)}
                />
              )}
            </Field>
            <Field label={`${t("target.notes")} · ${tc("optional")}`} className="col-span-2">
              {({ id }) => (
                <Textarea
                  id={id}
                  value={v.notes}
                  maxLength={1000}
                  onChange={(e) => set("notes", e.target.value)}
                />
              )}
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {tc("save")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => run(() => actions.removeBlockExercise(programId, item.id))}
            >
              <Trash2 aria-hidden="true" />
              {t("removeExercise")}
            </Button>
          </div>
        </form>
      ) : null}
    </li>
  );
}
