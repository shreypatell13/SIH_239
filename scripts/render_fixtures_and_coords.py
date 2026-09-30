import fitz, os, json

doc_dir = 'tests/fixtures/documents'
results = {}

for fname in sorted(os.listdir(doc_dir)):
    if fname.endswith('.pdf'):
        fpath = os.path.join(doc_dir, fname)
        doc = fitz.open(fpath)
        page = doc[0]
        rect = page.rect
        pix = page.get_pixmap(dpi=150)
        out_png = os.path.join(doc_dir, fname.replace('.pdf', '.png'))
        pix.save(out_png)
        
        # Also copy into public or storage if needed
        print(f"=== {fname} === ({rect.width}x{rect.height}) -> PNG: {pix.width}x{pix.height}")
        
        blocks = page.get_text('blocks')
        doc_blocks = []
        for b in blocks:
            norm_x0 = round(b[0] / rect.width, 4)
            norm_y0 = round(b[1] / rect.height, 4)
            norm_w = round((b[2] - b[0]) / rect.width, 4)
            norm_h = round((b[3] - b[1]) / rect.height, 4)
            txt = b[4].strip().replace('\n', ' ')
            doc_blocks.append({
                "x": norm_x0,
                "y": norm_y0,
                "w": norm_w,
                "h": norm_h,
                "text": txt
            })
            print(f"  [{norm_x0}, {norm_y0}, {norm_w}, {norm_h}] {txt}")
        results[fname] = doc_blocks

with open('scripts/extracted_coords.json', 'w') as f:
    json.dump(results, f, indent=2)

print("\nFinished extracting coordinates and saving PNGs.")
