// app.js — Desire Cabinets LLC

class ClosetEstimatorApp {

    constructor() {
        this.calculator      = new ClosetCalculator();
        this.reportGenerator = new ReportGenerator(this.calculator);
        this.init();
    }

    init() {
        this.calculator.loadFromStorage();
        this.renderRoomTabs();
        this.refreshPanel();
        this.loadClientValues();
        this.loadSummaryControls();
        this.updateQuoteInfo();
        this.calculate();
        this.setupAutoSave();
    }

    // ── Panel switching ───────────────────────────────────────────────────────

    refreshPanel() {
        var room = this.calculator.getCurrentRoom();
        if (room.type === 'custom') {
            document.getElementById('closetPanel').style.display  = 'none';
            document.getElementById('customItemPanel').style.display = 'block';
            this.loadCustomValues();
        } else {
            document.getElementById('closetPanel').style.display  = 'block';
            document.getElementById('customItemPanel').style.display = 'none';
            this.renderClosetTypeSelector();
            this.renderDepthSelector();
            this.renderMaterialSelector();
            this.renderPullsSelector();
            this.renderRodsSelector();
            this.renderMountingSelector();
            this.renderAddonList();
            this.loadClosetValues();
        }
    }

    // ── Tabs ──────────────────────────────────────────────────────────────────

    renderRoomTabs() {
        var container = document.getElementById('roomTabs');
        var rooms     = this.calculator.getRooms();
        var current   = this.calculator.currentRoomIndex;
        var html      = '';

        for (var i = 0; i < rooms.length; i++) {
            var room     = rooms[i];
            var isCustom = room.type === 'custom';
            var label    = room.name || (isCustom ? 'Item ' + (i + 1) : 'Room ' + (i + 1));
            var prefix   = isCustom ? '\u2736 ' : '';
            var active   = i === current ? 'active' : '';
            var tabClass = isCustom ? 'room-tab custom-tab ' + active : 'room-tab ' + active;
            var delBtn   = rooms.length > 1
                ? '<span class="room-tab-remove" onclick="event.stopPropagation();app.deleteRoom(' + i + ')">&times;</span>'
                : '';
            html += '<button class="' + tabClass + '" onclick="app.switchToRoom(' + i + ')">'
                  + '<span class="room-tab-name">' + prefix + label + '</span>' + delBtn
                  + '</button>';
        }

        html += '<button class="room-tab-add" onclick="app.addNewRoom()">+ Add Room</button>';
        html += '<button class="room-tab-add" style="border-style:dashed;opacity:0.8;" onclick="app.addNewCustomItem()">\u2736 Add Item</button>';
        container.innerHTML = html;
    }

    // ── Selectors ─────────────────────────────────────────────────────────────

    renderClosetTypeSelector() {
        var el      = document.getElementById('closetTypeSelector');
        var room    = this.calculator.getCurrentRoom();
        var types   = [ { id: 'walk-in', name: 'Walk-In' }, { id: 'reach-in', name: 'Reach-In' } ];
        var html    = '';
        for (var i = 0; i < types.length; i++) {
            var t   = types[i];
            var sel = room.closet.closetType === t.id ? 'selected' : '';
            html   += '<button class="selection-btn ' + sel + '" onclick="app.selectClosetType(\'' + t.id + '\')">' + t.name + '</button>';
        }
        el.innerHTML = html;
    }

    renderDepthSelector() {
        var el     = document.getElementById('depthSelector');
        var room   = this.calculator.getCurrentRoom();
        var depths = [14, 16, 19, 24];
        var html   = '';
        for (var i = 0; i < depths.length; i++) {
            var d   = depths[i];
            var sel = room.closet.depth === d ? 'selected' : '';
            html   += '<div class="depth-option ' + sel + '" onclick="app.selectDepth(' + d + ')">'
                    + '<input type="radio" name="depth" value="' + d + '" ' + (room.closet.depth === d ? 'checked' : '') + '>'
                    + '<div class="depth-label">' + d + '"</div></div>';
        }
        el.innerHTML = html;
    }

