export interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number]; // [Longitude, Latitude]
}

export interface Race {
  id: number;
  external_id: string;
  name: string;
  date: string; // Les dates arrivent en string via JSON
  city: string;

  // Important : Ici on type location comme un objet GeoJSON, pas comme le type brut Prisma
  location: GeoJSONPoint;

  types: string[];
  min_km: number; // Prisma Decimal devient string ou number via API, ici number pour le front
  max_km: number;
  min_dplus: number | null;
  max_dplus: number | null;

  url: string | null;
  source: string | null;

  // Champ ajouté par notre requête SQL brute
  dist: number;
}
