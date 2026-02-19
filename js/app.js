// Main App Controller - Desire Cabinets Estimator
// Multi-Room Support

class ClosetEstimatorApp {
    constructor() {
        this.calculator = new ClosetCalculator();
        this.reportGenerator = new ReportGenerator(this.calculator);
        this.init();
    }

    init() {
        // Load saved estimate if exists
        this.calculator.loadFromStorage();
        
        // Render room tabs
        this.renderRoomTabs();
        
        // Render all UI components
        const firstRoom = this.calculator.getCurrentRoom();
        if (firstRoom.type === 'custom') {
            this.showCustomPanel();
            this.loadCustomItemValues();
        } else {
            this.showClosetPanel();
            this.renderClosetTypeSelector();
            this.renderDepthSelector();
            this.renderMaterialSelector();
            this.renderPullsSelector();
            this.renderRodsSelector();
            this.renderMountingSelector();
            this.renderAddonList();
        }
        
        // Load saved values into form
        this.loadFormValues();
        
        // Update quote info
        this.updateQuoteInfo();
        
        // Initial calculation
        this.calculate();

        // Auto-save on changes
        this.setupAutoSave();
    }

    renderRoomTabs() {
        const container = document.getElementById('roomTabs');
        const rooms = this.calculator.getRooms();
        
        container.innerHTML = rooms.map((room, index) => {
            const isCustom = room.type === 'custom';
            const label = isCustom
                ? (room.name || `Item ${index + 1}`)
                : (room.name || `Room ${index + 1}`);
            const prefix = isCustom ? '✦ ' : '';
            return `
                <button class="room-tab ${index === this.calculator.currentRoomIndex ? 'active' : ''} ${isCustom ? 'custom-tab' : ''}"
                        onclick="app.switchToRoom(${index})">
                    <span class="room-tab-name">${prefix}${label}</span>
                    ${rooms.length > 1 ? `<span class="room-tab-remove" onclick="event.stopPropagation(); app.deleteRoom(${index})">×</span>` : ''}
                </button>
            `;
        }).join('') + `
            <button class="room-tab-add" onclick="app.addNewRoom()">+ Add Room</button>
            <button class="room-tab-add" onclick="app.addNewCustomItem()" style="border-style:dashed; opacity:0.8;">✦ Add Item</button>
        `;
    }

    renderDepthSelector() {
        const container = document.getElementById('depthSelector');
        const depths = [14, 16, 19, 24];
        const currentRoom = this.calculator.getCurrentRoom();
        
        container.innerHTML = depths.map(depth => `
            <div class="depth-option ${currentRoom.closet.depth === depth ? 'selected' : ''}" 
                 onclick="app.selectDepth(${depth})">
                <input type="radio" name="depth" value="${depth}" id="depth${depth}" 
                       ${currentRoom.closet.depth === depth ? 'checked' : ''}>
                <div class="depth-label">${depth}"</div>
            </div>
        `).join('');
    }

    renderClosetTypeSelector() {
        const container = document.getElementById('closetTypeSelector');
        const currentRoom = this.calculator.getCurrentRoom();
        const types = [
            { id: 'walk-in', name: 'Walk-In' },
            { id: 'reach-in', name: 'Reach-In' }
        ];
        
        container.innerHTML = types.map(type => `
            <button class="selection-btn ${currentRoom.closet.closetType === type.id ? 'selected' : ''}" 
                 onclick="app.selectClosetType('${type.id}')">
                ${type.name}
            </button>
        `).join('');
    }

    renderMaterialSelector() {
        const container = document.getElementById('materialSelector');
        const currentRoom = this.calculator.getCurrentRoom();
        
        container.innerHTML = PRICING_CONFIG.materials.map(material => `
            <button class="selection-btn ${currentRoom.closet.material === material.id ? 'selected' : ''}" 
                 onclick="app.selectMaterial('${material.id}')">
                ${material.name}${material.upcharge > 0 ? ` (+$${material.upcharge}/ft)` : ''}
            </button>
        `).join('');
    }

