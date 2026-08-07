/**
 * Simulation Registry
 * Maps simulationId -> { Component, paramSchema, ...AI-facing metadata }.
 * Single lookup point used by SimulationBlock. The AI selects an id +
 * params; this is the only place that resolves an id to a trusted,
 * pre-built component — never AI-generated rendering logic (blueprint
 * §4.3). Each entry merges its Component + paramSchema with the plain-data
 * metadata from simulationBank.js (title/concepts/fits/doesNotFit/
 * paramHints) — PromptBuilder reads that bank directly (not this file) so
 * it never has to import the .jsx component tree; this file remains the
 * single merged source of truth for anything that needs the full picture.
 *
 * ProjectileMotion, GraphExplorer, QuadraticExplorer, and OhmsLaw are wired
 * so far — the other two simulation folders stay unimplemented placeholders
 * until their own task.
 */
import ProjectileMotion from './ProjectileMotion/ProjectileMotion.jsx';
import projectileMotionParamSchema from './ProjectileMotion/paramSchema.js';
import GraphExplorer from './GraphExplorer/GraphExplorer.jsx';
import graphExplorerParamSchema from './GraphExplorer/paramSchema.js';
import QuadraticExplorer from './QuadraticExplorer/QuadraticExplorer.jsx';
import quadraticExplorerParamSchema from './QuadraticExplorer/paramSchema.js';
import OhmsLaw from './OhmsLaw/OhmsLaw.jsx';
import ohmsLawParamSchema from './OhmsLaw/paramSchema.js';
import { simulationBank } from './simulationBank.js';

export const registry = {
  'projectile-motion': {
    Component: ProjectileMotion,
    paramSchema: projectileMotionParamSchema,
    ...simulationBank['projectile-motion'],
  },
  'graph-explorer': {
    Component: GraphExplorer,
    paramSchema: graphExplorerParamSchema,
    ...simulationBank['graph-explorer'],
  },
  'quadratic-explorer': {
    Component: QuadraticExplorer,
    paramSchema: quadraticExplorerParamSchema,
    ...simulationBank['quadratic-explorer'],
  },
  'ohms-law': {
    Component: OhmsLaw,
    paramSchema: ohmsLawParamSchema,
    ...simulationBank['ohms-law'],
  },
};

export default registry;
