// PDF Report Generator — Styled to match Closet Profile PDF aesthetic

class ReportGenerator {
    constructor(calculator) {
        this.calculator = calculator;
    }

    async generate() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const estimate = this.calculator.getEstimate();
        const calculations = estimate.calculations;

        // ── Palette (matches Closet Profile) ──────────────────────────
        const gold    = [171, 137, 0];
        const black   = [0, 0, 0];
        const muted   = [125, 117, 103];
        const faint   = [184, 173, 154];
        const lineclr = [230, 224, 212];
        const tintbg  = [250, 248, 243];

        const left  = 15;
        const right = 195;

        // $1,974.31 style currency
        const money = (n) => '$' + (Number(n) || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2, maximumFractionDigits: 2
        });

        // Split typed text into clean lines: one per line break, leading
        // "-", "•", "*" removed (the PDF adds its own dash), blanks dropped
        const cleanLines = (text) => String(text || '')
            .split(/\r?\n/)
            .map(l => l.replace(/^\s*[-–—•*·]+\s*/, '').trim())
            .filter(Boolean);

        // ── Fixed header coordinates (no accumulation drift) ──────────
        const LOGO_TOP   = 10;
        const LOGO_H     = 22;
        const RULE_Y     = LOGO_TOP + LOGO_H + 3;
        const LABEL_Y    = RULE_Y + 6;
        const NAME_Y     = LABEL_Y + 4;
        const SUBINFO_Y  = NAME_Y + 5;

        // ── Logo ───────────────────────────────────────────────────────
        try {
            const logoImg = document.getElementById('logo-img');
            if (logoImg && logoImg.complete) {
                const aspectRatio = logoImg.naturalWidth / logoImg.naturalHeight;
                const logoW = Math.min(LOGO_H * aspectRatio, 80);
                doc.addImage(logoImg, 'JPEG', left, LOGO_TOP, logoW, LOGO_H);
            }
        } catch (e) {
            console.log('Logo not added to PDF');
        }

        // ── "QUOTE" label — top-right, aligned to logo top ────────────
        doc.setFont(undefined, 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...black);
        doc.text('QUOTE', right, LOGO_TOP + 4, { align: 'right' });

        // ── Gold rule ──────────────────────────────────────────────────
        doc.setDrawColor(...gold);
        doc.setLineWidth(0.5);
        doc.line(left, RULE_Y, right, RULE_Y);

        // ── CLIENT / DATE labels ───────────────────────────────────────
        doc.setFont(undefined, 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...black);
        doc.text('CLIENT', left, LABEL_Y);
        doc.text('QUOTE #', right - 36, LABEL_Y);
        doc.text('DATE', right, LABEL_Y, { align: 'right' });

        // ── Client name / quote # / date values ───────────────────────
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...black);
        doc.text(estimate.client.name || '—', left, NAME_Y);

        const quoteNum = estimate.revision > 0
            ? `${estimate.quoteNumber} (Rev. ${estimate.revision})`
            : estimate.quoteNumber;
        doc.setFontSize(8);
        doc.text(quoteNum, right - 36, NAME_Y);
        doc.text(new Date(estimate.date).toLocaleDateString(), right, NAME_Y, { align: 'right' });

        // ── Sub info (address, phone, email) — muted ──────────────────
        doc.setFontSize(7.5);
        doc.setTextColor(...muted);
        const contactLines = [
            estimate.client.address,
            estimate.client.phone,
            estimate.client.email
        ].filter(Boolean);
        contactLines.forEach((line, i) => {
            doc.text(line, left, SUBINFO_Y + (i * 4));
        });

        // ── Client block bottom rule ───────────────────────────────────
        const clientBlockBottom = SUBINFO_Y + Math.max(contactLines.length, 1) * 4 + 4;
        doc.setDrawColor(...lineclr);
        doc.setLineWidth(0.3);
        doc.line(left, clientBlockBottom, right, clientBlockBottom);

        // ── Content starts here ────────────────────────────────────────
        let y = clientBlockBottom + 8;

        // ── Layout constants for the line-item table ───────────────────
        const QTY_X       = 130;
        const UNIT_X      = 160;
        const DESC_W      = 100;   // description column width (stops before QTY)
        const INDENT      = 3;     // hanging indent for bullet text
        const TITLE_LINE  = 4.6;   // line height for 9pt titles
        const LINE        = 4.2;   // line height for 8pt bullets / notes
        const PAGE_BOTTOM = 262;   // last usable baseline before the footer area
        const PAGE_TOP    = 15;

        // Table header — drawn on the first page and repeated on new pages
        const drawTableHeader = (yy) => {
            doc.setFontSize(7);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...black);
            doc.text('ITEM DESCRIPTION', left, yy);
            doc.text('QTY', QTY_X, yy, { align: 'right' });
            doc.text('UNIT PRICE', UNIT_X, yy, { align: 'right' });
            doc.text('AMOUNT', right, yy, { align: 'right' });
            yy += 1;
            doc.setDrawColor(...gold);
            doc.setLineWidth(0.5);
            doc.line(left, yy, right, yy);
            return yy + 6;
        };

        const newPageWithHeader = () => {
            doc.addPage();
            return drawTableHeader(PAGE_TOP);
        };

        y = drawTableHeader(y);
        const firstItemY = y;

        // ── Rooms / line items ─────────────────────────────────────────
        estimate.rooms.forEach((room, index) => {
            const roomCalc    = calculations.rooms[index];
            const description = this.calculator.generateRoomDescription(room);

            // 1. Clean details: one bullet per typed line, no doubled dashes
            const bullets = [];
            description.details.forEach(d => cleanLines(d).forEach(l => bullets.push(l)));
            const notes = cleanLines(room.notes);

            // 2. Wrap everything to the description column
            doc.setFont(undefined, 'bold');
            doc.setFontSize(9);
            const titleLines = doc.splitTextToSize(description.title, DESC_W);

            doc.setFont(undefined, 'normal');
            doc.setFontSize(8);
            const bulletRows = [];
            bullets.forEach(b => {
                doc.splitTextToSize(b, DESC_W - INDENT).forEach((t, i) => {
                    bulletRows.push({ text: t, dash: i === 0 });
                });
            });

            doc.setFont(undefined, 'italic');
            const noteRows = [];
            notes.forEach((n, ni) => {
                const txt = ni === 0 ? `Note: ${n}` : n;
                doc.splitTextToSize(txt, DESC_W - INDENT).forEach((t, i) => {
                    noteRows.push({ text: t, dash: i === 0 });
                });
            });

            // 3. Measure; move the whole item to a new page if it won't fit
            const blockH = titleLines.length * TITLE_LINE + (bulletRows.length + noteRows.length) * LINE;
            if (y + blockH > PAGE_BOTTOM && y > firstItemY + 1) {
                y = newPageWithHeader();
            }

            // Title — bold black
            const titleY = y;
            doc.setFont(undefined, 'bold');
            doc.setFontSize(9);
            doc.setTextColor(...black);
            titleLines.forEach(t => { doc.text(t, left, y); y += TITLE_LINE; });

            // Bullets — normal black, hanging indent
            doc.setFont(undefined, 'normal');
            doc.setFontSize(8);
            doc.setTextColor(...black);
            bulletRows.forEach(r => {
                if (y > PAGE_BOTTOM) { y = newPageWithHeader(); doc.setFont(undefined, 'normal'); doc.setFontSize(8); doc.setTextColor(...black); }
                if (r.dash) doc.text('-', left, y);
                doc.text(r.text, left + INDENT, y);
                y += LINE;
            });

            // Notes — italic muted, same indent
            if (noteRows.length) {
                doc.setFont(undefined, 'italic');
                doc.setTextColor(...muted);
                noteRows.forEach(r => {
                    if (y > PAGE_BOTTOM) { y = newPageWithHeader(); doc.setFont(undefined, 'italic'); doc.setFontSize(8); doc.setTextColor(...muted); }
                    if (r.dash) doc.text('-', left, y);
                    doc.text(r.text, left + INDENT, y);
                    y += LINE;
                });
            }

            // 4. Prices — on the title row
            doc.setFont(undefined, 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...black);
            doc.text('1', QTY_X, titleY, { align: 'right' });
            doc.text(money(roomCalc.total), UNIT_X, titleY, { align: 'right' });
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...gold);
            doc.text(money(roomCalc.total), right, titleY, { align: 'right' });
            doc.setTextColor(...black);
            doc.setFont(undefined, 'normal');

            // 5. Spacing + light separator between items
            const lastBaseline = y - LINE;
            if (index < estimate.rooms.length - 1) {
                const sepY = lastBaseline + 3.5;
                doc.setDrawColor(...lineclr);
                doc.setLineWidth(0.2);
                doc.line(left, sepY, right, sepY);
                y = sepY + 6.5;
            } else {
                y = lastBaseline;
            }
        });

        // ── Totals ─────────────────────────────────────────────────────
        if (y > 235) { doc.addPage(); y = 15; }

        // Separator line before totals
        y += 6;
        doc.setDrawColor(...lineclr);
        doc.setLineWidth(0.3);
        doc.line(left, y, right, y);
        y += 10;

        // Thank you — gold italic
        doc.setFont(undefined, 'italic');
        doc.setFontSize(9);
        doc.setTextColor(...gold);
        doc.text('Thank you for your business!', left, y);
        y += 8;

        // Subtotal
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...black);
        doc.text('SUBTOTAL', 130, y);
        doc.text(money(calculations.subtotal), right, y, { align: 'right' });
        y += 5;

        // Discount
        if (calculations.discount > 0) {
            const discountLabel = estimate.discountType === 'percent'
                ? `DISCOUNT (${estimate.discountValue}%)`
                : 'DISCOUNT';
            doc.setTextColor(...gold);
            doc.text(discountLabel, 130, y);
            doc.text('-' + money(calculations.discount), right, y, { align: 'right' });
            doc.setTextColor(...black);
            y += 5;
        }

        // Tax
        if (estimate.taxRate > 0) {
            doc.setTextColor(...black);
            doc.text(`TAX (${estimate.taxRate}%)`, 130, y);
            doc.text(money(calculations.tax), right, y, { align: 'right' });
            y += 6;
        } else {
            y += 2;
        }

        // Grand total
        if (y > 265) { doc.addPage(); y = 15; }
        doc.setDrawColor(...gold);
        doc.setLineWidth(0.5);
        doc.line(130, y, right, y);
        y += 6;

        doc.setFont(undefined, 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...black);
        doc.text('TOTAL', 130, y);
        doc.setTextColor(...gold);
        doc.text(money(calculations.total), right, y, { align: 'right' });
        y += 10;

        // Terms — muted small text
        if (y > 270) { doc.addPage(); y = 15; }
        doc.setFont(undefined, 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...muted);
        doc.text('Terms: 50% deposit required. Balance due upon completion. Valid for 30 days.', left, y);

        // ── Footer ─────────────────────────────────────────────────────
        const pageHeight = doc.internal.pageSize.height;
        const footerY = pageHeight - 14;

        doc.setDrawColor(...lineclr);
        doc.setLineWidth(0.3);
        doc.line(left, footerY - 6, right, footerY - 6);

        doc.setFont(undefined, 'italic');
        doc.setFontSize(8);
        doc.setTextColor(...gold);
        doc.text('Thank you for your business!', (left + right) / 2, footerY - 1, { align: 'center' });

        doc.setFont(undefined, 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(...faint);
        doc.text('Rangel Pineda  ·  678-709-3790  ·  rangelp@desirecabinets.com', (left + right) / 2, footerY + 4, { align: 'center' });

        // ── Download ───────────────────────────────────────────────────
        const filename = `DC_${estimate.quoteNumber}.pdf`;
        const pdfBlob = doc.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            alert(`Opening PDF: ${filename}\n\nNote: iOS will show "Unknown.pdf" — you can rename it after saving.`);
            window.open(blobUrl, '_blank');
        } else {
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }

        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    }

    // Generate alternate quote (e.g., without LEDs)
    async generateAlternate(removeAddonKey = 'colorChangingLEDs') {
        // Save current state
        const originalAddons = this.calculator.getCurrentRoom().addons;

        // Remove specified addon from current room
        if (originalAddons[removeAddonKey]) {
            originalAddons[removeAddonKey].enabled = false;
        }

        // Update quote number for alternate
        const originalQuoteNum = this.calculator.estimate.quoteNumber;
        this.calculator.estimate.quoteNumber = originalQuoteNum + '-ALT';

        // Generate PDF
        await this.generate();

        // Restore original state
        this.calculator.getCurrentRoom().addons = originalAddons;
        this.calculator.estimate.quoteNumber = originalQuoteNum;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReportGenerator;
}
