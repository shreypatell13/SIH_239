import os
import pymupdf as fitz
from PIL import Image, ImageFilter, ImageEnhance
import io

OUTPUT_DIR = "tests/fixtures/documents"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def create_pdf(filename, title, subtitle, rows, cert_number, issue_date="15/05/2024", authority="Tehsildar & Sub-Divisional Magistrate, Sawai Madhopur"):
    doc = fitz.open()
    page = doc.new_page(width=595, height=842) # A4 size
    
    # 1. Border
    rect = fitz.Rect(20, 20, 575, 822)
    page.draw_rect(rect, color=(0.1, 0.2, 0.4), width=2)
    inner_rect = fitz.Rect(26, 26, 569, 816)
    page.draw_rect(inner_rect, color=(0.6, 0.7, 0.8), width=0.8)
    
    # 2. Header Emblem / Government Title
    page.insert_text((160, 65), "GOVERNMENT OF RAJASTHAN", fontsize=15, fontname="helv", fontfile=None, color=(0.1, 0.15, 0.35))
    page.insert_text((180, 85), "OFFICE OF THE DISTRICT MAGISTRATE", fontsize=11, fontname="helv", color=(0.2, 0.2, 0.2))
    page.insert_text((195, 102), "REVENUE ADMINISTRATION DEPARTMENT", fontsize=9, fontname="helv", color=(0.3, 0.3, 0.3))
    
    page.draw_line(fitz.Point(40, 115), fitz.Point(555, 115), color=(0.1, 0.2, 0.4), width=1.5)
    
    # 3. Document Title
    page.insert_text((140, 145), title.upper(), fontsize=14, fontname="helv", color=(0.7, 0.1, 0.1))
    page.insert_text((170, 165), subtitle, fontsize=10, fontname="helv", color=(0.3, 0.3, 0.3))
    
    # 4. Meta Details (Cert No, Date)
    page.insert_text((45, 195), f"Certificate No: {cert_number}", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((420, 195), f"Date of Issue: {issue_date}", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    
    page.draw_line(fitz.Point(40, 205), fitz.Point(555, 205), color=(0.8, 0.8, 0.8), width=1)
    
    # 5. Form Fields / Content
    y = 235
    for label, val in rows:
        page.insert_text((50, y), f"{label}:", fontsize=10, fontname="helv", color=(0.2, 0.25, 0.4))
        page.insert_text((220, y), f"{val}", fontsize=10, fontname="helv", color=(0.05, 0.05, 0.05))
        y += 32
        
    # 6. Declaration Text
    y += 15
    page.draw_line(fitz.Point(40, y), fitz.Point(555, y), color=(0.8, 0.8, 0.8), width=0.8)
    y += 20
    decl = ("This is to certify that the details furnished above have been thoroughly verified with the competent "
            "revenue land and citizen records. This certificate is issued for official government scholarship and educational purposes.")
    rect_decl = fitz.Rect(50, y, 545, y + 50)
    page.insert_textbox(rect_decl, decl, fontsize=8.5, fontname="helv", color=(0.3, 0.3, 0.3))
    
    # 7. Signature & Seal Area
    y += 70
    page.insert_text((60, y + 30), "[OFFICIAL DIGITAL SEAL]", fontsize=8, fontname="helv", color=(0.2, 0.5, 0.2))
    page.draw_rect(fitz.Rect(50, y + 15, 170, y + 65), color=(0.2, 0.5, 0.2), width=1)
    
    page.insert_text((370, y + 20), "Digitally Signed By:", fontsize=9, fontname="helv", color=(0.2, 0.2, 0.2))
    page.insert_text((370, y + 35), authority, fontsize=9, fontname="helv", color=(0.1, 0.15, 0.35))
    page.insert_text((370, y + 50), f"Timestamp: {issue_date} 11:42:18 IST", fontsize=7.5, fontname="helv", color=(0.4, 0.4, 0.4))
    
    pdf_path = os.path.join(OUTPUT_DIR, filename)
    doc.save(pdf_path)
    doc.close()
    print(f"Generated PDF: {pdf_path}")
    return pdf_path

def render_pdf_to_png(pdf_path, is_blurry=False, blur_radius=1.8):
    doc = fitz.open(pdf_path)
    page = doc[0]
    pix = page.get_pixmap(dpi=150)
    png_path = pdf_path.replace(".pdf", ".png")
    
    img = Image.open(io.BytesIO(pix.tobytes()))
    
    if is_blurry:
        # Apply gentle blur and slight contrast reduction
        img = img.filter(ImageFilter.GaussianBlur(radius=blur_radius))
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(0.88)
        
    img.save(png_path)
    print(f"Rendered PNG ({'Blurry' if is_blurry else 'Sharp'}): {png_path}")
    doc.close()

def main():
    print("=== GENERATING DEMO TEST FIXTURES ===")
    
    # 1. Name Mismatch Caste Certificate (SURESH KUMAR MEENA instead of RAMESH KUMAR MEENA)
    p1 = create_pdf(
        "demo-caste-certificate-mismatch-name.pdf",
        title="Scheduled Tribe Certificate",
        subtitle="Issued under the Constitution (Scheduled Tribes) Order, 1950",
        rows=[
            ("Applicant Full Name", "SURESH KUMAR MEENA"),
            ("Father's Name", "KAILASH CHAND MEENA"),
            ("Tribe / Community Name", "MEENA (MINA)"),
            ("Social Category", "SCHEDULED TRIBE (ST)"),
            ("State of Domicile", "RAJASTHAN"),
            ("District / Tehsil", "SAWAI MADHOPUR / BONLI"),
            ("Revenue Record Ref No.", "REV/ST/2024/091823"),
        ],
        cert_number="RAJ/ST/2024/778129",
    )
    render_pdf_to_png(p1)

    # 2. Social Category Mismatch Certificate (OBC instead of ST)
    p2 = create_pdf(
        "demo-caste-certificate-mismatch-category.pdf",
        title="Other Backward Class (OBC) Certificate",
        subtitle="Certificate for Employment & Educational Benefits",
        rows=[
            ("Applicant Full Name", "RAMESH KUMAR MEENA"),
            ("Father's Name", "RAMPHAL MEENA"),
            ("Caste / Community", "YADAV / GURJAR"),
            ("Social Category", "OBC (OTHER BACKWARD CLASS)"),
            ("Creamy Layer Status", "DOES NOT BELONG TO CREAMY LAYER"),
            ("State of Domicile", "RAJASTHAN"),
            ("District / Tehsil", "SAWAI MADHOPUR"),
        ],
        cert_number="RAJ/OBC/2024/441029",
    )
    render_pdf_to_png(p2)

    # 3. Income Mismatch Certificate (₹9,50,000 instead of declared ₹4,50,000)
    p3 = create_pdf(
        "demo-income-certificate-mismatch-amount.pdf",
        title="Certificate of Annual Family Income",
        subtitle="Issued by Revenue Department, Govt of Rajasthan",
        rows=[
            ("Applicant / Head of Family", "RAMESH KUMAR MEENA"),
            ("Father's / Guardian Name", "RAMPHAL MEENA"),
            ("Assessment Financial Year", "2024-2025 (FY 2024-25)"),
            ("Total Gross Family Income", "Rs. 9,50,000/- (Rupees Nine Lakh Fifty Thousand Only)"),
            ("Primary Income Source", "Commercial Enterprise & Agriculture"),
            ("State & District", "RAJASTHAN, SAWAI MADHOPUR"),
            ("Income Verification Code", "INC/950K/VERIF-2024"),
        ],
        cert_number="RAJ/INC/2024/991028",
    )
    render_pdf_to_png(p3)

    # 4. Slightly Blurry Caste Certificate (Simulates low-clarity camera phone scan)
    p4 = create_pdf(
        "demo-blurry-caste-certificate.pdf",
        title="Scheduled Tribe Certificate",
        subtitle="Issued under the Constitution (Scheduled Tribes) Order, 1950",
        rows=[
            ("Applicant Full Name", "RAMESH KUMAR MEENA"),
            ("Father's Name", "RAMPHAL MEENA"),
            ("Tribe / Community Name", "MEENA (MINA)"),
            ("Social Category", "SCHEDULED TRIBE (ST)"),
            ("State of Domicile", "RAJASTHAN"),
            ("District / Tehsil", "SAWAI MADHOPUR"),
            ("Revenue Record Ref No.", "REV/ST/BLUR/2024/001"),
        ],
        cert_number="RAJ/ST/2024/BLUR-0012",
    )
    render_pdf_to_png(p4, is_blurry=True, blur_radius=1.8)

    # 5. Slightly Blurry Income Certificate
    p5 = create_pdf(
        "demo-blurry-income-certificate.pdf",
        title="Certificate of Annual Family Income",
        subtitle="Issued by Revenue Department, Govt of Rajasthan",
        rows=[
            ("Applicant / Head of Family", "RAMESH KUMAR MEENA"),
            ("Father's / Guardian Name", "RAMPHAL MEENA"),
            ("Assessment Financial Year", "2024-2025"),
            ("Total Gross Family Income", "Rs. 4,50,000/- (Rupees Four Lakh Fifty Thousand Only)"),
            ("Primary Income Source", "Agriculture & Allied"),
            ("State & District", "RAJASTHAN, SAWAI MADHOPUR"),
            ("Income Verification Code", "INC/450K/BLUR-0091"),
        ],
        cert_number="RAJ/INC/2024/BLUR-0044",
    )
    render_pdf_to_png(p5, is_blurry=True, blur_radius=1.6)

    print("\n✅ All demo test fixtures generated successfully!")

if __name__ == "__main__":
    main()
