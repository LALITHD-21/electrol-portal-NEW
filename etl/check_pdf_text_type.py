import pymupdf

doc = pymupdf.open(r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\VOTERS PDF\100_1791587428.pdf")
print("Page 1 text length:", len(doc[0].get_text()))
print("Page 2 text length:", len(doc[1].get_text()))
print("Page 3 text length:", len(doc[2].get_text()))
if len(doc[2].get_text()) > 0:
    print("Sample page 3 text:", doc[2].get_text()[:300])
else:
    print("Page 3 has NO embedded text - it is a scanned image!")
doc.close()