    renderMaterialSelector() {
        var el   = document.getElementById('materialSelector');
        var room = this.calculator.getCurrentRoom();
        var html = '';
        var mats = PRICING_CONFIG.materials;
        for (var i = 0; i < mats.length; i++) {
            var m   = mats[i];
            var sel = room.closet.material === m.id ? 'selected' : '';
            var lbl = m.name + (m.upcharge > 0 ? ' (+$' + m.upcharge + '/ft)' : '');
            html   += '<button class="selection-btn ' + sel + '" onclick="app.selectMaterial(\'' + m.id + '\')">' + lbl + '</button>';
        }
        el.innerHTML = html;
    }

    renderPullsSelector() {
        var el   = document.getElementById('pullsSelector');
        var room = this.calculator.getCurrentRoom();
        var html = '';
        var list = PRICING_CONFIG.pullsHandles;
        for (var i = 0; i < list.length; i++) {
            var h   = list[i];
            var sel = room.closet.pullsHandles === h.id ? 'selected' : '';
            html   += '<button class="selection-btn ' + sel + '" onclick="app.selectPulls(\'' + h.id + '\')">' + h.name + '</button>';
        }
        el.innerHTML = html;
    }

    renderRodsSelector() {
        var el   = document.getElementById('rodsSelector');
        var room = this.calculator.getCurrentRoom();
        var html = '';
        var list = PRICING_CONFIG.hangingRods;
        for (var i = 0; i < list.length; i++) {
            var h   = list[i];
            var sel = room.closet.hangingRods === h.id ? 'selected' : '';
            html   += '<button class="selection-btn ' + sel + '" onclick="app.selectRods(\'' + h.id + '\')">' + h.name + '</button>';
        }
        el.innerHTML = html;
    }

    renderMountingSelector() {
        var el   = document.getElementById('mountingSelector');
        var room = this.calculator.getCurrentRoom();
        var html = '';
        var list = PRICING_CONFIG.mounting;
        for (var i = 0; i < list.length; i++) {
            var m   = list[i];
            var sel = room.closet.mounting === m.id ? 'selected' : '';
            html   += '<button class="selection-btn ' + sel + '" onclick="app.selectMounting(\'' + m.id + '\')">' + m.name + '</button>';
        }
        el.innerHTML = html;
    }

    renderAddonList() {
        var el   = document.getElementById('addonList');
        var room = this.calculator.getCurrentRoom();
        var html = '';
        var keys = Object.keys(PRICING_CONFIG.addons);
        for (var i = 0; i < keys.length; i++) {
            var key   = keys[i];
            var addon = PRICING_CONFIG.addons[key];
            var saved = room.addons[key] || { enabled: false, quantity: 0 };
            var total = (parseFloat(saved.quantity) || 0) * addon.price;
            var step  = addon.unit.indexOf('linear') >= 0 ? '0.5' : '1';
            html += '<div class="addon-item">'
                  + '<input type="checkbox" id="addon-' + key + '" ' + (saved.enabled ? 'checked' : '') + ' onchange="app.toggleAddon(\'' + key + '\', this.checked)">'
                  + '<div class="addon-details"><div class="addon-name">' + addon.name + '</div>'
                  + '<div class="addon-unit">$' + addon.price.toFixed(2) + ' / ' + addon.unit + '</div></div>'
                  + '<input type="number" class="addon-quantity" id="qty-' + key + '" min="0" step="' + step + '" value="' + saved.quantity + '" placeholder="Qty" onchange="app.updateAddonQty(\'' + key + '\', parseFloat(this.value)||0)">'
                  + '<div class="addon-price">$' + total.toFixed(2) + '</div>'
                  + '</div>';
        }
        el.innerHTML = html;
    }

    // ── Load values into form fields ──────────────────────────────────────────

