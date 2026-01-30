import { prisma } from "@/lib/prisma";

async function main() {
  // Nettoyage
  await prisma.$executeRaw`TRUNCATE TABLE "Race" RESTART IDENTITY`;

  // 1. Course sur route (Paris) - Plat
  // Utilisation de ST_MakePoint(lng, lat)
  await prisma.$executeRaw`
    INSERT INTO "Race" (external_id, name, date, city, location, types, min_km, max_km, min_dplus, max_dplus, raw_distances, url, source)
    VALUES (
      'run_paris_1', 
      'Marathon de Paris', 
      '2026-04-05 08:00:00', 
      'Paris', 
      ST_SetSRID(ST_MakePoint(2.3522, 48.8566), 4326), 
      ARRAY['road', 'marathon'], 
      42.195, 
      42.195, 
      100, 
      100, 
      '[{"km": 42.195, "dplus": 100}]'::jsonb, 
      'https://schneiderelectricparismarathon.com', 
      'manual'
    );
  `;

  // 2. Trail de Montagne (Chamonix) - Gros D+
  await prisma.$executeRaw`
    INSERT INTO "Race" (external_id, name, date, city, location, types, min_km, max_km, min_dplus, max_dplus, raw_distances, url, source)
    VALUES (
      'trail_mb_1', 
      'Ultra-Trail du Mont-Blanc', 
      '2026-08-28 18:00:00', 
      'Chamonix', 
      ST_SetSRID(ST_MakePoint(6.8694, 45.9237), 4326), 
      ARRAY['trail', 'ultra'], 
      170.0, 
      170.0, 
      10000, 
      10000, 
      '[{"km": 170, "dplus": 10000}]'::jsonb, 
      'https://montblanc.utmb.world', 
      'manual'
    );
  `;

  console.log("Seed terminé : 2 courses insérées (1 Route, 1 Trail).");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
