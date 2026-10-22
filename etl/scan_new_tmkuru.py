import os
import glob
import pandas as pd

target_epic = "YNT4252136"
target_num = "4252136"

dir_path = r"C:\Users\techb\Desktop\new\tmkuru"
files = glob.glob(os.path.join(dir_path, "*.xlsx"))
print(f"Scanning {len(files)} files in '{dir_path}' for '{target_epic}' / '{target_num}'...")

found = False
for f in files:
    try:
        df = pd.read_excel(f)
        # Search every cell
        mask = df.astype(str).apply(lambda row: row.str.contains(target_num, case=False, na=False).any(), axis=1)
        matches = df[mask]
        if not matches.empty:
            print(f"\n>>> FOUND in {os.path.basename(f)}! <<<")
            print(matches)
            found = True
    except Exception as e:
        print(f"Error {os.path.basename(f)}: {e}")

if not found:
    print(f"\n'{target_num}' not found in {dir_path}")

