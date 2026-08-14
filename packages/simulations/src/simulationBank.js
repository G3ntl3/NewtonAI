/**
 * Simulation Bank — AI-facing metadata for each simulation, keyed by the
 * same simulationId used in registry.js. Pure data, deliberately kept free
 * of any React/.jsx import: registry.js statically imports each sim's
 * .jsx Component, which plain `node` (no bundler) cannot load — anything
 * that only needs to REASON about which sim fits a concept (PromptBuilder,
 * and the plain-node adversarial suite that exercises it) must be able to
 * import metadata without dragging in the component tree. registry.js
 * imports this file and merges each entry with its Component + paramSchema
 * — that merged registry.js entry remains the single source of truth for
 * anything (e.g. SimulationBlock) that needs the full picture.
 *
 * Fields per sim:
 *   title       - human name shown in prompt text.
 *   explainer   - STUDENT-FACING, unlike the rest of this file: a short
 *                 plain-language note on the concept the simulation is
 *                 teaching. Rendered under the sim by SimulationBlock, so it
 *                 shows everywhere a sim appears (chat and the Lab) without
 *                 each component repeating it. Never sent to the model.
 *   subject     - one of physics/chemistry/biology/maths (packages/database's
 *                 SUBJECTS enum) — used by the Lab catalog to group/filter
 *                 cards. Not read by PromptBuilder or the registry.
 *   concepts    - lowercase keyword(s) matched as a substring of the
 *                 concept title to decide whether this sim is relevant.
 *   fits        - plain-language description (incl. the fit test) of what
 *                 problems this sim CAN model.
 *   doesNotFit  - what it CANNOT model.
 *   paramHints  - how to map a stated problem to this sim's params.
 */
