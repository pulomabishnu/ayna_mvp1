/**
 * Add one goal she tapped "Add to my goals" on (a health-data suggestion) to
 * her quiz answers, exactly as if she had picked it in the quiz. Matching
 * then reads it as a need she selected; nothing is inferred.
 */
import { NEEDS } from './ontology.js';

const OPTION_BY_ID = Object.fromEntries(NEEDS.map((n) => [n.id, n.option]));

const addTo = (intake, option) => {
  if (!intake || typeof intake !== 'object') return intake;
  const current = Array.isArray(intake.supportSelections) ? intake.supportSelections : [];
  if (current.includes(option)) return intake;
  return { ...intake, supportSelections: [...current.filter((o) => o !== 'Nothing right now'), option] };
};

export function addNeedToAnswers(answers, needId) {
  const option = OPTION_BY_ID[needId];
  if (!option || !answers) return answers;
  const next = addTo(answers, option);
  if (answers.fullHealthIntake) return { ...next, fullHealthIntake: addTo(answers.fullHealthIntake, option) };
  return next;
}

export const needOption = (needId) => OPTION_BY_ID[needId] || null;
