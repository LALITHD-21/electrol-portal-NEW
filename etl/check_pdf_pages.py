import pymupdf
import glob
import os

pdf_paths = [
    r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\VOTERS PDF\100_1791587428.pdf",
    r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\VOTERS PDF\101_1791587543.pdf",
    r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\VOTERS PDF\102_1791587543.pdf",
    r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\VOTERS PDF\103_1791587543.pdf",
]

for p in pdf_paths:
    if os.path.exists(p):
        doc = pymupdf.open(p)
        print(f"{os.path.basename(p)}: {len(doc)} pages")
        doc.close()
