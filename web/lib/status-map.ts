/**
 * ============================================================================
 * SINGLE SOURCE OF TRUTH: Request Status Model & Public Mapping
 * ============================================================================
 * Defines internal status workflow, bilingual copy (EN + KN), transition
 * constraints, stepper positioning, and public guidance.
 *
 * CRITICAL RULE: "Approved" means approved by our team for filing.
 * The official electoral roll is updated ONLY by the Election Commission.
 */

export type RequestStatus =
  | 'new'
  | 'contacted'
  | 'documents_pending'
  | 'needs_info'
  | 'verified'
  | 'form_submitted'
  | 'enrolled'
  | 'rejected'
  | 'duplicate'
  | 'withdrawn'
  | 'closed';

export interface StatusMetadata {
  key: RequestStatus;
  // Admin Labels & Actions
  adminLabel: string;
  adminActionLabel?: string;
  adminActionDescription?: string;
  
  // Public Stepper & Cards
  publicStepLabel: {
    en: string;
    kn: string;
  };
  publicMessage: {
    en: (ctx?: Record<string, any>) => string;
    kn: (ctx?: Record<string, any>) => string;
  };
  whatHappensNext: {
    en: string;
    kn: string;
  };
  
  // Visuals & Layout
  badgeVariant: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'indigo' | 'secondary';
  stepperIndex: number; // 1-5 for linear progression, -1 for branch/terminal states
  isBranchState: boolean;
  isTerminal: boolean;
  defaultSlaDays: number;
}

