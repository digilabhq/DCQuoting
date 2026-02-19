// Calculator Module - Desire Cabinets LLC

class ClosetCalculator {

    constructor() {
        this.estimate = {
            client: { name: '', address: '', phone: '', email: '' },
            rooms: [ this.createNewRoom() ],
            taxRate: 0,
            discountType: 'percent',
            discountValue: 0,
            revision: 0,
            quoteNumber: this.generateQuoteNumber(),
            date: new Date().toISOString().split('T')[0]
        };
        this.currentRoomIndex = 0;
    }

    // ── Factory methods ────────────────────────────────────────────────────────

    createNewRoom() {
        return {
            type: 'room',
            name: '',
            closet: {
                closetType: 'walk-in',
                linearFeet: 0,
                depth: 16,
                height: 96,
                material: 'white',
                pullsHandles: 'black-style-1',
                hangingRods: 'black-style-1',
                mounting: 'floor',
                drawingNumber: ''
            },
            addons: {},
            notes: ''
        };
    }

    createNewCustomItem() {
        return {
            type: 'custom',
            name: '',
            description: '',
            price: 0,
            notes: ''
        };
    }

    // ── Quote number ───────────────────────────────────────────────────────────

    generateQuoteNumber(clientName = '') {
        const now = new Date();
        const yy  = String(now.getFullYear()).slice(-2);
        const mm  = String(now.getMonth() + 1).padStart(2, '0');
        const dd  = String(now.getDate()).padStart(2, '0');
        const hh  = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        let num = `${yy}${mm}${dd}-${hh}${min}`;
        if (clientName && clientName.trim()) {
            const initials = clientName.trim().split(' ')
                .filter(p => p.length > 0)
                .map(p => p[0].toUpperCase()).join('');
            if (initials) num += `-${initials}`;
        }
        return num;
    }

    // ── Room management ────────────────────────────────────────────────────────

    getCurrentRoom() {
        return this.estimate.rooms[this.currentRoomIndex];
    }

    getRooms() {
        return this.estimate.rooms;
    }

    addRoom() {
        this.estimate.rooms.push(this.createNewRoom());
        this.currentRoomIndex = this.estimate.rooms.length - 1;
        return this.currentRoomIndex;
    }

    addCustomItem() {
        this.estimate.rooms.push(this.createNewCustomItem());
        this.currentRoomIndex = this.estimate.rooms.length - 1;
        return this.currentRoomIndex;
    }

    removeRoom(index) {
        if (this.estimate.rooms.length > 1) {
            this.estimate.rooms.splice(index, 1);
            if (this.currentRoomIndex >= this.estimate.rooms.length) {
                this.currentRoomIndex = this.estimate.rooms.length - 1;
            }
            return true;
        }
        return false;
    }

    switchRoom(index) {
        if (index >= 0 && index < this.estimate.rooms.length) {
            this.currentRoomIndex = index;
            return true;
        }
        return false;
    }

    // ── Calculations ───────────────────────────────────────────────────────────

    calculateRoomBase(room) {
        const feet = parseFloat(room.closet.linearFeet) || 0;
        const ppf  = PRICING_CONFIG.baseSystem[room.closet.depth] || 0;
        return feet * ppf;
    }

    calculateRoomMaterialUpcharge(room) {
        const feet = parseFloat(room.closet.linearFeet) || 0;
        const mat  = PRICING_CONFIG.materials.find(m => m.id === room.closet.material);
        return feet * (mat ? mat.upcharge : 0);
    }

    calculateRoomAddons(room) {
        let total = 0;
        for (const [key, val] of Object.entries(room.addons)) {
            if (val.enabled && val.quantity > 0) {
                const cfg = PRICING_CONFIG.addons[key];
                if (cfg) total += (parseFloat(val.quantity) || 0) * (parseFloat(cfg.price) || 0);
            }
        }
        return total;
    }

    calculateRoomTotal(room) {
        if (room.type === 'custom') {
            return { base: 0, materialUpcharge: 0, addons: 0, total: parseFloat(room.price) || 0 };
        }
        const base            = this.calculateRoomBase(room);
        const materialUpcharge = this.calculateRoomMaterialUpcharge(room);
        const addons           = this.calculateRoomAddons(room);
        return { base, materialUpcharge, addons, total: base + materialUpcharge + addons };
    }

    calculateTotal() {
        let totalBase = 0, totalMaterial = 0, totalAddons = 0;

        const roomTotals = this.estimate.rooms.map(room => {
            const r = this.calculateRoomTotal(room);
            totalBase     += r.base;
            totalMaterial += r.materialUpcharge;
            totalAddons   += r.addons;
            return r;
        });

        const subtotal      = totalBase + totalMaterial + totalAddons;
        const discountValue = parseFloat(this.estimate.discountValue) || 0;
        let   discountAmount = 0;
        if (discountValue > 0) {
            discountAmount = this.estimate.discountType === 'percent'
                ? subtotal * (discountValue / 100)
                : discountValue;
        }
        const afterDiscount = subtotal - discountAmount;
        const taxRate       = parseFloat(this.estimate.taxRate) || 0;
        const taxAmount     = afterDiscount * (taxRate / 100);
        const total         = afterDiscount + taxAmount;

        return {
            base: totalBase,
            materialUpcharge: totalMaterial,
            addons: totalAddons,
            subtotal,
            discount: discountAmount,
            afterDiscount,
            tax: taxAmount,
            total,
            rooms: roomTotals
        };
    }

