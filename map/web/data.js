// ==========================================================================
// THE ASSET ARCHIVE — Facility Metadata, Departments, Specimens & Walk Zones
// Three.js Coordinate Space: X = Right, Y = Up, Z = Towards Entrance (+Z) / Towards North (-Z)
// ==========================================================================

export const FACILITY_INFO = {
  name: "THE ASSET ARCHIVE",
  subtitle: "Facility Master Map & 3D Architectural Museum",
  author: "Senior 3D Environment & Technical Artist",
  description: "A continuous 12,500 m² virtual research facility engineered with 11 interconnected wings, 100% watertight architecture, unobstructed open portals, bespoke hero sample models in every room, and real-time WebGL exploration alongside offline Blender Cycles raytraced showcases.",
  engineVersion: "Blender 5.2.1 LTS // Cycles Path Tracing // Three.js WebGL",
  departmentsCount: 11,
  totalTriangles: "228.6k Triangles",
  materialsCount: "44 Architectural PBR Master Sets"
};

export const DEPARTMENTS = [
  {
    id: "entrance",
    number: "00",
    name: "Welcome Lounge",
    category: "ORIENTATION & ACCESS",
    subtitle: "Facility Entrance & Visitor Vestibule",
    color: "#00e5ff",
    camPos: [0.0, 1.8, 84.0],
    targetPos: [0.0, 1.8, 65.0],
    cyclesImage: "./renders/cycles/RENDER_MASTER_HERO.png",
    webpImage: "./renders/archive/start.webp",
    specs: {
      heroModel: "Holographic Facility Maquette (1:200 Scale Model with Translucent Cyan Light Trusses)",
      secondaryExhibits: "1:100 Scale Sectional Architectural Cutaway Model, Holographic Recon Drone in Glass Vitrine",
      dimensions: "14.0m × 22.0m",
      ceilingHeight: "4.2m Structural Deck",
      lighting: "5000K Linear LED Cove Wash",
      triangles: "9.2k Triangles",
      materials: "Polished Basalt, Satin Titanium, Linear Glow Trim",
      cyclesSamples: "1024 Samples // OpenImageDenoise"
    },
    description: "The primary visitor reception and orientation vestibule. Features a central 1:200 holographic facility scale maquette with floating data crystals, high-contrast wayfinding beacons, and direct open passage north into the Nexus Central Rotunda."
  },
  {
    id: "nexus",
    number: "01",
    name: "Portfolio Nexus",
    category: "CENTRAL ROTUNDA",
    subtitle: "Facility Navigational Core & Hub",
    color: "#00e5ff",
    camPos: [0.0, 2.2, 64.0],
    targetPos: [0.0, 1.8, 55.0],
    cyclesImage: "./renders/cycles/RENDER_NEXUS.png",
    webpImage: "./renders/departments/nexus.webp",
    specs: {
      heroModel: "Quantum Gyro-Core Singularity Reactor (Faceted Plasma Singularity with Dual Gimbal Rings & Titanium Pylons)",
      secondaryExhibits: "NW Antimatter Hex Core Pod, NE Graviton Induction Array, SW Cryo-Power Relay, SE Telemetry Sensor Array",
      dimensions: "32.0m × 30.0m",
      ceilingHeight: "8.8m Clerestory Dome",
      lighting: "6500K High-Output Concentric Rings",
      triangles: "24.8k Triangles",
      materials: "Diamond Tread Plate, Cast Carbon Composite, Emissive Neon",
      cyclesSamples: "1024 Samples // Full Multi-Bounce GI"
    },
    description: "The grand central rotunda connecting all four quadrants of the facility. Showcases the massive Quantum Gyro-Core Reactor suspended inside nested counter-rotating magnetic containment rings, flanked by four titanium stabilizer pylons and 4 perimeter quadrant energy telemetry exhibits."
  },
  {
    id: "stylized",
    number: "02",
    name: "Stylized & Voxel Wing",
    category: "EXHIBITION WING",
    subtitle: "Non-Photorealistic & Modular Showcase",
    color: "#ff9100",
    camPos: [-42.0, 2.2, 70.0],
    targetPos: [-42.0, 1.8, 57.5],
    cyclesImage: "./renders/cycles/RENDER_STYLIZED.png",
    webpImage: "./renders/departments/stylized.webp",
    specs: {
      heroModel: "Voxel-Mech Cyber-Sentinel (Chiseled Terracotta Clay Armor with Chest Reactor & Modular Power Fists)",
      secondaryExhibits: "Prismatic Quartz Geode Golem, Torii Shrine Floating Island Diorama, Chibi Retro Arcade Mech, Enchanted Lectern & Grimoire",
      dimensions: "39.0m × 35.0m",
      ceilingHeight: "6.1m Modular Truss",
      lighting: "3800K Warm Ambient Fill with Accent Spotlights",
      triangles: "18.2k Triangles",
      materials: "Matte Ceramic, Colored Clay, Hand-Painted PBR",
      cyclesSamples: "1024 Samples // Ambient Occlusion Pass"
    },
    description: "Dedicated to stylized, low-poly, and voxel asset curation. Displays the Voxel-Mech Cyber-Sentinel along with perimeter dioramas including a floating Torii shrine, quartz geode golem, chibi arcade mech, and illuminated grimoire lectern."
  },
  {
    id: "creatures",
    number: "03",
    name: "Creature Containment",
    category: "RESEARCH LAB",
    subtitle: "Bio-Specimen Stasis Concourse",
    color: "#00e5ff",
    camPos: [0.0, 1.8, 17.8],
    targetPos: [0.0, 2.0, 5.0],
    cyclesImage: "./renders/cycles/RENDER_CREATURES.png",
    webpImage: "./renders/departments/creatures.webp",
    specs: {
      heroModel: "Apex Xeno-Specimen Stasis Core (Heavy Cryogenic Glass Vitrine with Articulated Chitin Predator)",
      secondaryExhibits: "Articulated Xenomorph Cranial Skull, Biological Embryo Centrifuge Rack, Neural Spore Glass Cloche, Cryogenic Specimen Canisters",
      dimensions: "24.0m × 37.6m",
      ceilingHeight: "6.65m Reinforced Roof Deck",
      lighting: "6000K Clinical Task Lighting with Saturated Chamber Pods",
      triangles: "41.5k Triangles",
      materials: "Cast Heavy Concrete, Crystal Glass, Hazard Striping",
      cyclesSamples: "1024 Samples // Volumetric Atmospheric Fog"
    },
    description: "An industrial containment concourse featuring 8 illuminated perimeter stasis chambers plus a centerpiece Apex Xeno-Specimen Stasis Core, articulated xenomorph skull specimen, bio-centrifuge embryo rack, and spore bell jar."
  },
  {
    id: "props",
    number: "04",
    name: "Props Workshop",
    category: "FABRICATION",
    subtitle: "Hard-Surface & Industrial Design",
    color: "#ffd600",
    camPos: [31.0, 2.5, 47.0],
    targetPos: [39.0, 0.8, 57.0],
    cyclesImage: "./renders/cycles/RENDER_PROPS.png",
    webpImage: "./renders/departments/props.webp",
    specs: {
      heroModel: "Heavy Industrial Plasma Arc Cutter (Dual-Grip Hard-Surface Power Tool with Solenoid Induction Coils)",
      secondaryExhibits: "Pneumatic Structural Rivet Cannon, Granite Surface Laser Micrometer, High-Torque Power Driver with Dock, CNC Modular Tool Chest",
      dimensions: "30.0m × 32.0m",
      ceilingHeight: "5.0m Steel I-Beam Frame",
      lighting: "4000K Workbench Spotlights & High-Contrast Rim Lights",
      triangles: "16.1k Triangles",
      materials: "Brushed Aluminum, Anodized Steel, Industrial Rubber",
      cyclesSamples: "1024 Samples // Path Traced Roughness Reflections"
    },
    description: "An active digital prop workshop featuring tool racks, inspection turntables, and the Heavy Industrial Plasma Arc Cutter hero model, flanked by an optical laser micrometer, pneumatic rivet cannon, and heavy tooling cabinets."
  },
  {
    id: "weapons",
    number: "05",
    name: "Weapons Forge",
    category: "ARMORY & FORGE",
    subtitle: "Tactical & Sci-Fi Arsenal",
    color: "#ffab00",
    camPos: [-2.0, 2.0, 35.0],
    targetPos: [0.0, 1.5, 29.0],
    cyclesImage: "./renders/cycles/RENDER_WEAPONS.png",
    webpImage: "./renders/departments/weapons.webp",
    specs: {
      heroModel: "Aethelgard Tactical Plasma Claymore (1.6m Damascus Energy Greatsword Levitating in Magnetic Cradle)",
      secondaryExhibits: "Bullpup Particle SMG on Magnetic Stand, Mag-Rail Anti-Materiel Rifle with Thermal Optic, Kinetic Breaching Hammer, Vibro-Daggers",
      dimensions: "20.0m × 21.8m",
      ceilingHeight: "5.5m Thermal Exhaust Baffles",
      lighting: "2800K Thermal Orange Glow & Cold Steel Rim",
      triangles: "21.6k Triangles",
      materials: "Tempered Damascus Steel, Heat-Treated Titanium, Carbon Fiber",
      cyclesSamples: "1024 Samples // Anisotropic Metallic Shading"
    },
    description: "An armory and weapon design wing with central illuminated forge ring. Features the Aethelgard Plasma Claymore flanked by magnetic wall mounts displaying a particle SMG, anti-materiel sniper rifle, kinetic hammer, and vibro-daggers."
  },
  {
    id: "ugc",
    number: "06",
    name: "UGC Modular Showroom",
    category: "COMMUNITY PLATFORM",
    subtitle: "Metaverse & Avatar Accessories",
    color: "#d500f9",
    camPos: [-25.0, 2.0, 32.0],
    targetPos: [-31.0, 1.5, 27.0],
    cyclesImage: "./renders/cycles/RENDER_UGC.png",
    webpImage: "./renders/departments/ugc.webp",
    specs: {
      heroModel: "Cyber Valkyrie Wing-Pack & Crown Visor (Deployable Hard-Light Iridescent Wings on Mannequin Bust)",
      secondaryExhibits: "Cyber-Samurai Oni Visor Mask, Floating Emotive Companion Pet Drone, Street Neo-Tokyo Hoverboard, Segmented Nanotube Pauldrons",
      dimensions: "32.0m × 30.0m",
      ceilingHeight: "6.5m Open Retail Grid",
      lighting: "Vibrant Purple Neon Cove with Floating Accent Backlights",
      triangles: "14.2k Triangles",
      materials: "Translucent Acrylic, Holographic Foil, Satin Plastic",
      cyclesSamples: "1024 Samples // Transmission & SSS Approximation"
    },
    description: "A retail-inspired showroom tailored for UGC creator items. Features the Cyber Valkyrie Hero Set alongside display pedestals showcasing a cyber Oni mask, emotive pet drone, street hoverboard, and stealth shoulder pauldrons."
  },
  {
    id: "environment",
    number: "07",
    name: "Environment Gallery",
    category: "BIOME ARCHITECTURE",
    subtitle: "Large-Scale Biome & Catwalk",
    color: "#00e676",
    camPos: [60.0, 4.6, 50.0],
    targetPos: [74.0, 1.5, 48.0],
    cyclesImage: "./renders/cycles/RENDER_ENVIRONMENT.png",
    webpImage: "./renders/departments/environment.webp",
    specs: {
      heroModel: "Biosphere Terrarium Diorama (Stratified Bedrock Island with Research Citadel & Bioluminescent Flora)",
      secondaryExhibits: "Dune Desert Biome Terrarium Diorama, Polar Ice Core Cryo Column, Observation Deck Survey Binoculars",
      dimensions: "40.0m × 50.0m",
      ceilingHeight: "9.2m High-Volume Clerestory",
      lighting: "5200K Daylight Skylight with Bioluminescent Flora",
      triangles: "26.4k Triangles",
      materials: "Natural Terrarium Soil, Structural Glazing, Weathered Rock",
      cyclesSamples: "1024 Samples // Foliage Translucency"
    },
    description: "The largest volume in the facility. Features a 3.5m-high perimeter catwalk overlooking the sunken living biosphere diorama, supplemented by an encapsulated desert biome, polar ice core column, and observation deck survey binoculars."
  },
  {
    id: "realistic",
    number: "08",
    name: "Realistic Material Lab",
    category: "SHADING & TEXTURING",
    subtitle: "PBR Shader & Material Validation",
    color: "#2979ff",
    camPos: [31.0, 2.2, 35.0],
    targetPos: [30.0, 1.2, 23.0],
    cyclesImage: "./renders/cycles/RENDER_REALISTIC.png",
    webpImage: "./renders/departments/realistic.webp",
    specs: {
      heroModel: "Aerospace Turbofan Compressor Core (Anisotropic Titanium Rotor Blades with Heat-Stained Exhaust)",
      secondaryExhibits: "6-Piston Carbon-Ceramic Brake Caliper, Chronograph Skeleton Movement, Calibrated PBR Shader Spheres (Chrome / Grey / Red), Step-Wedge Anodized Aluminum Slabs",
      dimensions: "28.0m × 40.0m",
      ceilingHeight: "4.8m Technical Acoustical Grid",
      lighting: "5500K Neutral D65 Calibration Light Bank",
      triangles: "17.8k Triangles",
      materials: "Micro-Roughness Metals, Optical Dielectrics, Clearcoat Car Paint",
      cyclesSamples: "1024 Samples // Spectral Reflection Passes"
    },
    description: "A precision material calibration laboratory equipped with calibrated shader test spheres, motorsport brake caliper, skeleton watch movement, and the Aerospace Turbofan Engine Benchmark core."
  },
  {
    id: "rnd",
    number: "09",
    name: "R&D Pipeline Lab",
    category: "TECHNICAL ART",
    subtitle: "Procedural Shaders & Tool Dev",
    color: "#00b0ff",
    camPos: [22.0, 2.5, -12.0],
    targetPos: [28.0, 1.5, -19.5],
    cyclesImage: "./renders/cycles/RENDER_RND.png",
    webpImage: "./renders/departments/rnd.webp",
    specs: {
      heroModel: "Exploded Tech-Art Drone (4-Stage Pipeline Breakdown: Wireframe, High-Poly Sculpt, PBR Shell, Skeleton)",
      secondaryExhibits: "FACS Diagnostic Facial Bust (Clay/Wireframe), Volumetric Shader Complexity Heatmap, 4-Tier Quad LOD Mesh Sequence, 3-Axis Kinematic Rig Arm",
      dimensions: "28.0m × 34.0m",
      ceilingHeight: "5.2m Service Conduit Grid",
      lighting: "4500K High-CRI Fluorescent with Pipeline Floor Guides",
      triangles: "15.6k Triangles",
      materials: "Modular Server Racks, Robotic Actuators, Cable Trays",
      cyclesSamples: "1024 Samples // High-Frequency Shadow Detail"
    },
    description: "The skunkworks engine room of the facility. Highlights an exploded 4-stage diagnostic drone alongside a dual FACS facial sculpt, volumetric shader complexity hologram, 4-tier LOD sequence, and robotic kinematics arm."
  },
  {
    id: "horror",
    number: "10",
    name: "Special Containment",
    category: "ATMOSPHERIC EXPERIMENTAL",
    subtitle: "High-Threat Quarantine Biome",
    color: "#ff1744",
    camPos: [-21.0, 2.0, -0.5],
    targetPos: [-28.0, 1.6, -8.0],
    cyclesImage: "./renders/cycles/RENDER_HORROR.png",
    webpImage: "./renders/departments/horror.webp",
    specs: {
      heroModel: "Subject Omega Biomechanical Neural Core (Crimson Bio-Mass with Chitin Claws inside Reinforced Pod)",
      secondaryExhibits: "Formaldehyde Xenomorph Larva Cloche, Mutated Arm on Dissection Tray, Corroded Radioactive Waste Drums & Sump, Decontamination UV Radiation Arch",
      dimensions: "26.0m × 30.0m",
      ceilingHeight: "4.2m Blast-Reinforced Bunker",
      lighting: "Low-Key Pulsing Crimson Warning Beacons with Deep Shadows",
      triangles: "19.3k Triangles",
      materials: "Corroded Heavy Steel, Laminated Acrylic, Xenobiotic Resin",
      cyclesSamples: "1024 Samples // Caustics & Heavy Falloff"
    },
    description: "An isolated deep-containment cell accessed through a pneumatic airlock. Houses Subject Omega alongside specimen formaldehyde cloches, medical dissection trays with mutated limbs, toxic sump drums, and decontamination UV portals."
  },
  {
    id: "exit",
    number: "11",
    name: "Contact & Exit Station",
    category: "DEBRIEF & OUTRO",
    subtitle: "Inquiries & Portfolio Debriefing",
    color: "#ffffff",
    camPos: [-1.0, 1.8, 78.0],
    targetPos: [-4.8, 2.0, 78.0],
    cyclesImage: "./renders/cycles/RENDER_EXIT.png",
    webpImage: "./renders/departments/exit.webp",
    specs: {
      heroModel: "Archival Data Codex Terminal (Capacitive Angled Interface with Floating Prismatic Data Crystal)",
      dimensions: "10.0m × 12.0m",
      ceilingHeight: "4.2m Clean Baffle Ceiling",
      lighting: "5000K Soft White Ambient with Clean Accent Signage",
      triangles: "7.8k Triangles",
      materials: "Brushed Steel, Frosted Glass, High-Contrast Black Glass",
      cyclesSamples: "1024 Samples // Neutral Diffuse Bounce"
    },
    description: "The debriefing terminal located near the Welcome Lounge. Features the Archival Data Codex Terminal with interactive contact portals, curriculum vitae transfer links, and portfolio debriefing data."
  }
];

