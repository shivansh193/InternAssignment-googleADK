 // src/tools/physicsTools.ts
 import { Tool } from '../types';
  
 export const physicsConstants: Tool = {
   name: 'physicsConstants',
   description: 'Look up fundamental physics constants',
   parameters: {
     constant: {
       type: 'string',
       description: 'Name of the physics constant to look up'
     }
   },
   execute: async (params: { constant: string }) => {
     const constants: Record<string, { value: number; unit: string; description: string }> = {
       'speed_of_light': {
         value: 299792458,
         unit: 'm/s',
         description: 'Speed of light in vacuum'
       },
       'gravitational_constant': {
         value: 6.67430e-11,
         unit: 'm³/(kg⋅s²)',
         description: 'Gravitational constant'
       },
       'planck_constant': {
         value: 6.62607015e-34,
         unit: 'J⋅s',
         description: 'Planck constant'
       },
       'electron_mass': {
         value: 9.1093837015e-31,
         unit: 'kg',
         description: 'Electron rest mass'
       },
       'proton_mass': {
         value: 1.67262192369e-27,
         unit: 'kg',
         description: 'Proton rest mass'
       },
       'avogadro_number': {
         value: 6.02214076e23,
         unit: 'mol⁻¹',
         description: 'Avogadro constant'
       }
     };
 
     const key = params.constant.toLowerCase().replace(/\s+/g, '_');
     const constant = constants[key];
     
     if (!constant) {
       const available = Object.keys(constants).map(k => k.replace(/_/g, ' ')).join(', ');
       throw new Error(`Constant not found. Available constants: ${available}`);
     }
 
     return {
       name: params.constant,
       value: constant.value,
       unit: constant.unit,
       description: constant.description,
       scientificNotation: constant.value.toExponential()
     };
   }
 };
 
 export const forceCalculator: Tool = {
   name: 'forceCalculator',
   description: 'Calculate force using F = ma',
   parameters: {
     mass: { type: 'number', description: 'Mass in kilograms' },
     acceleration: { type: 'number', description: 'Acceleration in m/s²' }
   },
   execute: async (params: { mass: number; acceleration: number }) => {
     const force = params.mass * params.acceleration;
     
     return {
       force,
       unit: 'N (Newtons)',
       calculation: `F = ma = ${params.mass} kg × ${params.acceleration} m/s² = ${force} N`,
       components: {
         mass: params.mass,
         acceleration: params.acceleration
       }
     };
   }
 };
 