/**
 * Pre-approved Rejection Reasons for Voter Enrolment Requests
 * Enforces neutral, factual, and legally sound bilingual copy.
 */

export interface RejectReasonItem {
  code: string;
  labelEn: string;
  labelKn: string;
  publicTextEn: string;
  publicTextKn: string;
}

export const REJECT_REASONS: RejectReasonItem[] = [
  {
    code: 'INCOMPLETE_DOCS',
    labelEn: 'Incomplete or unclear degree documentation',
    labelKn: 'ಅಪೂರ್ಣ ಅಥವಾ ಅಸ್ಪಷ್ಟ ಶೈಕ್ಷಣಿಕ ದಾಖಲೆಗಳು',
    publicTextEn: 'Uploaded or shared graduation certificate is incomplete or illegible for Form 18.',
    publicTextKn: 'ಫಾರ್ಮ್ 18 ಕ್ಕೆ ಸಲ್ಲಿಸಲಾದ ಪದವಿ ಪ್ರಮಾಣಪತ್ರವು ಅಪೂರ್ಣವಾಗಿದೆ ಅಥವಾ ಸ್ಪಷ್ಟವಾಗಿಲ್ಲ.',
  },
  {
    code: 'NOT_ELIGIBLE_GRAD_YEAR',
    labelEn: 'Graduation completed less than 3 years before qualifying date',
    labelKn: 'ಅರ್ಹತಾ ದಿನಾಂಕಕ್ಕಿಂತ 3 ವರ್ಷಗಳ ಮುಂಚೆ ಪದವಿ ಪೂರ್ಣಗೊಂಡಿಲ್ಲ',
    publicTextEn: 'Degree completion does not satisfy the statutory 3-year prior qualifying requirement under Section 27 of Representation of the People Act, 1950.',
    publicTextKn: 'ಜನಪ್ರತಿನಿಧಿ ಕಾಯ್ದೆ 1950 ರ ಸೆಕ್ಷನ್ 27 ರ ಪ್ರಕಾರ 3 ವರ್ಷಗಳ ಮುಂಚೆ ಪದವಿ ಪೂರ್ಣಗೊಂಡ ಮಾನದಂಡ ಪೂರೈಸಿಲ್ಲ.',
  },
  {
    code: 'OUTSIDE_CONSTITUENCY',
    labelEn: 'Residence outside South-East Graduates constituency',
    labelKn: 'ವಾಸಸ್ಥಳವು ಆಗ್ನೇಯ ಪದವೀಧರ ಕ್ಷೇತ್ರದ ವ್ಯಾಪ್ತಿಗೆ ಬರುವುದಿಲ್ಲ',
    publicTextEn: 'Ordinary residence falls outside the constituent districts (Tumkur, Chitradurga, Davanagere, Kolar, Chikkaballapura).',
    publicTextKn: 'ಸಾಮಾನ್ಯ ವಾಸಸ್ಥಳವು ನಿಗದಿತ ಜಿಲ್ಲೆಗಳ (ತುಮಕೂರು, ಚಿತ್ರದುರ್ಗ, ದಾವಣಗೆರೆ, ಕೋಲಾರ, ಚಿಕ್ಕಬಳ್ಳಾಪುರ) ವ್ಯಾಪ್ತಿಗೆ ಬರುವುದಿಲ್ಲ.',
  },
  {
    code: 'DUPLICATE_APPLICATION',
    labelEn: 'Duplicate application for the same voter',
    labelKn: 'ಅದೇ ಮತದಾರರ ನಕಲಿ ಅರ್ಜಿ',
    publicTextEn: 'An existing verified application is already active for this elector.',
    publicTextKn: 'ಈ ಮತದಾರರಿಗೆ ಈಗಾಗಲೇ ಪರಿಶೀಲಿಸಿದ ಅರ್ಜಿ ಚಾಲ್ತಿಯಲ್ಲಿದೆ.',
  },
  {
    code: 'APPLICANT_WITHDREW',
    labelEn: 'Withdrawn by applicant',
    labelKn: 'ಅರ್ಜಿದಾರರು ವಿನಂತಿಯನ್ನು ಹಿಂಪಡೆದಿದ್ದಾರೆ',
    publicTextEn: 'The applicant requested cancellation of this assistance request.',
    publicTextKn: 'ಅರ್ಜಿದಾರರ ಕೋರಿಕೆಯ ಮೇರೆಗೆ ಈ ವಿನಂತಿಯನ್ನು ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.',
  },
  {
    code: 'NON_RECOGNIZED_INSTITUTION',
    labelEn: 'Educational institution not recognized for Form 18 roll',
    labelKn: 'ಪದವಿ ನೀಡಿದ ಸಂಸ್ಥೆಯು ಮಾನ್ಯತೆ ಪಡೆದಿಲ್ಲ',
    publicTextEn: 'The awarding institution is not listed as a recognized university under statutory election guidelines.',
    publicTextKn: 'ಪದವಿ ನೀಡಿದ ಶಿಕ್ಷಣ ಸಂಸ್ಥೆಯು ಚುನಾವಣಾ ಆಯೋಗದ ಮಾನ್ಯತೆ ಪಡೆದ ವಿಶ್ವವಿದ್ಯಾಲಯಗಳ ಪಟ್ಟಿಯಲ್ಲಿಲ್ಲ.',
  },
];

export function getRejectReason(code: string | undefined): RejectReasonItem | undefined {
  if (!code) return undefined;
  return REJECT_REASONS.find((r) => r.code === code);
}