export const SPECIMENS = [
  {
    id: 1,
    chamber: "CHAMBER 01",
    name: "Crystal Golem",
    code: "SPECIMEN-GEO-01",
    category: "Crystalline Geo-Entity",
    color: "#00e5ff",
    stats: {
      hardness: "9.8 Mohs",
      resonance: "142.4 kHz",
      mass: "420 kg",
      stability: "Stable"
    },
    description: "A self-organizing mineral entity featuring floating crystalline quartz plates and an internal piezoelectric energy core. Its limb segments hover via localized quantum flux.",
    containment: "Maintain resonant harmonic dampening field at 140 kHz. Avoid high-energy ultrasonic pulses.",
    camPos: [-3.2, 2.1, 10.5],
    targetPos: [-6.9, 2.0, 10.5]
  },
  {
    id: 2,
    chamber: "CHAMBER 02",
    name: "Magma Rock Monster",
    code: "SPECIMEN-PYRO-02",
    category: "Volcanic Basalt Brute",
    color: "#ff6d00",
    stats: {
      coreTemp: "1,450 °C",
      density: "3.6 g/cm³",
      mass: "1,150 kg",
      stability: "Volatile"
    },
    description: "Composed of heavy cooling basalt plates interlaced with glowing molten lava fissures. Exerts extreme radiant heat and possesses high tensile rock crushing strength.",
    containment: "Cryogenic coolant perimeter active 24/7. Core temperature must not exceed 1,600 °C threshold.",
    camPos: [-3.2, 2.1, 3.5],
    targetPos: [-6.9, 2.0, 3.5]
  },
  {
    id: 3,
    chamber: "CHAMBER 03",
    name: "Cyber Mecha Drone",
    code: "SPECIMEN-SYNTH-03",
    category: "Autonomous Hover Chassis",
    color: "#ffd600",
    stats: {
      altitude: "1.4 m Hover",
      optics: "Multi-Spectrum LiDAR",
      power: "Micro-Fusion Cell",
      stability: "Calibrated"
    },
    description: "An advanced modular robotics prototype equipped with dual 3-segment articulated manipulator claws, gyroscopic hover thrusters, and a wide-angle optical sensory array.",
    containment: "Full Faraday isolation cage engaged. Wireless transmission bands jammed across all frequencies.",
    camPos: [-3.2, 2.1, -3.5],
    targetPos: [-6.9, 2.0, -3.5]
  },
  {
    id: 4,
    chamber: "CHAMBER 04",
    name: "Toxic Beast Chimera",
    code: "SPECIMEN-MUT-04",
    category: "Quadruped Bio-Predator",
    color: "#00e676",
    stats: {
      toxicity: "Grade VII Neurotoxin",
      velocity: "68 km/h Sprint",
      mass: "380 kg",
      stability: "Hostile"
    },
    description: "A mutated apex predator with glowing radioactive dorsal spines, dual barbed sensory tails, and high-impact crushing jaws lined with bioluminescent venom glands.",
    containment: "Dual atmospheric negative pressure seals. Automatic neuro-suppressant mist primed on motion detection.",
    camPos: [-3.2, 2.1, -10.5],
    targetPos: [-6.9, 2.0, -10.5]
  },
  {
    id: 5,
    chamber: "CHAMBER 05",
    name: "Bioluminescent Flora",
    code: "SPECIMEN-BIO-05",
    category: "Alien Botanical Organism",
    color: "#00b0ff",
    stats: {
      sporeYield: "12 ppm/hr",
      luminescence: "480 Lux",
      height: "2.8 m",
      stability: "Dormant"
    },
    description: "An exotic alien botanical organism with spiraling fibrous tendril stalks, glowing turquoise bulb pods, and floating microscopic airborne spore particles.",
    containment: "HEPA filtration grade H14 active. Humidity maintained at steady 85% with ultraviolet misting.",
    camPos: [3.2, 2.1, 10.5],
    targetPos: [6.9, 2.0, 10.5]
  },
  {
    id: 6,
    chamber: "CHAMBER 06",
    name: "Stasis Exo-Humanoid",
    code: "SPECIMEN-CYB-06",
    category: "Cybernetic Exosuit Subject",
    color: "#00e5ff",
    stats: {
      armorRating: "Class 5 Titanium-Carbide",
      neuralState: "Induced Cryo-Sleep",
      powerDraw: "12 kW Stasis Field",
      stability: "Suspended"
    },
    description: "A human-derivative subject encased in heavy blocky motorized power armor and suspended in an electromagnetic stasis field. Its chest reactor emits a stable blue pulse.",
    containment: "Maintain stasis emitter field at 100% integrity. Do not disengage neural sedative drip.",
    camPos: [3.2, 2.1, 3.5],
    targetPos: [6.9, 2.0, 3.5]
  },
  {
    id: 7,
    chamber: "CHAMBER 07",
    name: "Void Shard Entity",
    code: "SPECIMEN-ANOM-07",
    category: "Extradimensional Rift Entity",
    color: "#b388ff",
    stats: {
      gravityFlux: "-0.4 G Local",
      radiation: "Cherenkov Violet",
      spatialDistort: "14.2 mm",
      stability: "Fluctuating"
    },
    description: "A non-Euclidean entity composed of floating matte obsidian obelisks revolving around an intensely radiant violet spatial fissure. Disrupts local gravity.",
    containment: "Triple gravitational anchor field online. Any sudden mass drop triggers immediate lockdown.",
    camPos: [3.2, 2.1, -3.5],
    targetPos: [6.9, 2.0, -3.5]
  },
  {
    id: 8,
    chamber: "CHAMBER 08",
    name: "Deep-Sea Carapace Alien",
    code: "SPECIMEN-XENO-08",
    category: "Armored Chitinous Predator",
    color: "#ff5252",
    stats: {
      clawPressure: "8,500 psi",
      armorPlating: "Layered Chitin-Silica",
      mass: "760 kg",
      stability: "Aggressive"
    },
    description: "An armored crustacean-like xenomorph featuring asymmetric crushing claws, a segmented defensive tail ridge, and four compound bioluminescent crimson eye clusters.",
    containment: "High-density reinforced steel frame with double-ply laminated acrylic viewing port.",
    camPos: [3.2, 2.1, -10.5],
    targetPos: [6.9, 2.0, -10.5]
  }
];

