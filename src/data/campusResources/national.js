// National resources shown for EVERY school, including unverified ones.
// Every fact below was read from the cited official page on lastVerified.
// If a fact is not on the source, it is not here.
export const EMERGENCY_NOTICE = 'If you are in immediate danger, call 911.';

export const NATIONAL_RESOURCES = [
  {
    id: 'rainn-hotline',
    name: 'RAINN National Sexual Assault Hotline',
    category: 'national',
    description: 'Free, confidential support from trained support specialists, in English and Spanish.',
    phone: '800-656-4673',
    phoneDisplay: '800-656-HOPE (4673)',
    text: { number: '64673', keyword: 'HOPE' },
    chat: { url: 'https://rainn.org/hotline', label: 'Chat at RAINN.org/hotline' },
    hours: '24/7',
    confidentiality: 'confidential',
    confidentialityNote: 'RAINN describes the hotline as free and confidential.',
    sourceUrl: 'https://rainn.org/learn-about-rainn/what-we-do/support-and-services/',
    sourceLabel: 'RAINN: Support & Services',
    lastVerified: '2026-10-01',
  },
  {
    id: 'ny-state-hotline',
    onlyStates: ['NY'],
    name: 'New York State Domestic and Sexual Violence Hotline',
    category: 'national',
    description: 'Cornell lists this as a source of confidential support resources beyond those on its own list.',
    phone: '800-942-6906',
    confidentiality: 'confidential',
    confidentialityNote: 'Cornell lists this hotline for confidential support.',
    sourceUrl: 'https://share.cornell.edu/getcare/help-anytime/',
    sourceLabel: 'Cornell SHARE: Get Help Anytime',
    lastVerified: '2026-10-01',
  },
];
