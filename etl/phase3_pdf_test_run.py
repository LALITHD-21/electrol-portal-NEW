import os
import re
import json
import pymupdf
import numpy as np
import cv2
from rapidocr_onnxruntime import RapidOCR

PDF_DIR = r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\updates voter list pdf"
pdf_files = {
    "112": ("112_1791587543.pdf.pdf", 4), # 4 pages
    "32": ("32_1791587153.pdf.pdf", 3),   # 3 pages
    "36": ("36_1791587153.pdf.pdf", 3)    # 3 pages
}

ocr_engine = RapidOCR()
results_summary = []

EPIC_PATTERN = re.compile(r'[A-Z]{3}\d{7}|[A-Z]{2,4}\d{6,10}', re.IGNORECASE)

print("Starting Phase 3: 10-Page Test Run across 3 PDFs...")

for part_key, (fname, pages_to_test) in pdf_files.items():
    pdf_path = os.path.join(PDF_DIR, fname)
    doc = pymupdf.open(pdf_path)
    print(f"\nProcessing {fname} (Total pages: {len(doc)})...")

    file_results = {
        "file": fname,
        "part": part_key,
        "total_pages": len(doc),
        "tested_pages": pages_to_test,
        "pages_data": []
    }

    # Test pages 1 to pages_to_test (page 0 is title/summary)
    for p_idx in range(1, pages_to_test + 1):
        if p_idx >= len(doc):
            break
        page = doc[p_idx]
        
        # Check if direct text exists
        raw_text = page.get_text()
        extracted_epics = []
        confidences = []

        if len(raw_text.strip()) > 100:
            # Embedded text
            method = "embedded_text"
            epics = EPIC_PATTERN.findall(raw_text)
            extracted_epics = list(set([e.upper() for e in epics]))
            confidences = [1.0] * len(extracted_epics)
        else:
            # OCR
            method = "rapid_ocr"
            pix = page.get_pixmap(dpi=200)
            img_bytes = pix.tobytes("png")
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            ocr_res, elapse = ocr_engine(img)
            if ocr_res:
                for box, text, score in ocr_res:
                    epics = EPIC_PATTERN.findall(text)
                    for e in epics:
                        extracted_epics.append(e.upper())
                        confidences.append(float(score))

        avg_conf = sum(confidences) / len(confidences) if confidences else 0.0

        p_info = {
            "page_number": p_idx + 1,
            "method": method,
            "detected_epics_count": len(extracted_epics),
            "sample_epics": extracted_epics[:5],
            "average_confidence": round(avg_conf, 3)
        }
        file_results["pages_data"].append(p_info)
        print(f"  Page {p_idx + 1}: Method={method}, Found {len(extracted_epics)} EPICs, Avg Confidence={avg_conf:.2f}")

    results_summary.append(file_results)

# Save test report
out_path = r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\etl\reports\pdf_10page_test_report.json"
os.makedirs(os.path.dirname(out_path), exist_ok=True)
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(results_summary, f, indent=2)

print(f"\n10-Page Test Run complete. Report written to: {out_path}")