    // ── Descriptions for PDF ───────────────────────────────────────────────────

    getActiveAddons(room) {
        const active = [];
        for (const [key, val] of Object.entries(room.addons)) {
            if (val.enabled && val.quantity > 0) {
                const cfg = PRICING_CONFIG.addons[key];
                if (cfg) active.push({ key, name: cfg.name, quantity: val.quantity, unit: cfg.unit, price: cfg.price });
            }
        }
        return active;
    }

    generateRoomDescription(room) {
        if (room.type === 'custom') {
            return {
                title:   room.name || 'Custom Item',
                details: room.description ? [room.description] : []
            };
        }

        const c             = room.closet;
        const materialName  = (PRICING_CONFIG.materials.find(m => m.id === c.material) || {}).name || 'White';
        const pullsName     = (PRICING_CONFIG.pullsHandles.find(h => h.id === c.pullsHandles) || {}).name || 'Black - Style 1';
        const rodsName      = (PRICING_CONFIG.hangingRods.find(h => h.id === c.hangingRods)  || {}).name || 'Black - Style 1';
        const typeName      = c.closetType === 'walk-in' ? 'Walk-In' : 'Reach-In';
        const title         = room.name ? `${room.name} - ${typeName}` : typeName;
        const activeAddons  = this.getActiveAddons(room);

        const details = [
            `${c.depth}" deep x ${c.height}" high`,
            ...(c.drawingNumber && c.drawingNumber.trim() ? [`Drawing # ${c.drawingNumber.trim()}`] : []),
            `3/4" ${materialName} melamine finish`,
            `Pulls/Handles: ${pullsName}`,
            `Hanging Rod: ${rodsName}`,
            ...activeAddons.map(a => a.unit === 'per linear foot'
                ? `${a.name} (${a.quantity} LF)`
                : `${a.name} (${a.quantity})`),
            'Installation and delivery included'
        ];

        return { title, details };
    }

    // ── Update helpers ─────────────────────────────────────────────────────────

    updateClient(field, value)      { this.estimate.client[field] = value; }
    updateCloset(field, value)      { this.getCurrentRoom().closet[field] = value; }
    updateRoomName(name)            { this.getCurrentRoom().name = name; }
    updateRoomNotes(notes)          { this.getCurrentRoom().notes = notes; }
    updateAddon(key, enabled, qty)  { this.getCurrentRoom().addons[key] = { enabled, quantity: qty }; }
    updateTaxRate(rate)             { this.estimate.taxRate = parseFloat(rate) || 0; }
    updateRevision(val)             { this.estimate.revision = parseInt(val) || 0; }

    updateDiscount(type, value) {
        this.estimate.discountType  = type;
        this.estimate.discountValue = parseFloat(value) || 0;
    }

    updateDrawingNumber(value) {
        const room = this.getCurrentRoom();
        if (room.type === 'room') room.closet.drawingNumber = value;
    }

    updateCustomItem(field, value) {
        const room = this.getCurrentRoom();
        if (room.type === 'custom') room[field] = value;
    }

    // ── Persistence ────────────────────────────────────────────────────────────

    reset() {
        this.estimate = {
            client: { name: '', address: '', phone: '', email: '' },
            rooms: [ this.createNewRoom() ],
            taxRate: 0,
            discountType: 'percent',
            discountValue: 0,
            revision: 0,
            quoteNumber: this.generateQuoteNumber(),
            date: new Date().toISOString().split('T')[0]
        };
        this.currentRoomIndex = 0;
    }

    loadFromStorage() {
        const saved = localStorage.getItem('dcquoting-estimate');
        if (!saved) return;
        try {
            const data = JSON.parse(saved);
            this.estimate = data;

            if (!this.estimate.rooms || this.estimate.rooms.length === 0) {
                this.estimate.rooms = [ this.createNewRoom() ];
            }

            // Migrate any old room data
            this.estimate.rooms = this.estimate.rooms.map(room => {
                if (!room.type) room.type = 'room';
                if (room.type === 'room') {
                    if (!room.closet) room.closet = this.createNewRoom().closet;
                    if (!room.closet.pullsHandles)  room.closet.pullsHandles  = 'black-style-1';
                    if (!room.closet.hangingRods)   room.closet.hangingRods   = 'black-style-1';
                    if (!room.closet.drawingNumber) room.closet.drawingNumber = '';
                    delete room.closet.hardwareFinish;
                }
                return room;
            });

            this.currentRoomIndex = 0;
        } catch (e) {
            console.error('Error loading saved estimate:', e);
        }
    }

    saveToStorage() {
        localStorage.setItem('dcquoting-estimate', JSON.stringify(this.estimate));
    }
}

    // Get full estimate (used by ReportGenerator)
    getEstimate() {
        return {
            ...this.estimate,
            calculations: this.calculateTotal(),
            currentRoom: this.getCurrentRoom(),
            currentRoomIndex: this.currentRoomIndex
        };
    }


if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClosetCalculator;
}
