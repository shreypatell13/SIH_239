import os
import io
import shutil
import pymupdf as fitz
from PIL import Image, ImageFilter, ImageEnhance

BASE_SCENARIOS_DIR = "tests/fixtures/documents/demo-scenarios"
NORMAL_DIR = os.path.join(BASE_SCENARIOS_DIR, "normal")
MISMATCH_DIR = os.path.join(BASE_SCENARIOS_DIR, "info-mismatch")
BLUR_DIR = os.path.join(BASE_SCENARIOS_DIR, "blur")

for d in [NORMAL_DIR, MISMATCH_DIR, BLUR_DIR]:
    os.makedirs(d, exist_ok=True)

def build_pdf(title, subtitle, rows, cert_number, issue_date="15/05/2024", header_org="GOVERNMENT OF RAJASTHAN", dept="REVENUE ADMINISTRATION DEPARTMENT", authority="Tehsildar & Sub-Divisional Magistrate", footer_decl=None, badge_text="[OFFICIAL DIGITAL SEAL]"):
    doc = fitz.open()
    page = doc.new_page(width=595, height=842) # A4
    
    # Outer & Inner Borders
    rect = fitz.Rect(20, 20, 575, 822)
    page.draw_rect(rect, color=(0.1, 0.2, 0.4), width=2)
    inner_rect = fitz.Rect(26, 26, 569, 816)
    page.draw_rect(inner_rect, color=(0.6, 0.7, 0.8), width=0.8)
    
    # Mandatory Synthetic Banner (Top)
    banner_rect = fitz.Rect(30, 30, 565, 48)
    page.draw_rect(banner_rect, color=(0.85, 0.85, 0.85), fill=(0.95, 0.95, 0.95), width=0.5)
    page.insert_text((110, 42), "SYNTHETIC DEMO DOCUMENT — NOT A REAL GOVERNMENT RECORD", fontsize=8.5, fontname="helv", color=(0.5, 0.2, 0.2))
    
    # Header
    page.insert_text((150, 75), header_org.upper(), fontsize=13.5, fontname="helv", color=(0.1, 0.15, 0.35))
    page.insert_text((180, 93), dept.upper(), fontsize=9, fontname="helv", color=(0.25, 0.25, 0.25))
    page.draw_line(fitz.Point(40, 108), fitz.Point(555, 108), color=(0.1, 0.2, 0.4), width=1.5)
    
    # Document Title
    page.insert_text((130, 140), title.upper(), fontsize=12.5, fontname="helv", color=(0.7, 0.1, 0.1))
    page.insert_text((150, 158), subtitle, fontsize=9, fontname="helv", color=(0.3, 0.3, 0.3))
    
    # Metadata line
    page.insert_text((45, 185), f"Certificate / Ref No: {cert_number}", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((420, 185), f"Date of Issue: {issue_date}", fontsize=9, fontname="helv", color=(0.1, 0.1, 0.1))
    page.draw_line(fitz.Point(40, 195), fitz.Point(555, 195), color=(0.8, 0.8, 0.8), width=1)
    
    # Key-Value Content
    y = 225
    for label, val in rows:
        page.insert_text((50, y), f"{label}:", fontsize=9.5, fontname="helv", color=(0.2, 0.25, 0.4))
        page.insert_text((220, y), f"{val}", fontsize=9.5, fontname="helv", color=(0.05, 0.05, 0.05))
        y += 28
        
    y += 10
    page.draw_line(fitz.Point(40, y), fitz.Point(555, y), color=(0.8, 0.8, 0.8), width=0.8)
    y += 18
    
    if not footer_decl:
        footer_decl = ("This document is generated for statutory verification, academic admissions, "
                       "and national fellowship eligibility under the Ministry of Tribal Affairs guidelines.")
    page.insert_textbox(fitz.Rect(50, y, 545, y + 45), footer_decl, fontsize=8, fontname="helv", color=(0.3, 0.3, 0.3))
    
    y += 60
    page.insert_text((60, y + 22), badge_text, fontsize=8, fontname="helv", color=(0.2, 0.5, 0.2))
    page.draw_rect(fitz.Rect(50, y + 8, 180, y + 50), color=(0.2, 0.5, 0.2), width=1)
    
    page.insert_text((370, y + 15), "Authorized Signatory:", fontsize=8.5, fontname="helv", color=(0.2, 0.2, 0.2))
    page.insert_text((370, y + 28), authority, fontsize=8.5, fontname="helv", color=(0.1, 0.15, 0.35))
    page.insert_text((370, y + 42), f"Timestamp: {issue_date} 10:30 IST", fontsize=7.5, fontname="helv", color=(0.4, 0.4, 0.4))
    
    return doc

def export_document(target_dir, filename, title, subtitle, rows, cert_number, issue_date="15/05/2024", header_org="GOVERNMENT OF RAJASTHAN", dept="REVENUE ADMINISTRATION DEPARTMENT", authority="Tehsildar & Sub-Divisional Magistrate", footer_decl=None, badge_text="[OFFICIAL DIGITAL SEAL]", is_blurry=False, blur_radius=4.0):
    doc = build_pdf(title, subtitle, rows, cert_number, issue_date, header_org, dept, authority, footer_decl, badge_text)
    
    pdf_path = os.path.join(target_dir, filename)
    png_path = os.path.join(target_dir, filename.replace(".pdf", ".png"))
    
    if is_blurry:
        # Render high-res image
        page = doc[0]
        pix = page.get_pixmap(dpi=150)
        img = Image.open(io.BytesIO(pix.tobytes()))
        
        # Apply real Gaussian blur & slight contrast reduction
        blurred_img = img.filter(ImageFilter.GaussianBlur(radius=blur_radius))
        enhancer = ImageEnhance.Contrast(blurred_img)
        blurred_img = enhancer.enhance(0.78)
        
        # Save companion blurred PNG
        blurred_img.save(png_path, format="PNG")
        
        # Save purely raster image PDF (NO digital text layer)
        img_byte_arr = io.BytesIO()
        blurred_img.save(img_byte_arr, format="JPEG", quality=65)
        img_bytes = img_byte_arr.getvalue()
        
        blur_doc = fitz.open()
        blur_page = blur_doc.new_page(width=595, height=842)
        blur_page.insert_image(fitz.Rect(0, 0, 595, 842), stream=img_bytes)
        blur_doc.save(pdf_path)
        blur_doc.close()
        doc.close()
    else:
        # Save crisp vector PDF
        doc.save(pdf_path)
        
        # Save crisp companion PNG
        page = doc[0]
        pix = page.get_pixmap(dpi=150)
        img = Image.open(io.BytesIO(pix.tobytes()))
        img.save(png_path, format="PNG")
        doc.close()
        
    print(f"Exported: {pdf_path} (Blurry={is_blurry})")

def generate_all_scenarios():
    print("====================================================================")
    print("Building tests/fixtures/documents/demo-scenarios/ [normal, info-mismatch, blur]")
    print("====================================================================")

    # ----------------------------------------------------------------------
    # 1. NORMAL SCENARIO
    # ----------------------------------------------------------------------
    export_document(
        target_dir=NORMAL_DIR,
        filename="demo-st-caste-certificate.pdf",
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

    export_document(
        target_dir=NORMAL_DIR,
        filename="demo-income-certificate.pdf",
        title="Certificate of Annual Family Income",
        subtitle="Issued by Revenue Department, Govt of Rajasthan",
        rows=[
            ("Applicant / Head of Family", "RAMESH KUMAR MEENA"),
            ("Father's / Guardian Name", "RAMPHAL MEENA"),
            ("Assessment Financial Year", "2024-2025 (FY 2024-25)"),
            ("Total Gross Family Income", "Rs. 3,00,000/- (Rupees Three Lakh Only)"),
            ("Primary Income Source", "Agriculture & Allied Services"),
            ("State & District", "RAJASTHAN, SAWAI MADHOPUR"),
            ("Income Verification Code", "INC/300K/VERIF-2024"),
        ],
        cert_number="RAJ/INC/2024/441028",
        is_blurry=False
    )

    export_document(
        target_dir=NORMAL_DIR,
        filename="demo-admission-offer.pdf",
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

    export_document(
        target_dir=NORMAL_DIR,
        filename="demo-degree-transcript.pdf",
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

    export_document(
        target_dir=NORMAL_DIR,
        filename="demo-research-proposal.pdf",
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

    export_document(
        target_dir=NORMAL_DIR,
        filename="demo-passport.pdf",
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

    # ----------------------------------------------------------------------
    # 2. INFORMATION MISMATCH SCENARIO (Clear discrepancy vs Form values)
    # ----------------------------------------------------------------------
    # Form: ₹3,00,000 | Document: ₹4,50,000 (Difference: ₹1,50,000)
    export_document(
        target_dir=MISMATCH_DIR,
        filename="demo-income-certificate-mismatch.pdf",
        title="Certificate of Annual Family Income",
        subtitle="Issued by Revenue Department, Govt of Rajasthan",
        rows=[
            ("Applicant / Head of Family", "RAMESH KUMAR MEENA"),
            ("Father's / Guardian Name", "RAMPHAL MEENA"),
            ("Assessment Financial Year", "2024-2025 (FY 2024-25)"),
            ("Total Gross Family Income", "Rs. 4,50,000/- (Rupees Four Lakh Fifty Thousand Only)"),
            ("Primary Income Source", "Commercial Enterprise & Agriculture"),
            ("State & District", "RAJASTHAN, SAWAI MADHOPUR"),
            ("Income Verification Code", "INC/450K/VERIF-2024"),
        ],
        cert_number="RAJ/INC/2024/450000",
        is_blurry=False
    )

    # Form: ST | Document: OBC Category
    export_document(
        target_dir=MISMATCH_DIR,
        filename="demo-caste-certificate-mismatch.pdf",
        title="Other Backward Class (OBC) Certificate",
        subtitle="Certificate for Employment & Educational Benefits",
        rows=[
            ("Applicant Full Name", "RAMESH KUMAR MEENA"),
            ("Father's Name", "RAMPHAL MEENA"),
            ("Caste / Community", "YADAV / GURJAR"),
            ("Social Category", "OBC (OTHER BACKWARD CLASS)"),
            ("State of Domicile", "RAJASTHAN"),
            ("District / Tehsil", "SAWAI MADHOPUR"),
        ],
        cert_number="RAJ/OBC/2024/991204",
        is_blurry=False
    )

    # Form: 72.5% M.Sc. | Document: 48.2% B.Com
    export_document(
        target_dir=MISMATCH_DIR,
        filename="demo-degree-transcript-mismatch.pdf",
        title="Statement of Marks & Consolidated Grade Card",
        subtitle="Bachelor of Commerce (B.Com) Degree Examination",
        header_org="MOHANLAL SUKHADIA UNIVERSITY, UDAIPUR",
        dept="OFFICE OF THE CONTROLLER OF EXAMINATIONS",
        authority="Controller of Examinations",
        rows=[
            ("Candidate Name", "RAMESH KUMAR MEENA"),
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

    # Form: Ph.D. Physics RU | Document: B.A. Hons DU
    export_document(
        target_dir=MISMATCH_DIR,
        filename="demo-admission-offer-mismatch.pdf",
        title="Provisional Admission & Registration Letter",
        subtitle="Undergraduate Degree Enrollment",
        header_org="DELHI UNIVERSITY, NEW DELHI",
        dept="UNDERGRADUATE ADMISSIONS CELL",
        authority="Registrar (Admissions)",
        rows=[
            ("Candidate Name", "RAMESH KUMAR MEENA"),
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

    # ----------------------------------------------------------------------
    # 3. BLURRED / DEGRADED QUALITY SCENARIO (Physically blurred image PDFs)
    # ----------------------------------------------------------------------
    export_document(
        target_dir=BLUR_DIR,
        filename="demo-income-certificate-blurred.pdf",
        title="Certificate of Annual Family Income",
        subtitle="Issued by Revenue Department, Govt of Rajasthan",
        rows=[
            ("Applicant / Head of Family", "RAMESH KUMAR MEENA"),
            ("Father's / Guardian Name", "RAMPHAL MEENA"),
            ("Assessment Financial Year", "2024-2025"),
            ("Total Gross Family Income", "Rs. 3,00,000/- (Rupees Three Lakh Only)"),
            ("Primary Income Source", "Agriculture & Allied Services"),
            ("State & District", "RAJASTHAN, SAWAI MADHOPUR"),
            ("Income Verification Code", "INC/300K/BLUR-091"),
        ],
        cert_number="RAJ/INC/2024/BLUR-4410",
        is_blurry=True,
        blur_radius=4.2
    )

    export_document(
        target_dir=BLUR_DIR,
        filename="demo-st-caste-certificate-blurred.pdf",
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
        cert_number="RAJ/ST/2024/BLUR-7781",
        is_blurry=True,
        blur_radius=4.2
    )

    export_document(
        target_dir=BLUR_DIR,
        filename="demo-admission-offer-blurred.pdf",
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

    export_document(
        target_dir=BLUR_DIR,
        filename="demo-degree-transcript-blurred.pdf",
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
        cert_number="RU/EXAM/TRANSCRIPT/2024/BLUR-441",
        badge_text="[EXAMINATION CONTROLLER SEAL]",
        is_blurry=True,
        blur_radius=4.2
    )

    print("\nAll demo scenarios built successfully under tests/fixtures/documents/demo-scenarios/!")

if __name__ == "__main__":
    generate_all_scenarios()
