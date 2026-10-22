import pymupdf
import numpy as np
from rapidocr_onnxruntime import RapidOCR
import re

ocr = RapidOCR()
target_epic = "YNT4252136"
target_num = "4252136"

# Check Part 100, 101, 103
pdf_files = [
    (100, r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\VOTERS PDF\100_1791587428.pdf"),
    (101, r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\VOTERS PDF\101_1791587543.pdf"),
    (103, r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\VOTERS PDF\103_1791587543.pdf"),
    (99,  r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\VOTERS PDF\99_1791587428.pdf")
]

for part_num, pdf_path in pdf_files:
    print(f"\n=======================================================")
    print(f"Scanning Part {part_num} PDF: {pdf_path}")
    print(f"=======================================================")
    doc = pymupdf.open(pdf_path)
    print(f"Total pages: {len(doc)}")
    
    # We can scan all pages or target pages
    for page_idx in range(2, len(doc)):
        page = doc[page_idx]
        pix = page.get_pixmap(dpi=150)
        img_np = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
        if pix.n == 4:
            img_np = img_np[:, :, :3]
            
        res, _ = ocr(img_np)
        if not res:
            continue
            
        page_text = " ".join([r[1] for r in res])
        # Check if target or any YNT425 is in this page
        if target_num in page_text or target_epic in page_text:
            print(f">>> CRITICAL HIT: FOUND {target_epic} ON PAGE {page_idx+1} OF PART {part_num}! <<<")
            for r in res:
                if target_num in r[1] or "YNT" in r[1]:
                    print("  Hit:", r[1])
            doc.close()
            exit(0)
        elif "YNT425" in page_text:
            print(f"Part {part_num} Page {page_idx+1}: Found YNT425 prefix! Sample text:")
            for r in res:
                if "YNT" in r[1]:
                    print("  ", r[1])
    doc.close()

print("\nScan completed across specified PDFs.")
