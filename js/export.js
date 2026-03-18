/**
 * export.js — PDF report generation using jsPDF.
 */

const Export = (() => {
    function init() {
        const btn = document.getElementById('exportPdfBtn');
        if (btn) {
            btn.addEventListener('click', generateReport);
            console.log('[Export] PDF Export module initialized.');
        } else {
            console.error('[Export] Button #exportPdfBtn not found!');
        }
    }

    function generateReport() {
        console.log('[Export] Generating PDF report...');
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            alert('jsPDF library not loaded.');
            return;
        }

        const featA = App.state.featuresA;
        const featB = App.state.featuresB;
        const sim = App.state.similarityResult;

        if (!featA || !featB) {
            alert('Please analyze both samples before exporting.');
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 20;

        // Title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('SamDetector | DFPS — Forensic Analysis Report', pageWidth / 2, y, { align: 'center' });
        y += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120);
        doc.text('Digital Forensic Phonetics — DFPS Professional Report', pageWidth / 2, y, { align: 'center' });
        y += 5;
        doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: 'center' });
        y += 12;

        // Line
        doc.setDrawColor(200);
        doc.line(20, y, pageWidth - 20, y);
        y += 8;

        // Features table
        doc.setTextColor(40);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Extracted Features', 20, y);
        y += 8;

        const features = [
            ['Feature', 'Sample A', 'Sample B'],
            ['Duration', `${featA.duration} s`, `${featB.duration} s`],
            ['Pitch Mean', `${featA.pitch.mean} Hz`, `${featB.pitch.mean} Hz`],
            ['Pitch Range', `${featA.pitch.range} Hz`, `${featB.pitch.range} Hz`],
            ['F1 Mean', `${featA.formants.f1_mean} Hz`, `${featB.formants.f1_mean} Hz`],
            ['F2 Mean', `${featA.formants.f2_mean} Hz`, `${featB.formants.f2_mean} Hz`],
            ['Speech Rate', `${featA.speech_rate} syl/s`, `${featB.speech_rate} syl/s`],
            ['Avg Pause', `${featA.avg_pause_length} s`, `${featB.avg_pause_length} s`],
        ];

        doc.setFontSize(9);
        const colWidths = [50, 55, 55];
        const startX = 20;

        features.forEach((row, idx) => {
            let x = startX;
            row.forEach((cell, ci) => {
                if (idx === 0) {
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(80);
                } else {
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(40);
                }
                doc.text(cell, x, y);
                x += colWidths[ci];
            });
            y += 6;
        });

        y += 6;

        // Similarity score
        if (sim) {
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40);
            doc.text('Similarity Analysis', 20, y);
            y += 8;

            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(`Overall Similarity: ${sim.similarity_pct}%`, 20, y);
            y += 6;

            // NEW: LR Display
            if (sim.lr) {
                doc.setFont('helvetica', 'bold');
                doc.text(`Likelihood Ratio (LR): ${sim.lr.toExponential(2)}`, 20, y);
                y += 6;
                doc.text(`Log10(LR): ${sim.log_lr.toFixed(2)}`, 20, y);
                y += 6;
                doc.setTextColor(56, 189, 248); // Accent blue
                doc.text(`Verbal Scale: ${sim.verbal_scale}`, 20, y);
                doc.setTextColor(40);
                y += 8;
            }

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(sim.confidence_text, 20, y, { maxWidth: pageWidth - 40 });
            y += 10;

            // Feature breakdown
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Feature Breakdown:', 20, y);
            y += 6;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);

            const labels = {
                pitch_mean: 'Pitch Mean',
                pitch_range: 'Pitch Range',
                formants: 'Formants',
                speech_rate: 'Speech Rate',
                pause: 'Pause Pattern',
            };

            for (const [key, val] of Object.entries(sim.feature_scores)) {
                doc.text(`  ${labels[key] || key}: ${val}%`, 25, y);
                y += 5;
            }
            y += 4;

            // Explanations
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('Analysis Notes:', 20, y);
            y += 6;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);

            sim.explanations.forEach(text => {
                const lines = doc.splitTextToSize(`• ${text}`, pageWidth - 45);
                lines.forEach(line => {
                    if (y > 270) { doc.addPage(); y = 20; }
                    doc.text(line, 25, y);
                    y += 5;
                });
            });
        }

        // Courtroom report if available
        const report = document.getElementById('witnessReport')?.value;
        if (report && report.trim().length > 0) {
            y += 8;
            if (y > 250) { doc.addPage(); y = 20; }
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.text('Expert Witness Report', 20, y);
            y += 8;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            const reportLines = doc.splitTextToSize(report, pageWidth - 40);
            reportLines.forEach(line => {
                if (y > 270) { doc.addPage(); y = 20; }
                doc.text(line, 20, y);
                y += 5;
            });
        }

        // Footer disclaimer
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(150);
            doc.text(
                'CONFIDENTIAL: FOR FORENSIC USE ONLY. SamDetector | DFPS © 2026 — System Architecture: Abdus Samad Khan',
                pageWidth / 2,
                285,
                { align: 'center' }
            );
        }

        doc.save('voice_comparison_report.pdf');
    }

    return { init };
})();
