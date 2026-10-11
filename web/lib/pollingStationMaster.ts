/**
 * Master Polling Station Directory & Auxiliary Booth Resolution Engine
 * Contains all 239 Primary & Auxiliary Polling Booths parsed from
 * 'new poling addres/update polling address.xlsx'.
 */

export interface MasterPollingBooth {
  boothCode: string;
  basePart: string;
  isAuxiliary: boolean;
  buildingName: string;
  location: string;
  pollingArea: string;
  roomNumber: string | null;
  minSerial: number | null;
  maxSerial: number | null;
  rangeText: string | null;
}

export interface PollingStationDetails {
  basePartNumber: string;
  boothCode: string;
  boothLabel: string;
  isAuxiliary: boolean;
  boothType: 'Primary Booth' | 'Auxiliary Booth';
  buildingName: string;
  location: string;
  pollingArea: string;
  serialRangeText: string | null;
  thresholdNotice: string | null;
  roomNumber: string | null;
}

export const POLLING_BOOTHS_MASTER: MasterPollingBooth[] = [
  {
    "boothCode": "1",
    "basePart": "1",
    "isAuxiliary": false,
    "buildingName": "Mariya Nivasa Higher Primary School Room no.1 Harihara",
    "location": "Harihara-1",
    "pollingArea": "Harihara City Municipal Ward No 1 to 17 (SL No. 1-850)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 850,
    "rangeText": "SL No. 1 – 850"
  },
  {
    "boothCode": "1A",
    "basePart": "1",
    "isAuxiliary": true,
    "buildingName": "Mariya Nivasa Higher Primary School Room no.2 Harihara",
    "location": "Harihara-1",
    "pollingArea": "Harihara City Municipal I Ward No 1 to 17 (SL No. 851 Above)",
    "roomNumber": "Room 2",
    "minSerial": 851,
    "maxSerial": 999999,
    "rangeText": "SL No. 851 & Above"
  },
  {
    "boothCode": "2",
    "basePart": "2",
    "isAuxiliary": false,
    "buildingName": "S.G.R.K.S. First Grade Womens College, Room No-1 Harihara",
    "location": "Harihara-2",
    "pollingArea": "Harihara City Municipal Ward No 18 to31 (SL No. 1-600)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 600,
    "rangeText": "SL No. 1 – 600"
  },
  {
    "boothCode": "2A",
    "basePart": "2",
    "isAuxiliary": true,
    "buildingName": "S.G.R.K.S. First Grade Womens College, Room No-2 Harihara",
    "location": "Harihara-2",
    "pollingArea": "Harihara City Municipal Ward No 18 to31 (SL No. 601 Above)",
    "roomNumber": "Room 2",
    "minSerial": 601,
    "maxSerial": 999999,
    "rangeText": "SL No. 601 & Above"
  },
  {
    "boothCode": "3",
    "basePart": "3",
    "isAuxiliary": false,
    "buildingName": "Govt. Girls Highschool, Room No- 1, Gandhi Maidana, Harihara",
    "location": "Harihara-3",
    "pollingArea": "All Villages of Kasaba Hdbli in Harihara Taluk ' (SL No. 1-750)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 750,
    "rangeText": "SL No. 1 – 750"
  },
  {
    "boothCode": "3A",
    "basePart": "3",
    "isAuxiliary": true,
    "buildingName": "Govt. Girls Highschool, Room No- 2, Gandhi Maidana, Harihara",
    "location": "Harihara-3",
    "pollingArea": "All Villages of Kasaba Hobli in Harihara Taluk (SL No. 751 Above)",
    "roomNumber": "Room 2",
    "minSerial": 751,
    "maxSerial": 999999,
    "rangeText": "SL No. 751 & Above"
  },
  {
    "boothCode": "4",
    "basePart": "4",
    "isAuxiliary": false,
    "buildingName": "Govt. PU College Room No-1 Jigali Road, Malebennuru",
    "location": "Malebennuru",
    "pollingArea": "Malebennuru Town Municipal Ward No 1 to 23",
    "roomNumber": "Room 1",
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "5",
    "basePart": "5",
    "isAuxiliary": false,
    "buildingName": "Govt. PU College Room No-2 Jigali Road, Malebennuru",
    "location": "Malebennuru",
    "pollingArea": "All Villages of Malebenm;iru Hobli In Harihara Taluk' (SL No. 1-750) ' '",
    "roomNumber": "Room 2",
    "minSerial": 1,
    "maxSerial": 750,
    "rangeText": "SL No. 1 – 750"
  },
  {
    "boothCode": "5A",
    "basePart": "5",
    "isAuxiliary": true,
    "buildingName": "Govt. PU College Room No-3 Jigali Road, Malebennuru",
    "location": "Malebennuru",
    "pollingArea": "All Villages of Malebennuru Hobli In Harihara Taluk (Sl. No. 751-1500)",
    "roomNumber": "Room 3",
    "minSerial": 751,
    "maxSerial": 1500,
    "rangeText": "SL No. 751 – 1500"
  },
  {
    "boothCode": "5B",
    "basePart": "5",
    "isAuxiliary": true,
    "buildingName": "Govt. PU College Room No-4 Jigali Road, Malebennuru",
    "location": "Malebennuru",
    "pollingArea": "All Villages of Malebennuru Hobli In Harihara Taluk (SL No. 1501 Above)",
    "roomNumber": "Room 4",
    "minSerial": 1501,
    "maxSerial": 999999,
    "rangeText": "SL No. 1501 & Above"
  },
  {
    "boothCode": "6",
    "basePart": "6",
    "isAuxiliary": false,
    "buildingName": "Rajanahalli Seethamma Govt Girls PU College, Room No 1, Davanagere",
    "location": "Davanagere",
    "pollingArea": "1. Gandhinagar 2. S S M Nagar & Mustafa Nagar 3. Siddarameshwara ! Badavane and Mandakki Bhati Layout 4. BashaNagar",
    "roomNumber": "Room 1",
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "7",
    "basePart": "7",
    "isAuxiliary": false,
    "buildingName": "Rajanahalli Seethamma Govt Girls PU College, Room No 2, Davanagere",
    "location": "Davanagere",
    "pollingArea": "5. Babu Jagajeevanaram Nagar, S PS Nagar 2nd Stage, Rajeev Gandhi Badavane & S PS 1st Stage 6. Kurubarakeri 7. Jalinagar & Devaraja Urs Badavane B Block 8. Suresh Nagar",
    "roomNumber": "Room 2",
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "8",
    "basePart": "8",
    "isAuxiliary": false,
    "buildingName": "Rajanahalli Seethamma Govt Girls PU College, Room No 3, Davanagere",
    "location": "Davanagere",
    "pollingArea": "9. Azad Nagar 10. Ganesh Pete 11. Basavaraja Pete 12.Ahamad Nagar",
    "roomNumber": "Room 3",
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "9",
    "basePart": "9",
    "isAuxiliary": false,
    "buildingName": "Rajanahalli Seethamma Govt Girls P U College, Room No 4, Davanagere",
    "location": "Davanagere",
    "pollingArea": "13.Karlmarks Nagar, Muddabhovi Colony & Koracharahatti 14. Chamaraja Pete & Basavaraja Pete 18. Kaipete & Mysabedarakeri 19. Mandipete & Shekharappa Nagar",
    "roomNumber": "Room 4",
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "10",
    "basePart": "10",
    "isAuxiliary": false,
    "buildingName": "Govt Boys P U College, P J Extn. Room No 1 Davanagere",
    "location": "Davanagere",
    "pollingArea": "20. Bharath Colony 21. Basapura 25. KB Badavane & D C M Quatres 45. SJ M Nagar, Yaragunte & Karuru",
    "roomNumber": "Room 1",
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "11",
    "basePart": "11",
    "isAuxiliary": false,
    "buildingName": "Govt Boys P U College, P J Extn. Room No 2 Davanagere",
    "location": "Davanagere",
    "pollingArea": "15. Devaraja Urs Badavane & Vinobanagar 16. Vinobanagar (Sl. No. 1-500)",
    "roomNumber": "Room 2",
    "minSerial": 1,
    "maxSerial": 500,
    "rangeText": "SL No. 1 – 500"
  },
  {
    "boothCode": "11A",
    "basePart": "11",
    "isAuxiliary": true,
    "buildingName": "Govt Boys P U College, P J Extn. Room No 3 Davanagere",
    "location": "Davanagere",
    "pollingArea": "15. Devaraja Urs Badavane & Vinobanagar 16. Vinobanagar (Sl. No. 501 Above)",
    "roomNumber": "Room 3",
    "minSerial": 501,
    "maxSerial": 999999,
    "rangeText": "SL No. 501 & Above"
  },
  {
    "boothCode": "12",
    "basePart": "12",
    "isAuxiliary": false,
    "buildingName": "Govt Boys P U College, P J Extn. Room No 4 Davanagere",
    "location": "Davanagere",
    "pollingArea": "22. Yallammanagar 23. Nijalingappa Badavane & S S Layout",
    "roomNumber": "Room 4",
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "13",
    "basePart": "13",
    "isAuxiliary": false,
    "buildingName": "Govt Boys P U College, P J Extn. Room No 5 Davanagere",
    "location": "Davanagere",
    "pollingArea": "17. P J Badavane 24. M C C A Block & P J Badavane",
    "roomNumber": "Room 5",
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "14",
    "basePart": "14",
    "isAuxiliary": false,
    "buildingName": "Mahila Seva Samaj (R) Smt. T.M. Chinnamma Maheshwaraiah Memorial Pre-University College, Room No.-01 Ashoka Road Davangere",
    "location": "Davanagere",
    "pollingArea": "I 26. KT J Nagar 02 27. KT J Nagar 01 28. Bhagath Singh Nagar (SL No. 1-529)",
    "roomNumber": "Room 01",
    "minSerial": 1,
    "maxSerial": 529,
    "rangeText": "SL No. 1 – 529"
  },
  {
    "boothCode": "14A",
    "basePart": "14",
    "isAuxiliary": true,
    "buildingName": "Mahila Seva Samaj (R) Smt. T.M. Chinnamma Maheshwaraiah Memorial Pre University College, Room No.-02 Ashoka Road Davangere",
    "location": "Davanagere",
    "pollingArea": "26. KT J Nagar 02 27. KT J Nagar 01 28. Bhagath Singh Nagaj: (SL No. 530 Above) !",
    "roomNumber": "Room 02",
    "minSerial": 530,
    "maxSerial": 999999,
    "rangeText": "SL No. 530 & Above"
  },
  {
    "boothCode": "15",
    "basePart": "15",
    "isAuxiliary": false,
    "buildingName": "Mahila Seva Samaj (R) Smt. T.M. Chinnamma Maheshwaraiah Memorial Pre-University College, Room No.-03 Ashoka Road Davangere",
    "location": "Davanagere",
    "pollingArea": "29. Nittuvalli, Anjaneya Badavane & Srirama Badavane 30.Avaragere & Goshale 31. S O G Colony & Anjaneya Mill Badavane ' I",
    "roomNumber": "Room 03",
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "16",
    "basePart": "16",
    "isAuxiliary": false,
    "buildingName": "Mahila Seva Samaj (R) Smt. T.M. Chinnamma Maheshwaraiah Memorial Pre University College, Room No.-04 Ashoka Road Davangere",
    "location": "Davanagere",
    "pollingArea": "32. Nittuvalli Chikkanali-alli Badavane 33.SaraswathiBadavane 34. Shivakumaraswamy Badavane (SI. No. 1-993)",
    "roomNumber": "Room 04",
    "minSerial": 1,
    "maxSerial": 993,
    "rangeText": "SL No. 1 – 993"
  },
  {
    "boothCode": "16A",
    "basePart": "16",
    "isAuxiliary": true,
    "buildingName": "Mahila Seva Samaj (R) Smt. T.M. Chinnamma Maheshwaraiah Memorial Pre-University College, Room No.-05 Ashoka Road Davangere",
    "location": "Davanagere",
    "pollingArea": "32. Nittuvalli Chikkanahalli Badavane I 33. Sru:aswathi Badavane 34. Shivakumaraswamy' Badavane (SI. No. 994 Above)",
    "roomNumber": "Room 05",
    "minSerial": 994,
    "maxSerial": 999999,
    "rangeText": "SL No. 994 & Above"
  },
  {
    "boothCode": "17",
    "basePart": "17",
    "isAuxiliary": false,
    "buildingName": "Mahila Seva Samaj (R) Smt. T.M. Chinnamma Maheshwaraiah Memorial Pre University College, Room No.-06 Ashoka Road Davangere",
    "location": "Davanagere",
    "pollingArea": "35. Nittuvalli New Extension 36. Lenin Nagar 37. KE B Colony (SI. No. 1-500)",
    "roomNumber": "Room 06",
    "minSerial": 1,
    "maxSerial": 500,
    "rangeText": "SL No. 1 – 500"
  },
  {
    "boothCode": "17A",
    "basePart": "17",
    "isAuxiliary": true,
    "buildingName": "Mahila Seva Samaj (R) Smt. T.M. Chinnamma Maheshwaraiah Memorial Pre-University College, Room No.-07 Ashoka Road Davangere",
    "location": "Davanagere",
    "pollingArea": "35. Nittuvalli New Extension 36. Lenin Nagar 37. KE B Colony (Sl.No. 501 Above)",
    "roomNumber": "Room 07",
    "minSerial": 501,
    "maxSerial": 999999,
    "rangeText": "SL No. 501 & Above"
  },
  {
    "boothCode": "18",
    "basePart": "18",
    "isAuxiliary": false,
    "buildingName": "DIET, Room No 1, Davanagere",
    "location": "Davanagere",
    "pollingArea": "38. M C C B Block 39. Vidya Nagar (Sl.No. 1-966)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 966,
    "rangeText": "SL No. 1 – 966"
  },
  {
    "boothCode": "18A",
    "basePart": "18",
    "isAuxiliary": true,
    "buildingName": "DIET, Room No 2, Davanagere",
    "location": "Davanagere",
    "pollingArea": "38. M C C B Block 39. Vidya Nagar (SL No. 967 Above)",
    "roomNumber": "Room 2",
    "minSerial": 967,
    "maxSerial": 999999,
    "rangeText": "SL No. 967 & Above"
  },
  {
    "boothCode": "19",
    "basePart": "19",
    "isAuxiliary": false,
    "buildingName": "DIET, Room No 3, Davanagere",
    "location": "Davanagere",
    "pollingArea": "40. Anjaneya Badavane 42. Siddaveerappa Badavane",
    "roomNumber": "Room 3",
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "20",
    "basePart": "20",
    "isAuxiliary": false,
    "buildingName": "Mothi Veerappa Govt.PU College, Room No 1, Davanagere",
    "location": "Davanagere",
    "pollingArea": "41. Banashankari Badavane, Budda Basava Nagar & Industrial Area 43. Shabanuru & Hosa Kundawada 44. S S Badavane B Block, Vinayaka Nagar & Shanthi Nagar (SL No. 1-699)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 699,
    "rangeText": "SL No. 1 – 699"
  },
  {
    "boothCode": "20A",
    "basePart": "20",
    "isAuxiliary": true,
    "buildingName": "Mothi Veerappa Govt.PU College, Room No 2, Davanagere",
    "location": "Davanagere",
    "pollingArea": "41. Banashankari Badavane, Budda Basava Nagar & Industrial Area 43. Shabanuru & Hosa Kundawada 44. S S Badavane B Block, Vinayaka Nagar & Shanthi Nagar (SL No. 700 Above)",
    "roomNumber": "Room 2",
    "minSerial": 700,
    "maxSerial": 999999,
    "rangeText": "SL No. 700 & Above"
  },
  {
    "boothCode": "21",
    "basePart": "21",
    "isAuxiliary": false,
    "buildingName": "Mothi Veerappa Govt.PU College, Room No 3, Davanagere",
    "location": "Davanagere",
    "pollingArea": "No-106 Davanagere North LAC All Villages",
    "roomNumber": "Room 3",
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "22",
    "basePart": "22",
    "isAuxiliary": false,
    "buildingName": "Mothi Veerappa Govt.PU College, Room No 3, Davanagere",
    "location": "Davanagere",
    "pollingArea": "No-107 Davanagere South LAC All Villages",
    "roomNumber": "Room 3",
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "23",
    "basePart": "23",
    "isAuxiliary": false,
    "buildingName": "Polling Station 23",
    "location": "Upgraded Govt. Higher",
    "pollingArea": "Entire Anagodu Hobli Davanagere Taluk (SL No. 1-600)",
    "roomNumber": null,
    "minSerial": 1,
    "maxSerial": 600,
    "rangeText": "SL No. 1 – 600"
  },
  {
    "boothCode": "24",
    "basePart": "24",
    "isAuxiliary": false,
    "buildingName": "Govt. Model Higher Primary School, Anaji",
    "location": "Anaji",
    "pollingArea": "Entire Anaji Hobli Davanagere Taluk",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "25",
    "basePart": "25",
    "isAuxiliary": false,
    "buildingName": "Karnataka Public school, Room No 1 Mayakonda",
    "location": "Mayakonda",
    "pollingArea": "Entire Mayakonda Hobli Davanagere Taluk",
    "roomNumber": "Room 1",
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "26",
    "basePart": "26",
    "isAuxiliary": false,
    "buildingName": "Maruthi Govt High School, Lokikere Room No-1",
    "location": "Lokikere",
    "pollingArea": "Entire Lokikere Hobli Davanagere Taluk (SL No. 1-600)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 600,
    "rangeText": "SL No. 1 – 600"
  },
  {
    "boothCode": "27",
    "basePart": "27",
    "isAuxiliary": false,
    "buildingName": "Govt PU College, D. BR Ambedkar Circle Jagaluru Room No-1",
    "location": "Jagaluru",
    "pollingArea": "J agalur Town and Kasaba Hobli of Jagalur (SL No. 1-1000)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 1000,
    "rangeText": "SL No. 1 – 1000"
  },
  {
    "boothCode": "28",
    "basePart": "28",
    "isAuxiliary": false,
    "buildingName": "Govt PU College, Hosakere, Jagaluru Takuku",
    "location": "Hosakere",
    "pollingArea": "Hosakere Village Hobli of Sokke",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "29",
    "basePart": "29",
    "isAuxiliary": false,
    "buildingName": "Karnataka Public School, High School And College Section, Bilichodu, Jagaluru Taluku",
    "location": "Bilichodu",
    "pollingArea": "Bilichodu Village Hobli of Bilichodu",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "30",
    "basePart": "30",
    "isAuxiliary": false,
    "buildingName": "Taluk Office, Room-1, Molakalmuru",
    "location": "Kasaba Hobli",
    "pollingArea": "Entire Molakalmuru town and Kasaba hobli (SL No. 1-800)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 800,
    "rangeText": "SL No. 1 – 800"
  },
  {
    "boothCode": "31",
    "basePart": "31",
    "isAuxiliary": false,
    "buildingName": "Shri Gadde Veerabhadrappa Govt Model Higher Primary School, Rampura",
    "location": "Rampura",
    "pollingArea": "Entire Devasamudra hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "32",
    "basePart": "32",
    "isAuxiliary": false,
    "buildingName": "H.P.P.C First Grade College Room No.1 Challakere Town",
    "location": "Kasaba Hobli",
    "pollingArea": "Entire Challakere Town & Kasaba Hobli (SL No. 1-852)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 852,
    "rangeText": "SL No. 1 – 852"
  },
  {
    "boothCode": "32A",
    "basePart": "32",
    "isAuxiliary": true,
    "buildingName": "H.P.P.C First Grade College Room No.2 Challakere Town",
    "location": "Kasaba Hobli",
    "pollingArea": "Entire Challakere Town & Kasaba Hobli (SI. No. 853-1704)",
    "roomNumber": "Room 2",
    "minSerial": 853,
    "maxSerial": 1704,
    "rangeText": "SL No. 853 – 1704"
  },
  {
    "boothCode": "32B",
    "basePart": "32",
    "isAuxiliary": true,
    "buildingName": "H.P.P.C First Grade College Room No.3 Challakere Town",
    "location": "Kasaba Hobli",
    "pollingArea": "Entire Challakere Town & Kasaba Hobli (SL No. 1705-2566)",
    "roomNumber": "Room 3",
    "minSerial": 1705,
    "maxSerial": 2566,
    "rangeText": "SL No. 1705 – 2566"
  },
  {
    "boothCode": "32C",
    "basePart": "32",
    "isAuxiliary": true,
    "buildingName": "H.P.P.C First Grade College Room No.4 Challakere Town",
    "location": "Kasaba Hobli",
    "pollingArea": "Entire Challakere Town & Kasaba Hobli (SL No. 2557-3408)",
    "roomNumber": "Room 4",
    "minSerial": 2557,
    "maxSerial": 3408,
    "rangeText": "SL No. 2557 – 3408"
  },
  {
    "boothCode": "32D",
    "basePart": "32",
    "isAuxiliary": true,
    "buildingName": "H.P.P.C First Grade College Room No.5 Challakere Town",
    "location": "Kasaba Hobli",
    "pollingArea": "Entire Challakere Town & Kasaba Hobli (SL No. 3409-4259)",
    "roomNumber": "Room 5",
    "minSerial": 3409,
    "maxSerial": 4259,
    "rangeText": "SL No. 3409 – 4259"
  },
  {
    "boothCode": "33",
    "basePart": "33",
    "isAuxiliary": false,
    "buildingName": "Govt.junior college, Room No.1 Parashurampura",
    "location": "Parashurampura",
    "pollingArea": "Entire Parashurampura Hobli (SL No. 1-683)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 683,
    "rangeText": "SL No. 1 – 683"
  },
  {
    "boothCode": "33A",
    "basePart": "33",
    "isAuxiliary": true,
    "buildingName": "Govt.junior college, Room No.2 Parashurampura",
    "location": "Parashurampura",
    "pollingArea": "Entire Parashurampura Hobli (SL No. 684-1366)",
    "roomNumber": "Room 2",
    "minSerial": 684,
    "maxSerial": 1366,
    "rangeText": "SL No. 684 – 1366"
  },
  {
    "boothCode": "34",
    "basePart": "34",
    "isAuxiliary": false,
    "buildingName": "Govt.Urdu Higher primary School, Room No.1 Nayakanahatti",
    "location": "Nayakanahatti",
    "pollingArea": "Entire Nayakanahatti Hobli (SL No. 1-700)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 700,
    "rangeText": "SL No. 1 – 700"
  },
  {
    "boothCode": "34A",
    "basePart": "34",
    "isAuxiliary": true,
    "buildingName": "Govt.Urdu Higher primary School, Room No.2 Nayakanahatti",
    "location": "Nayakanahatti",
    "pollingArea": "Entire Nayakanahatti Hobli (SL No. 701-1400)",
    "roomNumber": "Room 2",
    "minSerial": 701,
    "maxSerial": 1400,
    "rangeText": "SL No. 701 – 1400"
  },
  {
    "boothCode": "35",
    "basePart": "35",
    "isAuxiliary": false,
    "buildingName": "Govt.junior college, Room No.1 Talaku",
    "location": "Talaku",
    "pollingArea": "Entire Talaku Hobli (SL No. 1-617)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 617,
    "rangeText": "SL No. 1 – 617"
  },
  {
    "boothCode": "35A",
    "basePart": "35",
    "isAuxiliary": true,
    "buildingName": "Govt.junior college , Room No.2 Talaku",
    "location": "Talaku",
    "pollingArea": "Entire Talaku Hobli (SL No. 618-1234)",
    "roomNumber": "Room 2",
    "minSerial": 618,
    "maxSerial": 1234,
    "rangeText": "SL No. 618 – 1234"
  },
  {
    "boothCode": "36",
    "basePart": "36",
    "isAuxiliary": false,
    "buildingName": "Govt PU College for Girls, B.D. Road, Room No-1, Chitradurga City",
    "location": "Kasaba",
    "pollingArea": "Entire Chitradurga City Kasaba hobli, (SL No.1-800)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 800,
    "rangeText": "SL No. 1 – 800"
  },
  {
    "boothCode": "37",
    "basePart": "37",
    "isAuxiliary": false,
    "buildingName": "Govt Higher Primary School, Hireguntanuru",
    "location": "Hireguntanu",
    "pollingArea": "Entire Hireguntanuru hobli,",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "38",
    "basePart": "38",
    "isAuxiliary": false,
    "buildingName": "Govt Higher Primary School, Room No-1 Bharamasagara,",
    "location": "Bharamasagara",
    "pollingArea": "Entire Bharamasagara hobli, (SL No. 1-800) 'I I",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 800,
    "rangeText": "SL No. 1 – 800"
  },
  {
    "boothCode": "39",
    "basePart": "39",
    "isAuxiliary": false,
    "buildingName": "Govt PU College, Room No-1, Turuvanuru",
    "location": "Turuvanuru",
    "pollingArea": "Entire Turuvanur hobli,",
    "roomNumber": "Room 1",
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "40",
    "basePart": "40",
    "isAuxiliary": false,
    "buildingName": "Govt Higher Primary School, Room No-1 Dharmapura",
    "location": "Dharmapura",
    "pollingArea": "Entire Dharmapura Hobli (SI. No. 1-800)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 800,
    "rangeText": "SL No. 1 – 800"
  },
  {
    "boothCode": "40A",
    "basePart": "40",
    "isAuxiliary": true,
    "buildingName": "Govt Higher Primary School, Room No-2 Dharmapura",
    "location": "Dharmapura",
    "pollingArea": "Entire Dharmapura Hobli (SI. No. 801-1275)",
    "roomNumber": "Room 2",
    "minSerial": 801,
    "maxSerial": 1275,
    "rangeText": "SL No. 801 – 1275"
  },
  {
    "boothCode": "41",
    "basePart": "41",
    "isAuxiliary": false,
    "buildingName": "Govt-Pre University College, Room No-1, Beside Hospital Main Road, Hiriyur",
    "location": "Kasaba Hobli",
    "pollingArea": "Entire Hiriyur Town and Entire Kasaba Hobli (SI. No. 1-800)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 800,
    "rangeText": "SL No. 1 – 800"
  },
  {
    "boothCode": "41A",
    "basePart": "41",
    "isAuxiliary": true,
    "buildingName": "Govt-Pre University College, Room No-2, Beside. Hospital Main Road, Hiriyur",
    "location": "Kasaba Hobli",
    "pollingArea": "Entire Hiriyur Town and Entire Kasaba Hobli (SI. No. 801-1600)",
    "roomNumber": "Room 2",
    "minSerial": 801,
    "maxSerial": 1600,
    "rangeText": "SL No. 801 – 1600"
  },
  {
    "boothCode": "418",
    "basePart": "418",
    "isAuxiliary": false,
    "buildingName": "Govt-Pre University College, Room No-3, Beside Hospital Main Road, Hiriyur",
    "location": "Kasaba Hobli",
    "pollingArea": "Entire Hiriyur Town and Entire Kasaba Hobli (SI. No. 1601-2400)",
    "roomNumber": "Room 3",
    "minSerial": 1601,
    "maxSerial": 2400,
    "rangeText": "SL No. 1601 – 2400"
  },
  {
    "boothCode": "41C",
    "basePart": "41",
    "isAuxiliary": true,
    "buildingName": "Govt-Pre University College For Girls, Room No-1, Hiriyur",
    "location": "Kasaba Hobli",
    "pollingArea": "Entire Hiriyur Town and Entire Kasaba Hobli (SI. No. 2401-3200)",
    "roomNumber": "Room 1",
    "minSerial": 2401,
    "maxSerial": 3200,
    "rangeText": "SL No. 2401 – 3200"
  },
  {
    "boothCode": "41D",
    "basePart": "41",
    "isAuxiliary": true,
    "buildingName": "Govt-Pre University College For Girls, Room No-2, Hiriyur",
    "location": "Kasaba Hobli",
    "pollingArea": "Entire Hiriyur Town and Entire Kasaba Hobli, (SI. No. 3201-3567))",
    "roomNumber": "Room 2",
    "minSerial": 3201,
    "maxSerial": 3567,
    "rangeText": "SL No. 3201 – 3567"
  },
  {
    "boothCode": "42",
    "basePart": "42",
    "isAuxiliary": false,
    "buildingName": "Govt Higher Primary School, Room No. 1 Aimangala",
    "location": "Aimangla",
    "pollingArea": "Entire Aimangla Hobli, (SI. No. 1-800)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 800,
    "rangeText": "SL No. 1 – 800"
  },
  {
    "boothCode": "42A",
    "basePart": "42",
    "isAuxiliary": true,
    "buildingName": "Govt Higher Primary School, Room No. 2 Aimangala",
    "location": "Aimangla",
    "pollingArea": "Entire Aimangla Hobli {SI. No. 801-1383)",
    "roomNumber": "Room 2",
    "minSerial": 801,
    "maxSerial": 1383,
    "rangeText": "SL No. 801 – 1383"
  },
  {
    "boothCode": "43",
    "basePart": "43",
    "isAuxiliary": false,
    "buildingName": "Govt. Higher Primary School, JG Halli",
    "location": "JG Halli",
    "pollingArea": "Entire JG Halli Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "44",
    "basePart": "44",
    "isAuxiliary": false,
    "buildingName": "Govt. P.U. College (High School), Room No.1, Hosadurga",
    "location": "Kasaba Hobli",
    "pollingArea": "Entire Hosadurga town And Kasaba Hobli (SI. No. 1-800)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 800,
    "rangeText": "SL No. 1 – 800"
  },
  {
    "boothCode": "44A",
    "basePart": "44",
    "isAuxiliary": true,
    "buildingName": "Govt. P.U. College (High School), Room No.2, Hosadurga",
    "location": "Kasaba Hobli",
    "pollingArea": "Entire Hosadurga town And Kasaba Hobli (Sl. No. 801-1600)",
    "roomNumber": "Room 2",
    "minSerial": 801,
    "maxSerial": 1600,
    "rangeText": "SL No. 801 – 1600"
  },
  {
    "boothCode": "44B",
    "basePart": "44",
    "isAuxiliary": true,
    "buildingName": "Govt. P.U. College (High School), Room No.3, Hosadurga",
    "location": "Kasaba Hobli",
    "pollingArea": "Entire Hosadurga town And Kasaba Hobli (SL No. 1601-2400)",
    "roomNumber": "Room 3",
    "minSerial": 1601,
    "maxSerial": 2400,
    "rangeText": "SL No. 1601 – 2400"
  },
  {
    "boothCode": "44C",
    "basePart": "44",
    "isAuxiliary": true,
    "buildingName": "Govt. P.U. College (High School), Room No.4, Hosadurga",
    "location": "Kasaba Hobli",
    "pollingArea": "Entire Hosadurga town And Kasaba Hobli (SL No. 2401-3273",
    "roomNumber": "Room 4",
    "minSerial": 2401,
    "maxSerial": 3273,
    "rangeText": "SL No. 2401 – 3273"
  },
  {
    "boothCode": "45",
    "basePart": "45",
    "isAuxiliary": false,
    "buildingName": "Government Higher Primary School, Madadakere",
    "location": "Madadakere",
    "pollingArea": "Entire Madadakere Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "46",
    "basePart": "46",
    "isAuxiliary": false,
    "buildingName": "Karnataka Public School, Srirampura",
    "location": "Srirampura",
    "pollingArea": "Entire Srirampura Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "47",
    "basePart": "47",
    "isAuxiliary": false,
    "buildingName": "Government Higher Primary School, Mathodu",
    "location": "Mathodu",
    "pollingArea": "Entire Mathodu Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "48",
    "basePart": "48",
    "isAuxiliary": false,
    "buildingName": "Govt Modle Higher Primary Kannada & Urdu School, Room No-1 Holalkere",
    "location": "Kasaba Hobli",
    "pollingArea": "Entire Holalkere Town & Kasaba Hobli (SL No. 1-759)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 759,
    "rangeText": "SL No. 1 – 759"
  },
  {
    "boothCode": "48A",
    "basePart": "48",
    "isAuxiliary": true,
    "buildingName": "Govt Modle Higher Primary Kannada & Urdu School Room No-2 Holalkere",
    "location": "Kasaba Hobli",
    "pollingArea": "Entire Holalkere Town & Kasaba Hobli (SL No. 760-1470)",
    "roomNumber": "Room 2",
    "minSerial": 760,
    "maxSerial": 1470,
    "rangeText": "SL No. 760 – 1470"
  },
  {
    "boothCode": "49",
    "basePart": "49",
    "isAuxiliary": false,
    "buildingName": "Govt, Higher Primary School Bharamannanayakanadurga",
    "location": "Bharamannanaya kanadurga",
    "pollingArea": "Entire B Durga Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "50",
    "basePart": "50",
    "isAuxiliary": false,
    "buildingName": "Govt, Higher Primary School Room No-1 Ramagiri",
    "location": "Ramagiri-1",
    "pollingArea": "Entire Ramagiri Hobli (Sl. No. 1-631)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 631,
    "rangeText": "SL No. 1 – 631"
  },
  {
    "boothCode": "50A",
    "basePart": "50",
    "isAuxiliary": true,
    "buildingName": "Govt, Higher Primary School Room No-2 Ramagiri",
    "location": "Ramagiri-2",
    "pollingArea": "Entire Ramagiri Hobli (SL No. 632-1193)",
    "roomNumber": "Room 2",
    "minSerial": 632,
    "maxSerial": 1193,
    "rangeText": "SL No. 632 – 1193"
  },
  {
    "boothCode": "51",
    "basePart": "51",
    "isAuxiliary": false,
    "buildingName": "Govt, Model Higher Primary School Talya",
    "location": "Talya",
    "pollingArea": "Entire Talya Hobli (1-872)",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "52",
    "basePart": "52",
    "isAuxiliary": false,
    "buildingName": "Government P.U.College. Pavagada Room No-1",
    "location": "Pavagada",
    "pollingArea": "Entire Town Panchayat & Kasaba Hobli (SL No. 1-900)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 900,
    "rangeText": "SL No. 1 – 900"
  },
  {
    "boothCode": "52A",
    "basePart": "52",
    "isAuxiliary": true,
    "buildingName": "Government P.U.College. Pavagada. Room No-2",
    "location": "Pavagada",
    "pollingArea": "Entire Town Panchayat & Kasaba Hobli (Sl No. 901-1777)",
    "roomNumber": "Room 2",
    "minSerial": 901,
    "maxSerial": 1777,
    "rangeText": "SL No. 901 – 1777"
  },
  {
    "boothCode": "53",
    "basePart": "53",
    "isAuxiliary": false,
    "buildingName": "Rashtriya Vidyapeeta High school, Y.N.Hosakote Room No-1",
    "location": "Y.N.Hosakote",
    "pollingArea": "Entire Y.N.Hosakote Hobli (SL No. 1- 700)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 700,
    "rangeText": "SL No. 1 – 700"
  },
  {
    "boothCode": "53A",
    "basePart": "53",
    "isAuxiliary": true,
    "buildingName": "Rashtriya Vidyapeeta High school; Y.N.Hosakote Room No-2",
    "location": "Y.N.Hosakote",
    "pollingArea": "Entire Y.N.Hosakote Hobli (SL No. 701-1345)",
    "roomNumber": "Room 2",
    "minSerial": 701,
    "maxSerial": 1345,
    "rangeText": "SL No. 701 – 1345"
  },
  {
    "boothCode": "54",
    "basePart": "54",
    "isAuxiliary": false,
    "buildingName": "Govt. Higher Primary School, Nagalamadike",
    "location": "Nagalamadike",
    "pollingArea": "Entire Nagalamadike Hobli Entire Nidagal Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "55",
    "basePart": "55",
    "isAuxiliary": false,
    "buildingName": "Govt. Higher Primary School, Mangalawada",
    "location": "Nidagal",
    "pollingArea": "Entire City Municipal Council & Kasaba Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "56",
    "basePart": "56",
    "isAuxiliary": false,
    "buildingName": "Government High School K R Extension Madhugiri",
    "location": "Madhugiri",
    "pollingArea": "(SL No. 1-600)",
    "roomNumber": null,
    "minSerial": 1,
    "maxSerial": 600,
    "rangeText": "SL No. 1 – 600"
  },
  {
    "boothCode": "56A",
    "basePart": "56",
    "isAuxiliary": true,
    "buildingName": "Government High School K R Extension Madhugiri",
    "location": "Madhugiri",
    "pollingArea": "Entire City Municipal Council & Kasaba Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "56B",
    "basePart": "56",
    "isAuxiliary": true,
    "buildingName": "Government High School K R Extension Madhugiri",
    "location": "Madhugiri",
    "pollingArea": "(SL No. 601-1200)",
    "roomNumber": null,
    "minSerial": 601,
    "maxSerial": 1200,
    "rangeText": "SL No. 601 – 1200"
  },
  {
    "boothCode": "57",
    "basePart": "57",
    "isAuxiliary": false,
    "buildingName": "Government Higher Primary School, Dodderi",
    "location": "Dodderi",
    "pollingArea": "Entire City Municipal Council & Kasaba Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "58",
    "basePart": "58",
    "isAuxiliary": false,
    "buildingName": "Government High School I D Halli",
    "location": "ID Halli",
    "pollingArea": "(SL No. 1201-1839)",
    "roomNumber": null,
    "minSerial": 1201,
    "maxSerial": 1839,
    "rangeText": "SL No. 1201 – 1839"
  },
  {
    "boothCode": "59",
    "basePart": "59",
    "isAuxiliary": false,
    "buildingName": "Government Higher Primary School, Kodigenahalli",
    "location": "Kodigenahalli",
    "pollingArea": "Entire Dodderi Hobli Entire I D Halli Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "60",
    "basePart": "60",
    "isAuxiliary": false,
    "buildingName": "Government High School Puravara",
    "location": "l Puravara",
    "pollingArea": "Entire Kodigenahalli Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "61",
    "basePart": "61",
    "isAuxiliary": false,
    "buildingName": "Government High School Medigeshi",
    "location": "Medigeshi",
    "pollingArea": "Entire Puravara Hobli Entire Medigeshi Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "62",
    "basePart": "62",
    "isAuxiliary": false,
    "buildingName": "Govt.PU College, I B Circle, Sira, Room- I",
    "location": "Sira",
    "pollingArea": "Entire City Municipal Council & Kasaba Hobli",
    "roomNumber": "Room I",
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "62A",
    "basePart": "62",
    "isAuxiliary": true,
    "buildingName": "Govt.PU College, I B Circle, Sira, Room-2",
    "location": "Sira",
    "pollingArea": "(Sl. No. 1-700)",
    "roomNumber": "Room 2",
    "minSerial": 1,
    "maxSerial": 700,
    "rangeText": "SL No. 1 – 700"
  },
  {
    "boothCode": "62B",
    "basePart": "62",
    "isAuxiliary": true,
    "buildingName": "Govt.PU College, I B Circle, Sira, Room-3",
    "location": "Sira",
    "pollingArea": "Entire City Municipal Council & Kasaba Hobli",
    "roomNumber": "Room 3",
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "62C",
    "basePart": "62",
    "isAuxiliary": true,
    "buildingName": "Govt.PU College, I B Circle, Sira, Room-4",
    "location": "Sira",
    "pollingArea": "Entire City Municipal Council & Kasaba Hobli (SL No. 2101-2741)",
    "roomNumber": "Room 4",
    "minSerial": 2101,
    "maxSerial": 2741,
    "rangeText": "SL No. 2101 – 2741"
  },
  {
    "boothCode": "63",
    "basePart": "63",
    "isAuxiliary": false,
    "buildingName": "Government Higher Primary School, NH-28 Kallambella",
    "location": "Kallambella",
    "pollingArea": "Entire Kallambella Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "64",
    "basePart": "64",
    "isAuxiliary": false,
    "buildingName": "Government Higher Primary School, Gowdagere",
    "location": "Gowdagere",
    "pollingArea": "Entire Gowdagere Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "65",
    "basePart": "65",
    "isAuxiliary": false,
    "buildingName": "Government High School, Baraguru",
    "location": "Hulikunte",
    "pollingArea": "Entire Hulikunte Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "66",
    "basePart": "66",
    "isAuxiliary": false,
    "buildingName": "Government Higher Primary School, Bukkapattana",
    "location": "Bukkapatna",
    "pollingArea": "Entire Bukkapatna Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "67",
    "basePart": "67",
    "isAuxiliary": false,
    "buildingName": "Court Hall, Taluk Office, Chikk:anayakanahalli",
    "location": "Chikkanayakana halli",
    "pollingArea": "Entire Town Panchayat & Kasaba Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "68",
    "basePart": "68",
    "isAuxiliary": false,
    "buildingName": "Govt..Model Higher Primary School, Huliyaru",
    "location": "Huliyaru",
    "pollingArea": "Entire Huliyaru Pattana Panchayat & Hobli (SL No. 1-600)",
    "roomNumber": null,
    "minSerial": 1,
    "maxSerial": 600,
    "rangeText": "SL No. 1 – 600"
  },
  {
    "boothCode": "68A",
    "basePart": "68",
    "isAuxiliary": true,
    "buildingName": "Govt.. Model Higher Primary School, Huliyaru",
    "location": "Huliyaru",
    "pollingArea": "Entire Huliyaru Pattana Panchayat & Hobli (SL No. 601-1077)",
    "roomNumber": null,
    "minSerial": 601,
    "maxSerial": 1077,
    "rangeText": "SL No. 601 – 1077"
  },
  {
    "boothCode": "69",
    "basePart": "69",
    "isAuxiliary": false,
    "buildingName": "Grama Panchayat Building, Kandikere",
    "location": "Kandikere",
    "pollingArea": "Entire Kandikere Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "70",
    "basePart": "70",
    "isAuxiliary": false,
    "buildingName": "Grama Panchayat Building, Shettikere",
    "location": "Shettikere",
    "pollingArea": "Entire Shettikere Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "71",
    "basePart": "71",
    "isAuxiliary": false,
    "buildingName": "Grama Panchayat Building, Handanakere",
    "location": "Handanakere",
    "pollingArea": "Entire Handanakere Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "72",
    "basePart": "72",
    "isAuxiliary": false,
    "buildingName": "Govt. PU College For Boys, Room No. 1, B.H. Road, Tiptur Town",
    "location": "Tiptur",
    "pollingArea": "Entire Tiptur Town & Kasaba Hobali (SL No. 1-850)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 850,
    "rangeText": "SL No. 1 – 850"
  },
  {
    "boothCode": "72A",
    "basePart": "72",
    "isAuxiliary": true,
    "buildingName": "Govt. PU College For Boys, Room No. 2, B.H. Road, Tiptur Town",
    "location": "Tiptur",
    "pollingArea": "Entire Tiptur Town & Kasaba Hobali (Sl.No. 851-1700)",
    "roomNumber": "Room 2",
    "minSerial": 851,
    "maxSerial": 1700,
    "rangeText": "SL No. 851 – 1700"
  },
  {
    "boothCode": "72B",
    "basePart": "72",
    "isAuxiliary": true,
    "buildingName": "Govt. PU College For Boys, Room No. 3, B.H. Road, Tiptur Town",
    "location": "Tiptur",
    "pollingArea": "Entire Tiptur Town & Kasaba Hobali (Sl. No.1701-2471)",
    "roomNumber": "Room 3",
    "minSerial": 1701,
    "maxSerial": 2471,
    "rangeText": "SL No. 1701 – 2471"
  },
  {
    "boothCode": "73",
    "basePart": "73",
    "isAuxiliary": false,
    "buildingName": "Karnataka Public School (High School Section), Nonavinakere, Tiptur Taluk",
    "location": "Nonavinakere",
    "pollingArea": "Entire Nonavinakere Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "74",
    "basePart": "74",
    "isAuxiliary": false,
    "buildingName": "Karnataka Public School (High School Section), Honnavalli, Tiptur Taluk",
    "location": "Honnavalli",
    "pollingArea": "Entire Honnavalli Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "75",
    "basePart": "75",
    "isAuxiliary": false,
    "buildingName": "GHPS, Kibbanahalli, Tiptur Taluk",
    "location": "Kibbanahalli",
    "pollingArea": "Entire Kibbanahalli Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "76",
    "basePart": "76",
    "isAuxiliary": false,
    "buildingName": "Pattana Panchayath Office (old Building), Turuvekere",
    "location": "Turuvekere",
    "pollingArea": "Entire Town Panchayath & Kasaba Hobli (SL No. 1-700)",
    "roomNumber": null,
    "minSerial": 1,
    "maxSerial": 700,
    "rangeText": "SL No. 1 – 700"
  },
  {
    "boothCode": "76A",
    "basePart": "76",
    "isAuxiliary": true,
    "buildingName": "Pattana Panchayath Office (old Building), Turuvekere",
    "location": "Turuvekere",
    "pollingArea": "Entire Town Panchayath & Kasaba Hobli (SL. No. 701-1292)",
    "roomNumber": null,
    "minSerial": 701,
    "maxSerial": 1292,
    "rangeText": "SL No. 701 – 1292"
  },
  {
    "boothCode": "77",
    "basePart": "77",
    "isAuxiliary": false,
    "buildingName": "Govt. Model Higher Primary School, Mayasandra",
    "location": "Mayasandra",
    "pollingArea": "Entire Mayasandra Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "78",
    "basePart": "78",
    "isAuxiliary": false,
    "buildingName": "Karnataka Public School (High School Section), Dandinashivara",
    "location": "Dandinashivara",
    "pollingArea": "Entire Dandinashivara Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "79",
    "basePart": "79",
    "isAuxiliary": false,
    "buildingName": "Govt. Higher Primary School (East Wing), Dabbeghatta",
    "location": "Dabbeghatta",
    "pollingArea": "Entire Dabbeghatta Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "80",
    "basePart": "80",
    "isAuxiliary": false,
    "buildingName": "Court Hall, Taluk Office Kunigal Taluk",
    "location": "KUNIGAL",
    "pollingArea": "Entire Town & Kasaba Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "81",
    "basePart": "81",
    "isAuxiliary": false,
    "buildingName": "Govt. Higher Primary School , Kottagere",
    "location": "KOTHAGERE",
    "pollingArea": "Entire Kothagere Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "82",
    "basePart": "82",
    "isAuxiliary": false,
    "buildingName": "Nada Kacheri, Huthridurga Hobli",
    "location": "HUTHRlDURGA",
    "pollingArea": "Entire Huthridurga Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "83",
    "basePart": "83",
    "isAuxiliary": false,
    "buildingName": "Govt. Junior College, Huliyurdurga",
    "location": "HULIYURDURGA",
    "pollingArea": "Entire Huliyurdurga Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "84",
    "basePart": "84",
    "isAuxiliary": false,
    "buildingName": "Karnataka Public School(Higher Primary Section), Amruthur",
    "location": "AMRUTHUR",
    "pollingArea": "Entire Amruthur Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "85",
    "basePart": "85",
    "isAuxiliary": false,
    "buildingName": "Sree Siddalingeshwara High School, Yadiyur",
    "location": "YADIYUR",
    "pollingArea": "Entire Yadiyur Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "86",
    "basePart": "86",
    "isAuxiliary": false,
    "buildingName": "Govt, Junior College Gubbi Town, Gubbi",
    "location": "Gubbi Town",
    "pollingArea": "Entire Town Panchayath & Kasaba Hobli (SL No. 1-700)",
    "roomNumber": null,
    "minSerial": 1,
    "maxSerial": 700,
    "rangeText": "SL No. 1 – 700"
  },
  {
    "boothCode": "86A",
    "basePart": "86",
    "isAuxiliary": true,
    "buildingName": "Govt, Junior College Gubbi Town, Gubbi",
    "location": "Gubbi Town-A",
    "pollingArea": "Entire Town Panchayath & Kasaba Hobli (SI. No. 701-1335)",
    "roomNumber": null,
    "minSerial": 701,
    "maxSerial": 1335,
    "rangeText": "SL No. 701 – 1335"
  },
  {
    "boothCode": "87",
    "basePart": "87",
    "isAuxiliary": false,
    "buildingName": "Govt. Model Higher Primary School, Hagalawadi",
    "location": "Hagalawadi",
    "pollingArea": "Entire Hagalawadi Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "88",
    "basePart": "88",
    "isAuxiliary": false,
    "buildingName": "Govt. Model Higher Primary School, Kadaba",
    "location": "Gubbi Town",
    "pollingArea": "Entire Kadaba Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "89",
    "basePart": "89",
    "isAuxiliary": false,
    "buildingName": "Karnataka Public School, Chandrashekarapura",
    "location": "Chandrashekhara pura",
    "pollingArea": "Entire Chandrashekharapura Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "90",
    "basePart": "90",
    "isAuxiliary": false,
    "buildingName": "Govt. Model Higher Primary School, Nittur",
    "location": "Nitturu",
    "pollingArea": "Entire Nitturu Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "91",
    "basePart": "91",
    "isAuxiliary": false,
    "buildingName": "Mahathamagandhi Pre university college Chelur",
    "location": "Cheluru",
    "pollingArea": "Entire Cheluru Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "92",
    "basePart": "92",
    "isAuxiliary": false,
    "buildingName": "Kalidasa Composite Pre-University College, Room No. 1, Sira Gate, Tumkur",
    "location": "Tumkur-1 .",
    "pollingArea": "Entire Ward No.01 to 05 (SL No. 1-750)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 750,
    "rangeText": "SL No. 1 – 750"
  },
  {
    "boothCode": "92A",
    "basePart": "92",
    "isAuxiliary": true,
    "buildingName": "Kalidasa Composite Pre-University College, Room No. 2, Sira Gate, Tumkur",
    "location": "Tumkur-1",
    "pollingArea": "Entire Ward No.01 to 05 (SL No. 751-1472)",
    "roomNumber": "Room 2",
    "minSerial": 751,
    "maxSerial": 1472,
    "rangeText": "SL No. 751 – 1472"
  },
  {
    "boothCode": "93",
    "basePart": "93",
    "isAuxiliary": false,
    "buildingName": "Government Model Higher Primary School, Shishuvihara Compound, Tumkur",
    "location": "Tumkur-2",
    "pollingArea": "Entire Ward No.06 to 10",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "94",
    "basePart": "94",
    "isAuxiliary": false,
    "buildingName": "Siddaganga Pre University College,B H Road Gandhinagara, Tumkur",
    "location": "Tumkur-3",
    "pollingArea": "Entire Ward No.11 to 15 (SL No. 1-650)",
    "roomNumber": null,
    "minSerial": 1,
    "maxSerial": 650,
    "rangeText": "SL No. 1 – 650"
  },
  {
    "boothCode": "94A",
    "basePart": "94",
    "isAuxiliary": true,
    "buildingName": "Siddaganga Pre University College,B H Road Gandhinagara; Tumkur",
    "location": "Tumkur-3",
    "pollingArea": "Entire Ward No.11 to 15 (Sl. No. 651-1283)",
    "roomNumber": null,
    "minSerial": 651,
    "maxSerial": 1283,
    "rangeText": "SL No. 651 – 1283"
  },
  {
    "boothCode": "95",
    "basePart": "95",
    "isAuxiliary": false,
    "buildingName": "Government Higher Primary School, Shanthi nagara ASK Palya",
    "location": "Tumkur-4",
    "pollingArea": "Entire Ward No.16 to 20 (SL No. 1-550)",
    "roomNumber": null,
    "minSerial": 1,
    "maxSerial": 550,
    "rangeText": "SL No. 1 – 550"
  },
  {
    "boothCode": "95A",
    "basePart": "95",
    "isAuxiliary": true,
    "buildingName": "Government Higher Primary School, Shanthi nagara ASK Palya",
    "location": "Tumkur-4",
    "pollingArea": "Entire Ward No.16 to 20 (SL No. 551-1097)",
    "roomNumber": null,
    "minSerial": 551,
    "maxSerial": 1097,
    "rangeText": "SL No. 551 – 1097"
  },
  {
    "boothCode": "96",
    "basePart": "96",
    "isAuxiliary": false,
    "buildingName": "Sri Siddaganga Kannada Elementory Higher Primary School, Room No. - 2",
    "location": "Tumkur-5",
    "pollingArea": "Entire Ward No.21 to 25 (Sl. No. 1-600)",
    "roomNumber": null,
    "minSerial": 1,
    "maxSerial": 600,
    "rangeText": "SL No. 1 – 600"
  },
  {
    "boothCode": "96A",
    "basePart": "96",
    "isAuxiliary": true,
    "buildingName": "Sri Siddaganga Kannada Elementory Higher Primary School, Room No. - 2",
    "location": "Tumkur-5",
    "pollingArea": "Entire Ward No.21 to 25 (SL No. 601-1200)",
    "roomNumber": null,
    "minSerial": 601,
    "maxSerial": 1200,
    "rangeText": "SL No. 601 – 1200"
  },
  {
    "boothCode": "96B",
    "basePart": "96",
    "isAuxiliary": true,
    "buildingName": "Sri Siddaganga Kannada Elementory Higher Primary School, Room No. - 2",
    "location": "Tumkur-5",
    "pollingArea": "Entire Ward No.21 to 25 (Sl. No. 1201-1810)",
    "roomNumber": null,
    "minSerial": 1201,
    "maxSerial": 1810,
    "rangeText": "SL No. 1201 – 1810"
  },
  {
    "boothCode": "97",
    "basePart": "97",
    "isAuxiliary": false,
    "buildingName": "Nalanda convent and high school sapthagiri extension, Room No. - 1",
    "location": "Tumkur-6",
    "pollingArea": "Entire Ward No.26 to 30 (Sl. No. 1-610)",
    "roomNumber": null,
    "minSerial": 1,
    "maxSerial": 610,
    "rangeText": "SL No. 1 – 610"
  },
  {
    "boothCode": "97A",
    "basePart": "97",
    "isAuxiliary": true,
    "buildingName": "Nalanda convent and high school sapthagiri extension, Room No. - 1",
    "location": "Tumkur-6",
    "pollingArea": "Entire Ward No.26 to 30 Sl. No. 611-1220)",
    "roomNumber": null,
    "minSerial": 611,
    "maxSerial": 1220,
    "rangeText": "SL No. 611 – 1220"
  },
  {
    "boothCode": "97B",
    "basePart": "97",
    "isAuxiliary": true,
    "buildingName": "Nalanda convent and high school sapthagiri extension, Room No. - 1",
    "location": "Tumkur-6",
    "pollingArea": "Entire Ward No.26 to 30 (Sl. No. 1221-1821)",
    "roomNumber": null,
    "minSerial": 1221,
    "maxSerial": 1821,
    "rangeText": "SL No. 1221 – 1821"
  },
  {
    "boothCode": "98",
    "basePart": "98",
    "isAuxiliary": false,
    "buildingName": "Government Model Higher Primary School, Kyathsandra, Room No. - 1",
    "location": "Tumkur-7",
    "pollingArea": "Entire Ward No.31 to 35 (SL No. 1-650)",
    "roomNumber": null,
    "minSerial": 1,
    "maxSerial": 650,
    "rangeText": "SL No. 1 – 650"
  },
  {
    "boothCode": "98A",
    "basePart": "98",
    "isAuxiliary": true,
    "buildingName": "Government Model Higher Primary School, Kyathsandra, Room No. - 1",
    "location": "Tumkur-7",
    "pollingArea": "Entire Ward No.31 to 35 (Sl. No. 651-1300)",
    "roomNumber": null,
    "minSerial": 651,
    "maxSerial": 1300,
    "rangeText": "SL No. 651 – 1300"
  },
  {
    "boothCode": "98B",
    "basePart": "98",
    "isAuxiliary": true,
    "buildingName": "Government Model Higher Primary School, Kyathsandra, Room No. - 1",
    "location": "Tumkur-7",
    "pollingArea": "Entire Ward No.31 to 35 (SL No. 1301-1950)",
    "roomNumber": null,
    "minSerial": 1301,
    "maxSerial": 1950,
    "rangeText": "SL No. 1301 – 1950"
  },
  {
    "boothCode": "98C",
    "basePart": "98",
    "isAuxiliary": true,
    "buildingName": "Government Model Higher Primary School, Kyathsandra, Room No. - 1",
    "location": "Tumkur-7",
    "pollingArea": "Entire Ward No.31 to 35 (Sl. No. 1951-2623)",
    "roomNumber": null,
    "minSerial": 1951,
    "maxSerial": 2623,
    "rangeText": "SL No. 1951 – 2623"
  },
  {
    "boothCode": "99",
    "basePart": "99",
    "isAuxiliary": false,
    "buildingName": "Court Hall, Taluk Office, Tumkur",
    "location": "Taluk Office",
    "pollingArea": "Tumkur, Entire Kasaba Hobli of Tumkur Taluk (SL No. 1-700)",
    "roomNumber": null,
    "minSerial": 1,
    "maxSerial": 700,
    "rangeText": "SL No. 1 – 700"
  },
  {
    "boothCode": "99A",
    "basePart": "99",
    "isAuxiliary": true,
    "buildingName": "Taluk Office, Tumkur",
    "location": "Taluk Office",
    "pollingArea": "Tumkur, Entire Kasaba Hobli of Tumkur Taluk (SL No. 701-1387)",
    "roomNumber": null,
    "minSerial": 701,
    "maxSerial": 1387,
    "rangeText": "SL No. 701 – 1387"
  },
  {
    "boothCode": "100",
    "basePart": "100",
    "isAuxiliary": false,
    "buildingName": "Government Higher Primary School, Gulur",
    "location": "Gulur",
    "pollingArea": "Entire Gulur Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "101",
    "basePart": "101",
    "isAuxiliary": false,
    "buildingName": "Ganapathi High School, Hebbur",
    "location": "Hebbur",
    "pollingArea": "Entire Hebbur Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "102",
    "basePart": "102",
    "isAuxiliary": false,
    "buildingName": "Government Higher Primary School, Urdigere",
    "location": "Urdigere",
    "pollingArea": "Entire Urdigere Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "103",
    "basePart": "103",
    "isAuxiliary": false,
    "buildingName": "Kuvempu Government Primary School, Bellavi",
    "location": "Bellavi",
    "pollingArea": "Entire Bellavi Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "104",
    "basePart": "104",
    "isAuxiliary": false,
    "buildingName": "Government Higher Primary School, Kora",
    "location": "Kora",
    "pollingArea": "Entire Kora Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "105",
    "basePart": "105",
    "isAuxiliary": false,
    "buildingName": "Court Hall, Taluk Office, Koratagere",
    "location": "Koratag ere",
    "pollingArea": "Entire City Municipal Council & Kasaba Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "106",
    "basePart": "106",
    "isAuxiliary": false,
    "buildingName": "Karnataka Public School, Holavanahalli",
    "location": "Holavanahalli",
    "pollingArea": "Entire Holavanahalli Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "107",
    "basePart": "107",
    "isAuxiliary": false,
    "buildingName": "Government Model Higher Primary School Thovinakere",
    "location": "Channarayana durga",
    "pollingArea": "Entire Channarayana Durga Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "108",
    "basePart": "108",
    "isAuxiliary": false,
    "buildingName": "Government Higher Primary School,Kolala",
    "location": "Kolala",
    "pollingArea": "Entire Kolala Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "109",
    "basePart": "109",
    "isAuxiliary": false,
    "buildingName": "Taluk Office, Gauribidanur Room No.I",
    "location": "Gauribidanur",
    "pollingArea": "Kasaba, Nagaragere and Hosuru Hobli, Gauribidanur Taluk (SL No. 1 to 800)",
    "roomNumber": "Room I",
    "minSerial": 1,
    "maxSerial": 800,
    "rangeText": "SL No. 1 – 800"
  },
  {
    "boothCode": "109A",
    "basePart": "109",
    "isAuxiliary": true,
    "buildingName": "Taluk Office, Gauribidanur Room No.3",
    "location": "Gauribidanur",
    "pollingArea": "Kasaba, Nagaragere and Hosuru Hobli, Gauribidanur Taluk (SL No. 801 to 1600)",
    "roomNumber": "Room 3",
    "minSerial": 801,
    "maxSerial": 1600,
    "rangeText": "SL No. 801 – 1600"
  },
  {
    "boothCode": "109B",
    "basePart": "109",
    "isAuxiliary": true,
    "buildingName": "Taluk Office, Gauribidanur Room No.4",
    "location": "Gauribidanur",
    "pollingArea": "Kasaba, Nagaragere and Hosuru Hobli, Gauribidanur Taluk (SL No. 1601 to 2400)",
    "roomNumber": "Room 4",
    "minSerial": 1601,
    "maxSerial": 2400,
    "rangeText": "SL No. 1601 – 2400"
  },
  {
    "boothCode": "109C",
    "basePart": "109",
    "isAuxiliary": true,
    "buildingName": "Taluk Office, Gauribidanur Room No.5",
    "location": "Gauribidanur",
    "pollingArea": "Kasaba, Nagaragere and Hosuru Hobli, Gauribidanur Taluk (SL No. 2401 to 3001)",
    "roomNumber": "Room 5",
    "minSerial": 2401,
    "maxSerial": 3001,
    "rangeText": "SL No. 2401 – 3001"
  },
  {
    "boothCode": "110",
    "basePart": "110",
    "isAuxiliary": false,
    "buildingName": "Taluk Office, Gauribidanur Room No.2",
    "location": "Gauribidanur",
    "pollingArea": "D.Palya and Thondebhavi Hobli, Gauribidanur Taluk",
    "roomNumber": "Room 2",
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "111",
    "basePart": "111",
    "isAuxiliary": false,
    "buildingName": "Taluk Office, Manchenahalli",
    "location": "Manchenahalli",
    "pollingArea": "Entire Manchenahalli Taluk",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "112",
    "basePart": "112",
    "isAuxiliary": false,
    "buildingName": "Taluk Office, Chickballapur Room No.I",
    "location": "Chikkaballapura",
    "pollingArea": "Nandi and Kasaba Hobli, Chickballapur Taluk (SL No. 1 to 850)",
    "roomNumber": "Room I",
    "minSerial": 1,
    "maxSerial": 850,
    "rangeText": "SL No. 1 – 850"
  },
  {
    "boothCode": "112A",
    "basePart": "112",
    "isAuxiliary": true,
    "buildingName": "Taluk Office, Chickballapur Room No.2",
    "location": "Chikkaballapura",
    "pollingArea": "Nandi and Kasaba Hobli, Chickballapur Taluk (SL No. 851 to 1700)",
    "roomNumber": "Room 2",
    "minSerial": 851,
    "maxSerial": 1700,
    "rangeText": "SL No. 851 – 1700"
  },
  {
    "boothCode": "112B",
    "basePart": "112",
    "isAuxiliary": true,
    "buildingName": "Taluk Office, Chickballapur RpomNo.3",
    "location": "Chikkaballapura",
    "pollingArea": "Nandi and Kasaba Hobli, Chickballapur Taluk (SL No. 1701 to 2550)",
    "roomNumber": null,
    "minSerial": 1701,
    "maxSerial": 2550,
    "rangeText": "SL No. 1701 – 2550"
  },
  {
    "boothCode": "112C",
    "basePart": "112",
    "isAuxiliary": true,
    "buildingName": "Taluk Office, Chickballapur Room No.4",
    "location": "Chikkaballapura",
    "pollingArea": "Nandi and Kasaba Hobli, Chickballapur Taluk (SL No. 2551 to 3400)",
    "roomNumber": "Room 4",
    "minSerial": 2551,
    "maxSerial": 3400,
    "rangeText": "SL No. 2551 – 3400"
  },
  {
    "boothCode": "112D",
    "basePart": "112",
    "isAuxiliary": true,
    "buildingName": "Taluk Office, Chickballapur Room No.5",
    "location": "Chikkaballapura",
    "pollingArea": "Nandi and Kasaba Hobli, Chickballapur Taluk (SL No. 3401 to 4256)",
    "roomNumber": "Room 5",
    "minSerial": 3401,
    "maxSerial": 4256,
    "rangeText": "SL No. 3401 – 4256"
  },
  {
    "boothCode": "113",
    "basePart": "113",
    "isAuxiliary": false,
    "buildingName": "Govt. PU College, Peresandra, Chikkaballapura",
    "location": "Chikkaballapura",
    "pollingArea": "Mandikal Hobli, Chickballapur Taluk",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "114",
    "basePart": "114",
    "isAuxiliary": false,
    "buildingName": "Taluk Office, Room No.1 Gudibande",
    "location": "Gudibande",
    "pollingArea": "Entire Gudibande Taluk (SL No. 1 to 600)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 600,
    "rangeText": "SL No. 1 – 600"
  },
  {
    "boothCode": "114A",
    "basePart": "114",
    "isAuxiliary": true,
    "buildingName": "Taluk Office, Room No.2 Gudibande",
    "location": "Gudibande",
    "pollingArea": "Entire Gudibande Taluk (SL No. 601 to 1134)",
    "roomNumber": "Room 2",
    "minSerial": 601,
    "maxSerial": 1134,
    "rangeText": "SL No. 601 – 1134"
  },
  {
    "boothCode": "115",
    "basePart": "115",
    "isAuxiliary": false,
    "buildingName": "Taluk Office, Bagepalli Room No.l",
    "location": "Bagepalli",
    "pollingArea": "Guluru, Kasaba and Mittemari Hobli, Bagepalli Taluk (SL No. 1 to 800)",
    "roomNumber": null,
    "minSerial": 1,
    "maxSerial": 800,
    "rangeText": "SL No. 1 – 800"
  },
  {
    "boothCode": "115A",
    "basePart": "115",
    "isAuxiliary": true,
    "buildingName": "Taluk Office, Bagepalli Room No.2",
    "location": "Bagepalli",
    "pollingArea": "Guluru, Kasaba and Mittemari Hobli, Bagepalli Taluk (SL No. 801 to 1600)",
    "roomNumber": "Room 2",
    "minSerial": 801,
    "maxSerial": 1600,
    "rangeText": "SL No. 801 – 1600"
  },
  {
    "boothCode": "115B",
    "basePart": "115",
    "isAuxiliary": true,
    "buildingName": "Taluk Office, Bagepalli Room No.3",
    "location": "Bagepalli",
    "pollingArea": "Guluru, Kasaba and Mittemari Hobli, Bagepalli Taluk (SL No. 1601 to 2043)",
    "roomNumber": "Room 3",
    "minSerial": 1601,
    "maxSerial": 2043,
    "rangeText": "SL No. 1601 – 2043"
  },
  {
    "boothCode": "116",
    "basePart": "116",
    "isAuxiliary": false,
    "buildingName": "Govt. Higher Primary School, Pathapalya, Bagepalli",
    "location": "Bagepalli",
    "pollingArea": "Pathapalya Hobli, Bagepalli Taluk (1 to 246)",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "117",
    "basePart": "117",
    "isAuxiliary": false,
    "buildingName": "Taluk Office, Cheluru Room No.l",
    "location": "Cheluru",
    "pollingArea": "Entire Cheluru Taluk (SL No. 1 to 600)",
    "roomNumber": null,
    "minSerial": 1,
    "maxSerial": 600,
    "rangeText": "SL No. 1 – 600"
  },
  {
    "boothCode": "117A",
    "basePart": "117",
    "isAuxiliary": true,
    "buildingName": "Taluk OffiC:e, Cheluru Room No.2",
    "location": "Cheluru",
    "pollingArea": "Entire Cheluru Taluk (SL No. 601 to 1173)",
    "roomNumber": "Room 2",
    "minSerial": 601,
    "maxSerial": 1173,
    "rangeText": "SL No. 601 – 1173"
  },
  {
    "boothCode": "118",
    "basePart": "118",
    "isAuxiliary": false,
    "buildingName": "Govt. First Grade College, Shidlaghatta Room No. l .",
    "location": "Shidlaghatta",
    "pollingArea": "Jangamakote and Kasaba Hobli, Sidlaghatta Taluk (SL No. 1 to 850)",
    "roomNumber": null,
    "minSerial": 1,
    "maxSerial": 850,
    "rangeText": "SL No. 1 – 850"
  },
  {
    "boothCode": "118A",
    "basePart": "118",
    "isAuxiliary": true,
    "buildingName": "Govt. First Grade College, Shidlaghatta Room No.2",
    "location": "Shidlaghatta",
    "pollingArea": "Jangamakote and Kasaba Hobli, Sidlaghatta Taluk (SL No. 851 to 1700)",
    "roomNumber": "Room 2",
    "minSerial": 851,
    "maxSerial": 1700,
    "rangeText": "SL No. 851 – 1700"
  },
  {
    "boothCode": "118B",
    "basePart": "118",
    "isAuxiliary": true,
    "buildingName": "Govt. First Grade College, Shidlaghatta Room No.3",
    "location": "Shidlaghatta",
    "pollingArea": "Jangamakote and Kasaba Hobli, Sidlaghatta Taluk (SL No. 1701 to 2550)",
    "roomNumber": "Room 3",
    "minSerial": 1701,
    "maxSerial": 2550,
    "rangeText": "SL No. 1701 – 2550"
  },
  {
    "boothCode": "118C",
    "basePart": "118",
    "isAuxiliary": true,
    "buildingName": "Govt. First Grade College, Shidlaghatta Room No.4",
    "location": "Shidlaghatta",
    "pollingArea": "Jangamakote and Kasaba Hobli, Sidlaghatta Taluk (SL No. 2551 to 3307)",
    "roomNumber": "Room 4",
    "minSerial": 2551,
    "maxSerial": 3307,
    "rangeText": "SL No. 2551 – 3307"
  },
  {
    "boothCode": "119",
    "basePart": "119",
    "isAuxiliary": false,
    "buildingName": "Govt. Higher Primary School, Dibburahalli, Sidlaghatta Taluk",
    "location": "Dibburahalli",
    "pollingArea": "Bashettihalli and Sadali Hobli, Sidlaghatta Taluk",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "120",
    "basePart": "120",
    "isAuxiliary": false,
    "buildingName": "Govt. Higher Primary School, Munganahalli",
    "location": "Munganahalli",
    "pollingArea": "Munganahalli Hobli, Chintamani Taluk",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "121",
    "basePart": "121",
    "isAuxiliary": false,
    "buildingName": "Govt. Higher Primary School, Murugamalla",
    "location": "Murugamalla",
    "pollingArea": "Munganahalli Hobli, Chintamani Taluk",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "122",
    "basePart": "122",
    "isAuxiliary": false,
    "buildingName": "Govt. Urdu Primary School, Upparapete Room No. l",
    "location": "Chinthamani",
    "pollingArea": "Ambajidurga Hobli, Chintamani Talukl to (Sl. No. 1 to 600)",
    "roomNumber": null,
    "minSerial": 1,
    "maxSerial": 600,
    "rangeText": "SL No. 1 – 600"
  },
  {
    "boothCode": "122A",
    "basePart": "122",
    "isAuxiliary": true,
    "buildingName": "Govt. Urdu Primary School, Upp�apete Room No.2",
    "location": "Chinthamani",
    "pollingArea": "Ambajidurga Hobli, Chintamani Taluk (Sl. No. 601 to 1159)",
    "roomNumber": "Room 2",
    "minSerial": 601,
    "maxSerial": 1159,
    "rangeText": "SL No. 601 – 1159"
  },
  {
    "boothCode": "123",
    "basePart": "123",
    "isAuxiliary": false,
    "buildingName": "Govt. Higher Primary School, Kaiwara",
    "location": "Kaiwara",
    "pollingArea": "Kaiwara Hobli, Chintamani Taluk (Sl. No. 1 to 500)",
    "roomNumber": null,
    "minSerial": 1,
    "maxSerial": 500,
    "rangeText": "SL No. 1 – 500"
  },
  {
    "boothCode": "123A",
    "basePart": "123",
    "isAuxiliary": true,
    "buildingName": "Govt. Higher Primary School, Kaiwara Room l",
    "location": "Kaiwara",
    "pollingArea": "Kaiwara Hobli, Chintamani Taluk (Sl. No. 501 to 992)",
    "roomNumber": null,
    "minSerial": 501,
    "maxSerial": 992,
    "rangeText": "SL No. 501 – 992"
  },
  {
    "boothCode": "124",
    "basePart": "124",
    "isAuxiliary": false,
    "buildingName": "Government First Grade Co}lege, Chintamani",
    "location": "Chinthamani",
    "pollingArea": "Kasaba Hobli, Chintamani Taluk (Sl. No. l to 800)",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "124A",
    "basePart": "124",
    "isAuxiliary": true,
    "buildingName": "Government First Grade College, Room No.2, Chintamani",
    "location": "Chinthamani",
    "pollingArea": "Kasaba Hobli, Chintamani Taluk (Sl. No. 801 to 1600)",
    "roomNumber": "Room 2",
    "minSerial": 801,
    "maxSerial": 1600,
    "rangeText": "SL No. 801 – 1600"
  },
  {
    "boothCode": "124B",
    "basePart": "124",
    "isAuxiliary": true,
    "buildingName": "Government First Grade College, Room No.3, Chintamani",
    "location": "Chinthamani",
    "pollingArea": "Kasaba Hobli, Chintamani Taluk (Sl. No. 1601 to 2400)",
    "roomNumber": "Room 3",
    "minSerial": 1601,
    "maxSerial": 2400,
    "rangeText": "SL No. 1601 – 2400"
  },
  {
    "boothCode": "124C",
    "basePart": "124",
    "isAuxiliary": true,
    "buildingName": "Government First Grade College, Room No.4, Chintamani",
    "location": "Chinthamani",
    "pollingArea": "Kasaba Hobli, Chintamani Taluk (Sl. No. 2401 to 3200)",
    "roomNumber": "Room 4",
    "minSerial": 2401,
    "maxSerial": 3200,
    "rangeText": "SL No. 2401 – 3200"
  },
  {
    "boothCode": "124D",
    "basePart": "124",
    "isAuxiliary": true,
    "buildingName": "Government First Grade College, Room No.5, Chintamani",
    "location": "Chinthamani",
    "pollingArea": "Kasaba Hobli, Chintamani Taluk (Sl. No. 3201 to 3854)",
    "roomNumber": "Room 5",
    "minSerial": 3201,
    "maxSerial": 3854,
    "rangeText": "SL No. 3201 – 3854"
  },
  {
    "boothCode": "125",
    "basePart": "125",
    "isAuxiliary": false,
    "buildingName": "Govt PU College Gownipalli, Srinivaspura",
    "location": "Rayalpad Hobli",
    "pollingArea": "Entire Rayalpad Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "126",
    "basePart": "126",
    "isAuxiliary": false,
    "buildingName": "Government Model Higher Primary School, Lakshmipura",
    "location": "Nelavanki Hobli",
    "pollingArea": "Entire Nelavanki Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "127",
    "basePart": "127",
    "isAuxiliary": false,
    "buildingName": "Room No. 1, Government Model Higher Primary School, Ronur",
    "location": "Ronur Hobli",
    "pollingArea": "Entire Ronur Hobli (Sl. No. 1-507)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 507,
    "rangeText": "SL No. 1 – 507"
  },
  {
    "boothCode": "127A",
    "basePart": "127",
    "isAuxiliary": true,
    "buildingName": "Room No. 2, Government Model Higher Primary School, Ronur",
    "location": "Entire Ronur Hobli (SL No. 508-1014",
    "pollingArea": "Entire Ronur Hobli (SL No. 508-1014",
    "roomNumber": "Room 2",
    "minSerial": 508,
    "maxSerial": 1014,
    "rangeText": "SL No. 508 – 1014"
  },
  {
    "boothCode": "128",
    "basePart": "128",
    "isAuxiliary": false,
    "buildingName": "Room No. 1, Government Pre University College for Girls, Srinivasapura",
    "location": "Entire Kasaba Hobli (SL No. 1-806)",
    "pollingArea": "Entire Kasaba Hobli (SL No. 1-806)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 806,
    "rangeText": "SL No. 1 – 806"
  },
  {
    "boothCode": "128A",
    "basePart": "128",
    "isAuxiliary": true,
    "buildingName": "Room No. 2,Govemment Pre University College for Girls, Srinivasapura",
    "location": "Entire Kasaba Hobli (SL No. 807-1612)",
    "pollingArea": "Entire Kasaba Hobli (SL No. 807-1612)",
    "roomNumber": "Room 2",
    "minSerial": 807,
    "maxSerial": 1612,
    "rangeText": "SL No. 807 – 1612"
  },
  {
    "boothCode": "128B",
    "basePart": "128",
    "isAuxiliary": true,
    "buildingName": "Room No. 3, Government Pre University College for Girls, Srinivasapura",
    "location": "Entire Kasaba Hobli (SL No. 1613-2418)",
    "pollingArea": "Entire Kasaba Hobli (SL No. 1613-2418)",
    "roomNumber": "Room 3",
    "minSerial": 1613,
    "maxSerial": 2418,
    "rangeText": "SL No. 1613 – 2418"
  },
  {
    "boothCode": "129",
    "basePart": "129",
    "isAuxiliary": false,
    "buildingName": "National High School, Yeldur",
    "location": "Entire Yeldur Hobli",
    "pollingArea": "Entire Yeldur Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "130",
    "basePart": "130",
    "isAuxiliary": false,
    "buildingName": "Government Higher Primary School, Koladevi",
    "location": "Entire Duggasandra Hobli Entire Byrakur Hobli",
    "pollingArea": "Entire Duggasandra Hobli Entire Byrakur Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "131",
    "basePart": "131",
    "isAuxiliary": false,
    "buildingName": "Nadakacheri, Byrakur Hobli, Mulbagal Taluk",
    "location": "Entire Kasaba Hobli (SI. No. 1-751)",
    "pollingArea": "Entire Kasaba Hobli (SI. No. 1-751)",
    "roomNumber": null,
    "minSerial": 1,
    "maxSerial": 751,
    "rangeText": "SL No. 1 – 751"
  },
  {
    "boothCode": "132",
    "basePart": "132",
    "isAuxiliary": false,
    "buildingName": "Room No. 1, Government Junior College for Boys Mulbagal town",
    "location": "Entire Kasaba Hobli (SL No. 752-1502)",
    "pollingArea": "Entire Kasaba Hobli (SL No. 752-1502)",
    "roomNumber": "Room 1",
    "minSerial": 752,
    "maxSerial": 1502,
    "rangeText": "SL No. 752 – 1502"
  },
  {
    "boothCode": "132A",
    "basePart": "132",
    "isAuxiliary": true,
    "buildingName": "Room No. 2, Government Junior College for Boys Mulbagal town",
    "location": "Entire Kasaba Hobli (SL No. 1503-2254)",
    "pollingArea": "Entire Kasaba Hobli (SL No. 1503-2254)",
    "roomNumber": "Room 2",
    "minSerial": 1503,
    "maxSerial": 2254,
    "rangeText": "SL No. 1503 – 2254"
  },
  {
    "boothCode": "132B",
    "basePart": "132",
    "isAuxiliary": true,
    "buildingName": "Room No. 3, Government Junior College for Boys Mulbagal town",
    "location": "Entire Tayalur Hobli Entire Avani Hobli",
    "pollingArea": "Entire Tayalur Hobli Entire Avani Hobli",
    "roomNumber": "Room 3",
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "133",
    "basePart": "133",
    "isAuxiliary": false,
    "buildingName": "Nadakacheri, Tayalur Hobli, Mulbagal Taluk",
    "location": "Entire Huttur Hobli (SL No. 1-521)",
    "pollingArea": "Entire Huttur Hobli (SL No. 1-521)",
    "roomNumber": null,
    "minSerial": 1,
    "maxSerial": 521,
    "rangeText": "SL No. 1 – 521"
  },
  {
    "boothCode": "134",
    "basePart": "134",
    "isAuxiliary": false,
    "buildingName": "Ramalingeshwara Government Junior College, Avani",
    "location": "Entire Huttur Hobli (SL No. 522-1042)",
    "pollingArea": "Entire Huttur Hobli (SL No. 522-1042)",
    "roomNumber": null,
    "minSerial": 522,
    "maxSerial": 1042,
    "rangeText": "SL No. 522 – 1042"
  },
  {
    "boothCode": "135",
    "basePart": "135",
    "isAuxiliary": false,
    "buildingName": "Room No. 1, Government Higher Primary School, Huttur",
    "location": "Entire Holur Hobli",
    "pollingArea": "Entire Holur Hobli",
    "roomNumber": "Room 1",
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "135A",
    "basePart": "135",
    "isAuxiliary": true,
    "buildingName": "Room No. 2, Government Higher Primary School, Huttur",
    "location": "Room No. 2",
    "pollingArea": "Government Higher Primary School, Huttur",
    "roomNumber": "Room 2",
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "136",
    "basePart": "136",
    "isAuxiliary": false,
    "buildingName": "Govt. Kuvempu Model Higher Primary School, Holur",
    "location": "Govt. Kuvempu Model Higher Primary School",
    "pollingArea": "Holur",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "137",
    "basePart": "137",
    "isAuxiliary": false,
    "buildingName": "Government Higher Primary School, Sugatur",
    "location": "Sugtur Hobli",
    "pollingArea": "Entire Sugtur Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "138",
    "basePart": "138",
    "isAuxiliary": false,
    "buildingName": "Room No. 1, Government First Grade College, Vemgal.",
    "location": "Vemgal Hobli",
    "pollingArea": "Entire Vemgal Hobli (SL No. 1-561) •",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 561,
    "rangeText": "SL No. 1 – 561"
  },
  {
    "boothCode": "138A",
    "basePart": "138",
    "isAuxiliary": true,
    "buildingName": "Room No. 2, Government First Grade College, Vemgal.",
    "location": "Vemgal Hobli",
    "pollingArea": "Entire Vemgal Hobli {Sl. No. 562-1122)",
    "roomNumber": "Room 2",
    "minSerial": 562,
    "maxSerial": 1122,
    "rangeText": "SL No. 562 – 1122"
  },
  {
    "boothCode": "139",
    "basePart": "139",
    "isAuxiliary": false,
    "buildingName": "Karnataka Public School, Narasapura",
    "location": "Narasapura Hobli",
    "pollingArea": "Entire Narasapura Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "140",
    "basePart": "140",
    "isAuxiliary": false,
    "buildingName": "Room No. l, Government Pre University College for Girls, Kolar town",
    "location": "Kolar Town (Kasaba Hobli)",
    "pollingArea": "Entire Kasaba Hobli (Sl. No. 1-976)",
    "roomNumber": null,
    "minSerial": 1,
    "maxSerial": 976,
    "rangeText": "SL No. 1 – 976"
  },
  {
    "boothCode": "140A",
    "basePart": "140",
    "isAuxiliary": true,
    "buildingName": "Room No. 2,Govemment Pre University College for Girls, Kolar town",
    "location": "Kolar Town (Kasaba Hobli)",
    "pollingArea": "Entire Kasaba Hobli (SL No. 977-1952)",
    "roomNumber": "Room 2",
    "minSerial": 977,
    "maxSerial": 1952,
    "rangeText": "SL No. 977 – 1952"
  },
  {
    "boothCode": "140B",
    "basePart": "140",
    "isAuxiliary": true,
    "buildingName": "Room No.3, Government Pre University College for Girls, Kolar town",
    "location": "Kolar Town (Kasaba Hobli)",
    "pollingArea": "Entire Kasaba Hobli (Sl. No. 1953-2928)",
    "roomNumber": "Room 3",
    "minSerial": 1953,
    "maxSerial": 2928,
    "rangeText": "SL No. 1953 – 2928"
  },
  {
    "boothCode": "140C",
    "basePart": "140",
    "isAuxiliary": true,
    "buildingName": "Room No. 4, Government Pre University College for Girls, Kolar town",
    "location": "Kolar Town (Kasaba Hobli)",
    "pollingArea": "Entire Kasaba Hobli (Sl. No. 2929-3904)",
    "roomNumber": "Room 4",
    "minSerial": 2929,
    "maxSerial": 3904,
    "rangeText": "SL No. 2929 – 3904"
  },
  {
    "boothCode": "140D",
    "basePart": "140",
    "isAuxiliary": true,
    "buildingName": "Room No. 5, Government Pre University College for Girls, Kolar town",
    "location": "Kolar Town (Kasaba Hobli)",
    "pollingArea": "Entire Kasaba Hobli (SL No. 3905-4878)",
    "roomNumber": "Room 5",
    "minSerial": 3905,
    "maxSerial": 4878,
    "rangeText": "SL No. 3905 – 4878"
  },
  {
    "boothCode": "141",
    "basePart": "141",
    "isAuxiliary": false,
    "buildingName": "Government Higher Primary School, Vokkaleri",
    "location": "Vokkaleri Hobli",
    "pollingArea": "Entire Vokkaleri Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "142",
    "basePart": "142",
    "isAuxiliary": false,
    "buildingName": "Room No. 1, Government Pre University College for Girls, Malur",
    "location": "MalurTow:n (Kasaba Hobli)",
    "pollingArea": "Entire Kasaba Hobli (Sl. No. 1-850)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 850,
    "rangeText": "SL No. 1 – 850"
  },
  {
    "boothCode": "142A",
    "basePart": "142",
    "isAuxiliary": true,
    "buildingName": "Room No. 2, Government Pre University College for Girls, Malur",
    "location": "MalurTown (Kasaba Hobli)",
    "pollingArea": "Entire Kasaba Hobli (Sl. No. 851-1701)",
    "roomNumber": "Room 2",
    "minSerial": 851,
    "maxSerial": 1701,
    "rangeText": "SL No. 851 – 1701"
  },
  {
    "boothCode": "142B",
    "basePart": "142",
    "isAuxiliary": true,
    "buildingName": "Room No. 3, Government Pre University College for Girls, Malur",
    "location": "MalurTown (Kasaba Hobli)",
    "pollingArea": "Entire Kasaba Hobli (SL No. 1702-2552)",
    "roomNumber": "Room 3",
    "minSerial": 1702,
    "maxSerial": 2552,
    "rangeText": "SL No. 1702 – 2552"
  },
  {
    "boothCode": "143",
    "basePart": "143",
    "isAuxiliary": false,
    "buildingName": "Government Higher Primary School, Lakkur",
    "location": "Lakkur Hobli",
    "pollingArea": "Entire Lakkur Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "144",
    "basePart": "144",
    "isAuxiliary": false,
    "buildingName": "Karnataka Public School, Masthi",
    "location": "Masthi Hobli",
    "pollingArea": "Entire Masthi Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "145",
    "basePart": "145",
    "isAuxiliary": false,
    "buildingName": "Govt. PU College, Tekal",
    "location": "Tekal Hobli",
    "pollingArea": "Entire Tekal Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "146",
    "basePart": "146",
    "isAuxiliary": false,
    "buildingName": "Government Higher Primary School, Budikote",
    "location": "Budikote Hobli",
    "pollingArea": "Entire Budikote Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "147",
    "basePart": "147",
    "isAuxiliary": false,
    "buildingName": "Government High School (New Building) Kamasamudra.",
    "location": "Kamasamudra Hobli",
    "pollingArea": "Entire Kamasamudra Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "148",
    "basePart": "148",
    "isAuxiliary": false,
    "buildingName": "Room No. 1, Karnataka Model Higher Primary School, Camping Ground, Bang8IJ)et",
    "location": ".. Bang8IJ)et Town (Kasaba Hobli)",
    "pollingArea": "Entire Kasaba Hobli (Sl. No. 1-957)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 957,
    "rangeText": "SL No. 1 – 957"
  },
  {
    "boothCode": "148A",
    "basePart": "148",
    "isAuxiliary": true,
    "buildingName": "Room No. 2, Karnataka Model Higher Primary School, Camping Ground, Bang8IJ)et",
    "location": "Bang8IJ)et Town (Kasaba Hobli)",
    "pollingArea": "Entire Kasaba Hobli (Sl. No. 958-1915)",
    "roomNumber": "Room 2",
    "minSerial": 958,
    "maxSerial": 1915,
    "rangeText": "SL No. 958 – 1915"
  },
  {
    "boothCode": "148B",
    "basePart": "148",
    "isAuxiliary": true,
    "buildingName": "Room No. 3, Karnataka Model Higher Primary School, Camping Ground, Bang8IJ)et",
    "location": "Bang8IJ)et Town (Kasaba Hobli)",
    "pollingArea": "Entire Kasaba Hobli (SL No. 1916-2875)",
    "roomNumber": "Room 3",
    "minSerial": 1916,
    "maxSerial": 2875,
    "rangeText": "SL No. 1916 – 2875"
  },
  {
    "boothCode": "149",
    "basePart": "149",
    "isAuxiliary": false,
    "buildingName": "Room No. 1, Government Pre University College for Girls, KGF",
    "location": "Robertsonpet Hobli KGFTaluk",
    "pollingArea": "Entire Kasaba Hobli (SL No. 1-741)",
    "roomNumber": "Room 1",
    "minSerial": 1,
    "maxSerial": 741,
    "rangeText": "SL No. 1 – 741"
  },
  {
    "boothCode": "149A",
    "basePart": "149",
    "isAuxiliary": true,
    "buildingName": "Room No. 3, Government Pre University College for Girls, KGF",
    "location": "Robertsonpet Hobli KGFTaluk",
    "pollingArea": "Entire Kasaba Hobli (SL No. 742-1483)",
    "roomNumber": "Room 3",
    "minSerial": 742,
    "maxSerial": 1483,
    "rangeText": "SL No. 742 – 1483"
  },
  {
    "boothCode": "150",
    "basePart": "150",
    "isAuxiliary": false,
    "buildingName": "Grama Panchayath Office, Bethamangala",
    "location": "Bethamangala Hobli",
    "pollingArea": "Entire Beth·amangala Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  },
  {
    "boothCode": "151",
    "basePart": "151",
    "isAuxiliary": false,
    "buildingName": "Grama Panchayath Office, Kyasamballi",
    "location": "Kyasamballi Hobli",
    "pollingArea": "Entire Kyasamballi Hobli",
    "roomNumber": null,
    "minSerial": null,
    "maxSerial": null,
    "rangeText": null
  }
];

// Fast lookup structures
const BOOTH_BY_CODE = new Map<string, MasterPollingBooth>();
const BOOTH_BY_NAME = new Map<string, MasterPollingBooth>();
const BOOTH_BY_ADDRESS = new Map<string, MasterPollingBooth>();
const BOOTHS_BY_BASE_PART = new Map<string, MasterPollingBooth[]>();

for (const b of POLLING_BOOTHS_MASTER) {
  BOOTH_BY_CODE.set(b.boothCode.toUpperCase(), b);
  BOOTH_BY_NAME.set(b.buildingName.toLowerCase().trim(), b);
  BOOTH_BY_ADDRESS.set(`${b.location}, ${b.pollingArea}`.toLowerCase().trim(), b);
  BOOTH_BY_ADDRESS.set(b.pollingArea.toLowerCase().trim(), b);

  if (!BOOTHS_BY_BASE_PART.has(b.basePart)) {
    BOOTHS_BY_BASE_PART.set(b.basePart, []);
  }
  BOOTHS_BY_BASE_PART.get(b.basePart)!.push(b);
}

/**
 * Resolves full polling station details for an elector.
 * Accurately determines Primary vs Auxiliary Booth (e.g. Part 1 vs 1A, 5 vs 5A/5B, 112 vs 112A-112D)
 * and cleanly extracts Building Name, Location, and Polling Area.
 */
export function resolvePollingStationDetails(elector: {
  part_number?: string | number | null;
  serial_number?: number | null;
  polling_station_name?: string | null;
  polling_address?: string | null;
  village?: string | null;
  taluk?: string | null;
  district?: string | null;
}): PollingStationDetails {
  const rawPart = String(elector.part_number || '').trim();
  const rawSerial = typeof elector.serial_number === 'number' ? elector.serial_number : null;
  const rawStationName = String(elector.polling_station_name || '').trim();
  const rawAddress = String(elector.polling_address || '').trim();

  const basePart = rawPart.replace(/[A-Z]+$/i, '') || '1';
  const partCandidates = BOOTHS_BY_BASE_PART.get(basePart) || [];

  // 1. Direct match by booth code if part_number already contains suffix (e.g. '1A', '5B')
  let matched: MasterPollingBooth | undefined;
  if (rawPart && BOOTH_BY_CODE.has(rawPart.toUpperCase())) {
    const direct = BOOTH_BY_CODE.get(rawPart.toUpperCase())!;
    if (direct.isAuxiliary) {
      matched = direct;
    }
  }

  // 2. If part has multiple booths (split into auxiliary booths), resolve among candidate booths
  if (!matched && partCandidates.length > 1) {
    // 2a. Match by voter serial number range (e.g. 1-850 vs 851 Above)
    if (rawSerial !== null) {
      matched = partCandidates.find(c =>
        c.minSerial !== null &&
        c.maxSerial !== null &&
        rawSerial >= c.minSerial &&
        rawSerial <= c.maxSerial
      );

      // If serial is higher than all defined ranges, assign to highest auxiliary booth
      if (!matched) {
        const sorted = [...partCandidates].sort((a, b) => (b.maxSerial || 0) - (a.maxSerial || 0));
        if (sorted[0] && sorted[0].maxSerial && rawSerial > sorted[0].maxSerial) {
          matched = sorted[0];
        }
      }
    }

    // 2b. Match by address within this part's candidate booths
    if (!matched && rawAddress) {
      matched = partCandidates.find(c => {
        const full = (c.location + ', ' + c.pollingArea).toLowerCase().trim();
        return rawAddress.toLowerCase().trim() === full ||
               rawAddress.toLowerCase().includes(c.pollingArea.toLowerCase().trim());
      });
    }

    // 2c. Match by room number in building name (e.g. Room no.1 vs Room no.2)
    if (!matched && rawStationName) {
      matched = partCandidates.find(c =>
        c.roomNumber && rawStationName.toLowerCase().includes(c.roomNumber.toLowerCase())
      );
    }

    // 2d. Default to primary booth for this part
    if (!matched) {
      matched = partCandidates.find(c => !c.isAuxiliary) || partCandidates[0];
    }
  }

  // 3. Single booth part
  if (!matched && partCandidates.length === 1) {
    matched = partCandidates[0];
  }

  // 4. Global match by building name or address if part number was missing
  if (!matched && rawStationName) {
    matched = BOOTH_BY_NAME.get(rawStationName.toLowerCase().trim());
  }
  if (!matched && rawAddress) {
    matched = BOOTH_BY_ADDRESS.get(rawAddress.toLowerCase().trim());
  }

  // 5. Construct comprehensive details
  if (matched) {
    return {
      basePartNumber: matched.basePart,
      boothCode: matched.boothCode,
      boothLabel: matched.isAuxiliary ? `Part ${matched.boothCode} (Auxiliary)` : `Part ${matched.boothCode}`,
      isAuxiliary: matched.isAuxiliary,
      boothType: matched.isAuxiliary ? 'Auxiliary Booth' : 'Primary Booth',
      buildingName: rawStationName || matched.buildingName,
      location: matched.location,
      pollingArea: matched.pollingArea,
      serialRangeText: matched.rangeText,
      thresholdNotice: matched.isAuxiliary
        ? 'Auxiliary Booth created for rolls exceeding 750–850 voters'
        : null,
      roomNumber: matched.roomNumber
    };
  }

  // Generic fallback if not found in master
  let loc = rawAddress;
  let area = rawAddress;
  if (rawAddress.includes(',')) {
    const idx = rawAddress.indexOf(',');
    loc = rawAddress.slice(0, idx).trim();
    area = rawAddress.slice(idx + 1).trim();
  }

  const isAux = /[A-Z]/i.test(rawPart);
  return {
    basePartNumber: rawPart.replace(/[A-Z]+$/i, '') || '1',
    boothCode: rawPart || '1',
    boothLabel: isAux ? `Part ${rawPart} (Auxiliary)` : `Part ${rawPart || '1'}`,
    isAuxiliary: isAux,
    boothType: isAux ? 'Auxiliary Booth' : 'Primary Booth',
    buildingName: rawStationName || `Polling Station ${rawPart || '1'}`,
    location: loc || elector.taluk || elector.district || 'Karnataka',
    pollingArea: area || elector.village || 'Designated Station Area',
    serialRangeText: null,
    thresholdNotice: isAux ? 'Auxiliary Booth created for rolls exceeding 750–850 voters' : null,
    roomNumber: null
  };
}

export function getAllPollingBooths(): MasterPollingBooth[] {
  return POLLING_BOOTHS_MASTER;
}

export function getBoothsForPart(partNumber: string | number): MasterPollingBooth[] {
  const p = String(partNumber).trim().replace(/[A-Z]+$/i, '');
  return BOOTHS_BY_BASE_PART.get(p) || [];
}
