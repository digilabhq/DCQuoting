// Pricing Configuration - Desire Cabinets LLC
// Last Updated: February 2026

const PRICING_CONFIG = {

    baseSystem: {
        14: 200,
        16: 215,
        19: 225,
        24: 250
    },

    addons: {
        drawers:          { name: "Drawers",                               price: 75,  unit: "each"           },
        colorChangingLEDs:{ name: "LED Lighting",                          price: 75,  unit: "per linear foot" },
        shakerStyle:      { name: "Shaker Style Doors/Drawers",            price: 75,  unit: "per door/drawer" },
        laminatedTops:    { name: 'Laminated Tops (25" deep)',             price: 50,  unit: "per linear foot" },
        floatingShelves:  { name: 'Floating Shelves (3/4" thick, 12" deep)',price: 25, unit: "per linear foot" },
        hamper:           { name: "Hamper",                                price: 175, unit: "each"           },
        mirror:           { name: "Mirror",                                price: 150, unit: "each"           },
        doors:            { name: "Doors",                                 price: 45,  unit: "each"           },
        ssTops:           { name: 'SS Tops (25" deep)',                    price: 100, unit: "per linear foot" },
        removalDisposal:  { name: "Removal of Old System & Trash Disposal",price: 150, unit: "each"           }
    },

    pullsHandles: [
        { id: "black-style-1",          name: "Black - Style 1"          },
        { id: "black-style-2",          name: "Black - Style 2"          },
        { id: "gold-style-1",           name: "Gold - Style 1"           },
        { id: "gold-style-2",           name: "Gold - Style 2"           },
        { id: "chrome-style-1",         name: "Chrome - Style 1"         },
        { id: "chrome-style-2",         name: "Chrome - Style 2"         },
        { id: "brushed-nickel-style-1", name: "Brushed Nickel - Style 1" },
        { id: "brushed-nickel-style-2", name: "Brushed Nickel - Style 2" }
    ],

    hangingRods: [
        { id: "black-style-1",          name: "Black - Style 1"          },
        { id: "black-style-2",          name: "Black - Style 2"          },
        { id: "gold-style-1",           name: "Gold - Style 1"           },
        { id: "gold-style-2",           name: "Gold - Style 2"           },
        { id: "chrome-style-1",         name: "Chrome - Style 1"         },
        { id: "chrome-style-2",         name: "Chrome - Style 2"         },
        { id: "brushed-nickel-style-1", name: "Brushed Nickel - Style 1" },
        { id: "brushed-nickel-style-2", name: "Brushed Nickel - Style 2" }
    ],

    materials: [
        { id: "white",          name: "White",          upcharge: 0  },
        { id: "black",          name: "Black",          upcharge: 0  },
        { id: "gray",           name: "Gray",           upcharge: 8  },
        { id: "maple",          name: "Maple",          upcharge: 9  },
        { id: "moscato-elme",   name: "Moscato Elme",   upcharge: 15 },
        { id: "regal-cherry",   name: "Regal Cherry",   upcharge: 16 },
        { id: "umbria-elme",    name: "Umbria Elme",    upcharge: 17 },
        { id: "natural-oak",    name: "Natural Oak",    upcharge: 19 },
        { id: "sable-glow",     name: "Sable Glow",     upcharge: 19 },
        { id: "coastland-oak",  name: "Coastland Oak",  upcharge: 21 },
        { id: "pewter-pine",    name: "Pewter Pine",    upcharge: 29 },
        { id: "spring-blossom", name: "Spring Blossom", upcharge: 34 }
    ],

    mounting: [
        { id: "floor", name: "Floor Mounted" },
        { id: "wall",  name: "Wall Mounted"  }
    ]
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PRICING_CONFIG;
}
