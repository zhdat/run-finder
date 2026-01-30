"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Race } from "./types";

// Import dynamique de la carte (Client Side Only)
const Map = dynamic(() => import("@/app/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      Chargement de la carte...
    </div>
  ),
});

export default function Home() {
  // --- ÉTATS (State) ---
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(false);

  // Position (Défaut: Paris)
  const [userLat, setUserLat] = useState(48.8566);
  const [userLng, setUserLng] = useState(2.3522);

  // Filtres
  const [radius, setRadius] = useState(50); // km
  const [minDplus, setMinDplus] = useState(0); // mètres
  const [minKm, setMinKm] = useState(0);
  const [maxKm, setMaxKm] = useState(200);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // --- LOGIQUE API ---
  const fetchRaces = useCallback(async () => {
    setLoading(true);
    try {
      // Construction de l'URL avec Query Params
      const params = new URLSearchParams({
        lat: userLat.toString(),
        lng: userLng.toString(),
        radius: radius.toString(),
        min_km: minKm.toString(),
        max_km: maxKm.toString(),
        min_dplus: minDplus.toString(),
      });

      if (selectedTypes.length > 0) {
        params.append("types", selectedTypes.join(","));
      }

      const res = await fetch(`/api/races/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRaces(data);
      }
    } catch (error) {
      console.error("Erreur fetch:", error);
    } finally {
      setLoading(false);
    }
  }, [userLat, userLng, radius, minKm, maxKm, minDplus, selectedTypes]);

  // Chargement initial + Reload quand les filtres changent
  // (Note: Pour optimiser, on pourrait ajouter un bouton "Rechercher" au lieu de l'effet automatique)
  useEffect(() => {
    // Petit debounce pour éviter de spammer l'API pendant qu'on glisse les sliders
    const timer = setTimeout(() => {
      fetchRaces();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchRaces]);

  // Fonction Geolocation "Autour de moi"
  const handleLocateMe = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
      });
    } else {
      alert("Géolocalisation non supportée par ce navigateur.");
    }
  };

  // Gestion des Checkboxes Types
  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  return (
    <main className="flex h-screen flex-col md:flex-row bg-gray-50">
      {/* SIDEBAR FILTRES */}
      <aside className="w-full md:w-80 bg-white shadow-xl z-20 overflow-y-auto p-5 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-blue-600 mb-2">🏃‍♂️ Run-Finder</h1>
          <p className="text-sm text-gray-500">Trouvez votre prochaine course.</p>
        </div>

        {/* Bouton Géoloc */}
        <button
          onClick={handleLocateMe}
          className="flex items-center justify-center gap-2 w-full bg-blue-100 text-blue-700 py-2 rounded hover:bg-blue-200 transition font-medium">
          📍 Autour de moi
        </button>

        {/* Filtre: Rayon */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="font-semibold text-gray-700">Rayon</label>
            <span className="text-blue-600 font-bold">{radius} km</span>
          </div>
          <input
            type="range"
            min="5"
            max="500"
            step="5"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Filtre: Dénivelé (D+) */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="font-semibold text-gray-700">Dénivelé Min (D+)</label>
            <span className="text-green-600 font-bold">{minDplus} m</span>
          </div>
          <input
            type="range"
            min="0"
            max="3000"
            step="100"
            value={minDplus}
            onChange={(e) => setMinDplus(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
          />
        </div>

        {/* Filtre: Distance */}
        <div className="space-y-3">
          <label className="font-semibold text-gray-700 block">Distance (km)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={minKm}
              onChange={(e) => setMinKm(Number(e.target.value))}
              className="w-20 p-2 border rounded text-center text-black"
              placeholder="Min"
              min={0}
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              value={maxKm}
              onChange={(e) => setMaxKm(Number(e.target.value))}
              className="w-20 p-2 border rounded text-center text-black"
              placeholder="Max"
              min={0}
            />
          </div>
        </div>

        {/* Filtre: Types */}
        <div className="space-y-2">
          <label className="font-semibold text-gray-700 block">Type de terrain</label>
          <div className="flex flex-wrap gap-2">
            {["trail", "road", "marathon", "ultra"].map((type) => (
              <label
                key={type}
                className="flex items-center gap-2 cursor-pointer px-3 py-1 rounded border text-black hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => toggleType(type)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Compteur de résultats */}
        <div className="mt-auto pt-4 border-t">
          {loading ? (
            <p className="text-center text-gray-500 animate-pulse">Recherche...</p>
          ) : (
            <p className="text-center font-bold text-gray-800">{races.length} courses trouvées</p>
          )}
        </div>
      </aside>

      {/* ZONE CARTE */}
      <div className="flex-1 relative z-10 h-[50vh] md:h-auto">
        <Map races={races} center={[userLat, userLng]} />
      </div>
    </main>
  );
}
