import { Race } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Type de retour enrichi avec la distance calculée par PostGIS
type RaceWithDistance = Race & {
  dist: number; // Distance en mètres
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // 1. Extraction et validation des paramètres
  const lat = Number.parseFloat(searchParams.get("lat") || "");
  const lng = Number.parseFloat(searchParams.get("lng") || "");
  const radiusKm = Number.parseFloat(searchParams.get("radius") || "50"); // Rayon par défaut 50km

  // Filtres optionnels
  const typesParam = searchParams.get("types"); // ex: "trail,marathon"
  const types = typesParam ? typesParam.split(",") : [];

  const minKm = Number.parseFloat(searchParams.get("min_km") || "0");
  const maxKm = Number.parseFloat(searchParams.get("max_km") || "1000");
  const minDplus = Number.parseInt(searchParams.get("min_dplus") || "0");

  // Validation basique
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "Latitude and Longitude are required" }, { status: 400 });
  }

  try {
    // 2. Requête SQL Spatiale (Raw Query)
    // ST_DWithin : Filtre les points dans le rayon (très performant via index GIST)
    // ST_Distance : Calcule la distance exacte pour l'affichage et le tri
    // ::geography : Cast explicite pour s'assurer que PostGIS traite ça comme des coordonnées GPS

    // Note : Prisma gère automatiquement l'échappement des variables via ${...}
    const races = await prisma.$queryRaw<RaceWithDistance[]>`
      SELECT 
        id, external_id, name, date, city, types, min_km, max_km, min_dplus, max_dplus, raw_distances, url, source,

        -- 👇 AJOUT IMPORTANT : On récupère la géométrie au format JSON
        ST_AsGeoJSON(location)::json as location,

        ST_Distance(location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) as dist
      FROM "Race"
      WHERE 
        -- Filtre Spatial (Rayon)
        ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusKm * 1000} -- Conversion km -> mètres
        )
        
        -- Filtre Distance de course (Chevauchement de plages)
        -- On veut que la plage [min_km, max_km] de la course croise la recherche utilisateur
        AND (max_km >= ${minKm} AND min_km <= ${maxKm})
        
        -- Filtre Dénivelé (Optionnel)
        AND (max_dplus >= ${minDplus} OR ${minDplus} = 0)
        
        -- Filtre Types (Si spécifiés)
        -- L'opérateur && vérifie si les tableaux ont des éléments en commun (overlap)
        AND (${types.length > 0}::boolean IS FALSE OR types && ${types}::text[])
        
      ORDER BY dist ASC
      LIMIT 100;
    `;

    // 3. Post-traitement (Optionnel : formatage)
    // Prisma retourne les BigInt (s'il y en a) sous forme non sérialisable,
    // mais ici nos types sont standards.

    return NextResponse.json(races);
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
