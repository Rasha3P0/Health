// Appointment prep options. All taps. These are things she may want to say or
// ask; none of them is advice, and none of them sets her against her GP.
//
// ⚠ Draft wording. Every line here is listed in docs/CONTENT_REVIEW.md and
// needs checking against current NHS guidance and by a clinician before the
// app goes beyond the private beta.

export interface Option {
  id: string;
  label: string;
}

export const GOALS: Option[] = [
  { id: 'talk', label: 'Talk through these symptoms together' },
  { id: 'cause', label: 'Understand what might be behind them' },
  { id: 'options', label: 'Hear what my options are' },
  { id: 'tests', label: 'Ask whether any tests would help' },
  { id: 'referral', label: 'Ask whether a referral would help' },
  { id: 'review', label: 'Review something I already take' },
  { id: 'plan', label: 'Leave with a clear next step' },
];

export const QUESTIONS: Option[] = [
  { id: 'q-cause', label: 'What do you think could be causing this?' },
  { id: 'q-options', label: 'What are my options, including waiting and seeing?' },
  { id: 'q-tests', label: 'Would any tests help? If not, could you tell me why?' },
  { id: 'q-not-treat', label: "If you don't think this needs treating, could you explain why?" },
  { id: 'q-if-worse', label: "If it doesn't get better, when should I come back?" },
  { id: 'q-watch', label: 'Is there anything I should look out for in the meantime?' },
  { id: 'q-record', label: 'Could you note in my record what we discussed and decided?' },
  { id: 'q-read', label: 'Is there anything I could read about this afterwards?' },
];

// Things that help a neurodivergent patient get a fair appointment. Framed as
// what helps her, not as a diagnosis she has to disclose.
export const NEEDS: Option[] = [
  { id: 'n-written', label: 'I take things in better in writing. Could the plan be written down?' },
  { id: 'n-time', label: 'I may need a moment to answer' },
  { id: 'n-direct', label: 'Plain, direct language helps me' },
  { id: 'n-check', label: "I'd like to repeat the plan back to check I've understood" },
  { id: 'n-masking', label: "I may not look as unwell or in as much pain as I am" },
  { id: 'n-sensory', label: 'Bright light or noise makes it harder for me to think' },
  { id: 'n-nd', label: "I'm neurodivergent" },
];
