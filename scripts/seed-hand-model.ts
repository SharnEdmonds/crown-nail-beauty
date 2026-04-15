import { createClient } from '@sanity/client';
import { config } from 'dotenv';

config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-31',
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

async function run() {
  const doc = {
    _id: 'handModel',
    _type: 'handModel',
    idleRotationSpeed: 0.15,
    idleWobbleAmount: 0.02,
    idleWobbleSpeed: 0.25,
    scale: 2.5,
    color: '#e8beac',
    roughness: 0.7,
    metalness: 0.1,
    desktopStartPosition: { x: 2, y: -1, z: 0 },
    desktopStartRotation: { x: 0, y: -0.5, z: 0 },
    desktopEndPosition: { x: 9, y: -1, z: -4 },
    desktopEndRotation: { x: 0.1, y: Math.PI * 0.5, z: -0.1 },
    mobileStartPosition: { x: 0, y: -2, z: -2 },
    mobileStartRotation: { x: 0, y: -0.5, z: 0 },
    mobileEndPosition: { x: 4, y: -2, z: -4 },
    mobileEndRotation: { x: 0.1, y: Math.PI * 0.5, z: -0.1 },
  };
  await client.createIfNotExists(doc as never);
  console.log('handModel seeded.');
}

run().catch((e) => { console.error(e); process.exit(1); });