export const WALK_ZONES = [
  // 1. Starting Welcome Lounge & Arrival Hall
  { name: "Start_Lounge", deptId: "entrance", minX: -6.75, maxX: 6.75, minZ: 70.25, maxZ: 91.75, floorY: 1.8 },
  // Portal: Lounge to Nexus
  { name: "Portal_Lounge_Nexus", deptId: "entrance", minX: -4.0, maxX: 4.0, minZ: 68.5, maxZ: 70.5, floorY: 1.8 },

  // 2. Nexus Central Rotunda Hub
  { name: "Nexus_Rotunda", deptId: "nexus", minX: -15.75, maxX: 15.75, minZ: 40.25, maxZ: 69.75, floorY: 1.8 },

  // Portal: Nexus to Weapons Forge
  { name: "Portal_Nexus_Weapons", deptId: "weapons", minX: -4.0, maxX: 4.0, minZ: 38.5, maxZ: 40.5, floorY: 1.8 },
  // 3. Weapons Forge & Arsenal
  { name: "Weapons_Forge", deptId: "weapons", minX: -9.75, maxX: 9.75, minZ: 18.25, maxZ: 39.75, floorY: 1.8 },

  // Portal: Weapons to Creature Concourse
  { name: "Portal_Weapons_Creatures", deptId: "creatures", minX: -3.0, maxX: 3.0, minZ: 16.5, maxZ: 18.5, floorY: 1.8 },
  // 4. Creature Containment Concourse (Main Observation Hall)
  { name: "Creatures_Aisle", deptId: "creatures", minX: -4.75, maxX: 4.75, minZ: -13.75, maxZ: 17.75, floorY: 1.8 },

  // 5. Security Command Deck Platform (North Concourse)
  { name: "Control_Room", deptId: "creatures", minX: -11.75, maxX: 11.75, minZ: -17.75, maxZ: -13.75, floorY: 1.8 },

  // Portal: Command Deck West into Horror Quarantine
  { name: "Portal_Control_Horror", deptId: "horror", minX: -16.5, maxX: -11.5, minZ: -17.8, maxZ: -14.2, floorY: 1.8 },
  // 6. Horror Quarantine Sector
  { name: "Horror_Wing", deptId: "horror", minX: -37.75, maxX: -12.25, minZ: -19.75, maxZ: 9.75, floorY: 1.8 },

  // [NEW DOORWAY / 6m CORRIDOR] UGC Showroom <-> Horror Quarantine
  { name: "Portal_UGC_Horror", deptId: "horror", minX: -23.75, maxX: -20.25, minZ: 9.5, maxZ: 16.5, floorY: 1.8 },

  // Portal: Command Deck East into R&D Pipeline Lab
  { name: "Portal_Control_RND", deptId: "rnd", minX: 11.5, maxX: 14.5, minZ: -17.8, maxZ: -14.2, floorY: 1.8 },
  // 7. R&D Pipeline Lab
  { name: "RND_Tech_Wing", deptId: "rnd", minX: 14.25, maxX: 41.75, minZ: -35.75, maxZ: -2.25, floorY: 1.8 },

  // Portal: R&D South into Realistic Material Lab
  { name: "Portal_RND_Realistic", deptId: "realistic", minX: 24.0, maxX: 32.0, minZ: -2.5, maxZ: -1.5, floorY: 1.8 },
  // 8. Realistic Material Lab
  { name: "Realistic_Lab", deptId: "realistic", minX: 14.25, maxX: 41.75, minZ: -1.75, maxZ: 37.75, floorY: 1.8 },

  // [NEW DOORWAY] Realistic Material Lab <-> Props Workshop (Aligned to X=32)
  { name: "Portal_Props_Realistic", deptId: "realistic", minX: 30.0, maxX: 34.0, minZ: 37.5, maxZ: 40.5, floorY: 1.8 },

  // Portal: Nexus West into Stylized Wing (8m Grand Architectural Hallway)
  { name: "Portal_Nexus_Stylized", deptId: "stylized", minX: -24.5, maxX: -15.5, minZ: 51.5, maxZ: 58.5, floorY: 1.8 },
  // 9. Stylized & Voxel Wing (Shifted West by -8.0m)
  { name: "Stylized_Wing", deptId: "stylized", minX: -62.75, maxX: -23.5, minZ: 40.25, maxZ: 74.75, floorY: 1.8 },

  // [NEW DOORWAY] Stylized Wing <-> UGC Showroom (Aligned to X=-38)
  { name: "Portal_Stylized_UGC", deptId: "stylized", minX: -40.5, maxX: -35.5, minZ: 37.8, maxZ: 40.5, floorY: 1.8 },

  // 10. UGC Showroom
  { name: "UGC_Showroom", deptId: "ugc", minX: -47.75, maxX: -16.25, minZ: 16.0, maxZ: 37.75, floorY: 1.8 },

  // Portal: Nexus East into Props Workshop (8m Grand Architectural Hallway)
  { name: "Portal_Nexus_Props", deptId: "props", minX: 15.5, maxX: 24.5, minZ: 51.5, maxZ: 58.5, floorY: 1.8 },
  // 11. Props Workshop (Shifted East by +8.0m)
  { name: "Props_Wing", deptId: "props", minX: 23.5, maxX: 53.75, minZ: 40.25, maxZ: 71.75, floorY: 1.8 },

  // [NEW DOORWAY] Props Workshop <-> Environment Gallery
  { name: "Portal_Props_Env", deptId: "environment", minX: 53.0, maxX: 56.5, minZ: 53.8, maxZ: 58.2, floorY: 1.8 },
  // 12. Environment Gallery Viewing Catwalk & Platform (Shifted East by +8.0m)
  { name: "Environment_Catwalk", deptId: "environment", minX: 54.0, maxX: 94.0, minZ: 23.25, maxZ: 72.75, floorY: 1.8 }
];