    loadClientValues() {
        var c = this.calculator.estimate.client;
        document.getElementById('clientName').value    = c.name    || '';
        document.getElementById('clientPhone').value   = c.phone   || '';
        document.getElementById('clientAddress').value = c.address || '';
        document.getElementById('clientEmail').value   = c.email   || '';
    }

    loadSummaryControls() {
        var e = this.calculator.estimate;
        document.getElementById('taxRate').value        = e.taxRate      || 0;
        document.getElementById('discountType').value   = e.discountType || 'percent';
        document.getElementById('discountValue').value  = e.discountValue || 0;
        document.getElementById('revisionNumber').value = e.revision      || 0;
    }

    loadClosetValues() {
        var room = this.calculator.getCurrentRoom();
        if (room.type !== 'room') return;
        document.getElementById('roomName').value      = room.name                 || '';
        document.getElementById('linearFeet').value    = room.closet.linearFeet    || 0;
        document.getElementById('height').value        = room.closet.height        || 96;
        document.getElementById('drawingNumber').value = room.closet.drawingNumber || '';
        document.getElementById('roomNotes').value     = room.notes                || '';
    }

    loadCustomValues() {
        var room = this.calculator.getCurrentRoom();
        document.getElementById('customItemName').value        = room.name        || '';
        document.getElementById('customItemDescription').value = room.description || '';
        document.getElementById('customItemPrice').value       = room.price       || 0;
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
        this.refreshPanel();
        this.calculate();
    }

    // ── Selection handlers ────────────────────────────────────────────────────

    selectClosetType(type) { this.calculator.updateCloset('closetType', type); this.renderClosetTypeSelector(); this.save(); }
    selectDepth(depth)     { this.calculator.updateCloset('depth', depth);     this.renderDepthSelector();      this.calculate(); }
    selectMaterial(id)     { this.calculator.updateCloset('material', id);     this.renderMaterialSelector();   this.calculate(); }
    selectPulls(id)        { this.calculator.updateCloset('pullsHandles', id); this.renderPullsSelector();      this.save(); }
    selectRods(id)         { this.calculator.updateCloset('hangingRods', id);  this.renderRodsSelector();       this.save(); }
    selectMounting(id)     { this.calculator.updateCloset('mounting', id);     this.renderMountingSelector();   this.save(); }

    // ── Addon handlers ────────────────────────────────────────────────────────

    toggleAddon(key, enabled) {
        var qty = parseFloat(document.getElementById('qty-' + key).value) || 0;
        this.calculator.updateAddon(key, enabled, qty);
        this.renderAddonList();
        this.calculate();
    }

    updateAddonQty(key, qty) {
        var enabled = document.getElementById('addon-' + key).checked;
        this.calculator.updateAddon(key, enabled, qty);
        this.renderAddonList();
        this.calculate();
    }

    // ── Field update handlers ─────────────────────────────────────────────────

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

    updateRoomNotes(notes)  { this.calculator.updateRoomNotes(notes); this.save(); }
    updateTax(rate)         { this.calculator.updateTaxRate(rate);    this.calculate(); }
    updateRevision(val)     { this.calculator.updateRevision(val);    this.save(); }

    updateDiscountType(type) {
        var val = parseFloat(document.getElementById('discountValue').value) || 0;
        this.calculator.updateDiscount(type, val);
        this.calculate();
    }

    updateDiscountValue(value) {
        var type = document.getElementById('discountType').value;
        this.calculator.updateDiscount(type, parseFloat(value) || 0);
        this.calculate();
    }

    // ── Quote info ────────────────────────────────────────────────────────────

    updateQuoteInfo() {
        document.getElementById('quoteNumber').textContent = this.calculator.estimate.quoteNumber;
        document.getElementById('quoteDate').textContent   = new Date(this.calculator.estimate.date).toLocaleDateString();
    }

    // ── Calculate & update summary ────────────────────────────────────────────

