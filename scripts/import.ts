import fs from "fs";
import csv from "csv-parser";
import path from "node:path";
import { prisma } from "@/lib/prisma";

// Regex définies dans les SPECS.md pour le D+
// Ex: "2800D+", "1000m D+", "500 d+"
const REGEX_DPLUS = /(\d+)\s*(?:m\s*)?d\+/i;

// Regex simple pour la distance (ex: "42km", "10 km")
const REGEX_DIST = /(\d+(?:[.,]\d+)?)\s*km/i;

async function main() {
  const results: any[] = [];
  const filePath = path.join(__dirname, "data.csv"); // Assurez-vous d'avoir ce fichier

  console.log(`📂 Lecture du fichier : ${filePath}`);

  // 1. Lecture du CSV en stream
  fs.createReadStream(filePath)
    .pipe(csv({ separator: ";" })) // Le séparateur dépend souvent du CSV source (arrêtez-vous sur ',' ou ';')
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      console.log(`📊 ${results.length} lignes trouvées. Début du traitement...`);

      for (const row of results) {
        await processRow(row);
      }

      console.log("✅ Import terminé !");
      await prisma.$disconnect();
    });
}

async function processRow(row: any) {
  // Adaptation selon les colonnes réelles de data.gouv (souvent variables)
  // On suppose ici des colonnes standards pour l'exemple
  const name = row.nom_course || row.Nom || "Course Inconnue";
  const city = row.ville || row.Commune || "Inconnue";
  const dateStr = row.date || "2026-01-01";

  // Génération d'un ID externe stable (ou utilisation de l'ID source si dispo)
  const externalId =
    row.id_externe || `import_${name.replaceAll(/\s+/g, "_").toLowerCase()}_${dateStr}`;

  // --- LOGIQUE D'EXTRACTION INTELLIGENTE (ETL) ---

  // 1. Détection du Dénivelé (D+) via Regex sur le nom
  let extractedDplus = 0;
  const matchDplus = name.match(REGEX_DPLUS);
  if (matchDplus) {
    extractedDplus = Number.parseInt(matchDplus[1], 10);
    // console.log(`🏔️ D+ détecté pour "${name}" : ${extractedDplus}m`);
  }

  // 2. Détection de la Distance via Regex (si pas de colonne explicite)
  let extractedKm = 0;
  const matchDist = name.match(REGEX_DIST);
  if (matchDist) {
    extractedKm = Number.parseFloat(matchDist[1].replace(",", "."));
  }

  // Valeurs par défaut ou issues des colonnes CSV si elles existent
  const minKm = row.distance ? Number.parseFloat(row.distance) : extractedKm;
  const maxKm = minKm; // Pour l'instant on considère distance unique par ligne

  // --- GÉOLOCALISATION ---
  // Idéalement, le CSV contient déjà lat/lng. Sinon, il faudrait appeler l'API Adresse.
  // Ici on simule ou on prend les colonnes existantes.
  const lat = row.latitude ? Number.parseFloat(row.latitude) : 0;
  const lng = row.longitude ? Number.parseFloat(row.longitude) : 0;

  if (lat === 0 || lng === 0) {
    // console.warn(`⚠️ Pas de coordonnées pour ${name}, ignoré.`);
    return; // On saute les lignes sans GPS pour le MVP
  }

  // --- SAUVEGARDE (UPSERT) ---
  try {
    // Note: On utilise executeRaw pour le POINT PostGIS car Prisma create ne gère pas encore bien le type Geography pur
    // Mais pour l'upsert complet avec des types complexes, on peut mixer Prisma et Raw,
    // ou ici simplifier en utilisant prisma.race.upsert SI on avait le support natif.
    // Avec Unsupported, le plus propre en script one-shot est souvent une requête RAW directe pour l'insertion spatiale.

    await prisma.$executeRaw`
      INSERT INTO "Race" (
        external_id, name, date, city, location, types, 
        min_km, max_km, min_dplus, max_dplus, raw_distances, source
      )
      VALUES (
        ${externalId}, 
        ${name}, 
        ${new Date(dateStr)}, 
        ${city}, 
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, 
        ARRAY['trail']::text[], -- Par défaut, à affiner selon logique
        ${minKm}, 
        ${maxKm}, 
        ${extractedDplus}, 
        ${extractedDplus}, 
        '[]'::jsonb, 
        'data.gouv.import'
      )
      ON CONFLICT (external_id) DO UPDATE SET
        min_dplus = EXCLUDED.min_dplus,
        max_dplus = EXCLUDED.max_dplus,
        min_km = EXCLUDED.min_km,
        max_km = EXCLUDED.max_km;
    `;

    process.stdout.write("."); // Feedback visuel
  } catch (e) {
    console.error(`\nErreur sur ${name}:`, e);
  }
}

main().catch((e) => console.error(e));
