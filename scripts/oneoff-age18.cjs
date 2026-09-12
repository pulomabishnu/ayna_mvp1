const fs = require('node:fs');

const path = 'src/components/HealthIntakeForm.jsx';
let source = fs.readFileSync(path, 'utf8');

function replaceOnce(oldText, newText, label) {
  const count = source.split(oldText).length - 1;
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`);
  source = source.replace(oldText, newText);
}

replaceOnce(
  "      const restored = { ...EMPTY, ...(parsed?.intake || {}) };",
  `      const restored = { ...EMPTY, ...(parsed?.intake || {}) };\n      // ayna accounts are 18+. Clamp any stale pre-18 draft left in this tab\n      // so an old session cannot reintroduce an under-18 age into the intake.\n      if (restored.age) {\n        const restoredAge = Number(restored.age);\n        restored.age = Number.isFinite(restoredAge)\n          ? String(Math.min(90, Math.max(18, restoredAge)))\n          : '';\n      }`,
  'draft-age clamp',
);

replaceOnce(
  "      const numeric = intake.age ? Number(intake.age) : 28;",
  "      const numeric = intake.age ? Math.min(90, Math.max(18, Number(intake.age))) : 18;",
  'age slider default',
);
replaceOnce(
  "Math.max(13, (intake.age ? Number(intake.age) : 28) - 1)",
  "Math.max(18, (intake.age ? Math.max(18, Number(intake.age)) : 19) - 1)",
  'age decrement floor',
);
replaceOnce(
  "Math.min(90, (intake.age ? Number(intake.age) : 27) + 1)",
  "Math.min(90, (intake.age ? Math.max(18, Number(intake.age)) : 17) + 1)",
  'age increment start',
);
replaceOnce('min="13" max="90"', 'min="18" max="90"', 'age range minimum');
replaceOnce('<span>13</span><span>90</span>', '<span>18</span><span>90</span>', 'age range label');

fs.writeFileSync(path, source);

if (source.includes('Math.max(13') || source.includes('min="13" max="90"')) {
  throw new Error('under-18 age control remains after patch');
}
console.log('Health intake age control now starts at 18 and cannot select below 18.');
