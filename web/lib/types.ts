export interface Elector {
    id: number;
    serial_number: number | null;
    epic_number: string;
    name: string;
    relative_name: string | null;
    address: string | null;
    qualification: string | null;
    occupation: string | null;
    age: number | null;
    sex: 'M' | 'F' | null;
    // New fields from Excel
    whatsapp_mob: string | null;
    caste: string | null;
    district: string | null;
    ac_name: string | null;
    taluk: string | null;
    hobli: string | null;
    grama_panchayath: string | null;
    village: string | null;
    area_ward: string | null;
    // Polling info
    part_number: string | null;
    polling_station_name: string | null;
    polling_address: string | null;
    photo_url: string | null;  // ⚠️ Always null until photo feature is confirmed
    created_at: string;
    updated_at: string;
}

// Subset of Elector for display purposes
export interface ElectorDisplayData {
    epic_number: string;
    name: string;
    relative_name: string | null;
    address: string | null;
    qualification: string | null;
    occupation: string | null;
    age: number | null;
    sex: 'M' | 'F' | null;
    whatsapp_mob: string | null;
    caste: string | null;
    district: string | null;
    ac_name: string | null;
    taluk: string | null;
    hobli: string | null;
    grama_panchayath: string | null;
    village: string | null;
    area_ward: string | null;
    part_number: string | null;
    polling_station_name: string | null;
    polling_address: string | null;
    photo_url: string | null;
}

// Field labels for the table view and detail items
export const FIELD_LABELS: Record<keyof ElectorDisplayData, string> = {
    epic_number: 'EPIC Number',
    name: 'Name',
    relative_name: 'Relative Name',
    address: 'Address',
    qualification: 'Qualification',
    occupation: 'Occupation',
    age: 'Age',
    sex: 'Sex',
    whatsapp_mob: 'WhatsApp / Mobile',
    caste: 'Caste',
    district: 'District',
    ac_name: 'Assembly Constituency',
    taluk: 'Taluk',
    hobli: 'Hobli',
    grama_panchayath: 'Gram Panchayat',
    village: 'Village',
    area_ward: 'Area / Ward',
    part_number: 'Part Number',
    polling_station_name: 'Polling Station',
    polling_address: 'Polling Address',
    photo_url: 'Photo',
};
