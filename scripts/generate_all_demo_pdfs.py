import os
import shutil
import io
import pymupdf as fitz
from PIL import Image, ImageFilter, ImageEnhance

PDF_ONLY_DIR = "demo_pdf_documents"
FIXTURES_DIR = "tests/fixtures/documents"

os.makedirs(PDF_ONLY_DIR, exist_ok=True)
os.makedirs(FIXTURES_DIR, exist_ok=True)

def create_pdf_from_elements(title, subtitle, rows, cert_number, issue_date="15/05/2024", header_org="GOVERNMENT OF RAJASTHAN", dept="REVENUE ADMINISTRATION DEPARTMENT", authority="Tehsildar & Sub-Divisional Magistrate", footer_decl=None, badge_text="[OFFICIAL DIGITAL SEAL]"):
    doc = fitz.open()
    page = doc.new_page(width=595, height=842) # Standard A4
    
    # Border
    rect = fitz.Rect(20, 20, 575, 822)
    page.draw_rect(rect, color=(0.1, 0.2, 0.4), width=2)
    inner_rect = fitz.Rect(26, 26, 569, 816)
    page.draw_rect(inner_rect, color=(0.6, 0.7, 0.8), width=0.8)
    
    # Header
    page.insert_text((150, 65), header_org.upper(), fontsize=14, fontname="helv", color=(0.1, 0.15, 0.35))
    page.insert_text((180, 85), dept.upper(), fontsize=9.5, fontname="helv", color=(0.25, 0.25, 0.25))
    page.draw_line(fitz.Point(40, 105), fitz.Point(555, 105), color=(0.1, 0.2, 0.4), width=1.5)
    
    # Document Title
    page.insert_text((120, 140), title.upper(), fontsize=13, fontname="helv", color=(0.7, 0.1, 0.1))
    page.insert_text((140, 160), subtitle, fontsize=9.5, fontname="helv", color=(0.3, 0.3, 0.3))
    
    # Metadata line
    page.insert_text((45, 190), f"Doc Ref / Number: {cert_number}", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((420, 190), f"Date of Issue: {issue_date}", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.draw_line(fitz.Point(40, 200), fitz.Point(555, 200), color=(0.8, 0.8, 0.8), width=1)
    
    # Key-Value Content
    y = 230
    for label, val in rows:
        page.insert_text((50, y), f"{label}:", fontsize=10, fontname="helv", color=(0.2, 0.25, 0.4))
        page.insert_text((220, y), f"{val}", fontsize=10, fontname="helv", color=(0.05, 0.05, 0.05))
        y += 30
        
    y += 10
    page.draw_line(fitz.Point(40, y), fitz.Point(555, y), color=(0.8, 0.8, 0.8), width=0.8)
    y += 20
    
    if not footer_decl:
        footer_decl = ("This is an official credential issued for statutory verification, educational admissions, "
                       "and national fellowship eligibility under the Ministry of Tribal Affairs guidelines.")
    page.insert_textbox(fitz.Rect(50, y, 545, y + 45), footer_decl, fontsize=8.5, fontname="helv", color=(0.3, 0.3, 0.3))
    
    y += 65
    page.insert_text((60, y + 25), badge_text, fontsize=8, fontname="helv", color=(0.2, 0.5, 0.2))
    page.draw_rect(fitz.Rect(50, y + 10, 180, y + 55), color=(0.2, 0.5, 0.2), width=1)
    
    page.insert_text((370, y + 15), "Authorized Signatory:", fontsize=9, fontname="helv", color=(0.2, 0.2, 0.2))
    page.insert_text((370, y + 30), authority, fontsize=9, fontname="helv", color=(0.1, 0.15, 0.35))
    page.insert_text((370, y + 45), f"Verification Timestamp: {issue_date} 10:30 IST", fontsize=7.5, fontname="helv", color=(0.4, 0.4, 0.4))
    
    return doc

def save_document(filename, title, subtitle, rows, cert_number, issue_date="15/05/2024", header_org="GOVERNMENT OF RAJASTHAN", dept="REVENUE ADMINISTRATION DEPARTMENT", authority="Tehsildar & Sub-Divisional Magistrate", footer_decl=None, is_blurry=False, blur_radius=3.8, badge_text="[OFFICIAL DIGITAL SEAL]"):
    # 1. Build initial document
    doc = create_pdf_from_elements(title, subtitle, rows, cert_number, issue_date, header_org, dept, authority, footer_decl, badge_text)
    
    pdf_out_path = os.path.join(PDF_ONLY_DIR, filename)
    fixture_pdf_path = os.path.join(FIXTURES_DIR, filename)
    png_name = filename.replace(".pdf", ".png")
    fixture_png_path = os.path.join(FIXTURES_DIR, png_name)
    
    if is_blurry:
        # Render the page to a high-res pixmap
        page = doc[0]
        pix = page.get_pixmap(dpi=150)
        img = Image.open(io.BytesIO(pix.tobytes()))
        
        # Apply heavy visible Gaussian blur & contrast reduction
        blurred_img = img.filter(ImageFilter.GaussianBlur(radius=blur_radius))
        enhancer = ImageEnhance.Contrast(blurred_img)
        blurred_img = enhancer.enhance(0.8)
        
        # Save companion PNG
        blurred_img.save(fixture_png_path, format="PNG")
        
        # Create a purely image-based blurred PDF (NO digital text layer)
        img_byte_arr = io.BytesIO()
        blurred_img.save(img_byte_arr, format="JPEG", quality=70)
        img_bytes = img_byte_arr.getvalue()
        
        blur_doc = fitz.open()
        blur_page = blur_doc.new_page(width=595, height=842)
        blur_page.insert_image(fitz.Rect(0, 0, 595, 842), stream=img_bytes)
        
        blur_doc.save(pdf_out_path)
        blur_doc.save(fixture_pdf_path)
        blur_doc.close()
        doc.close()
    else:
        # Clean Vector PDF with crisp digital text
        doc.save(pdf_out_path)
        doc.save(fixture_pdf_path)
        
        # Also render crisp companion PNG for UI preview
        page = doc[0]
        pix = page.get_pixmap(dpi=150)
        img = Image.open(io.BytesIO(pix.tobytes()))
        img.save(fixture_png_path, format="PNG")
        doc.close()
        
    print(f"Generated: {filename} (Blurry={is_blurry})")

def generate_all_demo_documents():
    # Clean PDF folder to ensure only PDF files exist
    os.makedirs(PDF_ONLY_DIR, exist_ok=True)
    for f in os.listdir(PDF_ONLY_DIR):
        try:
            os.remove(os.path.join(PDF_ONLY_DIR, f))
        except Exception:
            pass

    print("==================================================")
    print("Generating Complete Suite of 18 Demo Documents")
    print("==================================================")

    # ----------------------------------------------------
    # 1. CASTE CERTIFICATES (Scheduled Tribe)
    # ----------------------------------------------------
    save_document(
        filename="01_Caste_Certificate_Normal.pdf",
        title="Scheduled Tribe Certificate",
        subtitle="Issued under the Constitution (Scheduled Tribes) Order, 1950",
        rows=[
            ("Applicant Full Name", "RAMESH KUMAR MEENA"),
            ("Father's Name", "RAMPHAL MEENA"),
            ("Tribe / Community Name", "MEENA (MINA)"),
            ("Social Category", "SCHEDULED TRIBE (ST)"),
            ("State of Domicile", "RAJASTHAN"),
            ("District / Tehsil", "SAWAI MADHOPUR / BONLI"),
            ("Revenue Record Ref No.", "REV/ST/2024/091823"),
        ],
        cert_number="RAJ/ST/2024/778129",
        is_blurry=False
    )
    save_document(
        filename="02_Caste_Certificate_Blurry.pdf",
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
        is_blurry=True,
        blur_radius=4.2
    )
    save_document(
        filename="03_Caste_Certificate_Mismatch_Info.pdf",
        title="Other Backward Class (OBC) Certificate",
        subtitle="Certificate for Employment & Educational Benefits",
        rows=[
            ("Applicant Full Name", "SURESH KUMAR MEENA"),
            ("Father's Name", "KAILASH CHAND MEENA"),
            ("Caste / Community", "YADAV / GURJAR"),
            ("Social Category", "OBC (OTHER BACKWARD CLASS)"),
            ("State of Domicile", "RAJASTHAN"),
            ("District / Tehsil", "SAWAI MADHOPUR"),
        ],
        cert_number="RAJ/OBC/2024/441029",
        is_blurry=False
    )

    # ----------------------------------------------------
    # 2. INCOME CERTIFICATES
    # ----------------------------------------------------
    save_document(
        filename="04_Income_Certificate_Normal.pdf",
        title="Certificate of Annual Family Income",
        subtitle="Issued by Revenue Department, Govt of Rajasthan",
        rows=[
            ("Applicant / Head of Family", "RAMESH KUMAR MEENA"),
            ("Father's / Guardian Name", "RAMPHAL MEENA"),
            ("Assessment Financial Year", "2024-2025 (FY 2024-25)"),
            ("Total Gross Family Income", "Rs. 4,50,000/- (Rupees Four Lakh Fifty Thousand Only)"),
            ("Primary Income Source", "Agriculture & Allied Services"),
            ("State & District", "RAJASTHAN, SAWAI MADHOPUR"),
            ("Income Verification Code", "INC/450K/VERIF-2024"),
        ],
        cert_number="RAJ/INC/2024/441028",
        is_blurry=False
    )
    save_document(
        filename="05_Income_Certificate_Blurry.pdf",
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
        is_blurry=True,
        blur_radius=4.2
    )
    save_document(
        filename="06_Income_Certificate_Mismatch_Info.pdf",
        title="Certificate of Annual Family Income",
        subtitle="Issued by Revenue Department, Govt of Rajasthan",
        rows=[
            ("Applicant / Head of Family", "ANIL KUMAR MEENA"),
            ("Father's / Guardian Name", "RAMPHAL MEENA"),
            ("Assessment Financial Year", "2024-2025 (FY 2024-25)"),
            ("Total Gross Family Income", "Rs. 9,50,000/- (Rupees Nine Lakh Fifty Thousand Only)"),
            ("Primary Income Source", "Commercial Enterprise & Agriculture"),
            ("State & District", "RAJASTHAN, SAWAI MADHOPUR"),
            ("Income Verification Code", "INC/950K/VERIF-2024"),
        ],
        cert_number="RAJ/INC/2024/991028",
        is_blurry=False
    )

    # ----------------------------------------------------
    # 3. ADMISSION OFFER LETTERS
    # ----------------------------------------------------
    save_document(
        filename="07_Admission_Letter_Normal.pdf",
        title="Provisional Admission & Registration Letter",
        subtitle="Ph.D. Doctoral Research Fellowship Program",
        header_org="UNIVERSITY OF RAJASTHAN, JAIPUR",
        dept="DIRECTORATE OF RESEARCH & ACADEMIC ADMISSIONS",
        authority="Dean (Academic Admissions)",
        rows=[
            ("Candidate Name", "RAMESH KUMAR MEENA"),
            ("Registration / Roll No.", "RU/DOC/2024/PHY-0192"),
            ("Enrolled Department", "Department of Physics, Faculty of Science"),
            ("Degree Program", "Ph.D. (Doctor of Philosophy in Physics)"),
            ("Admitting University", "University of Rajasthan, Jaipur"),
            ("Supervisor / Guide Name", "Prof. K. L. Sharma"),
            ("Session & Effective Date", "Academic Year 2024-2025 (w.e.f. 01/07/2024)"),
        ],
        cert_number="RU/ADM/2024/0912",
        badge_text="[UNIVERSITY ADMISSIONS SEAL]",
        is_blurry=False
    )
    save_document(
        filename="08_Admission_Letter_Blurry.pdf",
        title="Provisional Admission & Registration Letter",
        subtitle="Ph.D. Doctoral Research Fellowship Program",
        header_org="UNIVERSITY OF RAJASTHAN, JAIPUR",
        dept="DIRECTORATE OF RESEARCH & ACADEMIC ADMISSIONS",
        authority="Dean (Academic Admissions)",
        rows=[
            ("Candidate Name", "RAMESH KUMAR MEENA"),
            ("Registration / Roll No.", "RU/DOC/2024/PHY-0192"),
            ("Enrolled Department", "Department of Physics, Faculty of Science"),
            ("Degree Program", "Ph.D. (Doctor of Philosophy in Physics)"),
            ("Admitting University", "University of Rajasthan, Jaipur"),
            ("Supervisor / Guide Name", "Prof. K. L. Sharma"),
            ("Session & Effective Date", "Academic Year 2024-2025"),
        ],
        cert_number="RU/ADM/2024/BLUR-0912",
        badge_text="[UNIVERSITY ADMISSIONS SEAL]",
        is_blurry=True,
        blur_radius=4.2
    )
    save_document(
        filename="09_Admission_Letter_Mismatch_Info.pdf",
        title="Provisional Admission & Registration Letter",
        subtitle="Undergraduate Degree Enrollment",
        header_org="DELHI UNIVERSITY, NEW DELHI",
        dept="UNDERGRADUATE ADMISSIONS CELL",
        authority="Registrar (Admissions)",
        rows=[
            ("Candidate Name", "MUKESH KUMAR SHARMA"),
            ("Registration / Roll No.", "DU/UG/2024/BA-8812"),
            ("Enrolled Department", "Department of History, Faculty of Arts"),
            ("Degree Program", "Bachelor of Arts (B.A. Hons)"),
            ("Admitting University", "Delhi University, New Delhi"),
            ("Supervisor / Guide Name", "Not Applicable (UG)"),
            ("Session & Effective Date", "Academic Year 2024-2025"),
        ],
        cert_number="DU/ADM/2024/8812",
        badge_text="[UNIVERSITY ADMISSIONS SEAL]",
        is_blurry=False
    )

    # ----------------------------------------------------
    # 4. DEGREE TRANSCRIPTS & MARKSHEETS
    # ----------------------------------------------------
    save_document(
        filename="10_Degree_Transcript_Normal.pdf",
        title="Statement of Marks & Consolidated Grade Card",
        subtitle="Master of Science (M.Sc.) Final Degree Examination",
        header_org="UNIVERSITY OF RAJASTHAN, JAIPUR",
        dept="OFFICE OF THE CONTROLLER OF EXAMINATIONS",
        authority="Controller of Examinations",
        rows=[
            ("Candidate Name", "RAMESH KUMAR MEENA"),
            ("Roll No. / Enrollment", "RU/PG/PHY/2022/4412"),
            ("Degree & Specialization", "Master of Science (M.Sc.) in Physics"),
            ("Cumulative CGPA / Marks", "72.5% (First Division with Distinction)"),
            ("Total Credits Earned", "96 / 96 Credits Completed"),
            ("Month & Year of Passing", "May 2024"),
            ("Result Status", "PASSED (FIRST CLASS)"),
        ],
        cert_number="RU/EXAM/TRANSCRIPT/2024/00192",
        badge_text="[EXAMINATION CONTROLLER SEAL]",
        is_blurry=False
    )
    save_document(
        filename="11_Degree_Transcript_Blurry.pdf",
        title="Statement of Marks & Consolidated Grade Card",
        subtitle="Master of Science (M.Sc.) Final Degree Examination",
        header_org="UNIVERSITY OF RAJASTHAN, JAIPUR",
        dept="OFFICE OF THE CONTROLLER OF EXAMINATIONS",
        authority="Controller of Examinations",
        rows=[
            ("Candidate Name", "RAMESH KUMAR MEENA"),
            ("Roll No. / Enrollment", "RU/PG/PHY/2022/4412"),
            ("Degree & Specialization", "Master of Science (M.Sc.) in Physics"),
            ("Cumulative CGPA / Marks", "72.5% (First Division)"),
            ("Total Credits Earned", "96 Credits"),
            ("Month & Year of Passing", "May 2024"),
        ],
        cert_number="RU/EXAM/TRANSCRIPT/2024/BLUR-091",
        badge_text="[EXAMINATION CONTROLLER SEAL]",
        is_blurry=True,
        blur_radius=4.2
    )
    save_document(
        filename="12_Degree_Transcript_Mismatch_Info.pdf",
        title="Statement of Marks & Consolidated Grade Card",
        subtitle="Bachelor of Commerce (B.Com) Degree Examination",
        header_org="MOHANLAL SUKHADIA UNIVERSITY, UDAIPUR",
        dept="OFFICE OF THE CONTROLLER OF EXAMINATIONS",
        authority="Controller of Examinations",
        rows=[
            ("Candidate Name", "VIKAS KUMAR SHARMA"),
            ("Roll No. / Enrollment", "MLSU/UG/BCOM/2021/8921"),
            ("Degree & Specialization", "Bachelor of Commerce (B.Com General)"),
            ("Cumulative CGPA / Marks", "48.2% (Pass Division)"),
            ("Total Credits Earned", "72 / 96 Credits"),
            ("Month & Year of Passing", "June 2021"),
            ("Result Status", "PASSED (THIRD CLASS)"),
        ],
        cert_number="MLSU/EXAM/TRANSCRIPT/2021/9812",
        badge_text="[EXAMINATION CONTROLLER SEAL]",
        is_blurry=False
    )

    # ----------------------------------------------------
    # 5. RESEARCH PROPOSALS / SYNOPSIS
    # ----------------------------------------------------
    save_document(
        filename="13_Research_Proposal_Normal.pdf",
        title="Doctoral Research Synopsis & Study Proposal",
        subtitle="Submitted for National Fellowship for Higher Education of ST Students (NFST)",
        header_org="DEPARTMENT OF PHYSICS, UNIVERSITY OF RAJASTHAN",
        dept="CENTRE FOR ADVANCED SEMICONDUCTOR RESEARCH",
        authority="Research Guide & Head of Department",
        rows=[
            ("Principal Researcher", "RAMESH KUMAR MEENA"),
            ("Proposed Topic Title", "Synthesis and Characterization of Nanostructured Semiconductor Thin Films for Solar Energy Harvesting"),
            ("Faculty & Department", "Faculty of Science, Department of Physics"),
            ("Research Supervisor", "Prof. K. L. Sharma, FNASc"),
            ("Tenure Duration", "5 Years (Full-Time Doctoral Fellowship)"),
            ("Ethical & Lab Clearance", "Approved by Institutional Research Committee"),
        ],
        cert_number="RES/NFST/2024/PROPOSAL-01",
        badge_text="[INSTITUTIONAL RESEARCH SEAL]",
        is_blurry=False
    )
    save_document(
        filename="14_Research_Proposal_Blurry.pdf",
        title="Doctoral Research Synopsis & Study Proposal",
        subtitle="Submitted for National Fellowship for Higher Education of ST Students",
        header_org="DEPARTMENT OF PHYSICS, UNIVERSITY OF RAJASTHAN",
        dept="CENTRE FOR ADVANCED SEMICONDUCTOR RESEARCH",
        authority="Research Guide & Head of Department",
        rows=[
            ("Principal Researcher", "RAMESH KUMAR MEENA"),
            ("Proposed Topic Title", "Synthesis and Characterization of Nanostructured Semiconductor Thin Films"),
            ("Faculty & Department", "Faculty of Science, Department of Physics"),
            ("Research Supervisor", "Prof. K. L. Sharma"),
            ("Tenure Duration", "5 Years"),
        ],
        cert_number="RES/NFST/2024/BLUR-PROPOSAL",
        badge_text="[INSTITUTIONAL RESEARCH SEAL]",
        is_blurry=True,
        blur_radius=4.2
    )
    save_document(
        filename="15_Research_Proposal_Mismatch_Info.pdf",
        title="Masters Seminar Term Paper",
        subtitle="Undergraduate / Term Paper Assignment",
        header_org="DEPARTMENT OF SOCIOLOGY",
        dept="SOCIAL WORK STUDY CELL",
        authority="Course Instructor",
        rows=[
            ("Student Name", "KISHORE KUMAR MEHTA"),
            ("Project Topic Title", "General Observations on Rural Migration Trends in Northern India"),
            ("Faculty & Department", "Faculty of Arts, Sociology Department"),
            ("Faculty Incharge", "Dr. A. K. Gupta"),
            ("Submission Type", "Term Essay Assignment"),
        ],
        cert_number="SOC/TERM/2023/8812",
        badge_text="[DEPARTMENT CELL SEAL]",
        is_blurry=False
    )

    # ----------------------------------------------------
    # 6. PASSPORTS / CITIZEN IDENTITY
    # ----------------------------------------------------
    save_document(
        filename="16_Passport_Normal.pdf",
        title="Passport - Republic of India",
        subtitle="National Travel & Identity Document",
        header_org="GOVERNMENT OF INDIA",
        dept="MINISTRY OF EXTERNAL AFFAIRS - PASSPORT SEVA",
        authority="Passport Officer, Regional Passport Office Jaipur",
        rows=[
            ("Given Name & Surname", "RAMESH KUMAR MEENA"),
            ("Nationality", "INDIAN"),
            ("Sex / Date of Birth", "M / 15/05/1998"),
            ("Place of Birth", "SAWAI MADHOPUR, RAJASTHAN"),
            ("Passport Number", "Z8819204"),
            ("Date of Expiry", "14/05/2034"),
            ("Machine Readable Zone", "P<INDMEENA<<RAMESH<KUMAR<<<<<<<<<<<<<<<<<<<<<<<"),
        ],
        cert_number="IND/PPT/2024/8819204",
        badge_text="[REPUBLIC OF INDIA EMBLEM]",
        is_blurry=False
    )
    save_document(
        filename="17_Passport_Blurry.pdf",
        title="Passport - Republic of India",
        subtitle="National Travel & Identity Document",
        header_org="GOVERNMENT OF INDIA",
        dept="MINISTRY OF EXTERNAL AFFAIRS - PASSPORT SEVA",
        authority="Passport Officer, Regional Passport Office Jaipur",
        rows=[
            ("Given Name & Surname", "RAMESH KUMAR MEENA"),
            ("Nationality", "INDIAN"),
            ("Sex / Date of Birth", "M / 15/05/1998"),
            ("Place of Birth", "SAWAI MADHOPUR"),
            ("Passport Number", "Z8819204"),
            ("Date of Expiry", "14/05/2034"),
        ],
        cert_number="IND/PPT/2024/BLUR-8819",
        badge_text="[REPUBLIC OF INDIA EMBLEM]",
        is_blurry=True,
        blur_radius=4.2
    )
    save_document(
        filename="18_Passport_Mismatch_Info.pdf",
        title="Passport - Republic of India",
        subtitle="National Travel & Identity Document",
        header_org="GOVERNMENT OF INDIA",
        dept="MINISTRY OF EXTERNAL AFFAIRS - PASSPORT SEVA",
        authority="Passport Officer, Regional Passport Office Mumbai",
        rows=[
            ("Given Name & Surname", "DEEPAK KUMAR CHAUHAN"),
            ("Nationality", "INDIAN"),
            ("Sex / Date of Birth", "M / 01/01/1985"),
            ("Place of Birth", "MUMBAI, MAHARASHTRA"),
            ("Passport Number", "M1928374"),
            ("Date of Expiry", "31/12/2030"),
            ("Machine Readable Zone", "P<INDCHAUHAN<<DEEPAK<KUMAR<<<<<<<<<<<<<<<<<<<<<"),
        ],
        cert_number="IND/PPT/2020/1928374",
        badge_text="[REPUBLIC OF INDIA EMBLEM]",
        is_blurry=False
    )

    print("\nAll 18 demo documents generated successfully!")

if __name__ == "__main__":
    generate_all_demo_documents()