export const STATUS_MAP: Record<RequestStatus, StatusMetadata> = {
  new: {
    key: 'new',
    adminLabel: 'New Application',
    adminActionLabel: 'Mark Received',
    adminActionDescription: 'Initial submission awaiting volunteer review.',
    publicStepLabel: {
      en: 'Request received',
      kn: 'ವಿನಂತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ',
    },
    publicMessage: {
      en: (ctx) => `We received your request. Our team will verify your details and call you within ${ctx?.slaDays ?? 3} days.`,
      kn: (ctx) => `ನಿಮ್ಮ ವಿನಂತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ. ನಮ್ಮ ತಂಡವು ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ${ctx?.slaDays ?? 3} ದಿನಗಳಲ್ಲಿ ಸಂಪರ್ಕಿಸುತ್ತದೆ.`,
    },
    whatHappensNext: {
      en: 'Our desk team is validating your details against the constituency eligibility criteria.',
      kn: 'ನಮ್ಮ ತಂಡವು ಕ್ಷೇತ್ರದ ಅರ್ಹತಾ ಮಾನದಂಡಗಳ ಅನ್ವಯ ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸುತ್ತಿದೆ.',
    },
    badgeVariant: 'primary',
    stepperIndex: 1,
    isBranchState: false,
    isTerminal: false,
    defaultSlaDays: 3,
  },

  contacted: {
    key: 'contacted',
    adminLabel: 'Contacted',
    adminActionLabel: 'Mark contacted',
    adminActionDescription: 'Staff spoke with voter or attempted phone contact.',
    publicStepLabel: {
      en: 'Our team contacted you',
      kn: 'ನಮ್ಮ ತಂಡ ಸಂಪರ್ಕಿಸಿದೆ',
    },
    publicMessage: {
      en: () => 'We reached out to you regarding your voter enrollment request. Please keep your phone reachable.',
      kn: () => 'ಮತದಾರರ ನೋಂದಣಿ ಕುರಿತು ನಾವು ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿದ್ದೇವೆ. ದಯವಿಟ್ಟು ಕರೆಗೆ ಲಭ್ಯವಿರಿ.',
    },
    whatHappensNext: {
      en: 'A volunteer will guide you through Form 18 required documents and confirm filing schedule.',
      kn: 'ಫಾರ್ಮ್ 18 ಕ್ಕೆ ಅಗತ್ಯವಿರುವ ದಾಖಲೆಗಳು ಮತ್ತು ಸಲ್ಲಿಕೆಯ ವೇಳಾಪಟ್ಟಿಯನ್ನು ಮಾರ್ಗದರ್ಶನ ಮಾಡಲಾಗುವುದು.',
    },
    badgeVariant: 'indigo',
    stepperIndex: 2,
    isBranchState: false,
    isTerminal: false,
    defaultSlaDays: 4,
  },

  documents_pending: {
    key: 'documents_pending',
    adminLabel: 'Documents Needed',
    adminActionLabel: 'Request documents',
    adminActionDescription: 'Waiting for voter to send degree or address proof.',
    publicStepLabel: {
      en: 'Documents needed',
      kn: 'ದಾಖಲೆಗಳು ಅಗತ್ಯವಿದೆ',
    },
    publicMessage: {
      en: (ctx) => `Degree certificate or address proof is needed. Please share via WhatsApp at ${ctx?.helpline ?? '+91 9845123456'}.`,
      kn: (ctx) => `ಪದವಿ ಪ್ರಮಾಣಪತ್ರ ಅಥವಾ ವಿಳಾಸದ ಪುರಾವೆ ಅಗತ್ಯವಿದೆ. ದಯವಿಟ್ಟು ವಾಟ್ಸಾಪ್ (${ctx?.helpline ?? '+91 9845123456'}) ಮೂಲಕ ಕಳುಹಿಸಿ.`,
    },
    whatHappensNext: {
      en: 'Send clear photos of your degree certificate and residential proof so we can file your Form 18.',
      kn: 'ಫಾರ್ಮ್ 18 ಸಲ್ಲಿಸಲು ನಿಮ್ಮ ಪದವಿ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ವಿಳಾಸದ ಪುರಾವೆಯ ಸ್ಪಷ್ಟ ಪ್ರತಿಯನ್ನು ಕಳುಹಿಸಿ.',
    },
    badgeVariant: 'warning',
    stepperIndex: -1,
    isBranchState: true,
    isTerminal: false,
    defaultSlaDays: 5,
  },

  needs_info: {
    key: 'needs_info',
    adminLabel: 'More Info Needed',
    adminActionLabel: 'Request more info',
    adminActionDescription: 'Specific clarification required from the applicant.',
    publicStepLabel: {
      en: 'More information needed',
      kn: 'ಹೆಚ್ಚಿನ ಮಾಹಿತಿ ಅಗತ್ಯವಿದೆ',
    },
    publicMessage: {
      en: (ctx) => ctx?.publicNote || 'We need additional clarification regarding your application. Please check your messages or call our desk.',
      kn: (ctx) => ctx?.publicNoteKn || 'ನಿಮ್ಮ ಅರ್ಜಿಗೆ ಸಂಬಂಧಿಸಿದಂತೆ ಹೆಚ್ಚುವರಿ ಮಾಹಿತಿ ಅಗತ್ಯವಿದೆ. ದಯವಿಟ್ಟು ನಮ್ಮ ಸಹಾಯವಾಣಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    },
    whatHappensNext: {
      en: 'Please review the note above and reply to our volunteer or update your details.',
      kn: 'ದಯವಿಟ್ಟು ಮೇಲಿನ ಸೂಚನೆಯನ್ನು ಗಮನಿಸಿ ಮತ್ತು ಅಗತ್ಯ ಮಾಹಿತಿಯನ್ನು ಒದಗಿಸಿ.',
    },
    badgeVariant: 'warning',
    stepperIndex: -1,
    isBranchState: true,
    isTerminal: false,
    defaultSlaDays: 3,
  },

  verified: {
    key: 'verified',
    adminLabel: 'Verified by Team',
    adminActionLabel: 'Verify & approve for filing',
    adminActionDescription: 'Documents verified. Approved for official Form 18 submission.',
    publicStepLabel: {
      en: 'Approved by our team',
      kn: 'ನಮ್ಮ ತಂಡದಿಂದ ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
    },
    publicMessage: {
      en: () => 'Your details are verified by our team. Next step: We will help submit Form 18 to the Electoral Registration Officer (ERO).',
      kn: () => 'ನಿಮ್ಮ ವಿವರಗಳನ್ನು ನಮ್ಮ ತಂಡವು ಪರಿಶೀಲಿಸಿದೆ. ಮುಂದಿನ ಹಂತ: ERO ಕಚೇರಿಗೆ ಅರ್ಜಿ (ಫಾರ್ಮ್ 18) ಸಲ್ಲಿಸಲು ನೆರವಾಗುತ್ತೇವೆ.',
    },
    whatHappensNext: {
      en: 'Your application is scheduled for filing with the election office desk.',
      kn: 'ಚುನಾವಣಾ ಅಧಿಕಾರಿಗಳ ಕಚೇರಿಯಲ್ಲಿ ನಿಮ್ಮ ಅರ್ಜಿಯನ್ನು ಸಲ್ಲಿಸಲು ಸಿದ್ಧಪಡಿಸಲಾಗಿದೆ.',
    },
    badgeVariant: 'primary',
    stepperIndex: 3,
    isBranchState: false,
    isTerminal: false,
    defaultSlaDays: 5,
  },

  form_submitted: {
    key: 'form_submitted',
    adminLabel: 'Form Submitted to ERO',
    adminActionLabel: 'Mark form submitted',
    adminActionDescription: 'Physical or online Form 18 submitted. Acknowledgement captured.',
    publicStepLabel: {
      en: 'Form submitted to ERO',
      kn: 'ERO ಕಚೇರಿಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ',
    },
    publicMessage: {
      en: (ctx) => `Form 18 filed on ${ctx?.date ?? 'scheduled date'}. Acknowledgement no: ${ctx?.ackNumber ?? 'Pending'}. The official roll is updated solely by the Election Commission.`,
      kn: (ctx) => `ಅರ್ಜಿ (ಫಾರ್ಮ್ 18) ದಿನಾಂಕ ${ctx?.date ?? 'ನಿಗದಿತ ದಿನ'} ರಂದು ಸಲ್ಲಿಸಲಾಗಿದೆ. ಸ್ವೀಕೃತಿ ಸಂಖ್ಯೆ: ${ctx?.ackNumber ?? 'ಬಾಕಿ'}. ಮತದಾರರ ಪಟ್ಟಿಯನ್ನು ಚುನಾವಣಾ ಆಯೋಗವೇ ಅಂತಿಮಗೊಳಿಸುತ್ತದೆ.`,
    },
    whatHappensNext: {
      en: 'The Electoral Registration Officer will scrutinize the claim before publishing the final roll.',
      kn: 'ಅಂತಿಮ ಮತದಾರರ ಪಟ್ಟಿ ಪ್ರಕಟಿಸುವ ಮುನ್ನ ಚುನಾವಣಾ ನೋಂದಣಿ ಅಧಿಕಾರಿಯವರು ಪರಿಶೀಲನೆ ನಡೆಸುತ್ತಾರೆ.',
    },
    badgeVariant: 'indigo',
    stepperIndex: 4,
    isBranchState: false,
    isTerminal: false,
    defaultSlaDays: 14,
  },

  enrolled: {
    key: 'enrolled',
    adminLabel: 'Confirmed in Electoral Roll',
    adminActionLabel: 'Confirm name in roll',
    adminActionDescription: 'Verified that name is officially printed in published roll.',
    publicStepLabel: {
      en: 'Name confirmed in voter list',
      kn: 'ಮತದಾರರ ಪಟ್ಟಿಯಲ್ಲಿ ಹೆಸರು ದೃಢಪಟ್ಟಿದೆ',
    },
    publicMessage: {
      en: (ctx) => `Your name appears in the published electoral roll. Part No: ${ctx?.partNumber ?? '—'}, Serial No: ${ctx?.serialNumber ?? '—'}.`,
      kn: (ctx) => `ಪ್ರಕಟಿತ ಮತದಾರರ ಪಟ್ಟಿಯಲ್ಲಿ ನಿಮ್ಮ ಹೆಸರು ದಾಖಲಾಗಿದೆ. ಭಾಗ ಸಂಖ್ಯೆ: ${ctx?.partNumber ?? '—'}, ಕ್ರಮ ಸಂಖ್ಯೆ: ${ctx?.serialNumber ?? '—'}.`,
    },
    whatHappensNext: {
      en: 'You are an enrolled voter! Click below to view and download your official voter slip.',
      kn: 'ನೀವು ಯಶಸ್ವಿಯಾಗಿ ನೋಂದಾಯಿಸಲ್ಪಟ್ಟಿದ್ದೀರಿ! ನಿಮ್ಮ ಅಧಿಕೃತ ಮತದಾರರ ಚೀಟಿಯನ್ನು ವೀಕ್ಷಿಸಲು ಕೆಳಗೆ ಕ್ಲಿಕ್ ಮಾಡಿ.',
    },
    badgeVariant: 'success',
    stepperIndex: 5,
    isBranchState: false,
    isTerminal: true,
    defaultSlaDays: 0,
  },

  rejected: {
    key: 'rejected',
    adminLabel: 'Could Not Process',
    adminActionLabel: 'Reject request',
    adminActionDescription: 'Does not qualify or invalid documentation.',
    publicStepLabel: {
      en: 'Could not be processed',
      kn: 'ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ',
    },
    publicMessage: {
      en: (ctx) => `Reason: ${ctx?.rejectReason ?? 'Eligibility requirements not fulfilled'}. You may contact helpline ${ctx?.helpline ?? '+91 9845123456'} for guidance.`,
      kn: (ctx) => `ಕಾರಣ: ${ctx?.rejectReasonKn ?? 'ಅರ್ಹತಾ ಮಾನದಂಡಗಳು ಪೂರ್ಣಗೊಂಡಿಲ್ಲ'}. ಹೆಚ್ಚಿನ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ಸಹಾಯವಾಣಿ ${ctx?.helpline ?? '+91 9845123456'} ಸಂಪರ್ಕಿಸಿ.`,
    },
    whatHappensNext: {
      en: 'If you have additional supporting documents or wish to re-apply, contact our constituency desk.',
      kn: 'ನಿಮ್ಮ ಬಳಿ ಸೂಕ್ತ ದಾಖಲೆಗಳಿದ್ದರೆ ಅಥವಾ ಮರು-ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಬಯಸಿದರೆ ನಮ್ಮ ಕಚೇರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    },
    badgeVariant: 'error',
    stepperIndex: -1,
    isBranchState: true,
    isTerminal: true,
    defaultSlaDays: 0,
  },

  duplicate: {
    key: 'duplicate',
    adminLabel: 'Already in Electoral Roll',
    adminActionLabel: 'Mark duplicate',
    adminActionDescription: 'Applicant is already found in the current roll.',
    publicStepLabel: {
      en: 'Already in the voter list',
      kn: 'ಈಗಾಗಲೇ ಮತದಾರರ ಪಟ್ಟಿಯಲ್ಲಿದೆ',
    },
    publicMessage: {
      en: () => 'Your name is already registered in this constituency. Click below to view your details.',
      kn: () => 'ನೀವು ಈಗಾಗಲೇ ಈ ಕ್ಷೇತ್ರದ ಮತದಾರರ ಪಟ್ಟಿಯಲ್ಲಿದ್ದೀರಿ. ನಿಮ್ಮ ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಲು ಕೆಳಗೆ ಕ್ಲಿಕ್ ಮಾಡಿ.',
    },
    whatHappensNext: {
      en: 'No new Form 18 submission is required. You are already eligible to vote on polling day.',
      kn: 'ಹೊಸ ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಅಗತ್ಯವಿಲ್ಲ. ಚುನಾವಣಾ ದಿನದಂದು ಮತದಾನ ಮಾಡಲು ನೀವು ಈಗಾಗಲೇ ಅರ್ಹರಾಗಿದ್ದೀರಿ.',
    },
    badgeVariant: 'secondary',
    stepperIndex: -1,
    isBranchState: true,
    isTerminal: true,
    defaultSlaDays: 0,
  },

  withdrawn: {
    key: 'withdrawn',
    adminLabel: 'Withdrawn by Applicant',
    adminActionLabel: 'Mark withdrawn',
    adminActionDescription: 'Voter requested withdrawal.',
    publicStepLabel: {
      en: 'Withdrawn',
      kn: 'ಹಿಂಪಡೆಯಲಾಗಿದೆ',
    },
    publicMessage: {
      en: (ctx) => `This request was withdrawn by the applicant on ${ctx?.date ?? 'recent date'}.`,
      kn: (ctx) => `ಈ ವಿನಂತಿಯನ್ನು ಅರ್ಜಿದಾರರ ಕೋರಿಕೆಯಂತೆ ದಿನಾಂಕ ${ctx?.date ?? 'ಇತ್ತೀಚೆಗೆ'} ಹಿಂಪಡೆಯಲಾಗಿದೆ.`,
    },
    whatHappensNext: {
      en: 'This case is archived. You can submit a fresh request if needed in the future.',
      kn: 'ಈ ಅರ್ಜಿಯನ್ನು ಮುಕ್ತಾಯಗೊಳಿಸಲಾಗಿದೆ. ಭವಿಷ್ಯದಲ್ಲಿ ಅಗತ್ಯವಿದ್ದಲ್ಲಿ ಹೊಸ ವಿನಂತಿ ಸಲ್ಲಿಸಬಹುದು.',
    },
    badgeVariant: 'secondary',
    stepperIndex: -1,
    isBranchState: true,
    isTerminal: true,
    defaultSlaDays: 0,
  },

  closed: {
    key: 'closed',
    adminLabel: 'Closed',
    adminActionLabel: 'Close request',
    adminActionDescription: 'Final closure of request lifecycle.',
    publicStepLabel: {
      en: 'Closed',
      kn: 'ಮುಕ್ತಾಯಗೊಂಡಿದೆ',
    },
    publicMessage: {
      en: (ctx) => `This request was closed on ${ctx?.date ?? 'recent date'}.`,
      kn: (ctx) => `ಈ ವಿನಂತಿಯನ್ನು ದಿನಾಂಕ ${ctx?.date ?? 'ಇತ್ತೀಚೆಗೆ'} ಮುಕ್ತಾಯಗೊಳಿಸಲಾಗಿದೆ.`,
    },
    whatHappensNext: {
      en: 'This assistance request is concluded.',
      kn: 'ಈ ವಿನಂತಿಯ ಪ್ರಕ್ರಿಯೆಯು ಮುಕ್ತಾಯಗೊಂಡಿದೆ.',
    },
    badgeVariant: 'secondary',
    stepperIndex: -1,
    isBranchState: true,
    isTerminal: true,
    defaultSlaDays: 0,
  },
};

/**
 * Transition rules: Which statuses are allowed from each status.
 */
export const ALLOWED_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  new: ['contacted', 'needs_info', 'rejected', 'duplicate', 'withdrawn', 'closed'],
  contacted: ['documents_pending', 'verified', 'needs_info', 'rejected', 'duplicate', 'withdrawn', 'closed'],
  documents_pending: ['verified', 'needs_info', 'rejected', 'withdrawn', 'closed'],
  needs_info: ['contacted', 'documents_pending', 'verified', 'rejected', 'withdrawn', 'closed'],
  verified: ['form_submitted', 'rejected', 'withdrawn', 'closed'],
  form_submitted: ['enrolled', 'needs_info', 'rejected', 'withdrawn', 'closed'],
  enrolled: ['closed'],
  rejected: ['new', 'closed'],
  duplicate: ['new', 'closed'],
  withdrawn: ['new', 'closed'],
  closed: ['new'],
};

export const LINEAR_STEPPER_STEPS: Array<{ key: RequestStatus; step: number; labelEn: string; labelKn: string }> = [
  { key: 'new', step: 1, labelEn: 'Received', labelKn: 'ಸ್ವೀಕರಿಸಲಾಗಿದೆ' },
  { key: 'contacted', step: 2, labelEn: 'Contacted', labelKn: 'ಸಂಪರ್ಕಿಸಿದೆ' },
  { key: 'verified', step: 3, labelEn: 'Approved by Team', labelKn: 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ' },
  { key: 'form_submitted', step: 4, labelEn: 'Form Submitted', labelKn: 'ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ' },
  { key: 'enrolled', step: 5, labelEn: 'Name Confirmed', labelKn: 'ಹೆಸರು ದೃಢಪಟ್ಟಿದೆ' },
];

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  if (from === to) return true;
  const allowed = ALLOWED_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export function getStatusConfig(status: string | undefined): StatusMetadata {
  if (!status || !(status in STATUS_MAP)) {
    return STATUS_MAP.new;
  }
  return STATUS_MAP[status as RequestStatus];
}