export const simulationBank = {
  'projectile-motion': {
    title: 'Projectile Motion',
    explainer:
      'When you launch something at an angle, two things happen at once and independently: it keeps moving forward at a steady speed, while gravity pulls it downward. Combining those two motions is what bends the path into an arc — and why the launch angle and speed together decide how far and how high it goes.',
    subject: 'physics',
    concepts: ['projectile', 'trajectory', 'projectile motion'],
    fits:
      'The projectile-motion simulation models ONLY a projectile launched from GROUND LEVEL at an angle, and shows RANGE and MAX HEIGHT — nothing else. Emit it when: the problem is a projectile launched from the ground at an angle (including horizontal, angle=0), asking for range, max height, or a general exploration of how angle/speed affect the trajectory. Fit test: "Can this exact problem be represented by a ground-launched arc described only by angle and speed, where the answer is visible as range or height?" If yes, emit.',
    doesNotFit:
      'It has no concept of launch height (a cliff, building, table) and no readout for time-to-fall, time of flight, or final/impact velocity. Do NOT emit it when: the problem states a launch HEIGHT (thrown from a cliff, building, table, or anywhere above the ground), OR asks for a quantity the sim cannot show (time to fall, time of flight, final velocity, impact speed).',
    paramHints:
      'Params: angle (0-90 degrees), speed (0-50 m/s). Map from the student\'s stated problem PRECISELY — never ignore a value they actually gave, and never substitute an arbitrary number: "thrown horizontally at 15 m/s" -> angle: 0, speed: 15; "kicked at 30 degrees at 20 m/s" -> angle: 30, speed: 20; "thrown at 40 degrees at 25 m/s" -> angle: 40, speed: 25. A stated angle or speed always overrides any default. Only fall back to a sensible default (e.g. angle: 45, speed: 20) for a value the student did NOT specify at all.',
  },
  'graph-explorer': {
    title: 'Graph Explorer',
    explainer:
      'A straight-line equation y = mx + c describes a relationship between two quantities. The slope m sets how steeply the line rises or falls, and the intercept c sets where it crosses the y-axis. Changing one at a time shows exactly which part of the equation controls which part of the picture.',
    subject: 'maths',
    concepts: [
      'linear equation',
      'linear graph',
      'straight line',
      'slope',
      'gradient',
      'y = mx',
      'graphing lines',
      'equation of a line',
    ],
    fits:
      'The graph-explorer simulation plots and lets the student explore a straight line y = mx + c, and how changing the slope (m) or intercept (c) changes it. Fit test: does this problem come down to plotting or exploring a single straight line and how its slope/intercept behave? If yes, emit.',
    doesNotFit:
      'It draws straight lines only — it cannot model quadratics, parabolas, curves, or any non-linear/curved graph, and it does no expression parsing beyond y = mx + c. Do NOT emit it for any curved or non-linear graph, or a problem needing more than a single straight line.',
    paramHints:
      'Params: m (slope, -10 to 10), c (y-intercept, -10 to 10). m is slope, c is intercept — use the stated values from the equation. A stated m or c always overrides any default; only default a value the student did NOT specify at all.',
  },
  'quadratic-explorer': {
    title: 'Quadratic Explorer',
    explainer:
      'Because x is squared, a quadratic draws a curve called a parabola instead of a straight line. The coefficient a decides how narrow or wide that curve is and whether it opens upward or downward, while b and c slide it around the grid. The lowest or highest point of the curve is its vertex.',
    subject: 'maths',
    concepts: [
      'quadratic',
      'quadratic equation',
      'quadratic graph',
      'quadratic function',
      'parabola',
      'parabolic',
      'y = ax^2',
      'y = ax2',
    ],
    fits:
      'The quadratic-explorer simulation plots and lets the student explore a parabola y = ax^2 + bx + c, and how changing the coefficients a, b, c change its shape and position. Fit test: does this problem come down to plotting or exploring a single parabola and how its coefficients behave? If yes, emit.',
    doesNotFit:
      'It draws a single parabola only — it cannot model plain straight lines (that is graph-explorer\'s job), cubics or any higher-order polynomial, trig graphs, or anything needing expression parsing beyond y = ax^2 + bx + c. Do NOT emit it for a linear (straight-line) question — use graph-explorer for that instead.',
    paramHints:
      'Params: a (quadratic coefficient, -5 to 5), b (linear coefficient, -10 to 10), c (constant term, -10 to 10). a, b, c are the coefficients of ax^2 + bx + c; read them from the stated equation. A stated a, b, or c always overrides any default; only default a value the student did NOT specify at all.',
  },
  'ohms-law': {
    title: "Ohm's Law",
    explainer:
      'Voltage is the push that drives charge around a circuit, and resistance is what holds that flow back. The current you actually get is the balance between them: I = V / R. Increase the voltage and more current flows; increase the resistance and less does.',
    subject: 'physics',
    concepts: [
      "ohm's law",
      'ohms law',
      'current',
      'voltage',
      'resistance',
      'simple circuit',
      'series circuit',
      'i=v/r',
      'i = v/r',
    ],
    fits:
      'The ohms-law simulation models a single simple series circuit — one battery, one resistor — relating voltage, current, and resistance via I = V/R, and lets the student explore how changing the source voltage or the resistance changes the current. Fit test: does this problem come down to a single source and a single resistance, where the answer is the current (or how current responds to changing V or R)? If yes, emit.',
    doesNotFit:
      'It models exactly one battery and one resistor in a single loop — it cannot model series or parallel combinations of multiple resistors/components, power or energy calculations, capacitors, inductors, non-ohmic components, or any multi-loop circuit. Do NOT emit it for any of those — teach them Socratically with words instead.',
    paramHints:
      'Params: voltage (source EMF, volts, 1-24), resistance (ohms, 0.5-50). Current is DERIVED (I = V/R) — never a param, never set it yourself. Read stated voltage/resistance values from the problem; a stated value always overrides any default; only default a value the student did NOT specify at all.',
  },
  'gas-laws': {
    title: 'Gas Laws',
    explainer:
      'A fixed amount of gas has three linked properties: pressure, volume and temperature. Hold one of them steady and the other two can only change together, in a fixed way. That is all Boyle\'s, Charles\'s and Gay-Lussac\'s laws are — the same underlying relationship seen from three different angles, depending on which property you keep constant.',
    concepts: [
      "boyle's law",
      'boyles law',
      "charles's law",
      'charles law',
      "gay-lussac's law",
      'gay-lussac',
      'gay lussac',
      'gas law',
      'gas laws',
      'ideal gas',
      'pressure and volume',
      'pressure volume temperature',
    ],
    fits:
      'The gas-laws simulation models a fixed amount of gas with ONE variable held constant, selected by the "mode" param: constant temperature (Boyle\'s Law, P1V1 = P2V2), constant pressure (Charles\'s Law, V1/T1 = V2/T2), or constant volume (Gay-Lussac\'s Law, P1/T1 = P2/T2). It lets the student vary the two remaining quantities and watch the third relationship hold. Fit test: does this problem hold one of pressure, volume, or temperature CONSTANT while the other two change? If yes, emit with the matching mode.',
    doesNotFit:
      'It always holds exactly one variable constant for a fixed amount of gas — it cannot model problems where all three of pressure, volume and temperature change at once with nothing held constant, nor gas mixtures, partial pressures, moles/molar-mass or stoichiometry calculations, diffusion, or real (non-ideal) gas behaviour. Do NOT emit it for any of those — teach them Socratically with words instead.',
    paramHints:
      'Params: mode ("constant-temperature" | "constant-pressure" | "constant-volume"), pressure (atm, 0.5-10), volume (L, 1-20), temperature (K, 200-500). FIRST identify which quantity the problem states is held constant and pick the matching mode: "at constant temperature"/"isothermal" -> constant-temperature; "at constant pressure" -> constant-pressure; "in a rigid/sealed container of fixed volume" -> constant-volume. Then read the other two stated values from the problem into their params. A stated value always overrides any default; only default a value the student did NOT specify at all. Temperature must be in KELVIN — convert if the problem gives Celsius (K = degreesC + 273).',
  },
  'diffusion-osmosis': {
    title: 'Diffusion & Osmosis',
    explainer:
      'Particles are always moving, so they drift from where they are crowded to where they are sparse until they are evenly spread. That difference in crowding is a concentration gradient, and no energy is needed to move down it. Diffusion is particles spreading through open space; osmosis is the same idea but with water crossing a membrane that the solute cannot pass through.',
    concepts: [
      'diffusion',
      'osmosis',
      'concentration gradient',
      'particle movement',
      'cell membrane',
      'semi-permeable membrane',
      'solute',
      'solvent',
      'passive transport',
    ],
    fits:
      'The diffusion-osmosis simulation models PASSIVE particle movement down a concentration gradient, in one of two modes. Use mode "diffusion" for particles spreading through an open space with NO barrier — ink spreading in water, perfume or a smell spreading across a room, a gas filling a container. Use mode "osmosis" for WATER moving across a semi-permeable membrane between two different concentrations — a cell in salt water, a potato strip in sugar solution, red blood cells swelling or shrinking. Fit test: is this a substance spreading, or water crossing a membrane, purely because of a concentration difference and with no energy input? If yes, emit with the matching mode.',
    doesNotFit:
      'It models PASSIVE movement only — movement driven purely by the concentration gradient. It cannot model active transport or anything requiring energy/ATP (e.g. the sodium-potassium pump, moving a substance AGAINST its gradient), facilitated diffusion that depends on specific carrier or channel proteins, or the molecular structure of the membrane itself. Do NOT emit it for any of those — teach them Socratically with words instead.',
    paramHints:
      'Params: mode ("diffusion" | "osmosis"), particleCount (10-80), initialConcentrationDifference (0-1). Pick "osmosis" whenever a membrane, cell wall, or two separated solutions of different concentration are mentioned; pick "diffusion" when a substance simply spreads through open space with no barrier. particleCount is presentational — leave it at the default unless the problem names a specific number of particles. Set initialConcentrationDifference high (around 0.8) for a stark starting gradient like "a drop of ink" or "much saltier outside the cell", and lower when the two sides start closer together.',
  },
  titration: {
    title: 'Acid-Base Titration',
    concepts: [
      'titration',
      'titrate',
      'acid-base titration',
      'ph curve',
      'titration curve',
      'equivalence point',
      'end point',
      'endpoint',
      'buffer',
      'buffer solution',
      'weak acid',
      'strong acid',
      'weak base',
      'strong base',
      'indicator',
      'neutralisation',
      'neutralization',
    ],
    fits:
      'The titration simulation runs a full acid-base titration: a burette delivers a strong base into a measured volume of acid in a flask, showing the live pH, a pH-versus-volume curve, an indicator endpoint, and a rough/1st/2nd/3rd readings table with an average titre. It covers BOTH a strong acid (sharp jump, equivalence at pH 7) and a weak acid via its Ka (a flat buffer region, pH = pKa at half-equivalence, and a smaller jump to an equivalence point ABOVE pH 7). Fit test: is this an acid-base neutralisation where concentration or volume is found by titration, or an exploration of the shape of a pH curve? If yes, emit.',
    doesNotFit:
      'It models ACID-BASE titration in water only. It cannot model redox titrations (e.g. potassium manganate(VII) against iron(II)), precipitation or complexometric titrations, non-aqueous solvents, or the specific colour-change chemistry of a named indicator beyond a generic endpoint pH. It also does not do the stoichiometry of anything other than a 1:1 acid-base reaction. Do NOT emit it for any of those — teach them Socratically with words instead.',
    paramHints:
      'Params: acidConcentration (mol/L), acidVolumeMl (mL in the flask), baseConcentration (mol/L in the burette), ka (OPTIONAL), endpointPh. Read the stated concentrations and volumes straight from the problem. CRITICAL — ka decides strong vs weak: OMIT ka entirely for a strong acid (hydrochloric, nitric, sulfuric); supply ka ONLY when the problem names a weak acid, using its real value (ethanoic/acetic 1.8e-5, methanoic/formic 1.8e-4, carbonic 4.3e-7, hydrofluoric 6.8e-4). ka must lie between 1e-14 and 1e-1 — never invent a value outside that range. Leave endpointPh at its default (8.2, phenolphthalein) unless the problem names a different indicator.',
  },
};

export default simulationBank;
