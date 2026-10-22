import sys
import pymupdf
import numpy as np
from rapidocr_onnxruntime import RapidOCR
import re

sys.stdout.reconfigure(encoding='utf-8')
print("Initializing RapidOCR...", flush=True)
ocr = RapidOCR()
print("RapidOCR initialized.", flush=True)

target_epic = "YNT4252136"
target_num = "4252136"

tasks = [
    (100, r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\VOTERS PDF\100_1791587428.pdf", [20, 21, 22, 23]), # 0-indexed: 20=pg21, 21=pg22, 22=pg23, 23=pg24
    (103, r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\VOTERS PDF\103_1791587543.pdf", [20, 21, 22, 23]),
    (101, r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\VOTERS PDF\101_1791587543.pdf", [6, 7, 8, 10, 11, 12]),
]

found = False
for part_num, pdf_path, pages in tasks:
    print(f"\nChecking Part {part_num} pages {[p+1 for p in pages]}...", flush=True)
    doc = pymupdf.open(pdf_path)
    for p_idx in pages:
        if p_idx >= len(doc): continue
        page = doc[p_idx]
        pix = page.get_pixmap(dpi=150)
        img_np = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
        if pix.n == 4:
            img_np = img_np[:, :, :3]
        res, _ = ocr(img_np)
        if not res: continue
        
        epics = []
        for r in res:
            text = r[1].strip()
            if target_num in text or target_epic in text:
                print(f"\n*************************************************************", flush=True)
                print(f"FOUND EXACT TARGET {target_epic} ON PART {part_num} PAGE {p_idx+1}!", flush=True)
                print(f"Text line: {text}", flush=True)
                print(f"*************************************************************\n", flush=True)
                found = True
            m = re.findall(r'[A-Z]{3}[0-9]{7}', text)
            if m:
                epics.extend(m)
        print(f"  Part {part_num} Page {p_idx+1}: {len(epics)} EPICs detected. Sample: {epics[:5]}", flush=True)
    doc.close()

if not found:
    print("\nTarget not found on these target pages.", flush=True)