    calculate() {
        var calc = this.calculator.calculateTotal();

        document.getElementById('summaryBase').textContent = '$' + calc.base.toFixed(2);

        var matLine = document.getElementById('materialUpchargeLine');
        document.getElementById('summaryMaterial').textContent = '$' + calc.materialUpcharge.toFixed(2);
        matLine.style.display = calc.materialUpcharge > 0 ? 'flex' : 'none';

        var addonsLine = document.getElementById('addonsLine');
        document.getElementById('summaryAddons').textContent = '$' + calc.addons.toFixed(2);
        addonsLine.style.display = calc.addons > 0 ? 'flex' : 'none';

        document.getElementById('summaryTotal').textContent = '$' + calc.total.toFixed(2);

        var rooms = this.calculator.getRooms();
        document.getElementById('roomCount').textContent = rooms.length > 1 ? rooms.length + ' Rooms' : '1 Room';

        this.renderRoomBreakdown(calc);
        this.save();
    }

    renderRoomBreakdown(calc) {
        var container = document.getElementById('roomBreakdownList');
        var rooms     = this.calculator.getRooms();

        if (rooms.length <= 1) {
            container.innerHTML = '';
            document.getElementById('roomBreakdown').style.display = 'none';
            return;
        }

        document.getElementById('roomBreakdown').style.display = 'block';
        var html = '';
        for (var i = 0; i < rooms.length; i++) {
            var room     = rooms[i];
            var isCustom = room.type === 'custom';
            var name     = room.name || (isCustom ? 'Item ' + (i+1) : 'Room ' + (i+1));
            var sub      = isCustom ? '\u2736 custom' : (room.closet.linearFeet || 0) + ' LF';
            html += '<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:rgba(255,255,255,0.9);border-bottom:1px solid rgba(255,255,255,0.1);">'
                  + '<span>' + name + ' <span style="opacity:0.6;">(' + sub + ')</span></span>'
                  + '<span style="color:var(--gold);font-weight:600;">$' + calc.rooms[i].total.toFixed(2) + '</span>'
                  + '</div>';
        }
        container.innerHTML = html;
    }

    // ── Persistence ───────────────────────────────────────────────────────────

    save() { this.calculator.saveToStorage(); }

    setupAutoSave() { setInterval(function() { if (window.app) app.save(); }, 30000); }

    downloadQuote() {
        var data = JSON.stringify(this.calculator.estimate, null, 2);
        var blob = new Blob([data], { type: 'application/json' });
        var url  = URL.createObjectURL(blob);
        var a    = document.createElement('a');
        a.href   = url;
        a.download = 'DCQuoting_' + this.calculator.estimate.quoteNumber + '.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    uploadQuote(event) {
        var file = event.target.files[0];
        if (!file) return;
        var self   = this;
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                self.calculator.estimate = JSON.parse(e.target.result);
                self.calculator.currentRoomIndex = 0;
                self.renderRoomTabs();
                self.refreshPanel();
                self.loadClientValues();
                self.loadSummaryControls();
                self.updateQuoteInfo();
                self.calculate();
                alert('Quote loaded successfully!');
            } catch (err) {
                alert('Error loading quote: ' + err.message);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    generatePDF() {
        var rooms      = this.calculator.getRooms();
        var hasContent = false;
        for (var i = 0; i < rooms.length; i++) {
            var r = rooms[i];
            if (r.type === 'custom' && parseFloat(r.price) > 0) { hasContent = true; break; }
            if (r.type === 'room'   && parseFloat(r.closet.linearFeet) > 0) { hasContent = true; break; }
        }
        if (!hasContent) {
            alert('Please enter linear feet or a custom item price before generating quote.');
            return;
        }
        this.reportGenerator.generate();
    }

    reset() {
        if (confirm('Start a new quote? Current data will be cleared.')) {
            this.calculator.reset();
            this.calculator.saveToStorage();
            location.reload();
        }
    }
}

var app;
document.addEventListener('DOMContentLoaded', function() {
    if (typeof auth !== 'undefined' && !auth.init()) return;
    app = new ClosetEstimatorApp();
});
