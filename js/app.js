// Main App Controller - Desire Cabinets LLC

class ClosetEstimatorApp {

    constructor() {
        this.calculator      = new ClosetCalculator();
        this.reportGenerator = new ReportGenerator(this.calculator);
        this.init();
    }

    // ── Init ──────────────────────────────────────────────────────────────────

    init() {
        this.calculator.loadFromStorage();
        this.renderRoomTabs();
        this.switchPanelForCurrentRoom();
        this.loadClientValues();
        this.loadSummaryValues();
        this.updateQuoteInfo();
        this.calculate();
        this.setupAutoSave();
    }

    // Show the right panel (closet form vs custom item form) for current room
    switchPanelForCurrentRoom() {
        const room = this.calculator.getCurrentRoom();
        if (room.type === 'custom') {
            this.showCustomPanel();
            this.loadCustomItemValues();
        } else {
            this.showClosetPanel();
            this.renderAllSelectors();
            this.loadClosetValues();
        }
    }

    showClosetPanel() {
        document.getElementById('closetPanel').style.display = 'block';
        document.getElementById('customItemPanel').style.display = 'none';
    }

    showCustomPanel() {
        document.getElementById('closetPanel').style.display = 'none';
        document.getElementById('customItemPanel').style.display = 'block';
    }

    // ── Render selectors ──────────────────────────────────────────────────────

    renderAllSelectors() {
        this.renderClosetTypeSelector();
        this.renderDepthSelector();
        this.renderMaterialSelector();
        this.renderPullsSelector();
        this.renderRodsSelector();
        this.renderMountingSelector();
        this.renderAddonList();
    }

    renderRoomTabs() {
        const container = document.getElementById('roomTabs');
        const rooms     = this.calculator.getRooms();
        const current   = this.calculator.currentRoomIndex;

        container.innerHTML = rooms.map((room, i) => {
            const isCustom = room.type === 'custom';
            const label    = room.name || (isCustom ? `Item ${i + 1}` : `Room ${i + 1}`);
            const prefix   = isCustom ? '\u2736 ' : '';
            const active   = i === current ? 'active' : '';
            const cls      = isCustom ? 'room-tab custom-tab' : 'room-tab';
            const delBtn   = rooms.length > 1
                ? `<span class="room-tab-remove" onclick="event.stopPropagation(); app.deleteRoom(${i})">&times;</span>`
                : '';
            return `<button class="${cls} ${active}" onclick="app.switchToRoom(${i})">
                        <span class="room-tab-name">${prefix}${label}</span>${delBtn}
                    </button>`;
        }).join('') +
        `<button class="room-tab-add" onclick="app.addNewRoom()">+ Add Room</button>` +
        `<button class="room-tab-add" style="border-style:dashed;opacity:0.8;" onclick="app.addNewCustomItem()">\u2736 Add Item</button>`;
    }

    renderClosetTypeSelector() {
        const el   = document.getElementById('closetTypeSelector');
        const room = this.calculator.getCurrentRoom();
        el.innerHTML = [
            { id: 'walk-in',  name: 'Walk-In'  },
            { id: 'reach-in', name: 'Reach-In' }
        ].map(t => `<button class="selection-btn ${room.closet.closetType === t.id ? 'selected' : ''}"
                        onclick="app.selectClosetType('${t.id}')">${t.name}</button>`).join('');
    }

    renderDepthSelector() {
        const el   = document.getElementById('depthSelector');
        const room = this.calculator.getCurrentRoom();
        el.innerHTML = [14, 16, 19, 24].map(d => `
            <div class="depth-option ${room.closet.depth === d ? 'selected' : ''}"
                 onclick="app.selectDepth(${d})">
                <input type="radio" name="depth" value="${d}" ${room.closet.depth === d ? 'checked' : ''}>
                <div class="depth-label">${d}"</div>
            </div>`).join('');
    }

