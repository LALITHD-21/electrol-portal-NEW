import pymupdf
import re
import json

doc = pymupdf.open(r"updates voter list pdf\112_1791587543.pdf.pdf")
print(f"Total pages in 112: {len(doc)}")

# Look at text of page 1, 2, 3
for pno in [1, 2, 3]:
    text = doc[pno].get_text()
    print(f"\n--- PAGE {pno+1} RAW TEXT SAMPLE (first 500 chars) ---")
    print(text[:500])
