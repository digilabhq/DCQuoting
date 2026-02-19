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

        // ── Table header ───────────────────────────────────────────────
        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...black);
        doc.text('ITEM DESCRIPTION', left, y);
        doc.text('QTY', 130, y, { align: 'right' });
        doc.text('UNIT PRICE', 160, y, { align: 'right' });
        doc.text('AMOUNT', right, y, { align: 'right' });

        y += 1;
        doc.setDrawColor(...gold);
        doc.setLineWidth(0.5);
        doc.line(left, y, right, y);
        y += 6;

        // ── Rooms ──────────────────────────────────────────────────────
        estimate.rooms.forEach((room, index) => {
            const roomCalc = calculations.rooms[index];
            const description = this.calculator.generateRoomDescription(room);

            // Room title — bold black
            doc.setFont(undefined, 'bold');
            doc.setFontSize(9);
            doc.setTextColor(...black);
            doc.text(description.title, left, y);

            // Details as bullet lines
            doc.setFont(undefined, 'normal');
            doc.setFontSize(8);
            doc.setTextColor(...black);

            y += 3.5;
            description.details.forEach(detail => {
                if (y > 260) { doc.addPage(); y = 15; }
                doc.text(`- ${detail}`, left, y);
                y += 3.5;
            });

            // Room notes — italic muted
            if (room.notes && room.notes.trim()) {
                doc.setFont(undefined, 'italic');
                doc.setFontSize(8);
                doc.setTextColor(...muted);
                const notes = doc.splitTextToSize(`Note: ${room.notes}`, 115);
                notes.forEach(line => {
                    if (y > 260) { doc.addPage(); y = 15; }
                    doc.text(`- ${line}`, left, y);
                    y += 3.5;
                });
                doc.setFont(undefined, 'normal');
                doc.setTextColor(...black);
            }

            // Price columns — aligned to title row
            const noteLines = room.notes ? Math.ceil(room.notes.length / 60) : 0;
            const priceY = y - (3.5 * (description.details.length + noteLines)) - 3.5;
            doc.setFontSize(9);
            doc.setTextColor(...black);
            doc.text('1', 130, priceY + 3.5, { align: 'right' });
            doc.text(`$${roomCalc.total.toFixed(2)}`, 160, priceY + 3.5, { align: 'right' });
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...gold);
            doc.text(`$${roomCalc.total.toFixed(2)}`, right, priceY + 3.5, { align: 'right' });
            doc.setTextColor(...black);
            doc.setFont(undefined, 'normal');

            y += 5;
        });

        // ── Totals ─────────────────────────────────────────────────────
        if (y > 235) { doc.addPage(); y = 15; }

        // Separator line before totals
        y += 6;
        doc.setDrawColor(...lineclr);
        doc.setLineWidth(0.3);
        doc.line(left, y, right, y);
        y += 10;

        // Subtotal
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...black);
        doc.text('SUBTOTAL', 130, y);
        doc.text(`$${calculations.subtotal.toFixed(2)}`, right, y, { align: 'right' });
        y += 5;

        // Discount
        if (calculations.discount > 0) {
            const discountLabel = estimate.discountType === 'percent'
                ? `DISCOUNT (${estimate.discountValue}%)`
                : 'DISCOUNT';
            doc.setTextColor(...gold);
            doc.text(discountLabel, 130, y);
            doc.text(`-$${calculations.discount.toFixed(2)}`, right, y, { align: 'right' });
            doc.setTextColor(...black);
            y += 5;
        }

        // Tax
        if (estimate.taxRate > 0) {
            doc.setTextColor(...black);
            doc.text(`TAX (${estimate.taxRate}%)`, 130, y);
            doc.text(`$${calculations.tax.toFixed(2)}`, right, y, { align: 'right' });
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
        doc.text(`$${calculations.total.toFixed(2)}`, right, y, { align: 'right' });
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
