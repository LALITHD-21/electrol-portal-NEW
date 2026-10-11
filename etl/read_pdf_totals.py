import os
import pymupdf
import numpy as np
import cv2
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
PDF_DIR = r"updates voter list pdf"

for fname in ["32_1791587153.pdf.pdf", "36_1791587153.pdf.pdf", "112_1791587543.pdf.pdf"]:
    doc = pymupdf.open(os.path.join(PDF_DIR, fname))
    p0 = doc[0]
    pix = p0.get_pixmap(dpi=150)
    img = cv2.imdecode(np.frombuffer(pix.tobytes("png"), np.uint8), cv2.IMREAD_COLOR)
    res, _ = ocr(img)
    print(f"\n=================== {fname} ===================")
    for b, t, s in res:
        if any(k in t.lower() for k in ["total", "male", "female", "part no", "net number"]):
            print(f"  [{s:.2f}] {t}")