    renderMaterialSelector() {
        const el   = document.getElementById('materialSelector');
        const room = this.calculator.getCurrentRoom();
        el.innerHTML = PRICING_CONFIG.materials.map(m => `
            <button class="selection-btn ${room.closet.material === m.id ? 'selected' : ''}"
                    onclick="app.selectMaterial('${m.id}')">
                ${m.name}${m.upcharge > 0 ? ` (+$${m.upcharge}/ft)` : ''}
            </button>`).join('');
    }

    renderPullsSelector() {
        const el   = document.getElementById('pullsSelector');
        const room = this.calculator.getCurrentRoom();
        el.innerHTML = PRICING_CONFIG.pullsHandles.map(h => `
            <button class="selection-btn ${room.closet.pullsHandles === h.id ? 'selected' : ''}"
                    onclick="app.selectPulls('${h.id}')">${h.name}</button>`).join('');
    }

    renderRodsSelector() {
        const el   = document.getElementById('rodsSelector');
        const room = this.calculator.getCurrentRoom();
        el.innerHTML = PRICING_CONFIG.hangingRods.map(h => `
            <button class="selection-btn ${room.closet.hangingRods === h.id ? 'selected' : ''}"
                    onclick="app.selectRods('${h.id}')">${h.name}</button>`).join('');
    }

    renderMountingSelector() {
        const el   = document.getElementById('mountingSelector');
        const room = this.calculator.getCurrentRoom();
        el.innerHTML = PRICING_CONFIG.mounting.map(m => `
            <button class="selection-btn ${room.closet.mounting === m.id ? 'selected' : ''}"
                    onclick="app.selectMounting('${m.id}')">${m.name}</button>`).join('');
    }

    renderAddonList() {
        const el   = document.getElementById('addonList');
        const room = this.calculator.getCurrentRoom();
        el.innerHTML = Object.entries(PRICING_CONFIG.addons).map(([key, addon]) => {
            const saved = room.addons[key] || { enabled: false, quantity: 0 };
            const total = (parseFloat(saved.quantity) || 0) * addon.price;
            const step  = addon.unit.includes('linear') ? '0.5' : '1';
            return `<div class="addon-item">
                <input type="checkbox" id="addon-${key}" ${saved.enabled ? 'checked' : ''}
                       onchange="app.toggleAddon('${key}', this.checked)">
                <div class="addon-details">
                    <div class="addon-name">${addon.name}</div>
                    <div class="addon-unit">$${addon.price.toFixed(2)} / ${addon.unit}</div>
                </div>
                <input type="number" class="addon-quantity" id="qty-${key}"
                       min="0" step="${step}" value="${saved.quantity}" placeholder="Qty"
                       onchange="app.updateAddonQty('${key}', parseFloat(this.value) || 0)">
                <div class="addon-price">$${total.toFixed(2)}</div>
            </div>`;
        }).join('');
    }

    // ── Load form values ──────────────────────────────────────────────────────

    loadClientValues() {
        const c = this.calculator.estimate.client;
        document.getElementById('clientName').value    = c.name    || '';
        document.getElementById('clientPhone').value   = c.phone   || '';
        document.getElementById('clientAddress').value = c.address || '';
        document.getElementById('clientEmail').value   = c.email   || '';
    }

    loadSummaryValues() {
        const e = this.calculator.estimate;
        document.getElementById('taxRate').value       = e.taxRate      || 0;
        document.getElementById('discountType').value  = e.discountType || 'percent';
        document.getElementById('discountValue').value = e.discountValue || 0;
        document.getElementById('revisionNumber').value= e.revision     || 0;
    }

    loadClosetValues() {
        const room = this.calculator.getCurrentRoom();
        if (room.type !== 'room') return;
        document.getElementById('roomName').value     = room.name                    || '';
        document.getElementById('linearFeet').value   = room.closet.linearFeet       || 0;
        document.getElementById('height').value       = room.closet.height           || 96;
        document.getElementById('drawingNumber').value= room.closet.drawingNumber    || '';
        document.getElementById('roomNotes').value    = room.notes                   || '';
    }

