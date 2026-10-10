// Presentation labels only. Original intake answers and matching reasons are unchanged.
export function healthAreaLabel(label = '') {
  const matches = [
    [/pregnan|prenatal/i, 'Pregnancy'], [/postpartum/i, 'Postpartum'], [/breastfeed|lactation/i, 'Breastfeeding'],
    [/fibroid/i, 'Fibroids'], [/adenomyosis/i, 'Adenomyosis'], [/endometriosis/i, 'Endometriosis'], [/pcos/i, 'PCOS'],
    [/fertility|conceive|ovulation/i, 'Fertility'], [/perimenopause/i, 'Perimenopause'], [/menopause|hot flash|night sweat/i, 'Menopause'],
    [/cramp|period pain/i, 'Cramps'], [/pelvic pain/i, 'Pelvic'], [/heavy periods|light periods/i, 'Flow'], [/period|cycle/i, 'Period'],
    [/vaginal|vulva|intimate|\bBV\b|yeast/i, 'Intimate'], [/urinary|urination|UTI|bladder/i, 'Urinary'],
    [/skin|acne/i, 'Skin'], [/hair/i, 'Hair'], [/sleep/i, 'Sleep'], [/fatigue|energy/i, 'Energy'],
    [/anxiety|mood|stress|mental/i, 'Mood'], [/gut|digest/i, 'Gut'], [/sexual|libido|sex$/i, 'Sexual wellness'],
    [/contraception|birth control/i, 'Birth control'], [/hormon/i, 'Hormones'], [/breast/i, 'Breast care'],
    [/supplement|test.*device|other support/i, 'More care'],
  ];
  return matches.find(([pattern]) => pattern.test(label))?.[1] || label;
}
