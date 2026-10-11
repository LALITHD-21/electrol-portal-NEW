import os
import re
import json
import pymupdf

pdf_path = r"updates voter list pdf\112_1791587543.pdf.pdf"
doc = pymupdf.open(pdf_path)

print(f"Extracting all {len(doc)} pages of Part 112 PDF...")

EPIC_PATTERN = re.compile(r'\b([A-Z]{3}\d{7}|[A-Z]{2,4}\d{6,10})\b', re.IGNORECASE)

extracted_voters = []
seen_epics = set()

for pno in range(1, len(doc)):
    text = doc[pno].get_text()
    if not text.strip():
        continue
    
    # Extract all EPICs on the page
    epics = EPIC_PATTERN.findall(text)
    for ep in epics:
        clean_ep = ep.upper()
        if len(clean_ep) == 10 and clean_ep not in seen_epics:
            seen_epics.add(clean_ep)
            extracted_voters.append({
                "epic_number": clean_ep,
                "part_number": "112",
                "district": "CHIKKABALLAPURA",
                "taluk": "Chickballapur",
                "source_file": "112_1791587543.pdf.pdf",
                "page": pno + 1
            })

    if (pno + 1) % 100 == 0 or pno + 1 == len(doc):
        print(f"  Processed {pno + 1} / {len(doc)} pages... Found {len(extracted_voters)} unique standard EPICs")

print(f"\nTotal unique standard 10-char EPICs extracted from Part 112: {len(extracted_voters)}")

# Save to json
out_file = r"etl\reports\part112_extracted_epics.json"
os.makedirs(os.path.dirname(out_file), exist_ok=True)
with open(out_file, "w", encoding="utf-8") as f:
    json.dump(extracted_voters, f, indent=2)

print(f"Saved to: {out_file}")
