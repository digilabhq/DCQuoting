// calculator.js — Desire Cabinets LLC

var ClosetCalculator = (function() {

    function ClosetCalculator() {
        this.currentRoomIndex = 0;
        this.estimate = {
            client:        { name: '', address: '', phone: '', email: '' },
            rooms:         [ this.createNewRoom() ],
            taxRate:       0,
            discountType:  'percent',
            discountValue: 0,
            revision:      0,
            quoteNumber:   this.generateQuoteNumber(''),
            date:          new Date().toISOString().split('T')[0]
        };
    }

    ClosetCalculator.prototype.createNewRoom = function() {
        return {
            type:   'room',
            name:   '',
            closet: {
                closetType:    'walk-in',
                linearFeet:    0,
                depth:         16,
                height:        96,
                material:      'white',
                pullsHandles:  'black-style-1',
                hangingRods:   'black-style-1',
                mounting:      'floor',
                drawingNumber: ''
            },
            addons: {},
            notes:  ''
        };
    };

    ClosetCalculator.prototype.createNewCustomItem = function() {
        return {
            type:        'custom',
            name:        '',
            description: '',
            price:       0,
            notes:       ''
        };
    };

    ClosetCalculator.prototype.generateQuoteNumber = function(clientName) {
        var now = new Date();
        var yy  = String(now.getFullYear()).slice(-2);
        var mm  = String(now.getMonth() + 1).padStart(2, '0');
        var dd  = String(now.getDate()).padStart(2, '0');
        var hh  = String(now.getHours()).padStart(2, '0');
        var min = String(now.getMinutes()).padStart(2, '0');
        var num = yy + mm + dd + '-' + hh + min;
        if (clientName && clientName.trim()) {
            var parts    = clientName.trim().split(' ').filter(function(p) { return p.length > 0; });
            var initials = parts.map(function(p) { return p[0].toUpperCase(); }).join('');
            if (initials) num = num + '-' + initials;
        }
        return num;
    };

    ClosetCalculator.prototype.getCurrentRoom = function() {
        return this.estimate.rooms[this.currentRoomIndex];
    };

    ClosetCalculator.prototype.getRooms = function() {
        return this.estimate.rooms;
    };

    ClosetCalculator.prototype.addRoom = function() {
        this.estimate.rooms.push(this.createNewRoom());
        this.currentRoomIndex = this.estimate.rooms.length - 1;
        return this.currentRoomIndex;
    };

    ClosetCalculator.prototype.addCustomItem = function() {
        this.estimate.rooms.push(this.createNewCustomItem());
        this.currentRoomIndex = this.estimate.rooms.length - 1;
        return this.currentRoomIndex;
    };

    ClosetCalculator.prototype.removeRoom = function(index) {
        if (this.estimate.rooms.length > 1) {
            this.estimate.rooms.splice(index, 1);
            if (this.currentRoomIndex >= this.estimate.rooms.length) {
                this.currentRoomIndex = this.estimate.rooms.length - 1;
            }
            return true;
        }
        return false;
    };

    ClosetCalculator.prototype.switchRoom = function(index) {
        if (index >= 0 && index < this.estimate.rooms.length) {
            this.currentRoomIndex = index;
            return true;
        }
        return false;
    };

    ClosetCalculator.prototype.calculateRoomBase = function(room) {
        var feet = parseFloat(room.closet.linearFeet) || 0;
        var ppf  = PRICING_CONFIG.baseSystem[room.closet.depth] || 0;
        return feet * ppf;
    };

    ClosetCalculator.prototype.calculateRoomMaterialUpcharge = function(room) {
        var feet = parseFloat(room.closet.linearFeet) || 0;
        var mat  = null;
        for (var i = 0; i < PRICING_CONFIG.materials.length; i++) {
            if (PRICING_CONFIG.materials[i].id === room.closet.material) {
                mat = PRICING_CONFIG.materials[i];
                break;
            }
        }
        return feet * (mat ? mat.upcharge : 0);
    };

    ClosetCalculator.prototype.calculateRoomAddons = function(room) {
        var total = 0;
        var keys  = Object.keys(room.addons);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var val = room.addons[key];
            if (val.enabled && val.quantity > 0) {
                var cfg = PRICING_CONFIG.addons[key];
                if (cfg) {
                    total += (parseFloat(val.quantity) || 0) * (parseFloat(cfg.price) || 0);
                }
            }
        }
        return total;
    };

    ClosetCalculator.prototype.calculateRoomTotal = function(room) {
        if (room.type === 'custom') {
            var customPrice = parseFloat(room.price) || 0;
            return { base: 0, materialUpcharge: 0, addons: 0, customPrice: customPrice, total: customPrice };
        }
        var base             = this.calculateRoomBase(room);
        var materialUpcharge = this.calculateRoomMaterialUpcharge(room);
        var addons           = this.calculateRoomAddons(room);
        return { base: base, materialUpcharge: materialUpcharge, addons: addons, customPrice: 0, total: base + materialUpcharge + addons };
    };

    ClosetCalculator.prototype.calculateTotal = function() {
        var self          = this;
        var totalBase     = 0;
        var totalMaterial = 0;
        var totalAddons   = 0;
        var totalCustom   = 0;

        var roomTotals = this.estimate.rooms.map(function(room) {
            var r = self.calculateRoomTotal(room);
            totalBase     += r.base;
            totalMaterial += r.materialUpcharge;
            totalAddons   += r.addons;
            totalCustom   += r.customPrice;
            return r;
        });

        // subtotal = ALL rooms combined (closet + addons + custom items)
        var subtotal      = totalBase + totalMaterial + totalAddons + totalCustom;

        var discountValue  = parseFloat(this.estimate.discountValue) || 0;
        var discountAmount = 0;
        if (discountValue > 0) {
            if (this.estimate.discountType === 'percent') {
                discountAmount = subtotal * (discountValue / 100);
            } else {
                discountAmount = discountValue;
            }
        }

        var afterDiscount = subtotal - discountAmount;
        var taxRate       = parseFloat(this.estimate.taxRate) || 0;
        var taxAmount     = afterDiscount * (taxRate / 100);
        var total         = afterDiscount + taxAmount;

        return {
            base:             totalBase,
            materialUpcharge: totalMaterial,
            addons:           totalAddons,
            custom:           totalCustom,
            subtotal:         subtotal,
            discount:         discountAmount,
            afterDiscount:    afterDiscount,
            tax:              taxAmount,
            total:            total,
            rooms:            roomTotals
        };
    };

    ClosetCalculator.prototype.getActiveAddons = function(room) {
        var active = [];
        var keys   = Object.keys(room.addons);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var val = room.addons[key];
            if (val.enabled && val.quantity > 0) {
                var cfg = PRICING_CONFIG.addons[key];
                if (cfg) {
                    active.push({ key: key, name: cfg.name, quantity: val.quantity, unit: cfg.unit, price: cfg.price });
                }
            }
        }
        return active;
    };

    ClosetCalculator.prototype.generateRoomDescription = function(room) {
        if (room.type === 'custom') {
            return {
                title:   room.name || 'Custom Item',
                details: room.description ? [ room.description ] : []
            };
        }

        var c            = room.closet;
        var materialName = 'White';
        for (var i = 0; i < PRICING_CONFIG.materials.length; i++) {
            if (PRICING_CONFIG.materials[i].id === c.material) {
                materialName = PRICING_CONFIG.materials[i].name;
                break;
            }
        }
        var pullsName = 'Black - Style 1';
        for (var j = 0; j < PRICING_CONFIG.pullsHandles.length; j++) {
            if (PRICING_CONFIG.pullsHandles[j].id === c.pullsHandles) {
                pullsName = PRICING_CONFIG.pullsHandles[j].name;
                break;
            }
        }
        var rodsName = 'Black - Style 1';
        for (var k = 0; k < PRICING_CONFIG.hangingRods.length; k++) {
            if (PRICING_CONFIG.hangingRods[k].id === c.hangingRods) {
                rodsName = PRICING_CONFIG.hangingRods[k].name;
                break;
            }
        }

        var typeName     = c.closetType === 'walk-in' ? 'Walk-In' : 'Reach-In';
        var title        = room.name ? room.name + ' - ' + typeName : typeName;
        var activeAddons = this.getActiveAddons(room);

        var details = [ c.depth + '" deep x ' + c.height + '" high' ];
        if (c.drawingNumber && c.drawingNumber.trim()) {
            details.push('Drawing # ' + c.drawingNumber.trim());
        }
        details.push('3/4" ' + materialName + ' melamine finish');
        details.push('Pulls/Handles: ' + pullsName);
        details.push('Hanging Rod: ' + rodsName);
        for (var a = 0; a < activeAddons.length; a++) {
            var addon = activeAddons[a];
            details.push(addon.name + ' (' + addon.quantity + (addon.unit === 'per linear foot' ? ' LF' : '') + ')');
        }
        details.push('Installation and delivery included');

        return { title: title, details: details };
    };

    ClosetCalculator.prototype.getEstimate = function() {
        return {
            client:           this.estimate.client,
            rooms:            this.estimate.rooms,
            taxRate:          this.estimate.taxRate,
            discountType:     this.estimate.discountType,
            discountValue:    this.estimate.discountValue,
            revision:         this.estimate.revision,
            quoteNumber:      this.estimate.quoteNumber,
            date:             this.estimate.date,
            calculations:     this.calculateTotal(),
            currentRoom:      this.getCurrentRoom(),
            currentRoomIndex: this.currentRoomIndex
        };
    };

    ClosetCalculator.prototype.updateClient        = function(field, value) { this.estimate.client[field] = value; };
    ClosetCalculator.prototype.updateCloset        = function(field, value) { this.getCurrentRoom().closet[field] = value; };
    ClosetCalculator.prototype.updateRoomName      = function(name)         { this.getCurrentRoom().name = name; };
    ClosetCalculator.prototype.updateRoomNotes     = function(notes)        { this.getCurrentRoom().notes = notes; };
    ClosetCalculator.prototype.updateTaxRate       = function(rate)         { this.estimate.taxRate = parseFloat(rate) || 0; };
    ClosetCalculator.prototype.updateRevision      = function(val)          { this.estimate.revision = parseInt(val) || 0; };

    ClosetCalculator.prototype.updateAddon = function(key, enabled, qty) {
        this.getCurrentRoom().addons[key] = { enabled: enabled, quantity: qty };
    };

    ClosetCalculator.prototype.updateDiscount = function(type, value) {
        this.estimate.discountType  = type;
        this.estimate.discountValue = parseFloat(value) || 0;
    };

    ClosetCalculator.prototype.updateDrawingNumber = function(value) {
        var room = this.getCurrentRoom();
        if (room.type === 'room') { room.closet.drawingNumber = value; }
    };

    ClosetCalculator.prototype.updateCustomItem = function(field, value) {
        var room = this.getCurrentRoom();
        if (room.type === 'custom') { room[field] = value; }
    };

    ClosetCalculator.prototype.reset = function() {
        this.currentRoomIndex = 0;
        this.estimate = {
            client:        { name: '', address: '', phone: '', email: '' },
            rooms:         [ this.createNewRoom() ],
            taxRate:       0,
            discountType:  'percent',
            discountValue: 0,
            revision:      0,
            quoteNumber:   this.generateQuoteNumber(''),
            date:          new Date().toISOString().split('T')[0]
        };
    };

    ClosetCalculator.prototype.loadFromStorage = function() {
        var saved = localStorage.getItem('dcquoting-estimate');
        if (!saved) return;
        try {
            var data     = JSON.parse(saved);
            this.estimate = data;
            if (!this.estimate.rooms || this.estimate.rooms.length === 0) {
                this.estimate.rooms = [ this.createNewRoom() ];
            }
            var self = this;
            this.estimate.rooms = this.estimate.rooms.map(function(room) {
                if (!room.type) room.type = 'room';
                if (room.type === 'room') {
                    if (!room.closet)                  room.closet               = self.createNewRoom().closet;
                    if (!room.closet.pullsHandles)     room.closet.pullsHandles  = 'black-style-1';
                    if (!room.closet.hangingRods)      room.closet.hangingRods   = 'black-style-1';
                    if (room.closet.drawingNumber === undefined) room.closet.drawingNumber = '';
                    delete room.closet.hardwareFinish;
                }
                if (room.type === 'custom') {
                    if (room.price === undefined) room.price = 0;
                    if (!room.description)        room.description = '';
                }
                return room;
            });
            this.currentRoomIndex = 0;
        } catch (e) {
            console.error('Error loading estimate:', e);
        }
    };

    ClosetCalculator.prototype.saveToStorage = function() {
        localStorage.setItem('dcquoting-estimate', JSON.stringify(this.estimate));
    };

    return ClosetCalculator;
})();
