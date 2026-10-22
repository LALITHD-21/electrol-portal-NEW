import os
import glob
import pandas as pd

final_dir = r"C:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\FINAL VOTERS"
files = sorted(glob.glob(os.path.join(final_dir, "*.xlsx")))
print(f"Total .xlsx files in FINAL VOTERS: {len(files)}")

# Let's inspect the first 3 files in detail to understand their format
for f in files[:3]:
    print(f"\n==========================================")
    print(f"File: {os.path.basename(f)}")
    df = pd.read_excel(f, nrows=25)
    print(f"Columns: {list(df.columns)}")
    print(f"First 15 rows:")
    for idx, row in df.head(15).iterrows():
        non_na = {k: v for k, v in row.items() if pd.notna(v)}
        print(f"  Row {idx}: {non_na}")
