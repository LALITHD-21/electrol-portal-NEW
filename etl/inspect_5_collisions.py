import os
import sys
import zipfile
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

if __name__ == '__main__':
    final_dir = r"C:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\FINAL VOTERS"

    check_files = [
        'DVG 10.xlsx', 'DVG 11.xlsx',
        'DVG 21.xlsx', 'DVG 22.xlsx',
        'Hodurga-Entire Mathodu Hobli.xlsx', 'JAGALUR 1.xlsx',
        'Bangarpet-Entire Kasaba Hobli.xlsx', 'Hiriyur-Entire Aimangla Hobli.xlsx',
        'Madhugiri-Entire Kodigenahalli Hobli.xlsx', 'Part_59_Madhugiri_Kodigenahalli_Hobli_Voter_List.xlsx'
    ]

    for fn in check_files:
        p = os.path.join(final_dir, fn)
        rows = read_xlsx_fast(p, max_rows=15)
        print(f"\n=== {fn} ===")
        for i, r in enumerate(rows[:12]):
            non_empty = [str(c).replace('\n', ' | ') for c in r if c is not None]
            if non_empty:
                print(f"  Row {i}: {' // '.join(non_empty)[:180]}")
