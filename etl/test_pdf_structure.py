import os
import fitz # PyMuPDF

PDF_DIR = r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\updates voter list pdf"
pdf_files = [f for f in os.listdir(PDF_DIR) if f.lower().endswith('.pdf')]

print(f"Total PDFs found: {len(pdf_files)}")

for f in pdf_files:
    pdf_path = os.path.join(PDF_DIR, f)
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    
    # Check page 0 and page 1
    text_p0 = doc[0].get_text()
    text_p1 = doc[1].get_text() if total_pages > 1 else ""
    
    # Check if page has images
    images_p0 = doc[0].get_images()
    images_p1 = doc[1].get_images() if total_pages > 1 else []
    
    has_text = len(text_p0.strip()) > 50 or len(text_p1.strip()) > 50
    
    print(f"\n--- {f} ---")
    print(f"  Pages: {total_pages}")
    print(f"  Page 0 Text Length: {len(text_p0.strip())}")
    print(f"  Page 1 Text Length: {len(text_p1.strip())}")
    print(f"  Page 0 Images: {len(images_p0)}")
    print(f"  Has Embedded Text? {'YES (Direct extraction possible)' if has_text else 'NO (Scanned image - Needs OCR)'}")
    if has_text:
        sample = (text_p0 if len(text_p0.strip()) > 50 else text_p1)[:300]
        print(f"  Sample Text:\n    {repr(sample)}")
