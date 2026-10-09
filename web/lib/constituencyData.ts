export interface TalukData {
  name: string;
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
        name: 'Tumkur',
        cities: ['Tumkur City', 'Kyatsandra', 'Belagumba', 'Hirehalli', 'Antharasanahalli'],
      },
      {
        name: 'Tiptur',
        cities: ['Tiptur Town', 'Kibbanahalli', 'Honnavalli', 'Nonavinakere'],
      },
      {
        name: 'Kunigal',
        cities: ['Kunigal Town', 'Amruthur', 'Huliyurdurga', 'Yediyur'],
      },
      {
        name: 'Madhugiri',
        cities: ['Madhugiri Town', 'Midigeshi', 'Kodigenahalli', 'I.D. Halli'],
      },
      {
        name: 'Sira',
        cities: ['Sira Town', 'Kallambella', 'Bukkapatna', 'Tavarekere'],
      },
      {
        name: 'Gubbi',
        cities: ['Gubbi Town', 'Chelur', 'C.S. Pura', 'Nittur', 'Hagalavadi'],
      },
      {
        name: 'Pavagada',
        cities: ['Pavagada Town', 'Y.N. Hosakote', 'Roppa', 'Nagalamadike'],
      },
      {
        name: 'Koratagere',
        cities: ['Koratagere Town', 'Kolala', 'Theetha', 'Holavanahalli'],
      },
      {
        name: 'Turuvekere',
        cities: ['Turuvekere Town', 'Dandinashivara', 'Mayasandra', 'Sampige'],
      },
      {
        name: 'Chikkanayakanahalli',
        cities: ['C.N. Halli Town', 'Huliyar', 'Kandikere', 'Settikere'],
      },
    ],
  },
  {
    name: 'Chikkaballapura',
    taluks: [
      {
        name: 'Chikkaballapur',
        cities: ['Chikkaballapur City', 'Nandi', 'Mandikal', 'Peresandra'],
      },
      {
        name: 'Chintamani',
        cities: ['Chintamani Town', 'Muragamalla', 'Ambajidurga', 'Kaivara'],
      },
      {
        name: 'Gauribidanur',
        cities: ['Gauribidanur Town', 'Thondebhavi', 'Nagaragere', 'D.Palya'],
      },
      {
        name: 'Sidlaghatta',
        cities: ['Sidlaghatta Town', 'Jangamakote', 'Bashettihalli', 'Sadali'],
      },
      {
        name: 'Bagepalli',
        cities: ['Bagepalli Town', 'Chelur', 'Pathapalya', 'Mittemari'],
      },
      {
        name: 'Gudibanda',
        cities: ['Gudibanda Town', 'Somenahalli', 'Beechaganahalli'],
      },
    ],
  },
  {
    name: 'Chitradurga',
    taluks: [
      {
        name: 'Chitradurga',
        cities: ['Chitradurga City', 'Aimangala', 'Hireguntanur', 'Bharamasagara'],
      },
      {
        name: 'Challakere',
        cities: ['Challakere Town', 'Parasurampura', 'Talaku', 'Nayakanahatti'],
      },
      {
        name: 'Hiriyur',
        cities: ['Hiriyur Town', 'Dharmapura', 'J.G. Hally', 'Aimangala Cross'],
      },
      {
        name: 'Holalkere',
        cities: ['Holalkere Town', 'Ramagiri', 'Chitralli', 'B. Durga'],
      },
      {
        name: 'Hosadurga',
        cities: ['Hosadurga Town', 'Mathodu', 'Baguru', 'Srirampura'],
      },
      {
        name: 'Molakalmuru',
        cities: ['Molakalmuru Town', 'Devarahalli', 'B.G. Kere', 'Kondlahalli'],
      },
    ],
  },
  {
    name: 'Davanagere',
    taluks: [
      {
        name: 'Davanagere',
        cities: ['Davanagere City', 'Hadadi', 'Anagodu', 'Mayakonda'],
      },
      {
        name: 'Harihar',
        cities: ['Harihar Town', 'Biligodu', 'Malebennur', 'Kondajji'],
      },
      {
        name: 'Channagiri',
        cities: ['Channagiri Town', 'Santhebennur', 'Basavapatna', 'Hodigere'],
      },
      {
        name: 'Honnali',
        cities: ['Honnali Town', 'Belagutti', 'Sasvehalli', 'Kunduru'],
      },
      {
        name: 'Jagalur',
        cities: ['Jagalur Town', 'Bilichodu', 'Sokke', 'Asagodu'],
      },
      {
        name: 'Nyamathi',
        cities: ['Nyamathi Town', 'Suragondanakoppa', 'Jeena', 'Chiluru'],
      },
    ],
  },
  {
    name: 'Kolar',
    taluks: [
      {
        name: 'Kolar',
        cities: ['Kolar City', 'Vokkaleri', 'Holur', 'Sugatur'],
      },
      {
        name: 'Bangarapet',
        cities: ['Bangarapet Town', 'Kamasamudram', 'Deshihalli', 'Budikote'],
      },
      {
        name: 'KGF',
        cities: ['Robertsonpet (KGF)', 'Andersonpet', 'Marikuppam', 'Bethamangala'],
      },
      {
        name: 'Malur',
        cities: ['Malur Town', 'Lakkur', 'Tekal', 'Masti'],
      },
      {
        name: 'Mulbagal',
        cities: ['Mulbagal Town', 'Tayalur', 'Byrakur', 'Avani'],
      },
      {
        name: 'Srinivaspur',
        cities: ['Srinivaspur Town', 'Ronur', 'Yeldur', 'Rayalpadu'],
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
