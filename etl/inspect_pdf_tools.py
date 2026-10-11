import os
import sys

# Test PDF text extraction capability
PDF_DIR = r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\updates voter list pdf"

files = [f for f in os.listdir(PDF_DIR) if f.lower().endswith('.pdf')]
print(f"Found {len(files)} PDF files in {PDF_DIR}:")
for f in files:
    full_path = os.path.join(PDF_DIR, f)
    size_mb = os.path.getsize(full_path) / (1024 * 1024)
    print(f"  - {f} ({size_mb:.1f} MB)")

print("\nTesting available python PDF modules...")
for mod in ['pypdf', 'pypdf2', 'pdfplumber', 'fitz', 'pdfminer']:
    try:
        __import__(mod)
        print(f"  ✅ {mod}: available")
    except ImportError:
        print(f"  ❌ {mod}: not installed")

# Also check tesseract
import subprocess
try:
    res = subprocess.run(['tesseract', '--version'], capture_output=True, text=True)
    print(f"\n✅ Tesseract OCR available: {res.stdout.splitlines()[0]}")
except Exception as e:
    print(f"\n❌ Tesseract not found in PATH: {e}")
