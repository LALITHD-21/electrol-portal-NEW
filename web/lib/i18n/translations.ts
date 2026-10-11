export type Language = 'en' | 'kn';

export interface Translations {
  // Candidate Banner
  mlcElection: string;
  constituencyTitle: string;
  candidateName: string;
  candidateRole: string;
  voterCountText: string;
  bannerNotice: string;
  findNameTitle: string;
  searchPlaceholder: string;
  addRelativeBtn: string;
  hideRelativeBtn: string;
  relativePlaceholder: string;
  searchTip: string;

  // Districts
  allPlaces: string;
  tumkur: string;
  chitradurga: string;
  davanagere: string;
  kolar: string;
  chikkaballapura: string;

  // Filters
  districtLabel: string;
  talukLabel: string;
  acLabel: string;
  partLabel: string;
  villageLabel: string;
  clearFilters: string;
  filterByLocation: string;
  moreFilters: string;
  hideFilters: string;

  // PWA Install
  pwaInstallTitle: string;
  pwaInstallSubtitle: string;
  pwaInstallBtn: string;

  // Search Results
  votersFound: string;
  exactEpicMatch: string;
  fuzzyMatch: string;
  noVotersFound: string;
  noVotersDesc: string;
  nameNotInListTitle: string;
  nameNotInListDesc: string;
  requestAddBtn: string;
  clearFiltersRetry: string;
  fatherSpouseLabel: string;
  partLabelShort: string;
  serialLabelShort: string;
  viewDetails: string;
  downloadSlip: string;
  requestCorrection: string;

  // Polling Booth
  boothInfoTitle: string;
  pollingAddress: string;

  // Modals & Slips
  voterSlipTitle: string;
  voterProfileTitle: string;
  printBtn: string;
  downloadBtn: string;
  shareBtn: string;
  closeBtn: string;
  trackAppBtn: string;
  enrolForm18Title: string;
  correctionFormTitle: string;
  fullNameLabel: string;
  mobileLabel: string;
  epicLabel: string;
  submitRequestBtn: string;
  backToSearch: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    mlcElection: 'MLC ELECTION 2026',
    constituencyTitle: "South-East Graduates' Constituency, Karnataka",
    candidateName: 'SHASHI HULIKUNTEMUTT',
    candidateRole: 'INC Candidate',
    voterCountText: '1,92,696 graduate voters listed',
    bannerNotice:
      'Graduates whose name is not found can send a request below. Our team will call and help you enrol.',
    findNameTitle: 'Find your name in the voter list',
    searchPlaceholder: 'Type your name or EPIC number...',
    addRelativeBtn: '+ Add father / husband name',
    hideRelativeBtn: '− Hide relative name',
    relativePlaceholder: 'Relative / Father / Husband name...',
    searchTip:
      'Tip: type at least 3 letters. Names are in English as per the voter list.',

    allPlaces: 'All places',
    tumkur: 'Tumkur',
    chitradurga: 'Chitradurga',
    davanagere: 'Davanagere',
    kolar: 'Kolar',
    chikkaballapura: 'Chikkaballapura',

    districtLabel: 'District / Constituency Region',
    talukLabel: 'Taluk',
    acLabel: 'Assembly Constituency (AC)',
    partLabel: 'Polling Station / Part Number',
    villageLabel: 'Village / Area',
    clearFilters: 'Clear Filters',
    filterByLocation: 'Filter by Location',
    moreFilters: 'More Filters',
    hideFilters: 'Hide Filters',

    pwaInstallTitle: 'Install Voter Search App',
    pwaInstallSubtitle: 'Fast offline search, works seamlessly on iOS & Android',
    pwaInstallBtn: 'Install',

    votersFound: 'Voters Found',
    exactEpicMatch: 'Exact EPIC Match',
    fuzzyMatch: 'Fuzzy / Transliteration Match',
    noVotersFound: 'No Voters Found',
    noVotersDesc:
      'No voter record matches your search query. Check spelling, enable fuzzy search, or adjust filters.',
    nameNotInListTitle: 'Name not in the list?',
    nameNotInListDesc:
      'Send your details — our campaign team will call you and help you enrol.',
    requestAddBtn: 'Request to add (Form 18)',
    clearFiltersRetry: 'Clear Filters & Retry',
    fatherSpouseLabel: 'Father/Spouse:',
    partLabelShort: 'Part',
    serialLabelShort: 'Serial',
    viewDetails: 'View Details',
    downloadSlip: 'Download Slip',
    requestCorrection: 'Request Correction',

