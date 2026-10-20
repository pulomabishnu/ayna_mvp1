import { CHECKPOINT_STEP, EMPTY, INTAKE_DRAFT_KEY, readIntakeDraft, splitIntakeSteps } from './intakeModel.js';

// Follow-ups (flow, pain, timing...) keep their parent's number on the
// website quiz, and age + life stage share one screen there.
export const WEB_FOLLOWUP_STEP_IDS = new Set(['periodFlow', 'periodPain', 'utiFrequency', 'ttcDuration', 'postpartumTiming', 'pregnancyTrimester']);

/**
 * Where an unfinished quiz stands, counted the way each quiz shows it.
 * Returns null when there is no usable draft. Otherwise:
 *   { stepId, requiredDone, index, total, fraction }
 * index is the 1-based question she is on (of `total` required questions);
 * requiredDone means she reached the checkpoint or the optional part but
 * never pressed finish. fraction (0 to 1) is how much of the required part
 * is behind her, for the progress bar.
 */
export function draftProgress(draft, { surface = 'app' } = {}) {
  if (!draft || typeof draft !== 'object' || !draft.intake || typeof draft.intake !== 'object' || typeof draft.stepId !== 'string') return null;
  const intake = { ...EMPTY, ...draft.intake };
  let required;
  let optional;
  try { ({ required, optional } = splitIntakeSteps(intake)); } catch { return null; }
  const web = surface === 'web';
  const counted = web ? required.filter((s) => s.id !== 'lifeStage' && !WEB_FOLLOWUP_STEP_IDS.has(s.id)) : required;
  const total = counted.length;
  const { stepId } = draft;
  if (stepId === CHECKPOINT_STEP || optional.some((s) => s.id === stepId)) {
    return { stepId, requiredDone: true, index: total, total, fraction: 1 };
  }
  const shownId = web && stepId === 'lifeStage' ? 'age' : stepId;
  const at = required.findIndex((s) => s.id === shownId);
  const index = at < 0 ? 1 : Math.max(1, required.slice(0, at + 1).filter((s) => counted.includes(s)).length);
  return { stepId: shownId, requiredDone: false, index, total, fraction: total ? (index - 1) / total : 0 };
}

/** The saved draft on this device, as progress (null when there is none). */
export function readDraftProgress(options) {
  return draftProgress(readIntakeDraft(), options);
}

export function clearIntakeDraft() {
  try { localStorage.removeItem(INTAKE_DRAFT_KEY); } catch { /* storage unavailable */ }
}

/** "You're on question 3 of 9." or, past the required part, what's left. */
export function draftProgressLine(progress) {
  if (!progress) return '';
  if (progress.requiredDone) return `All ${progress.total} required questions are done. Your matches are one step away.`;
  return `You're on question ${progress.index} of ${progress.total}. It picks up where you left off.`;
}
