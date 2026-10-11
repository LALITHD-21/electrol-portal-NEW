import os
import pymupdf
import numpy as np
import cv2
from rapidocr_onnxruntime import RapidOCR

PDF_DIR = r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\updates voter list pdf"
pdf_path = os.path.join(PDF_DIR, "32_1791587153.pdf.pdf")

doc = pymupdf.open(pdf_path)
page = doc[1] # Page 1 (first voter list page usually)

# Render page to image
pix = page.get_pixmap(dpi=200)
img_bytes = pix.tobytes("png")
nparr = np.frombuffer(img_bytes, np.uint8)
img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

print(f"Rendered Page 1 to image: shape {img.shape}")

engine = RapidOCR()
result, elapse = engine(img)

print(f"OCR completed in {elapse}s. Total text blocks detected: {len(result) if result else 0}")
if result:
    print("\nSample OCR detected text (first 10 blocks):")
    for item in result[:10]:
        box, text, score = item
        print(f"  [{score:.2f}] {text}")