    loadCustomItemValues() {
        const room = this.calculator.getCurrentRoom();
        document.getElementById('customItemName').value       = room.name        || '';
        document.getElementById('customItemDescription').value= room.description || '';
        document.getElementById('customItemPrice').value      = room.price       || 0;
    }

    // ── Room management ───────────────────────────────────────────────────────

    addNewRoom() {
        this.calculator.addRoom();
        this.renderRoomTabs();
        this.switchToRoom(this.calculator.currentRoomIndex);
    }

    addNewCustomItem() {
        this.calculator.addCustomItem();
        this.renderRoomTabs();
        this.switchToRoom(this.calculator.currentRoomIndex);
    }

    deleteRoom(index) {
        if (confirm('Delete this room/item?')) {
            if (this.calculator.removeRoom(index)) {
                this.renderRoomTabs();
                this.switchToRoom(this.calculator.currentRoomIndex);
            }
        }
    }

    switchToRoom(index) {
        this.calculator.switchRoom(index);
        this.renderRoomTabs();
        this.switchPanelForCurrentRoom();
        this.calculate();
    }

    // ── Selectors ─────────────────────────────────────────────────────────────

    selectClosetType(type) {
        this.calculator.updateCloset('closetType', type);
        this.renderClosetTypeSelector();
        this.save();
    }

    selectDepth(depth) {
        this.calculator.updateCloset('depth', depth);
        this.renderDepthSelector();
        this.calculate();
    }

    selectMaterial(id) {
        this.calculator.updateCloset('material', id);
        this.renderMaterialSelector();
        this.calculate();
    }

    selectPulls(id) {
        this.calculator.updateCloset('pullsHandles', id);
        this.renderPullsSelector();
        this.save();
    }

    selectRods(id) {
        this.calculator.updateCloset('hangingRods', id);
        this.renderRodsSelector();
        this.save();
    }

    selectMounting(id) {
        this.calculator.updateCloset('mounting', id);
        this.renderMountingSelector();
        this.save();
    }

    // ── Addons ────────────────────────────────────────────────────────────────

    toggleAddon(key, enabled) {
        const qty = parseFloat(document.getElementById(`qty-${key}`).value) || 0;
        this.calculator.updateAddon(key, enabled, qty);
        this.renderAddonList();
        this.calculate();
    }

    updateAddonQty(key, qty) {
        const enabled = document.getElementById(`addon-${key}`).checked;
        this.calculator.updateAddon(key, enabled, qty);
        this.renderAddonList();
        this.calculate();
    }

    // ── Field updates ─────────────────────────────────────────────────────────

    updateClient(field, value) {
        this.calculator.updateClient(field, value);
        if (field === 'name') {
            this.calculator.estimate.quoteNumber = this.calculator.generateQuoteNumber(value);
            this.updateQuoteInfo();
        }
        this.save();
    }

    updateCloset(field, value) {
        if (field === 'roomName') {
            this.calculator.updateRoomName(value);
            this.renderRoomTabs();
        } else {
            this.calculator.updateCloset(field, value);
        }
        this.calculate();
    }

    updateCustomItem(field, value) {
        this.calculator.updateCustomItem(field, value);
        if (field === 'name') this.renderRoomTabs();
        this.calculate();
    }

    updateRoomNotes(notes)    { this.calculator.updateRoomNotes(notes); this.save(); }
    updateTax(rate)           { this.calculator.updateTaxRate(rate); this.calculate(); }
    updateRevision(val)       { this.calculator.updateRevision(val); this.save(); }

    updateDiscountType(type) {
        const val = parseFloat(document.getElementById('discountValue').value) || 0;
        this.calculator.updateDiscount(type, val);
        this.calculate();
    }

