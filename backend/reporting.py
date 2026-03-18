from fpdf import FPDF
import datetime
import json

class ForensicReport(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'SamDetect | Vocal Forensic Analysis Report', 0, 1, 'C')
        self.set_font('Arial', '', 10)
        self.cell(0, 10, f'Generated on: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', 0, 1, 'R')
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()} | CONFIDENTIAL FORENSIC DOCUMENT', 0, 0, 'C')

def generate_pdf_report(case_data: dict, analysis_results: dict, output_path: str):
    pdf = ForensicReport()
    pdf.add_page()
    
    # 1. Case Summary
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(0, 10, '1. CASE SUMMARY', 0, 1, 'L')
    pdf.set_font('Arial', '', 10)
    pdf.multi_cell(0, 5, f"Case Number: {case_data.get('case_id', 'N/A')}\nDescription: {case_data.get('description', 'N/A')}\nAnalyst: {case_data.get('analyst', 'System')}")
    pdf.ln(5)

    # 2. Evidence Description
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(0, 10, '2. EVIDENCE DESCRIPTION', 0, 1, 'L')
    pdf.set_font('Arial', '', 10)
    samples = analysis_results.get('samples', [])
    for s in samples:
        pdf.multi_cell(0, 5, f"Sample: {s['name']}\nFormat: {s['metadata']['format']} | SR: {s['metadata']['sample_rate']}Hz | SNR: {s['preprocessing']['snr_db']}dB")
        pdf.ln(2)

    # 3. Forensic Comparison Results
    pdf.add_page()
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(0, 10, '3. LIKELIHOOD RATIO ANALYSIS', 0, 1, 'L')
    pdf.set_font('Arial', '', 11)
    lr_data = analysis_results.get('comparison', {})
    pdf.cell(0, 10, f"Log-Likelihood Ratio (Log-LR): {round(lr_data.get('log_lr', 0), 2)}", 0, 1)
    pdf.set_text_color(200, 0, 0)
    pdf.multi_cell(0, 10, f"Verbal Scale Conclusion: {lr_data.get('verbal_scale', 'N/A')}")
    pdf.set_text_color(0, 0, 0)
    pdf.ln(5)

    # 4. Limitations & Reproducibility
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(0, 10, '4. PARAMETER TRANSPARENCY & LIMITATIONS', 0, 1, 'L')
    pdf.set_font('Arial', 'I', 9)
    pdf.multi_cell(0, 5, "This analysis was performed using the SamDetect v2.0 engine. All calculations are based on probabilistic modeling and should be interpreted as strength of evidence rather than absolute identification. Reproducibility parameters are stored in JSON format within the case file.")
    
    pdf.output(output_path)
    return output_path
