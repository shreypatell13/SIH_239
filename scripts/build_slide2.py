import pptx
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
from pptx.dml.color import RGBColor
import os
import shutil

def update_presentation():
    # Use _V4 for the destination file to bypass locks
    base_file = os.path.abspath('C:/Users/shrey_9lumr8o/OneDrive/Desktop/SIH_239/SIH2026-IDEA-Presentation-Format.pptx')
    out_file = os.path.abspath('C:/Users/shrey_9lumr8o/OneDrive/Desktop/SIH_239/SIH2026-IDEA-Presentation-Format_V4.pptx')
    
    try:
        prs = pptx.Presentation(base_file)
    except PermissionError:
        prs = pptx.Presentation(out_file)

    slide = prs.slides[1]

    # Clean existing custom shapes
    keep_ids = {15361, 7, 6, 9, 10, 11}
    shapes_to_remove = [shape for shape in slide.shapes if getattr(shape, "shape_id", None) not in keep_ids]
    for shape in shapes_to_remove:
        sp = shape._element
        sp.getparent().remove(sp)

    # Colors
    C_NAVY_DARK = RGBColor(15, 44, 89)
    C_SLATE_DARK = RGBColor(30, 41, 59)
    C_SLATE_MUTED = RGBColor(71, 85, 105)
    C_BORDER_LIGHT = RGBColor(203, 213, 225)
    C_GOLD_BORDER = RGBColor(245, 158, 11)
    C_WHITE = RGBColor(255, 255, 255)
    C_ICE_BLUE = RGBColor(147, 197, 253)
    C_GOLD_TEXT = RGBColor(253, 186, 116)

    # 1. Title Placeholder
    for shape in slide.shapes:
        if getattr(shape, "shape_id", None) == 15361:
            shape.left = Inches(2.25)
            shape.top = Inches(0.10)
            shape.width = Inches(8.8)
            shape.height = Inches(0.70)
            tf = shape.text_frame
            tf.word_wrap = True
            tf.clear()
            p = tf.paragraphs[0]
            p.text = "Intelligent Scholarship Case Orchestration Platform"
            p.alignment = PP_ALIGN.CENTER
            p.font.name = "Arial"
            p.font.size = Pt(21)
            p.font.bold = True
            p.font.color.rgb = C_NAVY_DARK

    def add_header(top, text, desc=""):
        tb = slide.shapes.add_textbox(Inches(0.48), Inches(top), Inches(12.37), Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        r1 = p.add_run()
        r1.text = text
        r1.font.name = "Arial"
        r1.font.bold = True
        r1.font.size = Pt(13)
        r1.font.color.rgb = C_NAVY_DARK
        
        if desc:
            r2 = p.add_run()
            r2.text = "   " + desc
            r2.font.name = "Arial"
            r2.font.bold = False
            r2.font.size = Pt(11)
            r2.font.color.rgb = C_SLATE_MUTED
        
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.48), Inches(top + 0.25), Inches(12.37), Pt(1))
        line.fill.solid()
        line.fill.fore_color.rgb = C_BORDER_LIGHT
        line.line.fill.background()

    # ==========================================
    # 2. PROPOSED SOLUTION (Y: 0.82 to 2.12)
    # ==========================================
    add_header(0.82, "Proposed Solution", "A unified, configurable and secure scholarship/fellowship case-management platform for MoTA that:")

    # Left Column (3 points)
    tb_p1 = slide.shapes.add_textbox(Inches(0.48), Inches(1.15), Inches(6.10), Inches(0.95))
    tf_p1 = tb_p1.text_frame
    tf_p1.word_wrap = True
    tf_p1.margin_left = tf_p1.margin_top = tf_p1.margin_right = tf_p1.margin_bottom = 0

    pts_left = [
        "Converts scheme rules and document requirements into dynamic workflows.",
        "Uses AI-powered document intelligence to extract and cross-check evidence.",
        "Detects and explains exceptions, guiding applicants through correction and targeted re-verification."
    ]
    for i, pt_text in enumerate(pts_left):
        p = tf_p1.paragraphs[0] if i == 0 else tf_p1.add_paragraph()
        p.space_after = Pt(4)
        r_b = p.add_run()
        r_b.text = "•  "
        r_b.font.name = "Arial"
        r_b.font.bold = True
        r_b.font.size = Pt(10.5)
        r_b.font.color.rgb = C_NAVY_DARK
        r_t = p.add_run()
        r_t.text = pt_text
        r_t.font.name = "Arial"
        r_t.font.size = Pt(10.5)
        r_t.font.color.rgb = C_SLATE_DARK

    # Right Column (2 points)
    tb_p2 = slide.shapes.add_textbox(Inches(6.8), Inches(1.15), Inches(6.05), Inches(0.95))
    tf_p2 = tb_p2.text_frame
    tf_p2.word_wrap = True
    tf_p2.margin_left = tf_p2.margin_top = tf_p2.margin_right = tf_p2.margin_bottom = 0

    pts_right = [
        "Provides human-in-the-loop case review with evidence-linked decisions and traceability.",
        "Gives Ministry stakeholders operational intelligence across the application-to-post-selection lifecycle."
    ]
    for i, pt_text in enumerate(pts_right):
        p = tf_p2.paragraphs[0] if i == 0 else tf_p2.add_paragraph()
        p.space_after = Pt(8)
        r_b = p.add_run()
        r_b.text = "•  "
        r_b.font.name = "Arial"
        r_b.font.bold = True
        r_b.font.size = Pt(10.5)
        r_b.font.color.rgb = C_NAVY_DARK
        r_t = p.add_run()
        r_t.text = pt_text
        r_t.font.name = "Arial"
        r_t.font.size = Pt(10.5)
        r_t.font.color.rgb = C_SLATE_DARK

    # ==========================================
    # 3. THREE MAIN BOXES (Y: 2.18 to 4.30)
    # ==========================================
    box_y = Inches(2.18)
    box_h = Inches(2.12)

    def draw_clean_box(left, width, title):
        box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), box_y, Inches(width), box_h)
        box.fill.solid()
        box.fill.fore_color.rgb = C_WHITE
        box.line.color.rgb = C_BORDER_LIGHT
        box.line.width = Pt(1.5)
        
        tb = slide.shapes.add_textbox(Inches(left), Inches(2.25), Inches(width), Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        r = p.add_run()
        r.text = title
        r.font.name = "Arial"
        r.font.bold = True
        r.font.size = Pt(11.5)
        r.font.color.rgb = C_NAVY_DARK
        
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(left+0.2), Inches(2.55), Inches(width-0.4), Pt(1))
        line.fill.solid()
        line.fill.fore_color.rgb = C_BORDER_LIGHT
        line.line.fill.background()

    # BOX 1: APPLICANT
    draw_clean_box(0.48, 3.4, "APPLICANT")
    
    tb_b1_body = slide.shapes.add_textbox(Inches(0.55), Inches(2.65), Inches(3.26), Inches(1.65))
    tf_b1b = tb_b1_body.text_frame
    tf_b1b.word_wrap = True
    tf_b1b.margin_left = tf_b1b.margin_top = tf_b1b.margin_right = tf_b1b.margin_bottom = 0

    b1_steps = [
        "Scheme Selection",
        "Dynamic Application",
        "Smart Document Checklist",
        "Readiness Check",
        "Application Submission",
        "Status & Timeline",
        "Deficiency → Correction → Re-submission"
    ]
    for i, step in enumerate(b1_steps):
        p = tf_b1b.paragraphs[0] if i == 0 else tf_b1b.add_paragraph()
        p.alignment = PP_ALIGN.CENTER
        r = p.add_run()
        r.text = step
        r.font.name = "Arial"
        r.font.size = Pt(9.5)
        r.font.bold = (i == len(b1_steps) - 1 or i == 0)
        r.font.color.rgb = C_SLATE_DARK
        if i < len(b1_steps) - 1:
            p_arr = tf_b1b.add_paragraph()
            p_arr.alignment = PP_ALIGN.CENTER
            p_arr.space_after = Pt(0)
            r_arr = p_arr.add_run()
            r_arr.text = "↓"
            r_arr.font.name = "Arial"
            r_arr.font.bold = True
            r_arr.font.size = Pt(8.5)
            r_arr.font.color.rgb = C_BORDER_LIGHT

    # Arrow 1
    tb_arr1 = slide.shapes.add_textbox(Inches(3.93), Inches(3.10), Inches(0.4), Inches(0.45))
    tf_arr1 = tb_arr1.text_frame
    p_a1 = tf_arr1.paragraphs[0]
    p_a1.alignment = PP_ALIGN.CENTER
    r_a1 = p_a1.add_run()
    r_a1.text = "➜"
    r_a1.font.name = "Arial"
    r_a1.font.size = Pt(24)
    r_a1.font.color.rgb = C_NAVY_DARK

    # BOX 2: SYSTEM INTELLIGENCE
    draw_clean_box(4.38, 4.57, "SYSTEM INTELLIGENCE")

    sub_configs = [
        {
            'title': 'DOCUMENT AI',
            'bullets': ['OCR', 'Document Classification', 'Information Extraction', 'Evidence Cross-Check'],
            'left': Inches(4.45),
            'width': Inches(1.42)
        },
        {
            'title': 'ELIGIBILITY CHECK',
            'bullets': ['Scheme Rules', 'Required Documents', 'Eligibility Criteria'],
            'left': Inches(5.95),
            'width': Inches(1.42)
        },
        {
            'title': 'CASE MANAGEMENT',
            'bullets': ['Evidence', 'Issues', 'Next Action', 'Case History'],
            'left': Inches(7.45),
            'width': Inches(1.42)
        }
    ]

    for sub in sub_configs:
        stb = slide.shapes.add_textbox(sub['left'], Inches(2.65), sub['width'], Inches(1.65))
        stf = stb.text_frame
        stf.word_wrap = True
        stf.margin_left = stf.margin_top = stf.margin_right = stf.margin_bottom = 0
        
        p_st = stf.paragraphs[0]
        p_st.alignment = PP_ALIGN.CENTER
        p_st.space_after = Pt(4)
        r_st = p_st.add_run()
        r_st.text = sub['title']
        r_st.font.name = "Arial"
        r_st.font.bold = True
        r_st.font.size = Pt(9.5)
        r_st.font.color.rgb = C_NAVY_DARK
        
        for b in sub['bullets']:
            p_b = stf.add_paragraph()
            p_b.space_after = Pt(2)
            r_dot = p_b.add_run()
            r_dot.text = "• "
            r_dot.font.name = "Arial"
            r_dot.font.bold = True
            r_dot.font.size = Pt(9.5)
            r_dot.font.color.rgb = C_NAVY_DARK
            r_bt = p_b.add_run()
            r_bt.text = b
            r_bt.font.name = "Arial"
            r_bt.font.size = Pt(9.5)
            r_bt.font.color.rgb = C_SLATE_DARK

    # Arrow 2
    tb_arr2 = slide.shapes.add_textbox(Inches(9.00), Inches(3.10), Inches(0.4), Inches(0.45))
    tf_arr2 = tb_arr2.text_frame
    p_a2 = tf_arr2.paragraphs[0]
    p_a2.alignment = PP_ALIGN.CENTER
    r_a2 = p_a2.add_run()
    r_a2.text = "➜"
    r_a2.font.name = "Arial"
    r_a2.font.size = Pt(24)
    r_a2.font.color.rgb = C_NAVY_DARK

    # BOX 3: OFFICIALS & MINISTRY
    draw_clean_box(9.45, 3.4, "OFFICIALS & MINISTRY")

    tb_b3_body = slide.shapes.add_textbox(Inches(9.52), Inches(2.70), Inches(3.26), Inches(1.60))
    tf_b3b = tb_b3_body.text_frame
    tf_b3b.word_wrap = True
    tf_b3b.margin_left = tf_b3b.margin_top = tf_b3b.margin_right = tf_b3b.margin_bottom = 0

    b3_steps = [
        "Cases Needing Attention",
        "Check Documents & Evidence",
        "Officer Review & Decision",
        "Ministry Dashboard",
        "Reports + Full Case History"
    ]
    for i, step in enumerate(b3_steps):
        p = tf_b3b.paragraphs[0] if i == 0 else tf_b3b.add_paragraph()
        p.alignment = PP_ALIGN.CENTER
        r = p.add_run()
        r.text = step
        r.font.name = "Arial"
        r.font.size = Pt(10)
        r.font.bold = (i == 2 or i == 0)
        r.font.color.rgb = C_SLATE_DARK
        if i < len(b3_steps) - 1:
            p_arr = tf_b3b.add_paragraph()
            p_arr.alignment = PP_ALIGN.CENTER
            p_arr.space_after = Pt(2)
            r_arr = p_arr.add_run()
            r_arr.text = "↓"
            r_arr.font.name = "Arial"
            r_arr.font.bold = True
            r_arr.font.size = Pt(8.5)
            r_arr.font.color.rgb = C_BORDER_LIGHT

    # ==========================================
    # 4. INNOVATION & UNIQUENESS (Y: 4.40 to 5.75)
    # ==========================================
    add_header(4.40, "Innovation & Uniqueness")

    # Left Column (3 points)
    tb_u1 = slide.shapes.add_textbox(Inches(0.48), Inches(4.70), Inches(6.00), Inches(1.05))
    tf_u1 = tb_u1.text_frame
    tf_u1.word_wrap = True
    tf_u1.margin_left = tf_u1.margin_top = tf_u1.margin_right = tf_u1.margin_bottom = 0

    uniq_left = [
        ("Configurable Multi-Scheme", "Rules, forms, documents and workflows can change without hardcoding each scheme."),
        ("Evidence-Linked Verification", "Results trace back to the supporting document and extracted evidence."),
        ("Exception-First Processing", "Routine cases move efficiently; uncertain cases are highlighted for human attention.")
    ]
    for i, (head, desc) in enumerate(uniq_left):
        p = tf_u1.paragraphs[0] if i == 0 else tf_u1.add_paragraph()
        p.space_after = Pt(4)
        r_b = p.add_run()
        r_b.text = "•  "
        r_b.font.name = "Arial"
        r_b.font.bold = True
        r_b.font.size = Pt(10.5)
        r_b.font.color.rgb = C_NAVY_DARK
        
        r_h = p.add_run()
        r_h.text = head + " — "
        r_h.font.name = "Arial"
        r_h.font.bold = True
        r_h.font.size = Pt(10.5)
        r_h.font.color.rgb = C_NAVY_DARK
        
        r_d = p.add_run()
        r_d.text = desc
        r_d.font.name = "Arial"
        r_d.font.size = Pt(10.5)
        r_d.font.color.rgb = C_SLATE_DARK

    # Right Column (2 points)
    tb_u2 = slide.shapes.add_textbox(Inches(6.8), Inches(4.70), Inches(6.00), Inches(1.05))
    tf_u2 = tb_u2.text_frame
    tf_u2.word_wrap = True
    tf_u2.margin_left = tf_u2.margin_top = tf_u2.margin_right = tf_u2.margin_bottom = 0

    uniq_right = [
        ("Intelligent Deficiency Loop", "Explain → Correct → Recheck → Resolve."),
        ("Human-in-the-Loop & Traceability", "AI assists, rules evaluate, officials retain decision authority.")
    ]
    for i, (head, desc) in enumerate(uniq_right):
        p = tf_u2.paragraphs[0] if i == 0 else tf_u2.add_paragraph()
        p.space_after = Pt(8)
        r_b = p.add_run()
        r_b.text = "•  "
        r_b.font.name = "Arial"
        r_b.font.bold = True
        r_b.font.size = Pt(10.5)
        r_b.font.color.rgb = C_NAVY_DARK
        
        r_h = p.add_run()
        r_h.text = head + " — "
        r_h.font.name = "Arial"
        r_h.font.bold = True
        r_h.font.size = Pt(10.5)
        r_h.font.color.rgb = C_NAVY_DARK
        
        r_d = p.add_run()
        r_d.text = desc
        r_d.font.name = "Arial"
        r_d.font.size = Pt(10.5)
        r_d.font.color.rgb = C_SLATE_DARK

    # ==========================================
    # 5. KEY INNOVATION STRIP (Y: 5.85 to 6.35)
    # ==========================================
    strip = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.48), Inches(5.85), Inches(12.37), Inches(0.50))
    strip.fill.solid()
    strip.fill.fore_color.rgb = C_NAVY_DARK
    strip.line.color.rgb = C_GOLD_BORDER
    strip.line.width = Pt(1.5)

    tb_strip = slide.shapes.add_textbox(Inches(0.50), Inches(5.90), Inches(12.33), Inches(0.5))
    tf_strip = tb_strip.text_frame
    tf_strip.word_wrap = True
    tf_strip.margin_left = tf_strip.margin_top = tf_strip.margin_right = tf_strip.margin_bottom = 0

    # Line 1
    p_s1 = tf_strip.paragraphs[0]
    p_s1.alignment = PP_ALIGN.CENTER

    r_s1a = p_s1.add_run()
    r_s1a.text = "KEY INNOVATION:   "
    r_s1a.font.name = "Arial"
    r_s1a.font.bold = True
    r_s1a.font.size = Pt(11)
    r_s1a.font.color.rgb = C_GOLD_TEXT

    r_s1b = p_s1.add_run()
    r_s1b.text = "DETECT → EXPLAIN → CORRECT → RECHECK → RESOLVE"
    r_s1b.font.name = "Arial"
    r_s1b.font.bold = True
    r_s1b.font.size = Pt(11)
    r_s1b.font.color.rgb = C_WHITE

    # Line 2
    p_s2 = tf_strip.add_paragraph()
    p_s2.alignment = PP_ALIGN.CENTER
    p_s2.space_before = Pt(3)

    r_s2 = p_s2.add_run()
    r_s2.text = "AI ASSISTS   •   RULES EVALUATE   •   HUMANS DECIDE"
    r_s2.font.name = "Arial"
    r_s2.font.bold = True
    r_s2.font.size = Pt(10)
    r_s2.font.color.rgb = C_ICE_BLUE

    # Save presentation
    prs.save(out_file)
    print("Successfully saved to workspace PPTX:", out_file)
    
    # Also sync to Downloads / Desktop if accessible
    for target in ['C:/Users/shrey_9lumr8o/Downloads/SIH2026-IDEA-Presentation-Format_V4.pptx']:
        try:
            shutil.copy2(out_file, target)
            print("Also updated:", target)
        except Exception as e:
            print(f"Could not copy to {target}: {e}")

if __name__ == "__main__":
    update_presentation()
