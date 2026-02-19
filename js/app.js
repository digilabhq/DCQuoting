// app.js — Desire Cabinets LLC

var ClosetEstimatorApp = (function() {

    function ClosetEstimatorApp() {
        this.calculator      = new ClosetCalculator();
        this.reportGenerator = new ReportGenerator(this.calculator);
        this.init();
    }

    ClosetEstimatorApp.prototype.init = function() {
        this.calculator.loadFromStorage();
        this.renderRoomTabs();
        this.refreshPanel();
        this.loadClientValues();
        this.loadSummaryControls();
        this.updateQuoteInfo();
        this.calculate();
        this.setupAutoSave();
    };

    // ── Panel switching ───────────────────────────────────────────────────────

    ClosetEstimatorApp.prototype.refreshPanel = function() {
        var room = this.calculator.getCurrentRoom();
        if (room.type === 'custom') {
            document.getElementById('closetPanel').style.display     = 'none';
            document.getElementById('customItemPanel').style.display = 'block';
            this.loadCustomValues();
        } else {
            document.getElementById('closetPanel').style.display     = 'block';
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
    };

    // ── Tabs ──────────────────────────────────────────────────────────────────

    ClosetEstimatorApp.prototype.renderRoomTabs = function() {
        var container = document.getElementById('roomTabs');
        var rooms     = this.calculator.getRooms();
        var current   = this.calculator.currentRoomIndex;
        var html      = '';
        for (var i = 0; i < rooms.length; i++) {
            var room     = rooms[i];
            var isCustom = room.type === 'custom';
            var label    = room.name || (isCustom ? 'Item ' + (i + 1) : 'Room ' + (i + 1));
            var prefix   = isCustom ? '\u2736 ' : '';
            var active   = (i === current) ? ' active' : '';
            var extra    = isCustom ? ' custom-tab' : '';
            var delBtn   = rooms.length > 1
                ? '<span class="room-tab-remove" onclick="event.stopPropagation();app.deleteRoom(' + i + ')">&times;</span>'
                : '';
            html += '<button class="room-tab' + extra + active + '" onclick="app.switchToRoom(' + i + ')">'
                  + '<span class="room-tab-name">' + prefix + label + '</span>' + delBtn + '</button>';
        }
        html += '<button class="room-tab-add" onclick="app.addNewRoom()">+ Add Room</button>';
        html += '<button class="room-tab-add" style="border-style:dashed;opacity:0.8;" onclick="app.addNewCustomItem()">\u2736 Add Item</button>';
        container.innerHTML = html;
    };

    // ── Selectors ─────────────────────────────────────────────────────────────

    ClosetEstimatorApp.prototype.renderClosetTypeSelector = function() {
        var el   = document.getElementById('closetTypeSelector');
        var room = this.calculator.getCurrentRoom();
        var types = [ { id: 'walk-in', name: 'Walk-In' }, { id: 'reach-in', name: 'Reach-In' } ];
        var html = '';
        for (var i = 0; i < types.length; i++) {
            var t = types[i];
            var sel = room.closet.closetType === t.id ? ' selected' : '';
            html += '<button class="selection-btn' + sel + '" onclick="app.selectClosetType(\'' + t.id + '\')">' + t.name + '</button>';
        }
        el.innerHTML = html;
    };

    ClosetEstimatorApp.prototype.renderDepthSelector = function() {
        var el     = document.getElementById('depthSelector');
        var room   = this.calculator.getCurrentRoom();
        var depths = [14, 16, 19, 24];
        var html   = '';
        for (var i = 0; i < depths.length; i++) {
            var d   = depths[i];
            var sel = room.closet.depth === d ? ' selected' : '';
            var chk = room.closet.depth === d ? ' checked' : '';
            html += '<div class="depth-option' + sel + '" onclick="app.selectDepth(' + d + ')">'
                  + '<input type="radio" name="depth" value="' + d + '"' + chk + '>'
                  + '<div class="depth-label">' + d + '"</div></div>';
        }
        el.innerHTML = html;
    };

    ClosetEstimatorApp.prototype.renderMaterialSelector = function() {
        var el   = document.getElementById('materialSelector');
        var room = this.calculator.getCurrentRoom();
        var mats = PRICING_CONFIG.materials;
        var html = '';
        for (var i = 0; i < mats.length; i++) {
            var m   = mats[i];
            var sel = room.closet.material === m.id ? ' selected' : '';
            var lbl = m.name + (m.upcharge > 0 ? ' (+$' + m.upcharge + '/ft)' : '');
            html += '<button class="selection-btn' + sel + '" onclick="app.selectMaterial(\'' + m.id + '\')">' + lbl + '</button>';
        }
        el.innerHTML = html;
    };

    ClosetEstimatorApp.prototype.renderPullsSelector = function() {
        var el   = document.getElementById('pullsSelector');
        var room = this.calculator.getCurrentRoom();
        var list = PRICING_CONFIG.pullsHandles;
        var html = '';
        for (var i = 0; i < list.length; i++) {
            var h   = list[i];
            var sel = room.closet.pullsHandles === h.id ? ' selected' : '';
            html += '<button class="selection-btn' + sel + '" onclick="app.selectPulls(\'' + h.id + '\')">' + h.name + '</button>';
        }
        el.innerHTML = html;
    };

    ClosetEstimatorApp.prototype.renderRodsSelector = function() {
        var el   = document.getElementById('rodsSelector');
        var room = this.calculator.getCurrentRoom();
        var list = PRICING_CONFIG.hangingRods;
        var html = '';
        for (var i = 0; i < list.length; i++) {
            var h   = list[i];
            var sel = room.closet.hangingRods === h.id ? ' selected' : '';
            html += '<button class="selection-btn' + sel + '" onclick="app.selectRods(\'' + h.id + '\')">' + h.name + '</button>';
        }
        el.innerHTML = html;
    };

    ClosetEstimatorApp.prototype.renderMountingSelector = function() {
        var el   = document.getElementById('mountingSelector');
        var room = this.calculator.getCurrentRoom();
        var list = PRICING_CONFIG.mounting;
        var html = '';
        for (var i = 0; i < list.length; i++) {
            var m   = list[i];
            var sel = room.closet.mounting === m.id ? ' selected' : '';
            html += '<button class="selection-btn' + sel + '" onclick="app.selectMounting(\'' + m.id + '\')">' + m.name + '</button>';
        }
        el.innerHTML = html;
    };

    ClosetEstimatorApp.prototype.renderAddonList = function() {
        var el   = document.getElementById('addonList');
        var room = this.calculator.getCurrentRoom();
        var keys = Object.keys(PRICING_CONFIG.addons);
        var html = '';
        for (var i = 0; i < keys.length; i++) {
            var key   = keys[i];
            var addon = PRICING_CONFIG.addons[key];
            var saved = room.addons[key] || { enabled: false, quantity: 0 };
            var total = (parseFloat(saved.quantity) || 0) * addon.price;
            var step  = addon.unit.indexOf('linear') >= 0 ? '0.5' : '1';
            var chk   = saved.enabled ? ' checked' : '';
            html += '<div class="addon-item">'
                  + '<input type="checkbox" id="addon-' + key + '"' + chk + ' onchange="app.toggleAddon(\'' + key + '\', this.checked)">'
                  + '<div class="addon-details">'
                  + '<div class="addon-name">' + addon.name + '</div>'
                  + '<div class="addon-unit">$' + addon.price.toFixed(2) + ' / ' + addon.unit + '</div>'
                  + '</div>'
                  + '<input type="number" class="addon-quantity" id="qty-' + key + '" min="0" step="' + step + '" value="' + saved.quantity + '" placeholder="Qty" onchange="app.updateAddonQty(\'' + key + '\', parseFloat(this.value)||0)">'
                  + '<div class="addon-price">$' + total.toFixed(2) + '</div>'
                  + '</div>';
        }
        el.innerHTML = html;
    };

    // ── Load form values ──────────────────────────────────────────────────────

    ClosetEstimatorApp.prototype.loadClientValues = function() {
        var c = this.calculator.estimate.client;
        document.getElementById('clientName').value    = c.name    || '';
        document.getElementById('clientPhone').value   = c.phone   || '';
        document.getElementById('clientAddress').value = c.address || '';
        document.getElementById('clientEmail').value   = c.email   || '';
    };

    ClosetEstimatorApp.prototype.loadSummaryControls = function() {
        var e = this.calculator.estimate;
        document.getElementById('taxRate').value        = e.taxRate       || 0;
        document.getElementById('discountType').value   = e.discountType  || 'percent';
        document.getElementById('discountValue').value  = e.discountValue || 0;
        document.getElementById('revisionNumber').value = e.revision      || 0;
    };

    ClosetEstimatorApp.prototype.loadClosetValues = function() {
        var room = this.calculator.getCurrentRoom();
        if (room.type !== 'room') return;
        document.getElementById('roomName').value      = room.name                 || '';
        document.getElementById('linearFeet').value    = room.closet.linearFeet    || 0;
        document.getElementById('height').value        = room.closet.height        || 96;
        document.getElementById('drawingNumber').value = room.closet.drawingNumber || '';
        document.getElementById('roomNotes').value     = room.notes                || '';
    };

    ClosetEstimatorApp.prototype.loadCustomValues = function() {
        var room = this.calculator.getCurrentRoom();
        document.getElementById('customItemName').value        = room.name        || '';
        document.getElementById('customItemDescription').value = room.description || '';
        document.getElementById('customItemPrice').value       = room.price       || 0;
    };

    // ── Room management ───────────────────────────────────────────────────────

    ClosetEstimatorApp.prototype.addNewRoom = function() {
        this.calculator.addRoom();
        this.renderRoomTabs();
        this.switchToRoom(this.calculator.currentRoomIndex);
    };

    ClosetEstimatorApp.prototype.addNewCustomItem = function() {
        this.calculator.addCustomItem();
        this.renderRoomTabs();
        this.switchToRoom(this.calculator.currentRoomIndex);
    };

    ClosetEstimatorApp.prototype.deleteRoom = function(index) {
        if (confirm('Delete this room/item?')) {
            if (this.calculator.removeRoom(index)) {
                this.renderRoomTabs();
                this.switchToRoom(this.calculator.currentRoomIndex);
            }
        }
    };

    ClosetEstimatorApp.prototype.switchToRoom = function(index) {
        this.calculator.switchRoom(index);
        this.renderRoomTabs();
        this.refreshPanel();
        this.calculate();
    };

    // ── Selection handlers ────────────────────────────────────────────────────

    ClosetEstimatorApp.prototype.selectClosetType = function(type) { this.calculator.updateCloset('closetType', type); this.renderClosetTypeSelector(); this.save(); };
    ClosetEstimatorApp.prototype.selectDepth      = function(d)    { this.calculator.updateCloset('depth', d);         this.renderDepthSelector();      this.calculate(); };
    ClosetEstimatorApp.prototype.selectMaterial   = function(id)   { this.calculator.updateCloset('material', id);     this.renderMaterialSelector();   this.calculate(); };
    ClosetEstimatorApp.prototype.selectPulls      = function(id)   { this.calculator.updateCloset('pullsHandles', id); this.renderPullsSelector();      this.save(); };
    ClosetEstimatorApp.prototype.selectRods       = function(id)   { this.calculator.updateCloset('hangingRods', id);  this.renderRodsSelector();       this.save(); };
    ClosetEstimatorApp.prototype.selectMounting   = function(id)   { this.calculator.updateCloset('mounting', id);     this.renderMountingSelector();   this.save(); };

    // ── Addon handlers ────────────────────────────────────────────────────────

    ClosetEstimatorApp.prototype.toggleAddon = function(key, enabled) {
        var qty = parseFloat(document.getElementById('qty-' + key).value) || 0;
        this.calculator.updateAddon(key, enabled, qty);
        this.renderAddonList();
        this.calculate();
    };

    ClosetEstimatorApp.prototype.updateAddonQty = function(key, qty) {
        var enabled = document.getElementById('addon-' + key).checked;
        this.calculator.updateAddon(key, enabled, qty);
        this.renderAddonList();
        this.calculate();
    };

    // ── Field updates ─────────────────────────────────────────────────────────

    ClosetEstimatorApp.prototype.updateClient = function(field, value) {
        this.calculator.updateClient(field, value);
        if (field === 'name') {
            this.calculator.estimate.quoteNumber = this.calculator.generateQuoteNumber(value);
            this.updateQuoteInfo();
        }
        this.save();
    };

    ClosetEstimatorApp.prototype.updateCloset = function(field, value) {
        if (field === 'roomName') {
            this.calculator.updateRoomName(value);
            this.renderRoomTabs();
        } else {
            this.calculator.updateCloset(field, value);
        }
        this.calculate();
    };

    ClosetEstimatorApp.prototype.updateCustomItem = function(field, value) {
        this.calculator.updateCustomItem(field, value);
        if (field === 'name') this.renderRoomTabs();
        this.calculate();
    };

    ClosetEstimatorApp.prototype.updateRoomNotes = function(notes) { this.calculator.updateRoomNotes(notes); this.save(); };
    ClosetEstimatorApp.prototype.updateTax       = function(rate)  { this.calculator.updateTaxRate(rate);    this.calculate(); };
    ClosetEstimatorApp.prototype.updateRevision  = function(val)   { this.calculator.updateRevision(val);    this.save(); };

    ClosetEstimatorApp.prototype.updateDiscountType = function(type) {
        var val = parseFloat(document.getElementById('discountValue').value) || 0;
        this.calculator.updateDiscount(type, val);
        this.calculate();
    };

    ClosetEstimatorApp.prototype.updateDiscountValue = function(value) {
        var type = document.getElementById('discountType').value;
        this.calculator.updateDiscount(type, parseFloat(value) || 0);
        this.calculate();
    };

    // ── Quote info ────────────────────────────────────────────────────────────

    ClosetEstimatorApp.prototype.updateQuoteInfo = function() {
        document.getElementById('quoteNumber').textContent = this.calculator.estimate.quoteNumber;
        document.getElementById('quoteDate').textContent   = new Date(this.calculator.estimate.date).toLocaleDateString();
    };

    // ── Calculate & update summary display ────────────────────────────────────

    ClosetEstimatorApp.prototype.calculate = function() {
        var calc = this.calculator.calculateTotal();

        document.getElementById('summaryBase').textContent = '$' + calc.base.toFixed(2);

        var matLine = document.getElementById('materialUpchargeLine');
        document.getElementById('summaryMaterial').textContent = '$' + calc.materialUpcharge.toFixed(2);
        matLine.style.display = calc.materialUpcharge > 0 ? 'flex' : 'none';

        var addonsLine = document.getElementById('addonsLine');
        document.getElementById('summaryAddons').textContent = '$' + calc.addons.toFixed(2);
        addonsLine.style.display = calc.addons > 0 ? 'flex' : 'none';

        // TOTAL includes base + material + addons + custom items + tax - discount
        document.getElementById('summaryTotal').textContent = '$' + calc.total.toFixed(2);

        var rooms = this.calculator.getRooms();
        document.getElementById('roomCount').textContent = rooms.length > 1 ? rooms.length + ' Rooms' : '1 Room';

        this.renderRoomBreakdown(calc);
        this.save();
    };

    ClosetEstimatorApp.prototype.renderRoomBreakdown = function(calc) {
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
            var name     = room.name || (isCustom ? 'Item ' + (i + 1) : 'Room ' + (i + 1));
            var sub      = isCustom ? '\u2736 custom' : ((room.closet.linearFeet || 0) + ' LF');
            html += '<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:rgba(255,255,255,0.9);border-bottom:1px solid rgba(255,255,255,0.1);">'
                  + '<span>' + name + ' <span style="opacity:0.6;">(' + sub + ')</span></span>'
                  + '<span style="color:var(--gold);font-weight:600;">$' + calc.rooms[i].total.toFixed(2) + '</span>'
                  + '</div>';
        }
        container.innerHTML = html;
    };

    // ── Persistence ───────────────────────────────────────────────────────────

    ClosetEstimatorApp.prototype.save = function() { this.calculator.saveToStorage(); };

    ClosetEstimatorApp.prototype.setupAutoSave = function() {
        setInterval(function() { if (window.app) { window.app.save(); } }, 30000);
    };

    ClosetEstimatorApp.prototype.downloadQuote = function() {
        var data = JSON.stringify(this.calculator.estimate, null, 2);
        var blob = new Blob([data], { type: 'application/json' });
        var url  = URL.createObjectURL(blob);
        var a    = document.createElement('a');
        a.href   = url;
        a.download = 'DCQuoting_' + this.calculator.estimate.quoteNumber + '.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    ClosetEstimatorApp.prototype.uploadQuote = function(event) {
        var file = event.target.files[0];
        if (!file) return;
        var self   = this;
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                self.calculator.estimate          = JSON.parse(e.target.result);
                self.calculator.currentRoomIndex  = 0;
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
    };

    ClosetEstimatorApp.prototype.generatePDF = function() {
        var rooms      = this.calculator.getRooms();
        var hasContent = false;
        for (var i = 0; i < rooms.length; i++) {
            var r = rooms[i];
            if (r.type === 'custom' && parseFloat(r.price) > 0)              { hasContent = true; break; }
            if (r.type === 'room'   && parseFloat(r.closet.linearFeet) > 0)  { hasContent = true; break; }
        }
        if (!hasContent) {
            alert('Please enter linear feet or a custom item price before generating quote.');
            return;
        }
        this.reportGenerator.generate();
    };

    ClosetEstimatorApp.prototype.reset = function() {
        if (confirm('Start a new quote? Current data will be cleared.')) {
            this.calculator.reset();
            this.calculator.saveToStorage();
            location.reload();
        }
    };

    return ClosetEstimatorApp;
})();

// Boot
document.addEventListener('DOMContentLoaded', function() {
    if (typeof auth !== 'undefined' && !auth.init()) { return; }
    window.app = new ClosetEstimatorApp();
});
