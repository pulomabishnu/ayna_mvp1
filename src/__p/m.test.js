import { test } from 'vitest'; import fs from 'fs';
import { makeProfiles, runSweep } from '../matching/v2sweep/sweep.js';
test('m', () => { const p = makeProfiles(250, 11).map((x) => ({ ...x, takesCurrent: 'No', allergyStatus: 'No', safetyConcern: 'No', diagnosisSelections: ['None that I know of'] })); const s = runSweep('v2', p); delete s.violationsList; delete s.lifeStageList; delete s.gatedList; fs.writeFileSync('/tmp/m.json', JSON.stringify(s)); }, 300000);
