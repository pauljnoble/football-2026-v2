import type { FormationData } from '../types';

const formations: FormationData = [
    {
        name: '4-3-3',
        positions: [
            // GK
            { x: -0.45, y: 0, z: 0 },

            // Back 4
            { x: -0.24, y: 0, z: -0.38 },
            { x: -0.24, y: 0, z: -0.13 },
            { x: -0.24, y: 0, z: 0.13 },
            { x: -0.24, y: 0, z: 0.38 },

            // Midfield 3
            { x: 0.0, y: 0, z: -0.22 },
            { x: 0.04, y: 0, z: 0 },
            { x: 0.0, y: 0, z: 0.22 },

            // Front 3
            { x: 0.28, y: 0, z: -0.3 },
            { x: 0.34, y: 0, z: 0 },
            { x: 0.28, y: 0, z: 0.3 },
        ],
    },
    {
        name: '4-4-2',
        positions: [
            // GK
            { x: -0.55, y: 0, z: 0 },

            // Back 4
            { x: -0.30, y: 0, z: -0.36 },
            { x: -0.25, y: 0, z: -0.12 },
            { x: -0.25, y: 0, z: 0.12 },
            { x: -0.30, y: 0, z: 0.36 },

            // Midfield 4
            { x: 0.0, y: 0, z: -0.36 },
            { x: 0.05, y: 0, z: -0.12 },
            { x: 0.05, y: 0, z: 0.12 },
            { x: 0.0, y: 0, z: 0.36 },

            // Front 2
            { x: 0.33, y: 0, z: -0.14 },
            { x: 0.33, y: 0, z: 0.14 },
        ],
    }
];

export default formations;