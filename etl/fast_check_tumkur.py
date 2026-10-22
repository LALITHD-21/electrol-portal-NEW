import pandas as pd
import os

parts_files = [
    r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\uptaed voter list\98_1791587428.xlsx",
    r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\uptaed voter list\99_1791587428.xlsx",
    r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\uptaed voter list\100_1791587428.xlsx",
    r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\uptaed voter list\101_1791587543.xlsx",
    r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\uptaed voter list\102_1791587543.xlsx",
    r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\uptaed voter list\103_1791587543.xlsx",
    r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\uptaed voter list\104_1791587543.xlsx",
]

for pf in parts_files:
    if os.path.exists(pf):
        df = pd.read_excel(pf)
        print(f"Read {os.path.basename(pf)}: shape {df.shape}")
        # Search all cells for 4252136
        match = df.astype(str).apply(lambda row: row.str.contains('4252136', case=False, na=False).any(), axis=1)
        matches = df[match]
        if not matches.empty:
            print(f">>> FOUND in {os.path.basename(pf)}! <<<")
            print(matches)