export const WAYPOINTS = {
  entrance_exterior: { camPos: [0.0, 1.8, 84.0], targetPos: [0.0, 1.8, 65.0] },
  portfolio_nexus: { camPos: [0.0, 2.2, 64.0], targetPos: [0.0, 1.8, 55.0] },
  dept_stylized: { camPos: [-42.0, 2.2, 70.0], targetPos: [-42.0, 1.8, 57.5] },
  dept_creatures: { camPos: [0.0, 1.8, 17.8], targetPos: [0.0, 2.0, 5.0] },
  dept_props: { camPos: [31.0, 2.5, 47.0], targetPos: [39.0, 0.8, 57.0] },
  dept_weapons: { camPos: [-2.0, 2.0, 35.0], targetPos: [0.0, 1.5, 29.0] },
  dept_ugc: { camPos: [-25.0, 2.0, 32.0], targetPos: [-31.0, 1.5, 27.0] },
  dept_environment: { camPos: [60.0, 4.6, 50.0], targetPos: [74.0, 1.5, 48.0] },
  dept_realistic: { camPos: [31.0, 2.2, 35.0], targetPos: [30.0, 1.2, 23.0] },
  dept_rnd: { camPos: [20.0, 2.0, -16.0], targetPos: [28.0, 1.8, -16.0] },
  dept_horror: { camPos: [-18.0, 2.0, -16.0], targetPos: [-28.0, 1.8, -12.0] },
  dept_exit: { camPos: [-1.0, 1.8, 78.0], targetPos: [-4.8, 2.0, 78.0] }
};

