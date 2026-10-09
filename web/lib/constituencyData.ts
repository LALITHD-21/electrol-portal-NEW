export interface TalukData {
  name: string;
  hoblis: string[];
  cities: string[];
}

export interface DistrictData {
  name: string;
  taluks: TalukData[];
}

export const CONSTITUENCY_DISTRICTS: DistrictData[] = [
  {
    name: 'Tumkur',
    taluks: [
      {
        name: 'Tumkur City',
        hoblis: ['Ward 1-10', 'Ward 11-20', 'Ward 21-30', 'Ward 31-35', 'Siddaganga Extn', 'Batawadi'],
        cities: ['Tumkur City', 'Kyatsandra', 'Siddaganga', 'Antharasanahalli'],
      },
      {
        name: 'Tumkur Rural',
        hoblis: ['Gulur', 'Hebbur', 'Urdigere', 'Bellavi', 'Kora'],
        cities: ['Gulur', 'Hebbur', 'Urdigere', 'Bellavi', 'Kora', 'Hirehalli'],
      },
      {
        name: 'Chikkanayakanahalli',
        hoblis: ['C.N. Halli', 'Huliyar', 'Kandikere', 'Settikere'],
        cities: ['C.N. Halli Town', 'Huliyar', 'Kandikere', 'Settikere'],
      },
      {
        name: 'Gubbi',
        hoblis: ['Gubbi', 'Chelur', 'C.S. Pura', 'Nittur', 'Hagalavadi'],
        cities: ['Gubbi Town', 'Chelur', 'C.S. Pura', 'Nittur', 'Hagalavadi'],
      },
      {
        name: 'Koratagere',
        hoblis: ['Koratagere', 'Kolala', 'Theetha', 'Holavanahalli'],
        cities: ['Koratagere Town', 'Kolala', 'Theetha', 'Holavanahalli'],
      },
      {
        name: 'Kunigal',
        hoblis: ['Kunigal', 'Amruthur', 'Huliyurdurga', 'Kothagere', 'Yediyur'],
        cities: ['Kunigal Town', 'Amruthur', 'Huliyurdurga', 'Yediyur'],
      },
      {
        name: 'Madhugiri',
        hoblis: ['Madhugiri', 'Midigeshi', 'Kodigenahalli', 'I.D. Halli'],
        cities: ['Madhugiri Town', 'Midigeshi', 'Kodigenahalli', 'I.D. Halli'],
      },
      {
        name: 'Pavagada',
        hoblis: ['Pavagada', 'Y.N. Hosakote', 'Roppa', 'Nagalamadike'],
        cities: ['Pavagada Town', 'Y.N. Hosakote', 'Roppa', 'Nagalamadike'],
      },
      {
        name: 'Sira',
        hoblis: ['Sira', 'Kallambella', 'Bukkapatna', 'Tavarekere', 'Gowdagere'],
        cities: ['Sira Town', 'Kallambella', 'Bukkapatna', 'Tavarekere'],
      },
      {
        name: 'Tiptur',
        hoblis: ['Tiptur', 'Kibbanahalli', 'Honnavalli', 'Nonavinakere'],
        cities: ['Tiptur Town', 'Kibbanahalli', 'Honnavalli', 'Nonavinakere'],
      },
      {
        name: 'Turuvekere',
        hoblis: ['Turuvekere', 'Dandinashivara', 'Mayasandra', 'Sampige'],
        cities: ['Turuvekere Town', 'Dandinashivara', 'Mayasandra', 'Sampige'],
      },
    ],
  },
  {
    name: 'Chitradurga',
    taluks: [
      {
        name: 'Chitradurga',
        hoblis: ['Kasaba', 'Aimangala', 'Hireguntanur', 'Bharamasagara', 'Turuvanoor'],
        cities: ['Chitradurga City', 'Aimangala', 'Hireguntanur', 'Bharamasagara'],
      },
      {
        name: 'Challakere',
        hoblis: ['Kasaba', 'Parasurampura', 'Talaku', 'Nayakanahatti'],
        cities: ['Challakere Town', 'Parasurampura', 'Talaku', 'Nayakanahatti'],
      },
      {
        name: 'Hiriyur',
        hoblis: ['Kasaba', 'Dharmapura', 'J.G. Hally', 'Aimangala Cross'],
        cities: ['Hiriyur Town', 'Dharmapura', 'J.G. Hally'],
      },
      {
        name: 'Holalkere',
        hoblis: ['Kasaba', 'Ramagiri', 'Chitralli', 'B. Durga'],
        cities: ['Holalkere Town', 'Ramagiri', 'Chitralli', 'B. Durga'],
      },
      {
        name: 'Hosadurga',
        hoblis: ['Kasaba', 'Mathodu', 'Baguru', 'Srirampura'],
        cities: ['Hosadurga Town', 'Mathodu', 'Baguru', 'Srirampura'],
      },
      {
        name: 'Molakalmuru',
        hoblis: ['Kasaba', 'Devarahalli', 'B.G. Kere', 'Kondlahalli'],
        cities: ['Molakalmuru Town', 'Devarahalli', 'B.G. Kere', 'Kondlahalli'],
      },
    ],
  },
  {
    name: 'Davanagere',
    taluks: [
      {
        name: 'Davanagere',
        hoblis: ['Kasaba', 'Hadadi', 'Anagodu', 'Mayakonda'],
        cities: ['Davanagere City', 'Hadadi', 'Anagodu', 'Mayakonda'],
      },
      {
        name: 'Harihar',
        hoblis: ['Kasaba', 'Biligodu', 'Malebennur', 'Kondajji'],
        cities: ['Harihar Town', 'Biligodu', 'Malebennur', 'Kondajji'],
      },
      {
        name: 'Channagiri',
        hoblis: ['Kasaba', 'Santhebennur', 'Basavapatna', 'Hodigere', 'Ubrani'],
        cities: ['Channagiri Town', 'Santhebennur', 'Basavapatna'],
      },
      {
        name: 'Honnali',
        hoblis: ['Kasaba', 'Belagutti', 'Sasvehalli', 'Kunduru'],
        cities: ['Honnali Town', 'Belagutti', 'Sasvehalli'],
      },
      {
        name: 'Jagalur',
        hoblis: ['Kasaba', 'Bilichodu', 'Sokke', 'Asagodu'],
        cities: ['Jagalur Town', 'Bilichodu', 'Sokke'],
      },
      {
        name: 'Nyamathi',
        hoblis: ['Kasaba', 'Suragondanakoppa', 'Jeena', 'Chiluru'],
        cities: ['Nyamathi Town', 'Suragondanakoppa', 'Jeena'],
      },
    ],
  },
  {
    name: 'Kolar',
    taluks: [
      {
        name: 'Kolar',
        hoblis: ['Kasaba', 'Vokkaleri', 'Holur', 'Sugatur', 'Vemgal'],
        cities: ['Kolar City', 'Vokkaleri', 'Holur', 'Sugatur'],
      },
      {
        name: 'Bangarapet',
        hoblis: ['Kasaba', 'Kamasamudram', 'Deshihalli', 'Budikote'],
        cities: ['Bangarapet Town', 'Kamasamudram', 'Deshihalli'],
      },
      {
        name: 'KGF',
        hoblis: ['Robertsonpet', 'Andersonpet', 'Marikuppam', 'Bethamangala', 'Kyasamballi'],
        cities: ['Robertsonpet (KGF)', 'Andersonpet', 'Marikuppam', 'Bethamangala'],
      },
      {
        name: 'Malur',
        hoblis: ['Kasaba', 'Lakkur', 'Tekal', 'Masti'],
        cities: ['Malur Town', 'Lakkur', 'Tekal', 'Masti'],
      },
      {
        name: 'Mulbagal',
        hoblis: ['Kasaba', 'Tayalur', 'Byrakur', 'Avani', 'Duggasandra'],
        cities: ['Mulbagal Town', 'Tayalur', 'Byrakur', 'Avani'],
      },
      {
        name: 'Srinivaspur',
        hoblis: ['Kasaba', 'Ronur', 'Yeldur', 'Rayalpadu'],
        cities: ['Srinivaspur Town', 'Ronur', 'Yeldur', 'Rayalpadu'],
      },
    ],
  },
  {
    name: 'Chikkaballapura',
    taluks: [
      {
        name: 'Chikkaballapur',
        hoblis: ['Kasaba', 'Nandi', 'Mandikal', 'Peresandra'],
        cities: ['Chikkaballapur City', 'Nandi', 'Mandikal', 'Peresandra'],
      },
      {
        name: 'Chintamani',
        hoblis: ['Kasaba', 'Muragamalla', 'Ambajidurga', 'Kaivara', 'Chilakalanerpu'],
        cities: ['Chintamani Town', 'Muragamalla', 'Ambajidurga', 'Kaivara'],
      },
      {
        name: 'Gauribidanur',
        hoblis: ['Kasaba', 'Thondebhavi', 'Nagaragere', 'D.Palya', 'Hoskote'],
        cities: ['Gauribidanur Town', 'Thondebhavi', 'Nagaragere'],
      },
      {
        name: 'Sidlaghatta',
        hoblis: ['Kasaba', 'Jangamakote', 'Bashettihalli', 'Sadali'],
        cities: ['Sidlaghatta Town', 'Jangamakote', 'Bashettihalli', 'Sadali'],
      },
      {
        name: 'Bagepalli',
        hoblis: ['Kasaba', 'Chelur', 'Pathapalya', 'Mittemari'],
        cities: ['Bagepalli Town', 'Chelur', 'Pathapalya', 'Mittemari'],
      },
      {
        name: 'Gudibanda',
        hoblis: ['Kasaba', 'Somenahalli', 'Beechaganahalli'],
        cities: ['Gudibanda Town', 'Somenahalli', 'Beechaganahalli'],
      },
    ],
  },
];

export function getTaluksByDistrict(districtName: string): TalukData[] {
  const dist = CONSTITUENCY_DISTRICTS.find(
    (d) => d.name.toLowerCase() === districtName.trim().toLowerCase()
  );
  return dist ? dist.taluks : [];
}

export function getHoblisByTaluk(districtName: string, talukName: string): string[] {
  const taluks = getTaluksByDistrict(districtName);
  const taluk = taluks.find(
    (t) => t.name.toLowerCase() === talukName.trim().toLowerCase()
  );
  return taluk ? taluk.hoblis : [];
}

export function getCitiesByTaluk(districtName: string, talukName: string): string[] {
  const taluks = getTaluksByDistrict(districtName);
  const taluk = taluks.find(
    (t) => t.name.toLowerCase() === talukName.trim().toLowerCase()
  );
  return taluk ? taluk.cities : [];
}

export function getAllTaluks(): { district: string; taluk: string }[] {
  const list: { district: string; taluk: string }[] = [];
  CONSTITUENCY_DISTRICTS.forEach((d) => {
    d.taluks.forEach((t) => {
      list.push({ district: d.name, taluk: t.name });
    });
  });
  return list;
}