    renderPullsSelector() {
        const container = document.getElementById('pullsSelector');
        const currentRoom = this.calculator.getCurrentRoom();
        if (!currentRoom.closet) return;
        container.innerHTML = PRICING_CONFIG.pullsHandles.map(h => `
            <button class="selection-btn ${currentRoom.closet.pullsHandles === h.id ? 'selected' : ''}"
                 onclick="app.selectPulls('${h.id}')">
                ${h.name}
            </button>
        `).join('');
    }

    renderRodsSelector() {
        const container = document.getElementById('rodsSelector');
        const currentRoom = this.calculator.getCurrentRoom();
        if (!currentRoom.closet) return;
        container.innerHTML = PRICING_CONFIG.hangingRods.map(h => `
            <button class="selection-btn ${currentRoom.closet.hangingRods === h.id ? 'selected' : ''}"
                 onclick="app.selectRods('${h.id}')">
                ${h.name}
            </button>
        `).join('');
    }

    renderMountingSelector() {
        const container = document.getElementById('mountingSelector');
        const currentRoom = this.calculator.getCurrentRoom();
        
        container.innerHTML = PRICING_CONFIG.mounting.map(mount => `
            <button class="selection-btn ${currentRoom.closet.mounting === mount.id ? 'selected' : ''}" 
                 onclick="app.selectMounting('${mount.id}')">
                ${mount.name}
            </button>
        `).join('');
    }

    renderAddonList() {
        const container = document.getElementById('addonList');
        const currentRoom = this.calculator.getCurrentRoom();
        
        container.innerHTML = Object.entries(PRICING_CONFIG.addons).map(([key, addon]) => {
            const savedAddon = currentRoom.addons[key] || { enabled: false, quantity: 0 };
            const total = savedAddon.quantity * addon.price;
            return `
                <div class="addon-item">
                    <input type="checkbox" id="addon-${key}" 
                           ${savedAddon.enabled ? 'checked' : ''}
                           onchange="app.toggleAddon('${key}', this.checked)">
                    <div class="addon-details">
                        <div class="addon-name">${addon.name}</div>
                        <div class="addon-unit">$${addon.price.toFixed(2)} / ${addon.unit}</div>
                    </div>
                    <input type="number" class="addon-quantity" id="qty-${key}" 
                           min="0" step="${addon.unit.includes('linear') ? '0.5' : '1'}" 
                           value="${savedAddon.quantity}"
                           placeholder="Qty"
                           onchange="app.updateAddonQty('${key}', parseFloat(this.value) || 0)">
                    <div class="addon-price">$${total.toFixed(2)}</div>
                </div>
            `;
        }).join('');
    }

    loadFormValues() {
        const estimate = this.calculator.estimate;
        const currentRoom = this.calculator.getCurrentRoom();
        
        // Client info
        document.getElementById('clientName').value = estimate.client.name || '';
        document.getElementById('clientPhone').value = estimate.client.phone || '';
        document.getElementById('clientAddress').value = estimate.client.address || '';
        document.getElementById('clientEmail').value = estimate.client.email || '';
        
        // Only load closet-specific fields for regular rooms
        if (currentRoom.type !== 'custom') {
            document.getElementById('roomName').value = currentRoom.name || '';
            document.getElementById('linearFeet').value = currentRoom.closet?.linearFeet || 0;
            document.getElementById('height').value = currentRoom.closet?.height || 96;
            document.getElementById('drawingNumber').value = currentRoom.closet?.drawingNumber || '';
            document.getElementById('roomNotes').value = currentRoom.notes || '';
        }
        
        // Tax and discount (always)
        document.getElementById('taxRate').value = estimate.taxRate || 0;
        document.getElementById('discountType').value = estimate.discountType || 'percent';
        document.getElementById('discountValue').value = estimate.discountValue || 0;
        document.getElementById('revisionNumber').value = estimate.revision || 0;
    }

    updateQuoteInfo() {
        document.getElementById('quoteNumber').textContent = this.calculator.estimate.quoteNumber;
        document.getElementById('quoteDate').textContent = new Date(this.calculator.estimate.date).toLocaleDateString();
    }

