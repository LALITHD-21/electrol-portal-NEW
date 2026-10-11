import os
import re
import json
import pymupdf
import numpy as np
import cv2
from rapidocr_onnxruntime import RapidOCR

PDF_DIR = r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\updates voter list pdf"

ocr_engine = RapidOCR()

# Patterns
EPIC_PATTERN = re.compile(r'[A-Z]{3}\d{7}|[A-Z]{2,4}\d{6,10}', re.IGNORECASE)
AGE_PATTERN = re.compile(r'\b(?:age|ವಯಸ್ಸು)?\s*[:\-\s]*([1-9][0-9]|1[0-1][0-9])\b', re.IGNORECASE)
SEX_PATTERN = re.compile(r'\b(?:sex|gender|ಲಿಂಗ)?\s*[:\-\s]*(M|F|O|Male|Female)\b', re.IGNORECASE)

def verify_page_ocr(doc, page_num, pdf_name, part_num):
    page = doc[page_num]
    raw_text = page.get_text()
    
    is_embedded = len(raw_text.strip()) > 150
    extracted_records = []
    
    if is_embedded:
        # Extract from embedded text
        lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
        text_full = "\n".join(lines)
        epics = EPIC_PATTERN.findall(text_full)
        
        return {
            "pdf_name": pdf_name,
            "part": part_num,
            "page": page_num + 1,
            "extraction_method": "Embedded Text (100% Digital Native)",
            "ocr_confidence": 1.00,
            "epics_found": len(epics),
            "sample_epics": list(set([e.upper() for e in epics]))[:5],
            "raw_text_sample": "\n".join(lines[:8])
        }
    else:
        # Render and run RapidOCR
        pix = page.get_pixmap(dpi=200)
        img_bytes = pix.tobytes("png")
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        ocr_res, elapse = ocr_engine(img)
        if not ocr_res:
            return {
                "pdf_name": pdf_name,
                "part": part_num,
                "page": page_num + 1,
                "extraction_method": "RapidOCR",
                "ocr_confidence": 0.0,
                "epics_found": 0,
                "sample_epics": [],
                "raw_text_sample": "No text detected"
            }

        scores = [float(item[2]) for item in ocr_res]
        all_text = " ".join([item[1] for item in ocr_res])
        epics = EPIC_PATTERN.findall(all_text)
        
        # Sample text lines
        sample_blocks = [f"[{item[2]:.2f}] {item[1]}" for item in ocr_res[:6]]

        return {
            "pdf_name": pdf_name,
            "part": part_num,
            "page": page_num + 1,
            "extraction_method": "RapidOCR Neural Network",
            "ocr_confidence": round(sum(scores) / len(scores), 3) if scores else 0.0,
            "min_confidence": round(min(scores), 3) if scores else 0.0,
            "max_confidence": round(max(scores), 3) if scores else 0.0,
            "epics_found": len(epics),
            "sample_epics": list(set([e.upper() for e in epics]))[:5],
            "raw_text_sample": "\n".join(sample_blocks)
        }

print("Running Comprehensive Quality Verification on PDF OCR...")
test_configs = [
    ("112_1791587543.pdf.pdf", "112", [1, 5, 10]),
    ("32_1791587153.pdf.pdf", "32", [1, 3, 5]),
    ("36_1791587153.pdf.pdf", "36", [1, 3, 5])
]

all_checks = []

for fname, part, pages in test_configs:
    fpath = os.path.join(PDF_DIR, fname)
    doc = pymupdf.open(fpath)
    print(f"\n=======================================================")
    print(f"VERIFYING: {fname} (Part {part}, Total Pages: {len(doc)})")
    print(f"=======================================================")

    for p in pages:
        res = verify_page_ocr(doc, p, fname, part)
        all_checks.append(res)
        print(f"\n--- Page {res['page']} ---")
        print(f"  Method:       {res['extraction_method']}")
        print(f"  Confidence:   {res['ocr_confidence'] * 100:.1f}% (Range: {res.get('min_confidence', 1.0)*100:.1f}% - {res.get('max_confidence', 1.0)*100:.1f}%)")
        print(f"  EPICs Found:  {res['epics_found']}")
        print(f"  Sample EPICs: {res['sample_epics']}")
        print(f"  Sample Text Snippets:\n    " + res['raw_text_sample'].replace('\n', '\n    '))

# Save report
out_path = r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\etl\reports\pdf_ocr_quality_verification.json"
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(all_checks, f, indent=2)

print(f"\nReport saved to: {out_path}")
