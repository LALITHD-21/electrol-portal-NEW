import os
import sys
import glob
import re
import zipfile
import time
import xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding='utf-8')

def col_to_idx(col_str):
    idx = 0
    for ch in col_str:
        if 'A' <= ch <= 'Z':
            idx = idx * 26 + (ord(ch) - ord('A') + 1)
    return idx - 1

def read_xlsx_fast(file_path, max_rows=None):
    with zipfile.ZipFile(file_path, 'r') as z:
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            ss_xml = z.read('xl/sharedStrings.xml')
            root = ET.fromstring(ss_xml)
            for si in root.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                shared_strings.append("".join(si.itertext()))
        
        sheet_name = 'xl/worksheets/sheet1.xml'
        if sheet_name not in z.namelist():
            sheets = [n for n in z.namelist() if n.startswith('xl/worksheets/sheet') and n.endswith('.xml')]
            if not sheets:
                return []
            sheet_name = sorted(sheets)[0]
            
        ws_xml = z.read(sheet_name)
        root = ET.fromstring(ws_xml)
        ns = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
        
        rows_data = []
        for r_idx, row_el in enumerate(root.iter(f'{ns}row')):
            if max_rows and r_idx >= max_rows:
                break
            row_dict = {}
            max_col = 0
            for c_el in row_el:
                ref = c_el.attrib.get('r', '')
                col_letters = "".join([ch for ch in ref if ch.isalpha()])
                c_idx = col_to_idx(col_letters) if col_letters else len(row_dict)
                if c_idx > max_col:
                    max_col = c_idx
                c_type = c_el.attrib.get('t', '')
                val = None
                if c_type == 's':
                    v_el = c_el.find(f'{ns}v')
                    if v_el is not None and v_el.text and v_el.text.isdigit():
                        s_idx = int(v_el.text)
                        if 0 <= s_idx < len(shared_strings):
                            val = shared_strings[s_idx]
                elif c_type == 'inlineStr':
                    is_el = c_el.find(f'{ns}is')
                    if is_el is not None:
                        val = "".join(is_el.itertext())
                else:
                    v_el = c_el.find(f'{ns}v')
                    if v_el is not None and v_el.text is not None:
                        val = v_el.text
                if val is not None:
                    row_dict[c_idx] = val
            if row_dict:
                row_list = [row_dict.get(i) for i in range(max_col + 1)]
                rows_data.append(row_list)
            else:
                rows_data.append([])
        return rows_data

t0 = time.time()
final_dir = r"C:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\FINAL VOTERS"
files = sorted(glob.glob(os.path.join(final_dir, "*.xlsx")))
print(f"Scanning {len(files)} files in FINAL VOTERS...", flush=True)

parts_found = {}
no_part_files = []

for f in files:
    bname = os.path.basename(f)
    try:
        rows = read_xlsx_fast(f, max_rows=20)
        part_no = None
        for r in rows:
            if not r: continue
            row_str = " ".join([str(c) for c in r if c is not None])
            m = re.search(r'Part\s*No\s*[:\-]?\s*(\d+)', row_str, re.IGNORECASE)
            if m:
                part_no = m.group(1)
                break
        if not part_no:
            m_fn = re.search(r'(?:Part[_\s]*|DVG\s*)(\d+)', bname, re.IGNORECASE)
            if m_fn:
                part_no = m_fn.group(1)
        if part_no:
            parts_found.setdefault(part_no, []).append(bname)
        else:
            no_part_files.append(bname)
    except Exception as e:
        print(f"Error on {bname}: {e}", flush=True)
        no_part_files.append(bname)

print(f"\nCompleted in {time.time() - t0:.2f}s!", flush=True)
print(f"Unique Part Numbers found: {len(parts_found)} (out of {len(files)} files)", flush=True)
print(f"Files without Part Number: {len(no_part_files)}", flush=True)
if no_part_files:
    for nf in no_part_files:
        print(f"  NO PART: {nf}", flush=True)

multi = {k: v for k, v in parts_found.items() if len(v) > 1}
if multi:
    print(f"\nParts mapped to multiple files ({len(multi)}):", flush=True)
    for k, v in sorted(multi.items(), key=lambda x: int(x[0])):
        print(f"  Part {k}: {v}", flush=True)

all_151 = set(str(i) for i in range(1, 152))
missing_parts = sorted([int(p) for p in (all_151 - set(parts_found.keys()))])
print(f"\nMissing parts from 1..151: {missing_parts}", flush=True)