    updateDiscountValue(value) {
        const type = document.getElementById('discountType').value;
        this.calculator.updateDiscount(type, parseFloat(value) || 0);
        this.calculate();
    }

    // ── Calculate & display ───────────────────────────────────────────────────

    updateQuoteInfo() {
        document.getElementById('quoteNumber').textContent =
            this.calculator.estimate.quoteNumber;
        document.getElementById('quoteDate').textContent =
            new Date(this.calculator.estimate.date).toLocaleDateString();
    }

    calculate() {
        const calc = this.calculator.calculateTotal();

        document.getElementById('summaryBase').textContent = `$${calc.base.toFixed(2)}`;

        const matLine = document.getElementById('materialUpchargeLine');
        document.getElementById('summaryMaterial').textContent = `$${calc.materialUpcharge.toFixed(2)}`;
        matLine.style.display = calc.materialUpcharge > 0 ? 'flex' : 'none';

        const addonsLine = document.getElementById('addonsLine');
        document.getElementById('summaryAddons').textContent = `$${calc.addons.toFixed(2)}`;
        addonsLine.style.display = calc.addons > 0 ? 'flex' : 'none';

        document.getElementById('summaryTotal').textContent = `$${calc.total.toFixed(2)}`;

        const rooms = this.calculator.getRooms();
        document.getElementById('roomCount').textContent =
            rooms.length > 1 ? `${rooms.length} Rooms` : '1 Room';

        this.renderRoomBreakdown(calc);
        this.save();
    }

    renderRoomBreakdown(calc) {
        const container = document.getElementById('roomBreakdownList');
        const rooms     = this.calculator.getRooms();

        if (rooms.length <= 1) {
            container.innerHTML = '';
            document.getElementById('roomBreakdown').style.display = 'none';
            return;
        }

        document.getElementById('roomBreakdown').style.display = 'block';
        container.innerHTML = rooms.map((room, i) => {
            const isCustom = room.type === 'custom';
            const name     = room.name || (isCustom ? `Item ${i+1}` : `Room ${i+1}`);
            const sub      = isCustom ? '\u2736 custom' : `${room.closet.linearFeet || 0} LF`;
            return `<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;
                        color:rgba(255,255,255,0.9);border-bottom:1px solid rgba(255,255,255,0.1);">
                        <span>${name} <span style="opacity:0.6;">(${sub})</span></span>
                        <span style="color:var(--gold);font-weight:600;">$${calc.rooms[i].total.toFixed(2)}</span>
                    </div>`;
        }).join('');
    }

    // ── Persistence ───────────────────────────────────────────────────────────

    save() { this.calculator.saveToStorage(); }

    setupAutoSave() { setInterval(() => this.save(), 30000); }

    downloadQuote() {
        const data = JSON.stringify(this.calculator.estimate, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `DCQuoting_${this.calculator.estimate.quoteNumber}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    uploadQuote(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.calculator.estimate = JSON.parse(e.target.result);
                this.calculator.currentRoomIndex = 0;
                this.renderRoomTabs();
                this.switchPanelForCurrentRoom();
                this.loadClientValues();
                this.loadSummaryValues();
                this.updateQuoteInfo();
                this.calculate();
                alert('Quote loaded successfully!');
            } catch (err) {
                alert('Error loading quote: ' + err.message);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    async generatePDF() {
        const rooms = this.calculator.getRooms();
        const hasContent = rooms.some(r =>
            r.type === 'custom'
                ? parseFloat(r.price) > 0
                : parseFloat(r.closet.linearFeet) > 0
        );
        if (!hasContent) {
            alert('Please enter linear feet or a custom item price before generating quote.');
            return;
        }
        await this.reportGenerator.generate();
    }

    reset() {
        if (confirm('Start a new quote? Current data will be cleared.')) {
            this.calculator.reset();
            this.calculator.saveToStorage();
            location.reload();
        }
    }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ClosetEstimatorApp();
});
