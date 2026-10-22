import os
import glob
import re
import openpyxl

final_dir = r"C:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\FINAL VOTERS"
files = sorted(glob.glob(os.path.join(final_dir, "*.xlsx")))
print(f"Total files in FINAL VOTERS: {len(files)}")

parts_found = {}
no_part_files = []

for f in files:
    bname = os.path.basename(f)
    try:
        wb = openpyxl.load_workbook(f, read_only=True, data_only=True)
        ws = wb.active
        part_no = None
        station_info = None
        
        for r_idx, row in enumerate(ws.iter_rows(max_row=15, values_only=True)):
            if not row: continue
            row_str = " ".join([str(c) for c in row if c is not None])
            m = re.search(r'Part\s*No\s*[:\-]?\s*(\d+)', row_str, re.IGNORECASE)
            if m and not part_no:
                part_no = m.group(1)
            if 'Building in which it is located' in row_str or 'Name of Polling Station' in row_str:
                station_info = row_str[:120]
                
        wb.close()
        
        if not part_no:
            # Try from filename
            m_fn = re.search(r'(?:Part[_\s]*|DVG\s*)(\d+)', bname, re.IGNORECASE)
            if m_fn:
                part_no = m_fn.group(1)
                
        if part_no:
            parts_found.setdefault(part_no, []).append(bname)
        else:
            no_part_files.append(bname)
    except Exception as e:
        print(f"Error reading {bname}: {e}")
        no_part_files.append(bname)

print(f"\nUnique Part Numbers identified: {len(parts_found)}")
print(f"Files without Part Number detected: {len(no_part_files)}")
if no_part_files:
    print("Files without part number:", no_part_files)

# Check if any part number appears in multiple files
multi_part = {k: v for k, v in parts_found.items() if len(v) > 1}
if multi_part:
    print(f"\nParts with multiple files ({len(multi_part)}):")
    for k, v in multi_part.items():
        print(f"  Part {k}: {v}")
