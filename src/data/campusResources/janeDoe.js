// Advocacy/news content kept separate from official resources on purpose.
// Everything here is attributed to its source and written as allegation or
// report, never as established fact. No accused individuals are named.
// Verified 2026-10-01.
export const PETITION = {
  label: 'Support Jane Doe: Read the Petition',
  url: 'https://www.change.org/p/cornell-alumni-supporting-jane-doe',
  note: 'The petition is hosted on Change.org and was started by an individual (Sami Sage), not by ayna or Cornell.',
};

export const SOURCES = {
  sun: { label: 'The Cornell Daily Sun: Tompkins County DA Reopens Criminal Investigation Into Alleged Chi Phi Gang Rape (Sept. 28, 2026)', url: 'https://www.cornellsun.com/article/2026/09/tompkins-county-da-reopens-criminal-investigation-into-alleged-chi-phi-gang-rape' },
  cbs: { label: 'CBS News: Details emerge in case of former Cornell student alleging gang rape by fraternity members (Sept. 30, 2026)', url: 'https://www.cbsnews.com/news/cornell-university-rape-allegations-chi-phi-fraternity-details/' },
  da: { label: 'Tompkins County District Attorney: Statement Regarding Jane Doe v. Cornell University, et al (Sept. 28, 2026)', url: 'https://www.tompkinscountyny.gov/files/assets/county/v/1/district-attorney/documents/district-attorney-public-statement-9-28-26.pdf' },
};

// Each block: heading, kind (shown as a label), paragraphs, and the source keys they rely on.
export const CASE_BLOCKS = [
  {
    heading: 'Allegations in the civil lawsuit',
    kind: 'Allegations — not proven',
    body: [
      'A former Cornell student alleges in a civil lawsuit that she was drugged and sexually assaulted by seven fraternity members in October 2024. According to the lawsuit, she was 20 at the time. The lawsuit names Cornell University and seven then-fraternity members as defendants and alleges breach of contract, negligence, and violations of state law.',
      'These are allegations in a civil complaint. They have not been decided by a court.',
    ],
    sources: ['cbs'],
  },
  {
    heading: 'Cornell’s statements and institutional actions',
    kind: 'According to Cornell',
    body: [
      'CBS News reports that Cornell says it conducted a Title IX investigation and that “the matter was sent to a hearing where a panel of trained faculty and staff heard evidence over multiple days.”',
      'According to Cornell President Michael Kotlikoff, as reported by CBS News, two of the accused students were expelled, two were suspended for at least two semesters, one had already graduated, and two were found not responsible. CBS also reports the fraternity chapter was closed in 2024.',
      'Cornell has said: “Any suggestion that the university did not impose consequential punishments for those involved is false.”',
    ],
    sources: ['cbs'],
  },
  {
    heading: 'District Attorney and law enforcement',
    kind: 'Statements from the DA',
    body: [
      'In a September 28, 2026 statement, Tompkins County District Attorney Matthew Van Houten said his office determined in November 2024 that Jane Doe’s sworn statement “did not allege that she was drugged against her will or gang raped,” and that he would reopen the case with a Grand Jury presentation.',
      'The Cornell Daily Sun reports the DA said his office is reopening the criminal investigation to “reexamine whether there’s additional evidence that we were not aware of in November of 2024,” and that no decision has been made on whether to bring charges. The Sun also reports the DA acknowledged his office relied on the Cornell University Police Department’s investigation and was not provided certain evidence.',
      'CBS News reports the DA said he had not seen the full transcript of the campus police interview, and that evidence is expected to go to a grand jury within about 45 days.',
    ],
    sources: ['da', 'sun', 'cbs'],
  },
  {
    heading: 'News reporting',
    kind: 'Reporting by news organizations',
    body: [
      'CBS News reports that an attorney for one defendant presented a hair follicle test that, according to the attorney, shows no ketamine, and that a defendant disputed that events were illegal. Defendants have not been found liable in court.',
    ],
    sources: ['cbs'],
  },
];