export function getDepartmentById(id) {
  return DEPARTMENTS.find((d) => d.id === id) || DEPARTMENTS[0];
}

export function isInsideAnyZone(x, z) {
  for (let i = 0; i < WALK_ZONES.length; i++) {
    const b = WALK_ZONES[i];
    if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) {
      return b;
    }
  }
  return null;
}

// ==========================================================================
// Structural Pillars, Columns & Interior Obstacles Database
// ==========================================================================
export const COLLISION_OBSTACLES = [
  // 1. Portfolio Nexus - 4 Grand Structural Columns (Base radius ~1.2m)
  { name: "Nexus_Pillar_SW", type: "circle", x: -12.0, z: 65.0, radius: 1.25, deptId: "nexus" },
  { name: "Nexus_Pillar_SE", type: "circle", x:  12.0, z: 65.0, radius: 1.25, deptId: "nexus" },
  { name: "Nexus_Pillar_NW", type: "circle", x: -12.0, z: 45.0, radius: 1.25, deptId: "nexus" },
  { name: "Nexus_Pillar_NE", type: "circle", x:  12.0, z: 45.0, radius: 1.25, deptId: "nexus" },
  // Nexus Central Holo Map Plinth
  { name: "Nexus_AssetCore_Plinth", type: "circle", x: 0.0, z: 55.0, radius: 2.35, deptId: "nexus" },
  // Nexus Directory Terminals
  { name: "Nexus_Terminal_N", type: "circle", x:  0.0, z: 49.0, radius: 0.65, deptId: "nexus" },
  { name: "Nexus_Terminal_S", type: "circle", x:  0.0, z: 61.0, radius: 0.65, deptId: "nexus" },
  { name: "Nexus_Terminal_W", type: "circle", x: -6.0, z: 55.0, radius: 0.65, deptId: "nexus" },
  { name: "Nexus_Terminal_E", type: "circle", x:  6.0, z: 55.0, radius: 0.65, deptId: "nexus" },

  // 2. Creature Containment - 10 Flanking Structural Columns (Aisle bounds)
  { name: "Creature_Pillar_L1", type: "circle", x: -5.2, z:  14.0, radius: 0.65, deptId: "creatures" },
  { name: "Creature_Pillar_L2", type: "circle", x: -5.2, z:   7.0, radius: 0.65, deptId: "creatures" },
  { name: "Creature_Pillar_L3", type: "circle", x: -5.2, z:   0.0, radius: 0.65, deptId: "creatures" },
  { name: "Creature_Pillar_L4", type: "circle", x: -5.2, z:  -7.0, radius: 0.65, deptId: "creatures" },
  { name: "Creature_Pillar_L5", type: "circle", x: -5.2, z: -14.0, radius: 0.65, deptId: "creatures" },
  { name: "Creature_Pillar_R1", type: "circle", x:  5.2, z:  14.0, radius: 0.65, deptId: "creatures" },
  { name: "Creature_Pillar_R2", type: "circle", x:  5.2, z:   7.0, radius: 0.65, deptId: "creatures" },
  { name: "Creature_Pillar_R3", type: "circle", x:  5.2, z:   0.0, radius: 0.65, deptId: "creatures" },
  { name: "Creature_Pillar_R4", type: "circle", x:  5.2, z:  -7.0, radius: 0.65, deptId: "creatures" },
  { name: "Creature_Pillar_R5", type: "circle", x:  5.2, z: -14.0, radius: 0.65, deptId: "creatures" },

  // 3. Weapons Forge - Central Induction Anvil & Flanking Structural Pillars
  { name: "Weapons_Forge_Anvil", type: "circle", x: 0.0, z: 29.0, radius: 2.25, deptId: "weapons" },
  { name: "Weapons_Pillar_W1", type: "circle", x: -9.2, z: 36.0, radius: 0.60, deptId: "weapons" },
  { name: "Weapons_Pillar_W2", type: "circle", x: -9.2, z: 29.0, radius: 0.60, deptId: "weapons" },
  { name: "Weapons_Pillar_W3", type: "circle", x: -9.2, z: 22.0, radius: 0.60, deptId: "weapons" },
  { name: "Weapons_Pillar_E1", type: "circle", x:  9.2, z: 36.0, radius: 0.60, deptId: "weapons" },
  { name: "Weapons_Pillar_E2", type: "circle", x:  9.2, z: 29.0, radius: 0.60, deptId: "weapons" },
  { name: "Weapons_Pillar_E3", type: "circle", x:  9.2, z: 22.0, radius: 0.60, deptId: "weapons" },
  { name: "Weapons_Pedestal_1", type: "circle", x:  5.0, z: 34.0, radius: 0.85, deptId: "weapons" },
  { name: "Weapons_Pedestal_2", type: "circle", x:  5.0, z: 29.0, radius: 0.85, deptId: "weapons" },
  { name: "Weapons_Pedestal_3", type: "circle", x:  5.0, z: 24.0, radius: 0.85, deptId: "weapons" },

  // 4. Stylized & Voxel Wing - Grand Arch Columns & Center Display (Shifted West -8.0m)
  { name: "Stylized_Arch_Pillar_L", type: "circle", x: -47.0, z: 57.5, radius: 1.00, deptId: "stylized" },
  { name: "Stylized_Arch_Pillar_R", type: "circle", x: -37.0, z: 57.5, radius: 1.00, deptId: "stylized" },
  { name: "Stylized_HeroDisplay_Steps", type: "circle", x: -42.0, z: 57.5, radius: 2.60, deptId: "stylized" },

  // 5. Props Workshop - Turntable & Storage Racks (Shifted East +8.0m)
  { name: "Props_Turntable_Base", type: "circle", x: 39.0, z: 55.0, radius: 3.40, deptId: "props" },
  { name: "Props_StorageRack_W", type: "box", minX: 24.2, maxX: 28.8, minZ: 42.2, maxZ: 43.8, deptId: "props" },
  { name: "Props_StorageRack_E", type: "box", minX: 45.7, maxX: 50.3, minZ: 42.2, maxZ: 43.8, deptId: "props" },

  // 6. Horror Quarantine - Central Stasis Pod Core & Console
  { name: "Horror_CorePod_Base", type: "circle", x: -28.0, z: -8.0, radius: 2.15, deptId: "horror" },
  { name: "Horror_Console", type: "box", minX: -28.7, maxX: -27.3, minZ: -4.8, maxZ: -4.2, deptId: "horror" },

  // 7. Realistic Material Lab - Calibration Turntable & Relocated Map Wall (East flank, doorway 100% open)
  { name: "Realistic_Cyc_Turntable", type: "circle", x: 31.0, z: 18.5, radius: 1.55, deptId: "realistic" },
  { name: "Realistic_TextureMap_Wall", type: "box", minX: 37.8, maxX: 38.2, minZ: 18.0, maxZ: 26.0, deptId: "realistic" },

  // 8. UGC Showroom - Center Vitrine & Exhibition Stands
  { name: "UGC_Center_Vitrine", type: "circle", x: -31.0, z: 27.0, radius: 0.95, deptId: "ugc" },
  { name: "UGC_TryOn_Kiosk_1", type: "box", minX: -35.4, maxX: -34.6, minZ: 36.2, maxZ: 36.8, deptId: "ugc" },
  { name: "UGC_TryOn_Kiosk_2", type: "box", minX: -27.4, maxX: -26.6, minZ: 36.2, maxZ: 36.8, deptId: "ugc" },

  // 9. Welcome Lounge - Security Checkpoint Arch Posts & Hero Maquette (Relocated to East Flank, central axis 100% open)
  { name: "Welcome_SecurityPost_L", type: "circle", x: -1.8, z: 73.0, radius: 0.35, deptId: "entrance" },
  { name: "Welcome_SecurityPost_R", type: "circle", x:  1.8, z: 73.0, radius: 0.35, deptId: "entrance" },
  { name: "Welcome_Hero_Maquette", type: "circle", x: 4.2, z: 78.5, radius: 1.75, deptId: "entrance" },
  { name: "Exit_Contact_Podium", type: "box", minX: -3.6, maxX: -2.8, minZ: 77.3, maxZ: 78.7, deptId: "entrance" },
  { name: "Welcome_Portal_Jamb_L", type: "box", minX: -6.5, maxX: -4.0, minZ: 69.8, maxZ: 70.4, deptId: "entrance" },
  { name: "Welcome_Portal_Jamb_R", type: "box", minX:  4.0, maxX:  6.5, minZ: 69.8, maxZ: 70.4, deptId: "entrance" },

  // 10. Center Concourse & Additional Hero Model Plinths
  { name: "Creature_Hero_StasisBase", type: "circle", x: 0.0, z: 0.0, radius: 1.85, deptId: "creatures" },
  { name: "RND_Hero_ExplodedPlinth", type: "circle", x: 28.0, z: -19.5, radius: 2.50, deptId: "rnd" },
  { name: "Env_Hero_BiosphereDiorama", type: "circle", x: 74.0, z: 48.0, radius: 3.30, deptId: "environment" }
];

