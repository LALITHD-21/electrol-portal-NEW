import os
import time
import multiprocessing as mp
import pymupdf
import numpy as np
import cv2
from rapidocr_onnxruntime import RapidOCR

PDF_PATH = r"updates voter list pdf\32_1791587153.pdf.pdf"

def ocr_worker(page_num):
    # Each worker opens doc and initializes engine
    doc = pymupdf.open(PDF_PATH)
    page = doc[page_num]
    pix = page.get_pixmap(dpi=150) # 150 DPI is crisp and 2x faster than 200 DPI
    img = cv2.imdecode(np.frombuffer(pix.tobytes("png"), np.uint8), cv2.IMREAD_COLOR)
    
    engine = RapidOCR()
    res, _ = engine(img)
    epics = []
    if res:
        for b, text, score in res:
            # find epics
            import re
            m = re.findall(r'[A-Z]{3}\d{7}', text.upper())
            epics.extend(m)
    return page_num, len(epics)

if __name__ == "__main__":
    mp.freeze_support()
    num_workers = min(8, os.cpu_count() or 4)
    pages_to_test = list(range(1, 21)) # 20 pages
    
    print(f"Testing parallel OCR on 20 pages with {num_workers} parallel workers...")
    start = time.time()
    
    with mp.Pool(num_workers) as pool:
        results = pool.map(ocr_worker, pages_to_test)
        
    duration = time.time() - start
    total_epics = sum(r[1] for r in results)
    print(f"Processed 20 pages in {duration:.1f}s ({20/duration:.2f} pages/sec)!")
    print(f"Total EPICs found across 20 pages: {total_epics}")
    print(f"Estimated time for 600 pages: {600 / (20/duration) / 60:.1f} minutes!")
