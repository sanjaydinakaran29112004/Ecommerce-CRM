import os
import re
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def create_project_report_docx(md_path, docx_path):
    with open(md_path, "r", encoding="utf-8") as f:
        md_text = f.read()

    doc = Document()

    # Page Margins
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Base Colors
    COLOR_PRIMARY = RGBColor(79, 70, 229)      # #4F46E5 (Indigo)
    COLOR_NAVY = RGBColor(15, 23, 42)          # #0F172A (Deep Slate)
    COLOR_TEXT = RGBColor(51, 65, 85)          # #334155 (Charcoal)
    COLOR_MUTED = RGBColor(100, 116, 139)      # #64748B (Gray)

    # Set Normal Style font
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Segoe UI'
    style_normal.font.size = Pt(10.5)
    style_normal.font.color.rgb = COLOR_TEXT

    # --- COVER / HEADER BANNER ---
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(10)
    title_p.paragraph_format.space_after = Pt(4)
    run_title = title_p.add_run("EntryKode E-Commerce CRM Suite")
    run_title.font.name = 'Segoe UI'
    run_title.font.size = Pt(26)
    run_title.font.bold = True
    run_title.font.color.rgb = COLOR_NAVY

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(16)
    run_sub = sub_p.add_run("Master Project Report & Technical Blueprint")
    run_sub.font.name = 'Segoe UI'
    run_sub.font.size = Pt(14)
    run_sub.font.color.rgb = COLOR_PRIMARY
    run_sub.font.bold = True

    # Metadata Table Box
    meta_table = doc.add_table(rows=4, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False

    meta_data = [
        ("Lead & Author:", "Sanjay D (Super Admin & Full Stack Lead - sanjay@entrykode.com)"),
        ("Organization:", "EntryKode Technologies"),
        ("Technology Stack:", "MERN Stack (React 18, Vite 5.4, Tailwind CSS, Node v22, Express, MongoDB 9.0, Razorpay)"),
        ("Document Version & Date:", "Version 2.4.0 (Production Ready) — 14 November 2026")
    ]

    for i, (label, val) in enumerate(meta_data):
        row = meta_table.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.7)
        set_cell_background(c0, "F8FAFC")
        set_cell_background(c1, "F1F5F9")
        set_cell_margins(c0, top=80, bottom=80, left=120, right=120)
        set_cell_margins(c1, top=80, bottom=80, left=120, right=120)
        
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_after = Pt(0)
        r0 = p0.add_run(label)
        r0.font.bold = True
        r0.font.size = Pt(9.5)
        r0.font.color.rgb = COLOR_NAVY

        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(0)
        r1 = p1.add_run(val)
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = COLOR_TEXT

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # --- PARSE MARKDOWN CONTENT ---
    lines = md_text.split("\n")
    in_code_block = False
    code_lines = []
    in_table = False
    table_lines = []

    def flush_table(t_lines):
        if not t_lines:
            return
        parsed_rows = []
        for l in t_lines:
            if re.match(r'^\s*\|?\s*:?-+:?\s*(\|?\s*:?-+:?\s*)+\|?\s*$', l):
                continue
            cells = [c.strip() for c in l.strip().strip('|').split('|')]
            if cells:
                parsed_rows.append(cells)
        if not parsed_rows:
            return

        cols_count = max(len(r) for r in parsed_rows)
        tbl = doc.add_table(rows=len(parsed_rows), cols=cols_count)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER

        for row_idx, r_data in enumerate(parsed_rows):
            is_header = (row_idx == 0)
            row = tbl.rows[row_idx]
            for col_idx in range(cols_count):
                cell = row.cells[col_idx]
                val = r_data[col_idx] if col_idx < len(r_data) else ""
                val = re.sub(r'[*`_]', '', val)
                set_cell_margins(cell, top=100, bottom=100, left=120, right=120)

                if is_header:
                    set_cell_background(cell, "1E293B")
                elif row_idx % 2 == 1:
                    set_cell_background(cell, "F8FAFC")
                else:
                    set_cell_background(cell, "FFFFFF")

                p = cell.paragraphs[0]
                p.paragraph_format.space_after = Pt(0)
                r = p.add_run(val)
                r.font.name = 'Segoe UI'
                r.font.size = Pt(9)
                if is_header:
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(255, 255, 255)
                else:
                    r.font.color.rgb = COLOR_TEXT

        doc.add_paragraph().paragraph_format.space_after = Pt(8)

    skip_front = True
    for line in lines:
        raw_line = line.rstrip()

        # Skip original header in MD since we made custom cover
        if skip_front:
            if raw_line.startswith("## 1. Executive Summary"):
                skip_front = False
            else:
                continue

        # Code block handler
        if raw_line.startswith("```"):
            if in_code_block:
                in_code_block = False
                # flush code block
                tbl = doc.add_table(rows=1, cols=1)
                tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
                cell = tbl.rows[0].cells[0]
                cell.width = Inches(6.9)
                set_cell_background(cell, "0F172A")
                set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
                p = cell.paragraphs[0]
                p.paragraph_format.space_after = Pt(0)
                r = p.add_run("\n".join(code_lines))
                r.font.name = 'Consolas'
                r.font.size = Pt(8.5)
                r.font.color.rgb = RGBColor(56, 189, 248) # Cyan
                code_lines = []
                doc.add_paragraph().paragraph_format.space_after = Pt(6)
            else:
                in_code_block = True
                code_lines = []
            continue

        if in_code_block:
            code_lines.append(raw_line)
            continue

        # Markdown Table handler
        if raw_line.strip().startswith("|"):
            in_table = True
            table_lines.append(raw_line)
            continue
        elif in_table:
            in_table = False
            flush_table(table_lines)
            table_lines = []

        # Empty lines
        if not raw_line.strip():
            continue

        # Headers
        if raw_line.startswith("## "):
            h_text = raw_line[3:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(18)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.keep_with_next = True
            r = p.add_run(h_text)
            r.font.name = 'Segoe UI'
            r.font.size = Pt(16)
            r.font.bold = True
            r.font.color.rgb = COLOR_NAVY
            continue

        if raw_line.startswith("### "):
            h_text = raw_line[4:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.keep_with_next = True
            r = p.add_run(h_text)
            r.font.name = 'Segoe UI'
            r.font.size = Pt(13)
            r.font.bold = True
            r.font.color.rgb = COLOR_PRIMARY
            continue

        if raw_line.startswith("#### "):
            h_text = raw_line[5:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.keep_with_next = True
            r = p.add_run(h_text)
            r.font.name = 'Segoe UI'
            r.font.size = Pt(11)
            r.font.bold = True
            r.font.color.rgb = COLOR_NAVY
            continue

        # Bullet items
        if raw_line.strip().startswith("- ") or raw_line.strip().startswith("* "):
            bullet_text = re.sub(r'^[ \t]*[-*]\s+', '', raw_line)
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            
            # Simple bold/inline parsing
            parts = re.split(r'(\*\*.*?\*\*|\`.*?\`)', bullet_text)
            for part in parts:
                if part.startswith("**") and part.endswith("**"):
                    r = p.add_run(part[2:-2])
                    r.font.bold = True
                    r.font.color.rgb = COLOR_NAVY
                elif part.startswith("`") and part.endswith("`"):
                    r = p.add_run(part[1:-1])
                    r.font.name = 'Consolas'
                    r.font.size = Pt(9.5)
                    r.font.color.rgb = COLOR_PRIMARY
                else:
                    p.add_run(part)
            continue

        # Numbered list
        num_match = re.match(r'^[ \t]*(\d+)\.\s+(.*)$', raw_line)
        if num_match:
            item_text = num_match.group(2)
            p = doc.add_paragraph(style='List Number')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            parts = re.split(r'(\*\*.*?\*\*|\`.*?\`)', item_text)
            for part in parts:
                if part.startswith("**") and part.endswith("**"):
                    r = p.add_run(part[2:-2])
                    r.font.bold = True
                    r.font.color.rgb = COLOR_NAVY
                elif part.startswith("`") and part.endswith("`"):
                    r = p.add_run(part[1:-1])
                    r.font.name = 'Consolas'
                    r.font.size = Pt(9.5)
                    r.font.color.rgb = COLOR_PRIMARY
                else:
                    p.add_run(part)
            continue

        # Normal Paragraph
        clean_line = raw_line.strip()
        if clean_line == "---":
            continue

        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(6)
        parts = re.split(r'(\*\*.*?\*\*|\`.*?\`)', clean_line)
        for part in parts:
            if part.startswith("**") and part.endswith("**"):
                r = p.add_run(part[2:-2])
                r.font.bold = True
                r.font.color.rgb = COLOR_NAVY
            elif part.startswith("`") and part.endswith("`"):
                r = p.add_run(part[1:-1])
                r.font.name = 'Consolas'
                r.font.size = Pt(9.5)
                r.font.color.rgb = COLOR_PRIMARY
            else:
                p.add_run(part)

    # In case of leftover table
    if in_table and table_lines:
        flush_table(table_lines)

    doc.save(docx_path)
    print(f"SUCCESS: Report saved to {docx_path}")

if __name__ == "__main__":
    md_file = r"D:\EntryKode\PROJECT_REPORT.md"
    docx_file = r"D:\EntryKode\EntryKode_CRM_Master_Project_Report.docx"
    create_project_report_docx(md_file, docx_file)
