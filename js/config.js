// Pricing Configuration - Desire Cabinets LLC
// Based on Quote #0018 Analysis
// Last Updated: February 2026

const PRICING_CONFIG = {
    // Base system pricing per linear foot by depth
    // INCLUDES: 3/4" white melamine, frameless cabinets, plain doors/drawers, 
    // full extension drawer slides, hardware, delivery & installation
    baseSystem: {
        14: 200,  // $200/LF for 14" depth
        16: 215,  // $215/LF for 16" depth
        19: 225,  // $225/LF for 19" depth
        24: 250   // $250/LF for 24" depth
    },

    // Add-ons - User enters quantity for each
    addons: {
        drawers: {
            name: "Drawers",
            price: 75,
            unit: "each"
        },
        colorChangingLEDs: {
            name: "LED Lighting",
            price: 75,
            unit: "per linear foot"
        },
        shakerStyle: {
            name: "Shaker Style Doors/Drawers",
            price: 75,
            unit: "per door/drawer"
        },
        laminatedTops: {
            name: "Laminated Tops (25\" deep)",
            price: 50,
            unit: "per linear foot"
        },
        floatingShelves: {
            name: "Floating Shelves (3/4\" thick, 12\" deep)",
            price: 25,
            unit: "per linear foot"
        },
        hamper: {
            name: "Hamper",
            price: 175,
            unit: "each"
        },
        mirror: {
            name: "Mirror",
            price: 150,
            unit: "each"
        },
        doors: {
            name: "Doors",
            price: 45,
            unit: "each"
        },
        ssTops: {
            name: "SS Tops (25\" deep)",
            price: 100,
            unit: "per linear foot"
        },
        removalDisposal: {
            name: "Removal of Old System & Trash Disposal",
            price: 150,
            unit: "each"
        }
    },

    // Hardware finish options (no upcharge - just for description)
    hardwareFinishes: [
        { id: "black", name: "Black" },
        { id: "gold", name: "Gold" },
        { id: "chrome", name: "Chrome" },
        { id: "brushed-nickel", name: "Brushed Nickel" }
    ],

    // Material options - White is base ($0), others have upcharge
    materials: [
        { id: "white", name: "White", upcharge: 0 },
        { id: "pewter-pine", name: "Pewter Pine", upcharge: 29 },
        { id: "gray", name: "Gray", upcharge: 8 },
        { id: "sable-glow", name: "Sable Glow", upcharge: 19 },
        { id: "umbria-elme", name: "Umbria Elme", upcharge: 17 },
        { id: "coastland-oak", name: "Coastland Oak", upcharge: 21 },
        { id: "spring-blossom", name: "Spring Blossom", upcharge: 34 },
        { id: "black", name: "Black", upcharge: 0 },
        { id: "regal-cherry", name: "Regal Cherry", upcharge: 16 },
        { id: "maple", name: "Maple", upcharge: 9 },
        { id: "natural-oak", name: "Natural Oak", upcharge: 19 },
        { id: "moscato-elme", name: "Moscato Elme", upcharge: 15 }
    ],

    // Mounting type (standard is floor)
    mounting: [
        { id: "floor", name: "Floor Mounted" },
        { id: "wall", name: "Wall Mounted" }
    ],

    // What's included in base price (for reference)
    standardIncludes: [
        "3/4\" Melamine Frameless Cabinets",
        "Plain Doors/Drawers",
        "Full Extension Drawer Slides",
        "Exposed Hardware",
        "Delivery & Installation"
    ]
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PRICING_CONFIG;
}
