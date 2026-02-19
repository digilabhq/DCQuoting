// Calculator Module - Desire Cabinets LLC
// Multi-Room Support

class ClosetCalculator {
    constructor() {
        this.estimate = {
            client: {
                name: '',
                address: '',
                phone: '',
                email: ''
            },
            rooms: [
                this.createNewRoom()  // Start with one room
            ],
            taxRate: 0,  // Tax rate as percentage (e.g., 7.5 for 7.5%)
            discountType: 'percent',  // 'percent' or 'dollar'
            discountValue: 0,  // Discount amount
            revision: 0,  // Revision number
            quoteNumber: this.generateQuoteNumber(),
            date: new Date().toISOString().split('T')[0]
        };
        this.currentRoomIndex = 0;  // Track which room we're editing
    }

    createNewRoom() {
        return {
            name: '',  // e.g., "Master Bedroom", "Walk-in Closet", etc.
            type: 'room',  // 'room' or 'custom'
            closet: {
                closetType: 'walk-in',  // 'walk-in' or 'reach-in'
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
            notes: ''  // Room-specific notes
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

    generateQuoteNumber(clientName = '') {
        // Format: YYMMDD-HHMM-INITIALS (e.g., 260210-1430-RP)
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        
        let quoteNum = `${yy}${mm}${dd}-${hh}${min}`;
        
        // Add initials if client name provided
        if (clientName && clientName.trim()) {
            const nameParts = clientName.trim().split(' ').filter(p => p.length > 0);
            const initials = nameParts.map(p => p[0].toUpperCase()).join('');
            if (initials) {
                quoteNum += `-${initials}`;
            }
        }
        
        return quoteNum;
    }

    // Get current room being edited
    getCurrentRoom() {
        return this.estimate.rooms[this.currentRoomIndex];
    }

    // Get all rooms
    getRooms() {
        return this.estimate.rooms;
    }

    // Add a new room
    addRoom() {
        this.estimate.rooms.push(this.createNewRoom());
        this.currentRoomIndex = this.estimate.rooms.length - 1;
        return this.currentRoomIndex;
    }

    // Add a custom line item
    addCustomItem() {
        this.estimate.rooms.push(this.createNewCustomItem());
        this.currentRoomIndex = this.estimate.rooms.length - 1;
        return this.currentRoomIndex;
    }

    // Remove a room
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

    // Switch to different room
    switchRoom(index) {
        if (index >= 0 && index < this.estimate.rooms.length) {
            this.currentRoomIndex = index;
            return true;
        }
        return false;
    }

    // Calculate base system cost for a specific room
    calculateRoomBase(room) {
        const { linearFeet, depth } = room.closet;
        const pricePerFoot = PRICING_CONFIG.baseSystem[depth] || 0;
        const feet = parseFloat(linearFeet) || 0;
        return feet * pricePerFoot;
    }

    // Calculate material upcharge for a specific room
    calculateRoomMaterialUpcharge(room) {
        const { linearFeet, material } = room.closet;
        const materialConfig = PRICING_CONFIG.materials.find(m => m.id === material);
        const feet = parseFloat(linearFeet) || 0;
        return feet * (materialConfig?.upcharge || 0);
    }

    // Calculate all add-ons for a specific room
    calculateRoomAddons(room) {
        let total = 0;
        for (const [key, value] of Object.entries(room.addons)) {
            if (value.enabled && value.quantity > 0) {
                const addonConfig = PRICING_CONFIG.addons[key];
                if (addonConfig) {
                    const qty = parseFloat(value.quantity) || 0;
                    const price = parseFloat(addonConfig.price) || 0;
                    total += qty * price;
                }
            }
        }
        return total;
    }

    // Calculate total for a specific room
    calculateRoomTotal(room) {
        if (room.type === 'custom') {
            const price = parseFloat(room.price) || 0;
            return { base: 0, materialUpcharge: 0, addons: 0, total: price };
        }
        const base = this.calculateRoomBase(room);
        const materialUpcharge = this.calculateRoomMaterialUpcharge(room);
        const addons = this.calculateRoomAddons(room);

        return {
            base,
            materialUpcharge,
            addons,
            total: base + materialUpcharge + addons
        };
    }

    // Calculate grand total across all rooms
    calculateTotal() {
        let totalBase = 0;
        let totalMaterialUpcharge = 0;
        let totalAddons = 0;

        const roomTotals = this.estimate.rooms.map(room => {
            const roomCalc = this.calculateRoomTotal(room);
            totalBase += roomCalc.base;
            totalMaterialUpcharge += roomCalc.materialUpcharge;
            totalAddons += roomCalc.addons;
            return roomCalc;
        });

        const subtotal = totalBase + totalMaterialUpcharge + totalAddons;
        
        // Calculate discount - ensure no NaN
        let discountAmount = 0;
        const discountValue = parseFloat(this.estimate.discountValue) || 0;
        if (discountValue > 0) {
            if (this.estimate.discountType === 'percent') {
                discountAmount = subtotal * (discountValue / 100);
            } else {
                discountAmount = discountValue;
            }
        }
        
        const afterDiscount = subtotal - discountAmount;
        
        // Calculate tax - ensure no NaN
        const taxRate = parseFloat(this.estimate.taxRate) || 0;
        const taxAmount = afterDiscount * (taxRate / 100);
        
        const total = afterDiscount + taxAmount;

        return {
            base: totalBase,
            materialUpcharge: totalMaterialUpcharge,
            addons: totalAddons,
            subtotal: subtotal,
            discount: discountAmount,
            afterDiscount: afterDiscount,
            tax: taxAmount,
            total: total,
            rooms: roomTotals
        };
    }

    // Get active add-ons for a specific room
    getActiveAddons(room) {
        const active = [];
        for (const [key, value] of Object.entries(room.addons)) {
            if (value.enabled && value.quantity > 0) {
                const addonConfig = PRICING_CONFIG.addons[key];
                active.push({
                    key,
                    name: addonConfig.name,
                    quantity: value.quantity,
                    unit: addonConfig.unit,
                    price: addonConfig.price
                });
            }
        }
        return active;
    }

    // Generate description for a specific room or custom item
    generateRoomDescription(room) {
        // Custom item — just description, no specs
        if (room.type === 'custom') {
            return {
                title: room.name || 'Custom Item',
                details: room.description ? [room.description] : []
            };
        }

        const { closetType, linearFeet, depth, height, material, pullsHandles, hangingRods, mounting, drawingNumber } = room.closet;
        const materialName = PRICING_CONFIG.materials.find(m => m.id === material)?.name || 'White';
        const pullsName = PRICING_CONFIG.pullsHandles.find(h => h.id === pullsHandles)?.name || 'Black · Style 1';
        const rodsName = PRICING_CONFIG.hangingRods.find(h => h.id === hangingRods)?.name || 'Black · Style 1';
        const closetTypeName = closetType === 'walk-in' ? 'Walk-In' : 'Reach-In';

        const activeAddons = this.getActiveAddons(room);

        let title = room.name ? `${room.name} - ${closetTypeName}` : closetTypeName;

        let details = [
            `${depth}" deep × ${height}" high`,
        ];

        if (drawingNumber && drawingNumber.trim()) {
            details.push(`Drawing # ${drawingNumber.trim()}`);
        }

        details = details.concat([
            `3/4" ${materialName} melamine finish`,
            `Pulls/Handles: ${pullsName}`,
            `Hanging Rod: ${rodsName}`,
            ...activeAddons.map(addon => {
                if (addon.unit === 'per linear foot') {
                    return `${addon.name} (${addon.quantity} LF)`;
                } else {
                    return `${addon.name} (${addon.quantity})`;
                }
            }),
            'Installation and delivery included'
        ]);

        return { title, details };
    }

    // Update drawing number for current room
    updateDrawingNumber(value) {
        if (this.getCurrentRoom().type === 'room') {
            this.getCurrentRoom().closet.drawingNumber = value;
        }
    }

    // Update custom item fields
    updateCustomItem(field, value) {
        const room = this.getCurrentRoom();
        if (room.type === 'custom') {
            room[field] = value;
        }
    }

    // Update client info
    updateClient(field, value) {
        this.estimate.client[field] = value;
    }

    // Update current room's closet specs
    updateCloset(field, value) {
        this.getCurrentRoom().closet[field] = value;
    }

    // Update current room's name
    updateRoomName(name) {
        this.getCurrentRoom().name = name;
    }

    // Update current room's notes
    updateRoomNotes(notes) {
        this.getCurrentRoom().notes = notes;
    }

    // Update addon for current room
    updateAddon(addonKey, enabled, quantity = 0) {
        this.getCurrentRoom().addons[addonKey] = { enabled, quantity };
    }

    // Update tax rate
    updateTaxRate(rate) {
        this.estimate.taxRate = parseFloat(rate) || 0;
    }

    // Update discount
    updateDiscount(type, value) {
        this.estimate.discountType = type;
        this.estimate.discountValue = parseFloat(value) || 0;
    }

    // Get current estimate data
    getEstimate() {
        return {
            ...this.estimate,
            calculations: this.calculateTotal(),
            currentRoom: this.getCurrentRoom(),
            currentRoomIndex: this.currentRoomIndex
        };
    }

    // Reset estimate
    reset() {
        this.estimate = {
            client: { name: '', address: '', phone: '', email: '' },
            rooms: [this.createNewRoom()],
            taxRate: 0,
            discountType: 'percent',
            discountValue: 0,
            revision: 0,
            quoteNumber: this.generateQuoteNumber(),
            date: new Date().toISOString().split('T')[0]
        };
        this.currentRoomIndex = 0;
    }

    // Load from localStorage
    loadFromStorage() {
        const saved = localStorage.getItem('dcquoting-estimate');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.estimate = data;
                // Ensure we have at least one room
                if (!this.estimate.rooms || this.estimate.rooms.length === 0) {
                    this.estimate.rooms = [this.createNewRoom()];
                }
                // Migrate old rooms missing new fields
                this.estimate.rooms = this.estimate.rooms.map(room => {
                    if (!room.type) room.type = 'room';
                    if (room.type === 'room' && room.closet) {
                        if (!room.closet.pullsHandles) room.closet.pullsHandles = 'black-style-1';
                        if (!room.closet.hangingRods)  room.closet.hangingRods  = 'black-style-1';
                        if (!room.closet.drawingNumber) room.closet.drawingNumber = '';
                        // Remove old hardwareFinish if present
                        delete room.closet.hardwareFinish;
                    }
                    return room;
                });
                this.currentRoomIndex = 0;
            } catch (e) {
                console.error('Error loading saved estimate:', e);
            }
        }
    }

    // Save to localStorage
    saveToStorage() {
        localStorage.setItem('dcquoting-estimate', JSON.stringify(this.estimate));
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClosetCalculator;
}
