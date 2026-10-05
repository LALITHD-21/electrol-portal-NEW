import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';
import { requireRole, isAuthError } from '@/lib/auth/roles';

interface ElectorInputRecord {
    serial_number?: number | null;
    epic_number: string;
    name: string;
    relative_name?: string | null;
    address?: string | null;
    qualification?: string | null;
    occupation?: string | null;
    age?: number | null;
    sex?: 'M' | 'F' | null;
    whatsapp_mob?: string | null;
    caste?: string | null;
    district?: string | null;
    ac_name?: string | null;
    taluk?: string | null;
    hobli?: string | null;
    grama_panchayath?: string | null;
    village?: string | null;
    area_ward?: string | null;
    part_number?: string | null;
    polling_station_name?: string | null;
    polling_address?: string | null;
    photo_url?: string | null;
}

// Official Polling station map fallback by Part Number
const POLLING_STATION_MAP: Record<string, { station: string; address: string }> = {
    '92': { station: 'Kalidasa Composite Pre- University College, Tumkur', address: 'Entire Ward No.01 to 05, Tumkur Taluk, Tumkur District, Karnataka' },
    '93': { station: 'Government Model Higher Primary School, Shishuvihara Compound, Tumkur', address: 'Entire Ward No.06 to 10, Tumkur Taluk, Tumkur District, Karnataka' },
    '94': { station: 'Siddaganga Pre University College,B H Road Gandhinagara, Tumkur', address: 'Entire Ward No.11 to 15, Tumkur Taluk, Tumkur District, Karnataka' },
    '95': { station: 'Government Higher Primary School, Shanthi nagara ASK Palya', address: 'Entire Ward No.16 to 20, Tumkur Taluk, Tumkur District, Karnataka' },
    '96': { station: 'Sri Siddaganga Kannada Elementory Higher Primary School, Room No-2, Tumkur', address: 'Entire Ward No.21 to 25, Tumkur Taluk, Tumkur District, Karnataka' },
    '97': { station: 'Nalanda convent and high school, sapthagiri extension, Room No-1, Tumkur', address: 'Entire Ward No.26 to 30, Tumkur Taluk, Tumkur District, Karnataka' },
    '98': { station: 'Government Model Higher Primary School, Kyathsandra, Room No-1, Tumkur.', address: 'Entire Ward No.31 to 35, Tumkur Taluk, Tumkur District, Karnataka' },
    '99': { station: 'Court Hall, Taluk Office Tumkur', address: 'Entire Kasaba Hobli - Rural, Tumkur Taluk, Tumkur District, Karnataka' },
    '100': { station: 'Govt. Higher Primary School, Gulur', address: 'Entire Gulur Hobli, Tumkur Taluk, Tumkur District, Karnataka' },
    '101': { station: 'Ganapathi High School, Hebbur', address: 'Entire Hebbur Hobli, Tumkur Taluk, Tumkur District, Karnataka' },
    '102': { station: 'Govt. Higher Primary School, Urdigere', address: 'Entire Urdigere Hobli, Tumkur Taluk, Tumkur District, Karnataka' },
    '103': { station: 'Kuvempu Govt. Primary School, Bellavi', address: 'Entire Bellavi Hobli, Tumkur Taluk, Tumkur District, Karnataka' },
    '104': { station: 'Govt. Model Higher Primary School, Kora', address: 'Entire Kora Hobli, Tumkur Taluk, Tumkur District, Karnataka' },
};

// Canonical column mapping helper
function canonicalizeKey(key: string): string {
    const k = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (k.includes('epic') || k.includes('voterid') || k.includes('idnumber')) return 'epic_number';
    if (k.includes('relative') || k.includes('father') || k.includes('husband') || k.includes('relation')) return 'relative_name';
    if (k.includes('name') && !k.includes('relative') && !k.includes('father') && !k.includes('mother') && !k.includes('station') && !k.includes('ac')) return 'name';
    if (k.includes('mob') || k.includes('whatsapp') || k.includes('phone')) return 'whatsapp_mob';
    if (k.includes('caste')) return 'caste';
    if (k.includes('district')) return 'district';
    if (k.includes('acname') || k.includes('assembly')) return 'ac_name';
    if (k.includes('taluk')) return 'taluk';
    if (k.includes('hobli')) return 'hobli';
    if (k.includes('panchayat') || k.includes('panchayth') || k === 'gp') return 'grama_panchayath';
    if (k.includes('village')) return 'village';
    if (k.includes('area') || k.includes('ward')) return 'area_ward';
    if (k.includes('address') || k.includes('house') || k.includes('loc') || k.includes('residence')) return 'address';
    if (k.includes('qualification') || k.includes('education')) return 'qualification';
    if (k.includes('occupation') || k.includes('occupcation') || k.includes('job') || k.includes('work')) return 'occupation';
    if (k.includes('age')) return 'age';
    if (k.includes('sex') || k.includes('gender')) return 'sex';
    if (k.includes('part') || k.includes('partno') || k.includes('partnumber')) return 'part_number';
    if (k.includes('station') || k.includes('pollingname')) return 'polling_station_name';
    if (k.includes('pollingaddress') || k.includes('psaddress')) return 'polling_address';
    if (k.includes('serial') || k.includes('slno') || k.includes('srno') || k.includes('sno')) return 'serial_number';
    return key;
}