    boothInfoTitle: 'Official Polling Station Information',
    pollingAddress: 'Polling Address',

    voterSlipTitle: 'Official Voter Information Slip',
    voterProfileTitle: 'Elector Profile Details',
    printBtn: 'Print Voter Slip',
    downloadBtn: 'Download Slip',
    shareBtn: 'Share via WhatsApp',
    closeBtn: 'Close',
    trackAppBtn: 'Track Application Status',
    enrolForm18Title: 'Enrol as Graduate Voter (Form 18)',
    correctionFormTitle: 'Request Voter Details Correction',
    fullNameLabel: 'Full Name',
    mobileLabel: 'Mobile Number',
    epicLabel: 'EPIC (Voter ID) Number',
    submitRequestBtn: 'Submit Request',
    backToSearch: 'Back to voter search',
  },
  kn: {
    mlcElection: 'ವಿಧಾನ ಪರಿಷತ್ ಚುನಾವಣೆ 2026',
    constituencyTitle: 'ಕರ್ನಾಟಕ ಆಗ್ನೇಯ ಪದವೀಧರರ ಕ್ಷೇತ್ರ',
    candidateName: 'ಶಶಿ ಹುಲಿಕುಂಟೆಮಠ್',
    candidateRole: 'ಕಾಂಗ್ರೆಸ್ ಅಭ್ಯರ್ಥಿ',
    voterCountText: '1,92,696 ನೋಂದಾಯಿತ ಪದವೀಧರ ಮತದಾರರು',
    bannerNotice:
      'ಮತದಾರರ ಪಟ್ಟಿಯಲ್ಲಿ ಹೆಸರು ಇಲ್ಲದ ಪದವೀಧರರು ಕೆಳಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು. ನಮ್ಮ ತಂಡವು ಸಂಪರ್ಕಿಸಿ ನೋಂದಣಿಗೆ ನೆರವಾಗಲಿದೆ.',
    findNameTitle: 'ಮತದಾರರ ಪಟ್ಟಿಯಲ್ಲಿ ನಿಮ್ಮ ಹೆಸರು ಹುಡುಕಿ',
    searchPlaceholder: 'ನಿಮ್ಮ ಹೆಸರು ಅಥವಾ EPIC ಸಂಖ್ಯೆ ನಮೂದಿಸಿ...',
    addRelativeBtn: '+ ತಂದೆ / ಪತಿಯ ಹೆಸರು ಸೇರಿಸಿ',
    hideRelativeBtn: '− ಸಂಬಂಧಿಕರ ಹೆಸರು ಮರೆಮಾಡಿ',
    relativePlaceholder: 'ಸಂಬಂಧಿಕರು / ತಂದೆ / ಪತಿಯ ಹೆಸರು...',
    searchTip:
      'ಸುಳಿವು: ಕನಿಷ್ಠ 3 ಅಕ್ಷರಗಳನ್ನು ಟೈಪ್ ಮಾಡಿ. ಅಧಿಕೃತ ಪಟ್ಟಿಯ ಪ್ರಕಾರ ಹೆಸರುಗಳು ಲಭ್ಯವಿವೆ.',

    allPlaces: 'ಎಲ್ಲಾ ಪ್ರದೇಶಗಳು',
    tumkur: 'ತುಮಕೂರು',
    chitradurga: 'ಚಿತ್ರದುರ್ಗ',
    davanagere: 'ದಾವಣಗೆರೆ',
    kolar: 'ಕೋಲಾರ',
    chikkaballapura: 'ಚಿಕ್ಕಬಳ್ಳಾಪುರ',

    districtLabel: 'ಜಿಲ್ಲೆ / ಕ್ಷೇತ್ರದ ವ್ಯಾಪ್ತಿ',
    talukLabel: 'ತಾಲೂಕು',
    acLabel: 'ವಿಧಾನಸಭಾ ಕ್ಷೇತ್ರ (AC)',
    partLabel: 'ಮತಗಟ್ಟೆ / ಭಾಗ ಸಂಖ್ಯೆ',
    villageLabel: 'ಗ್ರಾಮ / ಬಡಾವಣೆ',
    clearFilters: 'ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ',
    filterByLocation: 'ಸ್ಥಳದ ಪ್ರಕಾರ ಫಿಲ್ಟರ್ ಮಾಡಿ',
    moreFilters: 'ಹೆಚ್ಚಿನ ಫಿಲ್ಟರ್‌ಗಳು',
    hideFilters: 'ಫಿಲ್ಟರ್ ಮುಚ್ಚಿ',

    pwaInstallTitle: 'ಮತದಾರರ ಹುಡುಕಾಟ ಆ್ಯಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ',
    pwaInstallSubtitle: 'ಆಂಡ್ರಾಯ್ಡ್ ಮತ್ತು ಐಫೋನ್‌ಗಾಗಿ ತ್ವರಿತ ಹುಡುಕಾಟ',
    pwaInstallBtn: 'ಇನ್‌ಸ್ಟಾಲ್',

    votersFound: 'ಮತದಾರರು ಕಂಡುಬಂದಿದ್ದಾರೆ',
    exactEpicMatch: 'ಖಚಿತ EPIC ಹೊಂದಾಣಿಕೆ',
    fuzzyMatch: 'ಹೆಸರಿನ ಹೊಂದಾಣಿಕೆ',
    noVotersFound: 'ಯಾವುದೇ ಮತದಾರರ ಮಾಹಿತಿ ದೊರೆತಿಲ್ಲ',
    noVotersDesc:
      'ನೀವು ಹುಡುಕಿದ ವಿವರಗಳಿಗೆ ಯಾವುದೇ ಮತದಾರರ ದಾಖಲೆ ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ. ಅಕ್ಷರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಫಿಲ್ಟರ್ ಬದಲಾಯಿಸಿ.',
    nameNotInListTitle: 'ಪಟ್ಟಿಯಲ್ಲಿ ನಿಮ್ಮ ಹೆಸರು ಇಲ್ಲವೇ?',
    nameNotInListDesc:
      'ನಿಮ್ಮ ವಿವರ ಕಳುಹಿಸಿ — ನಮ್ಮ ತಂಡದವರು ಕರೆ ಮಾಡಿ ಮತದಾರರ ಪಟ್ಟಿಗೆ ಸೇರಿಸಲು ನೆರವಾಗುತ್ತಾರೆ.',
    requestAddBtn: 'ಹೆಸರು ಸೇರಿಸಲು ಅರ್ಜಿ (ನಮೂನೆ 18)',
    clearFiltersRetry: 'ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ ಮತ್ತೆ ಹುಡುಕಿ',
    fatherSpouseLabel: 'ತಂದೆ/ಪತಿ:',
    partLabelShort: 'ಭಾಗ',
    serialLabelShort: 'ಕ್ರ.ಸಂ',
    viewDetails: 'ವಿವರ ವೀಕ್ಷಿಸಿ',
    downloadSlip: 'ಸ್ಲಿಪ್ ಡೌನ್‌ಲೋಡ್',
    requestCorrection: 'ತಿದ್ದುಪಡಿಗೆ ವಿನಂತಿ',

    boothInfoTitle: 'ಅಧಿಕೃತ ಮತಗಟ್ಟೆ ಮಾಹಿತಿ',
    pollingAddress: 'ಮತಗಟ್ಟೆ ವಿಳಾಸ',

    voterSlipTitle: 'ಅಧಿಕೃತ ಮತದಾರರ ಮಾಹಿತಿ ಸ್ಲಿಪ್',
    voterProfileTitle: 'ಮತದಾರರ ವಿವರಗಳು',
    printBtn: 'ಮತದಾರರ ಸ್ಲಿಪ್ ಪ್ರಿಂಟ್ ಮಾಡಿ',
    downloadBtn: 'ಸ್ಲಿಪ್ ಡೌನ್‌ಲೋಡ್',
    shareBtn: 'ವಾಟ್ಸಾಪ್ ಮೂಲಕ ಹಂಚಿಕೊಳ್ಳಿ',
    closeBtn: 'ಮುಚ್ಚಿ',
    trackAppBtn: 'ಅರ್ಜಿಯ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ',
    enrolForm18Title: 'ಪದವೀಧರ ಮತದಾರರಾಗಿ ನೋಂದಾಯಿಸಿ (ನಮೂನೆ 18)',
    correctionFormTitle: 'ಮತದಾರರ ವಿವರ ತಿದ್ದುಪಡಿಗೆ ವಿನಂತಿ',
    fullNameLabel: 'ಪೂರ್ಣ ಹೆಸರು',
    mobileLabel: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
    epicLabel: 'EPIC (ಮತದಾರರ ಗುರುತಿನ ಚೀಟಿ) ಸಂಖ್ಯೆ',
    submitRequestBtn: 'ಅರ್ಜಿ ಸಲ್ಲಿಸಿ',
    backToSearch: 'ಮತದಾರರ ಹುಡುಕಾಟಕ್ಕೆ ಹಿಂತಿರುಗಿ',
  },
};
