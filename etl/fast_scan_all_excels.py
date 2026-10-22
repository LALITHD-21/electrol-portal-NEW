import os
import glob
import zipfile
import re

targets = [b"YNT4252136", b"4252136"]

scan_dirs = [
    r"C:\Users\techb\Desktop\new voters",
    r"C:\Users\techb\Desktop\electrol-portal-NEW-main",
    r"C:\Users\techb\Desktop\new",
    r"C:\Users\techb\Desktop\New folder"
]

all_xlsx = []
for d in scan_dirs:
    if os.path.exists(d):
        all_xlsx.extend(glob.glob(os.path.join(d, "**/*.xlsx"), recursive=True))

all_xlsx = list(set(all_xlsx))
print(f"Fast searching {len(all_xlsx)} .xlsx files for YNT4252136 / 4252136...")

found_files = []
for xf in all_xlsx:
    try:
        with zipfile.ZipFile(xf, 'r') as z:
            for name in z.namelist():
                if name.startswith('xl/sharedStrings') or name.startswith('xl/worksheets/'):
                    content = z.read(name)
                    for t in targets:
                        if t in content:
                            print(f"\n>>> FOUND '{t.decode()}' in {xf} ({name}) <<<")
                            found_files.append((xf, t.decode()))
                            break
    except Exception:
        pass

print(f"\nScan complete. Total matches: {len(found_files)}")