export async function POST(req: NextRequest) {
    const startTime = Date.now();

    try {
        // Auth check: require admin or operator role
        const auth = requireRole(req, 'admin', 'operator');
        if (isAuthError(auth)) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const supabase = createAdminClient();

        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const fileName = file.name;
        const ext = fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();

        // 1. Strict File Format Validation
        if (!['xlsx', 'xls', 'csv', 'pdf'].includes(ext)) {
            return NextResponse.json(
                { error: 'Invalid file format. Please upload an Excel (.xlsx, .xls, .csv) or PDF (.pdf) file.' },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let rawRows: Record<string, any>[] = [];
        let sheetsParsedCount = 1;
        const fileFormat = ext === 'pdf' ? 'PDF' : 'EXCEL';

        if (['xlsx', 'xls', 'csv'].includes(ext)) {
            // Parse spreadsheet workbook across ALL separate sheets
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            sheetsParsedCount = workbook.SheetNames.length;

            for (const sheetName of workbook.SheetNames) {
                const worksheet = workbook.Sheets[sheetName];

                // Mode A: Positional Array Parsing ({ header: 1 }) for Electoral Rolls
                const arrayRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
                let currentPartNo: string | null = null;
                let positionalFound = 0;

                for (const row of arrayRows) {
                    if (!row || !Array.isArray(row) || row.length === 0) continue;

                    const rowString = row.map(c => String(c || '').trim()).join(' ');

                    const partMatch = rowString.match(/Part\s*N?\s*o?\s*[\:\.\·\-\s]\s*(\d+[A-Za-z0-9\/\-]*)/i);
                    if (partMatch) {
                        currentPartNo = partMatch[1].trim();
                    }

                    let epicVal: string | null = null;
                    for (let idx = 0; idx < row.length; idx++) {
                        const cellText = String(row[idx] || '').trim();
                        if (!cellText) continue;
                        const epicMatch = cellText.match(/\b([A-Z]{3}\d{7})\b/i);
                        if (epicMatch) {
                            epicVal = epicMatch[1].toUpperCase();
                        }
                    }

                    if (epicVal) {
                        let snoVal: number | null = null;
                        let ageVal: number | null = null;
                        let sexVal: 'M' | 'F' | null = null;

                        for (let idx = 0; idx < row.length; idx++) {
                            const val = String(row[idx] || '').trim();
                            if (!val) continue;

                            if (/^\d{1,5}$/.test(val) && !snoVal) {
                                const num = parseInt(val, 10);
                                if (num > 0 && num < 10000) snoVal = num;
                            }

                            if (/\b(1[89]|[2-9]\d|1[01]\d)\b/.test(val) && !ageVal && val !== String(snoVal)) {
                                const num = parseInt(val, 10);
                                if (num >= 18 && num <= 120) ageVal = num;
                            }

                            if (/^(M|F|Male|Female)$/i.test(val) && !sexVal) {
                                sexVal = val.toUpperCase().startsWith('M') ? 'M' : 'F';
                            }
                        }

                        // Name: Column 1
                        let nameVal = row[1] ? String(row[1]).trim().replace(/\s+/g, ' ') : '';

                        // Relative Name: Column 4 or 5
                        let relVal = '';
                        if (row[4] && !/\d/.test(String(row[4])) && String(row[4]).length > 2) {
                            relVal = String(row[4]).trim().replace(/\s+/g, ' ');
                        } else if (row[5]) {
                            relVal = String(row[5]).trim().replace(/\s+/g, ' ');
                        }

                        // Address: Column 7, 8, 9, or 6
                        let addrVal = '';
                        for (const colIdx of [7, 8, 9, 6]) {
                            const cellStr = String(row[colIdx] || '').trim();
                            if (cellStr && (cellStr.includes('Karnataka') || cellStr.includes('Tumkur') || cellStr.includes('TUM') || cellStr.includes('VTC') || cellStr.includes('Post') || cellStr.includes('Dist') || cellStr.includes('Tq') || cellStr.length > 15)) {
                                addrVal = cellStr.replace(/\s+/g, ' ');
                                break;
                            }
                        }

                        // Qualification & Occupation: Columns 11..14
                        let qualVal = '';
                        let occVal = '';
                        for (const colIdx of [11, 12, 13, 14]) {
                            const cellStr = String(row[colIdx] || '').trim();
                            if (!cellStr || cellStr === '-' || cellStr.includes('Photo')) continue;
                            if (!qualVal && cellStr.length < 25) {
                                qualVal = cellStr;
                            } else if (!occVal && cellStr !== qualVal) {
                                occVal = cellStr;
                            }
                        }

                        if (nameVal && !nameVal.toLowerCase().includes('name of the elector') && !nameVal.toLowerCase().includes('sino')) {
                            rawRows.push({
                                epic_number: epicVal,
                                name: nameVal,
                                relative_name: relVal || null,
                                address: addrVal || null,
                                qualification: qualVal || null,
                                occupation: occVal || null,
                                age: ageVal,
                                sex: sexVal,
                                serial_number: snoVal,
                                part_number: currentPartNo
                            });
                            positionalFound++;
                        }
                    }
                }

                // Mode B: Standard Key-Based Object Parsing for standard table spreadsheets
                if (positionalFound === 0) {
                    const objectRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
                    rawRows.push(...objectRows);
                }
            }
        } else if (ext === 'pdf') {
            // PDF text parsing using pdf-parse 1.1.1
            const pdfParse = require('pdf-parse');
            let fullText = '';
            try {
                const pdfData = await pdfParse(buffer);
                fullText = pdfData?.text || '';
            } catch (pErr: any) {
                console.error('PDF extraction fallback:', pErr);
                fullText = buffer.toString('utf-8');
            }

            const lines = fullText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
            const epicRegex = /([A-Z]{3}\d{7})/gi;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const match = epicRegex.exec(line);
                epicRegex.lastIndex = 0;

                if (match) {
                    const epic = match[1].toUpperCase();
                    const parts = line.split(/\s{2,}|\t/).map(p => p.trim()).filter(Boolean);

                    let slNo: number | null = null;
                    let ageVal: number | null = null;
                    let sexVal: 'M' | 'F' | null = null;

                    if (/\bM\b/i.test(line)) sexVal = 'M';
                    else if (/\bF\b/i.test(line)) sexVal = 'F';

                    const ageMatch = line.match(/\b(1[89]|[2-9]\d|1[01]\d)\b/);
                    if (ageMatch) ageVal = parseInt(ageMatch[1], 10);

                    const slMatch = line.match(/^\d+/);
                    if (slMatch) slNo = parseInt(slMatch[0], 10);

                    let nameVal = '';
                    let relativeVal = '';
                    let addressVal = '';

                    if (parts.length >= 3) {
                        nameVal = parts[1] || parts[0];
                        relativeVal = parts[2] || '';
                        if (parts.length >= 4) addressVal = parts[3];
                    } else {
                        const cleanedLine = line.replace(/([A-Z]{3}\d{7})/gi, '').replace(/\bPhoto Available\b/gi, '').trim();
                        nameVal = cleanedLine || `Elector (${epic})`;
                    }

                    rawRows.push({
                        epic_number: epic,
                        name: nameVal || `Elector (${epic})`,
                        relative_name: relativeVal,
                        address: addressVal,
                        age: ageVal,
                        sex: sexVal,
                        serial_number: slNo
                    });
                }
            }

            if (rawRows.length === 0) {
                const matches = Array.from(fullText.matchAll(/([A-Z]{3}\d{7})/gi));
                const uniqueEpics = Array.from(new Set(matches.map(m => m[1].toUpperCase())));
                rawRows = uniqueEpics.map((epic, idx) => ({
                    epic_number: epic,
                    name: `Elector Record (${epic})`,
                    serial_number: idx + 1
                }));
            }
        }

        if (!rawRows || rawRows.length === 0) {
            return NextResponse.json({ error: 'Uploaded file contains no readable data rows or valid EPIC numbers.' }, { status: 400 });
        }

        // 2. Strict Deduplication & Validation across all rows and separate sheets
        const validRecords: ElectorInputRecord[] = [];
        let duplicateCount = 0;
        let invalidCount = 0;
        const seenEpics = new Set<string>();

        for (const row of rawRows) {
            const cleanedObj: Record<string, any> = {};
            for (const [k, v] of Object.entries(row)) {
                cleanedObj[canonicalizeKey(k)] = v;
            }

            const rawEpic = String(cleanedObj.epic_number || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
            const epicValid = /^[A-Z]{3}\d{7}$/.test(rawEpic);

            if (!epicValid) {
                invalidCount++;
                continue;
            }

            // Deduplication check
            if (seenEpics.has(rawEpic)) {
                duplicateCount++;
                continue;
            }

            const rawName = String(cleanedObj.name || '').trim().replace(/\s+/g, ' ');
            if (!rawName) {
                invalidCount++;
                continue;
            }

            seenEpics.add(rawEpic);

            let ageNum: number | null = null;
            if (cleanedObj.age) {
                const parsedAge = parseInt(String(cleanedObj.age), 10);
                if (!isNaN(parsedAge) && parsedAge >= 18 && parsedAge <= 120) {
                    ageNum = parsedAge;
                }
            }

            let sexVal: 'M' | 'F' | null = null;
            if (cleanedObj.sex) {
                const s = String(cleanedObj.sex).trim().toUpperCase();
                if (s.startsWith('M')) sexVal = 'M';
                else if (s.startsWith('F')) sexVal = 'F';
            }

            let slNo: number | null = null;
            if (cleanedObj.serial_number) {
                const parsedSl = parseInt(String(cleanedObj.serial_number), 10);
                if (!isNaN(parsedSl)) slNo = parsedSl;
            }

            const partNo = cleanedObj.part_number ? String(cleanedObj.part_number).trim() : null;
            const pollingInfo = partNo ? POLLING_STATION_MAP[partNo] : null;

            validRecords.push({
                epic_number: rawEpic,
                name: rawName,
                relative_name: cleanedObj.relative_name ? String(cleanedObj.relative_name).trim() : null,
                address: cleanedObj.address ? String(cleanedObj.address).trim() : null,
                qualification: cleanedObj.qualification ? String(cleanedObj.qualification).trim() : null,
                occupation: cleanedObj.occupation ? String(cleanedObj.occupation).trim() : null,
                age: ageNum,
                sex: sexVal,
                whatsapp_mob: cleanedObj.whatsapp_mob ? String(cleanedObj.whatsapp_mob).replace(/\D/g, '').trim() || null : null,
                caste: cleanedObj.caste ? String(cleanedObj.caste).trim() || null : null,
                district: cleanedObj.district ? String(cleanedObj.district).trim() || null : null,
                ac_name: cleanedObj.ac_name ? String(cleanedObj.ac_name).trim() || null : null,
                taluk: cleanedObj.taluk ? String(cleanedObj.taluk).trim() || null : null,
                hobli: cleanedObj.hobli ? String(cleanedObj.hobli).trim() || null : null,
                grama_panchayath: cleanedObj.grama_panchayath ? String(cleanedObj.grama_panchayath).trim() || null : null,
                village: cleanedObj.village ? String(cleanedObj.village).trim() || null : null,
                area_ward: cleanedObj.area_ward ? String(cleanedObj.area_ward).trim() || null : null,
                serial_number: slNo,
                part_number: partNo,
                polling_station_name: cleanedObj.polling_station_name ? String(cleanedObj.polling_station_name).trim() : (pollingInfo?.station || null),
                polling_address: cleanedObj.polling_address ? String(cleanedObj.polling_address).trim() : (pollingInfo?.address || null),
                photo_url: null
            });
        }

        if (validRecords.length === 0) {
            return NextResponse.json(
                { error: 'No valid EPIC records found in file. Ensure EPIC numbers match format: 3 letters + 7 digits.' },
                { status: 400 }
            );
        }

        // 3. Batch Upsert into Supabase (Idempotent ON CONFLICT DO UPDATE)
        const batchSize = 100;
        let upsertedCount = 0;

        for (let i = 0; i < validRecords.length; i += batchSize) {
            const chunk = validRecords.slice(i, i + batchSize);
            const { error: upsertError } = await supabase
                .from('electors')
                .upsert(chunk, { onConflict: 'epic_number' });

            if (upsertError) {
                return NextResponse.json(
                    { error: `Database Ingestion Error: ${upsertError.message}` },
                    { status: 500 }
                );
            }
            upsertedCount += chunk.length;
        }

        const durationMs = Date.now() - startTime;

        return NextResponse.json({
            success: true,
            fileName: fileName,
            fileFormat: fileFormat,
            sheetsParsed: sheetsParsedCount,
            totalRawRows: rawRows.length,
            validRecords: validRecords.length,
            upsertedRecords: upsertedCount,
            duplicateRecords: duplicateCount,
            droppedRecords: invalidCount,
            durationMs: durationMs
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Server error processing file' }, { status: 500 });
    }
}
