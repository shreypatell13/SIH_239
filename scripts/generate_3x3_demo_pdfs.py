import os
import shutil
import pymupdf as fitz
from PIL import Image, ImageFilter, ImageEnhance
import io

PDF_ONLY_DIR = "demo_pdf_documents"
FIXTURES_DIR = "tests/fixtures/documents"

os.makedirs(PDF_ONLY_DIR, exist_ok=True)
os.makedirs(FIXTURES_DIR, exist_ok=True)

def create_certificate_pdf(filepath, title, subtitle, rows, cert_number, issue_date="15/05/2024", authority="Tehsildar & Sub-Divisional Magistrate"):
    doc = fitz.open()
    page = doc.new_page(width=595, height=842) # A4
    
    # Border
    rect = fitz.Rect(20, 20, 575, 822)
    page.draw_rect(rect, color=(0.1, 0.2, 0.4), width=2)
    inner_rect = fitz.Rect(26, 26, 569, 816)
    page.draw_rect(inner_rect, color=(0.6, 0.7, 0.8), width=0.8)
    
    # Header Emblem & Title
    page.insert_text((160, 65), "GOVERNMENT OF RAJASTHAN", fontsize=15, fontname="helv", color=(0.1, 0.15, 0.35))
    page.insert_text((180, 85), "OFFICE OF THE DISTRICT MAGISTRATE", fontsize=11, fontname="helv", color=(0.2, 0.2, 0.2))
    page.insert_text((195, 102), "REVENUE ADMINISTRATION DEPARTMENT", fontsize=9, fontname="helv", color=(0.3, 0.3, 0.3))
    page.draw_line(fitz.Point(40, 115), fitz.Point(555, 115), color=(0.1, 0.2, 0.4), width=1.5)
    
    # Document Title
    page.insert_text((130, 145), title.upper(), fontsize=13, fontname="helv", color=(0.7, 0.1, 0.1))
    page.insert_text((150, 165), subtitle, fontsize=9.5, fontname="helv", color=(0.3, 0.3, 0.3))
    
    # Metadata
    page.insert_text((45, 195), f"Certificate No: {cert_number}", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((420, 195), f"Date of Issue: {issue_date}", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.draw_line(fitz.Point(40, 205), fitz.Point(555, 205), color=(0.8, 0.8, 0.8), width=1)
    
    # Content rows
    y = 235
    for label, val in rows:
        page.insert_text((50, y), f"{label}:", fontsize=10, fontname="helv", color=(0.2, 0.25, 0.4))
        page.insert_text((220, y), f"{val}", fontsize=10, fontname="helv", color=(0.05, 0.05, 0.05))
        y += 32
        
    y += 15
    page.draw_line(fitz.Point(40, y), fitz.Point(555, y), color=(0.8, 0.8, 0.8), width=0.8)
    y += 20
    decl = ("This is to certify that the details furnished above have been thoroughly verified with the competent "
            "revenue and citizen records. This certificate is issued for official government scholarship and educational purposes.")
    page.insert_textbox(fitz.Rect(50, y, 545, y + 50), decl, fontsize=8.5, fontname="helv", color=(0.3, 0.3, 0.3))
    
    y += 70
    page.insert_text((60, y + 30), "[OFFICIAL DIGITAL SEAL]", fontsize=8, fontname="helv", color=(0.2, 0.5, 0.2))
    page.draw_rect(fitz.Rect(50, y + 15, 170, y + 65), color=(0.2, 0.5, 0.2), width=1)
    
    page.insert_text((370, y + 20), "Digitally Signed By:", fontsize=9, fontname="helv", color=(0.2, 0.2, 0.2))
    page.insert_text((370, y + 35), authority, fontsize=9, fontname="helv", color=(0.1, 0.15, 0.35))
    page.insert_text((370, y + 50), f"Timestamp: {issue_date} 11:42:18 IST", fontsize=7.5, fontname="helv", color=(0.4, 0.4, 0.4))
    
    doc.save(filepath)
    doc.close()
    return filepath

def create_admission_pdf(filepath, title, subtitle, rows, ref_number, issue_date="20/06/2024", university="University of Rajasthan, Jaipur"):
    doc = fitz.open()
    page = doc.new_page(width=595, height=842) # A4
    
    # Border
    rect = fitz.Rect(20, 20, 575, 822)
    page.draw_rect(rect, color=(0.15, 0.2, 0.3), width=1.8)
    
    # University Header
    page.insert_text((170, 65), university.upper(), fontsize=14, fontname="helv", color=(0.1, 0.2, 0.4))
    page.insert_text((200, 85), "DIRECTORATE OF RESEARCH & ACADEMIC ADMISSIONS", fontsize=9, fontname="helv", color=(0.3, 0.3, 0.3))
    page.draw_line(fitz.Point(40, 100), fitz.Point(555, 100), color=(0.15, 0.2, 0.3), width=1.2)
    
    page.insert_text((150, 135), title.upper(), fontsize=13, fontname="helv", color=(0.1, 0.4, 0.2))
    page.insert_text((190, 155), subtitle, fontsize=9.5, fontname="helv", color=(0.3, 0.3, 0.3))
    
    page.insert_text((45, 185), f"Ref No: {ref_number}", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((420, 185), f"Date: {issue_date}", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.draw_line(fitz.Point(40, 195), fitz.Point(555, 195), color=(0.8, 0.8, 0.8), width=1)
    
    y = 225
    for label, val in rows:
        page.insert_text((50, y), f"{label}:", fontsize=10, fontname="helv", color=(0.2, 0.25, 0.4))
        page.insert_text((220, y), f"{val}", fontsize=10, fontname="helv", color=(0.05, 0.05, 0.05))
        y += 32
        
    y += 20
    page.draw_line(fitz.Point(40, y), fitz.Point(555, y), color=(0.8, 0.8, 0.8), width=0.8)
    y += 20
    decl = ("This is to certify that the candidate has been formally granted provisional admission / registration to the "
            "regular and full-time doctoral research program under the faculty of science. This letter is issued for scholarship grant endorsement.")
    page.insert_textbox(fitz.Rect(50, y, 545, y + 50), decl, fontsize=8.5, fontname="helv", color=(0.3, 0.3, 0.3))
    
    y += 80
    page.insert_text((60, y + 20), "[UNIVERSITY SEAL]", fontsize=8, fontname="helv", color=(0.1, 0.2, 0.4))
    page.draw_rect(fitz.Rect(50, y + 5, 160, y + 50), color=(0.1, 0.2, 0.4), width=1)
    
    page.insert_text((370, y + 15), "Dean (Academic Admissions)", fontsize=9.5, fontname="helv", color=(0.1, 0.15, 0.35))
    page.insert_text((370, y + 30), university, fontsize=8.5, fontname="helv", color=(0.3, 0.3, 0.3))
    
    doc.save(filepath)
    doc.close()
    return filepath

def render_png(pdf_path, png_path, is_blurry=False, blur_radius=1.8):
    doc = fitz.open(pdf_path)
    page = doc[0]
    pix = page.get_pixmap(dpi=150)
    img = Image.open(io.BytesIO(pix.tobytes()))
    if is_blurry:
        img = img.filter(ImageFilter.GaussianBlur(radius=blur_radius))
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(0.85)
    img.save(png_path)
    doc.close()

def generate_all():
    print("=== Generating 3x3 Demo PDFs (Caste, Income, Admission) ===")
    
    docs_to_make = [
        # --- 1. CASTE CERTIFICATES ---
        {
            "name": "1_Caste_Certificate_Normal.pdf",
            "type": "caste",
            "title": "Scheduled Tribe Certificate",
            "sub": "Issued under the Constitution (Scheduled Tribes) Order, 1950",
            "rows": [
                ("Applicant Full Name", "RAMESH KUMAR MEENA"),
                ("Father's Name", "RAMPHAL MEENA"),
                ("Tribe / Community Name", "MEENA (MINA)"),
                ("Social Category", "SCHEDULED TRIBE (ST)"),
                ("State of Domicile", "RAJASTHAN"),
                ("District / Tehsil", "SAWAI MADHOPUR / BONLI"),
                ("Revenue Record Ref No.", "REV/ST/2024/091823"),
            ],
            "num": "RAJ/ST/2024/778129",
            "blurry": False,
        },
        {
            "name": "2_Caste_Certificate_Blurry.pdf",
            "type": "caste",
            "title": "Scheduled Tribe Certificate",
            "sub": "Issued under the Constitution (Scheduled Tribes) Order, 1950",
            "rows": [
                ("Applicant Full Name", "RAMESH KUMAR MEENA"),
                ("Father's Name", "RAMPHAL MEENA"),
                ("Tribe / Community Name", "MEENA (MINA)"),
                ("Social Category", "SCHEDULED TRIBE (ST)"),
                ("State of Domicile", "RAJASTHAN"),
                ("District / Tehsil", "SAWAI MADHOPUR"),
                ("Revenue Record Ref No.", "REV/ST/BLUR/2024/001"),
            ],
            "num": "RAJ/ST/2024/BLUR-0012",
            "blurry": True,
        },
        {
            "name": "3_Caste_Certificate_Mismatch_Info.pdf",
            "type": "caste",
            "title": "Other Backward Class (OBC) Certificate",
            "sub": "Certificate for Employment & Educational Benefits",
            "rows": [
                ("Applicant Full Name", "SURESH KUMAR MEENA"),
                ("Father's Name", "KAILASH CHAND MEENA"),
                ("Caste / Community", "YADAV / GURJAR"),
                ("Social Category", "OBC (OTHER BACKWARD CLASS)"),
                ("State of Domicile", "RAJASTHAN"),
                ("District / Tehsil", "SAWAI MADHOPUR"),
            ],
            "num": "RAJ/OBC/2024/441029",
            "blurry": False,
        },

        # --- 2. INCOME CERTIFICATES ---
        {
            "name": "4_Income_Certificate_Normal.pdf",
            "type": "income",
            "title": "Certificate of Annual Family Income",
            "sub": "Issued by Revenue Department, Govt of Rajasthan",
            "rows": [
                ("Applicant / Head of Family", "RAMESH KUMAR MEENA"),
                ("Father's / Guardian Name", "RAMPHAL MEENA"),
                ("Assessment Financial Year", "2024-2025 (FY 2024-25)"),
                ("Total Gross Family Income", "Rs. 4,50,000/- (Rupees Four Lakh Fifty Thousand Only)"),
                ("Primary Income Source", "Agriculture & Allied Services"),
                ("State & District", "RAJASTHAN, SAWAI MADHOPUR"),
                ("Income Verification Code", "INC/450K/VERIF-2024"),
            ],
            "num": "RAJ/INC/2024/441028",
            "blurry": False,
        },
        {
            "name": "5_Income_Certificate_Blurry.pdf",
            "type": "income",
            "title": "Certificate of Annual Family Income",
            "sub": "Issued by Revenue Department, Govt of Rajasthan",
            "rows": [
                ("Applicant / Head of Family", "RAMESH KUMAR MEENA"),
                ("Father's / Guardian Name", "RAMPHAL MEENA"),
                ("Assessment Financial Year", "2024-2025"),
                ("Total Gross Family Income", "Rs. 4,50,000/- (Rupees Four Lakh Fifty Thousand Only)"),
                ("Primary Income Source", "Agriculture & Allied"),
                ("State & District", "RAJASTHAN, SAWAI MADHOPUR"),
                ("Income Verification Code", "INC/450K/BLUR-0091"),
            ],
            "num": "RAJ/INC/2024/BLUR-0044",
            "blurry": True,
        },
        {
            "name": "6_Income_Certificate_Mismatch_Info.pdf",
            "type": "income",
            "title": "Certificate of Annual Family Income",
            "sub": "Issued by Revenue Department, Govt of Rajasthan",
            "rows": [
                ("Applicant / Head of Family", "ANIL KUMAR MEENA"),
                ("Father's / Guardian Name", "RAMPHAL MEENA"),
                ("Assessment Financial Year", "2024-2025 (FY 2024-25)"),
                ("Total Gross Family Income", "Rs. 9,50,000/- (Rupees Nine Lakh Fifty Thousand Only)"),
                ("Primary Income Source", "Commercial Enterprise & Agriculture"),
                ("State & District", "RAJASTHAN, SAWAI MADHOPUR"),
                ("Income Verification Code", "INC/950K/VERIF-2024"),
            ],
            "num": "RAJ/INC/2024/991028",
            "blurry": False,
        },

        # --- 3. ADMISSION OFFER LETTERS ---
        {
            "name": "7_Admission_Letter_Normal.pdf",
            "type": "admission",
            "title": "Provisional Admission & Registration Letter",
            "sub": "Ph.D. Doctoral Research Fellowship Program",
            "rows": [
                ("Candidate Name", "RAMESH KUMAR MEENA"),
                ("Registration / Roll No.", "RU/DOC/2024/PHY-0192"),
                ("Enrolled Department", "Department of Physics, Faculty of Science"),
                ("Degree Program", "Ph.D. (Doctor of Philosophy in Physics)"),
                ("Admitting University", "University of Rajasthan, Jaipur"),
                ("Supervisor / Guide Name", "Prof. K. L. Sharma"),
                ("Session & Effective Date", "Academic Year 2024-2025 (w.e.f. 01/07/2024)"),
            ],
            "num": "RU/ADM/2024/0912",
            "blurry": False,
        },
        {
            "name": "8_Admission_Letter_Blurry.pdf",
            "type": "admission",
            "title": "Provisional Admission & Registration Letter",
            "sub": "Ph.D. Doctoral Research Fellowship Program",
            "rows": [
                ("Candidate Name", "RAMESH KUMAR MEENA"),
                ("Registration / Roll No.", "RU/DOC/2024/PHY-BLUR"),
                ("Enrolled Department", "Department of Physics"),
                ("Degree Program", "Ph.D. (Physics)"),
                ("Admitting University", "University of Rajasthan, Jaipur"),
                ("Supervisor / Guide Name", "Prof. K. L. Sharma"),
                ("Session", "2024-2025"),
            ],
            "num": "RU/ADM/BLUR-0081",
            "blurry": True,
        },
        {
            "name": "9_Admission_Letter_Mismatch_Info.pdf",
            "type": "admission",
            "title": "Provisional Admission & Registration Letter",
            "sub": "Master of Business Administration (MBA) Admission",
            "rows": [
                ("Candidate Name", "VIKRAM SINGH MEENA"),
                ("Registration / Roll No.", "ABC/MGT/2024/0821"),
                ("Enrolled Department", "School of Management Studies"),
                ("Degree Program", "M.B.A. (Finance & Marketing)"),
                ("Admitting University", "National Institute of Management"),
                ("Supervisor / Guide Name", "Dr. Arvind Gupta"),
                ("Session", "2024-2026"),
            ],
            "num": "ABC/ADM/2024/5521",
            "blurry": False,
        },
    ]

    for item in docs_to_make:
        pdf_only_path = os.path.join(PDF_ONLY_DIR, item["name"])
        fixtures_pdf_path = os.path.join(FIXTURES_DIR, item["name"])
        fixtures_png_path = os.path.join(FIXTURES_DIR, item["name"].replace(".pdf", ".png"))

        if item["type"] == "admission":
            create_admission_pdf(pdf_only_path, item["title"], item["sub"], item["rows"], item["num"])
        else:
            create_certificate_pdf(pdf_only_path, item["title"], item["sub"], item["rows"], item["num"])

        # Copy to fixtures folder
        shutil.copyfile(pdf_only_path, fixtures_pdf_path)

        # Render companion PNG in fixtures folder for high-res canvas rendering
        render_png(fixtures_pdf_path, fixtures_png_path, is_blurry=item["blurry"], blur_radius=1.8 if item["blurry"] else 0)

        print(f"Created: {pdf_only_path} -> {'(Blurry)' if item['blurry'] else '(Normal/Mismatch)'}")

    print("\nSUCCESS: All 9 demo PDFs created in folder: 'demo_pdf_documents'")

if __name__ == "__main__":
    generate_all()