export function resolveObstacleCollision(x, z, playerRadius = 0.25) {
  let resolvedX = x;
  let resolvedZ = z;
  let hasCollided = false;

  for (let i = 0; i < COLLISION_OBSTACLES.length; i++) {
    const obs = COLLISION_OBSTACLES[i];
    if (obs.type === 'circle') {
      const dx = resolvedX - obs.x;
      const dz = resolvedZ - obs.z;
      const distSq = dx * dx + dz * dz;
      const minDist = obs.radius + playerRadius;
      if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.0001) {
          resolvedX = obs.x + (dx / dist) * minDist;
          resolvedZ = obs.z + (dz / dist) * minDist;
        } else {
          resolvedZ = obs.z + minDist;
        }
        hasCollided = true;
      }
    } else if (obs.type === 'box') {
      const minX = obs.minX - playerRadius;
      const maxX = obs.maxX + playerRadius;
      const minZ = obs.minZ - playerRadius;
      const maxZ = obs.maxZ + playerRadius;
      if (resolvedX > minX && resolvedX < maxX && resolvedZ > minZ && resolvedZ < maxZ) {
        const dLeft = resolvedX - minX;
        const dRight = maxX - resolvedX;
        const dTop = resolvedZ - minZ;
        const dBottom = maxZ - resolvedZ;
        const minEdge = Math.min(dLeft, dRight, dTop, dBottom);
        if (minEdge === dLeft) resolvedX = minX;
        else if (minEdge === dRight) resolvedX = maxX;
        else if (minEdge === dTop) resolvedZ = minZ;
        else resolvedZ = maxZ;
        hasCollided = true;
      }
    }
  }

  return { x: resolvedX, z: resolvedZ, collided: hasCollided };
}