    // Room management
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
        if (confirm('Are you sure you want to delete this room?')) {
            if (this.calculator.removeRoom(index)) {
                this.renderRoomTabs();
                this.switchToRoom(this.calculator.currentRoomIndex);
            }
        }
    }

    switchToRoom(index) {
        this.calculator.switchRoom(index);
        const room = this.calculator.getCurrentRoom();

        this.renderRoomTabs();

        if (room.type === 'custom') {
            this.showCustomPanel();
            this.loadCustomItemValues();
        } else {
            this.showClosetPanel();
            this.renderClosetTypeSelector();
            this.renderDepthSelector();
            this.renderMaterialSelector();
            this.renderPullsSelector();
            this.renderRodsSelector();
            this.renderMountingSelector();
            this.renderAddonList();
            this.loadFormValues();
        }
        this.calculate();
    }

    showClosetPanel() {
        document.getElementById('closetPanel').style.display = 'block';
        document.getElementById('customItemPanel').style.display = 'none';
    }

    showCustomPanel() {
        document.getElementById('closetPanel').style.display = 'none';
        document.getElementById('customItemPanel').style.display = 'block';
    }

    loadCustomItemValues() {
        const room = this.calculator.getCurrentRoom();
        document.getElementById('customItemName').value = room.name || '';
        document.getElementById('customItemDescription').value = room.description || '';
        document.getElementById('customItemPrice').value = room.price || 0;
    }

    updateCustomItem(field, value) {
        this.calculator.updateCustomItem(field, value);
        if (field === 'name') this.renderRoomTabs();
        this.calculate();
    }

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

    selectMaterial(materialId) {
        this.calculator.updateCloset('material', materialId);
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

    selectMounting(mountingId) {
        this.calculator.updateCloset('mounting', mountingId);
        this.renderMountingSelector();
        this.save();
    }

    toggleAddon(addonKey, enabled) {
        const qty = parseFloat(document.getElementById(`qty-${addonKey}`).value) || 0;
        this.calculator.updateAddon(addonKey, enabled, qty);
        this.renderAddonList(); // Re-render to update totals
        this.calculate();
    }

    updateAddonQty(addonKey, qty) {
        const checkbox = document.getElementById(`addon-${addonKey}`);
        this.calculator.updateAddon(addonKey, checkbox.checked, qty);
        this.renderAddonList(); // Re-render to update totals
        this.calculate();
    }

    updateClient(field, value) {
        this.calculator.updateClient(field, value);
        
        // Regenerate quote number when client name changes
        if (field === 'name') {
            this.calculator.estimate.quoteNumber = this.calculator.generateQuoteNumber(value);
            this.updateQuoteInfo();
        }
        
        this.save();
    }

    updateCloset(field, value) {
        if (field === 'roomName') {
            this.calculator.updateRoomName(value);
            this.renderRoomTabs(); // Update tab name
        } else {
            this.calculator.updateCloset(field, value);
        }
        this.calculate();
    }

    updateRoomNotes(notes) {
        this.calculator.updateRoomNotes(notes);
        this.save();
    }

    updateTax(rate) {
        this.calculator.updateTaxRate(parseFloat(rate) || 0);
        this.calculate();
    }

    updateDiscountType(type) {
        const value = parseFloat(document.getElementById('discountValue').value) || 0;
        this.calculator.updateDiscount(type, value);
        this.calculate();
    }

    updateDiscountValue(value) {
        const type = document.getElementById('discountType').value;
        this.calculator.updateDiscount(type, parseFloat(value) || 0);
        this.calculate();
    }

    updateRevision(value) {
        this.calculator.estimate.revision = value;
        this.save();
    }

    downloadQuote() {
        const data = JSON.stringify(this.calculator.estimate, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DesireCabinets_Quote_${this.calculator.estimate.quoteNumber}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    uploadQuote(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.calculator.estimate = data;
                this.calculator.currentRoomIndex = 0;
                
                // Re-render everything
                this.renderRoomTabs();
                const firstRoom = this.calculator.getCurrentRoom();
                if (firstRoom.type === 'custom') {
                    this.showCustomPanel();
                    this.loadCustomItemValues();
                } else {
                    this.showClosetPanel();
                    this.renderClosetTypeSelector();
                    this.renderDepthSelector();
                    this.renderMaterialSelector();
                    this.renderPullsSelector();
                    this.renderRodsSelector();
                    this.renderMountingSelector();
                    this.renderAddonList();
                    this.loadFormValues();
                }
                this.updateQuoteInfo();
                this.calculate();
                
                alert('Quote loaded successfully!');
            } catch (err) {
                alert('Error loading quote file: ' + err.message);
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    calculate() {
        const calculations = this.calculator.calculateTotal();
        
        // Update summary display
        document.getElementById('summaryBase').textContent = `$${calculations.base.toFixed(2)}`;
        
        // Show/hide material upcharge line
        const materialLine = document.getElementById('materialUpchargeLine');
        const materialValue = document.getElementById('summaryMaterial');
        
        if (calculations.materialUpcharge > 0) {
            materialLine.style.display = 'flex';
            materialValue.textContent = `$${calculations.materialUpcharge.toFixed(2)}`;
        } else {
            materialLine.style.display = 'none';
        }
        
        // Show/hide add-ons line
        const addonsLine = document.getElementById('addonsLine');
        const addonsValue = document.getElementById('summaryAddons');
        
        if (calculations.addons > 0) {
            addonsLine.style.display = 'flex';
            addonsValue.textContent = `$${calculations.addons.toFixed(2)}`;
        } else {
            addonsLine.style.display = 'none';
        }

        // Update total (now includes tax and discount)
        document.getElementById('summaryTotal').textContent = `$${calculations.total.toFixed(2)}`;

        // Update room count display
        const roomCount = this.calculator.getRooms().length;
        document.getElementById('roomCount').textContent = roomCount > 1 ? `${roomCount} Rooms` : '1 Room';
        
        // Render room breakdown
        this.renderRoomBreakdown(calculations);
        
        this.save();
    }

    renderRoomBreakdown(calculations) {
        const container = document.getElementById('roomBreakdownList');
        const rooms = this.calculator.getRooms();
        
        if (rooms.length === 1) {
            container.innerHTML = '';
            document.getElementById('roomBreakdown').style.display = 'none';
            return;
        }
        
        document.getElementById('roomBreakdown').style.display = 'block';
        
        container.innerHTML = rooms.map((room, index) => {
            const roomCalc = calculations.rooms[index];
            const isCustom = room.type === 'custom';
            const roomName = isCustom
                ? (room.name || `Item ${index + 1}`)
                : (room.name || `Room ${index + 1}`);
            const sub = isCustom ? '✦ custom' : `${room.closet?.linearFeet || 0} LF`;

            return `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: rgba(255,255,255,0.9); border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <span>${roomName} <span style="opacity: 0.6;">(${sub})</span></span>
                    <span style="color: var(--gold); font-weight: 600;">$${roomCalc.total.toFixed(2)}</span>
                </div>
            `;
        }).join('');
    }

    save() {
        this.calculator.saveToStorage();
    }

    setupAutoSave() {
        // Auto-save every 30 seconds
        setInterval(() => this.save(), 30000);
    }

    async generatePDF() {
        const rooms = this.calculator.getRooms();
        const hasContent = rooms.some(room =>
            room.type === 'custom' ? (parseFloat(room.price) > 0) : (parseFloat(room.closet?.linearFeet) > 0)
        );
        if (!hasContent) {
            alert('Please enter linear feet or a custom item price before generating quote.');
            return;
        }
        await this.reportGenerator.generate();
    }

    reset() {
        if (confirm('Are you sure you want to start a new quote? Current data will be cleared.')) {
            this.calculator.reset();
            this.calculator.saveToStorage();
            location.reload();
        }
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ClosetEstimatorApp();
});
