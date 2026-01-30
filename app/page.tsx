"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { MapPin, Navigation, Filter, Ruler, Mountain, Search, Loader2 } from "lucide-react";
import { Race } from "./types";

// Import dynamique de la Map
const Map = dynamic(() => import("@/app/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-50 text-gray-400">
      Chargement de la carte...
    </div>
  ),
});

export default function Home() {
  // --- STATE ---
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLat, setUserLat] = useState(48.8566);
  const [userLng, setUserLng] = useState(2.3522);

  // Filtres
  const [radius, setRadius] = useState(50);
  const [minDplus, setMinDplus] = useState(0);
  const [minKm, setMinKm] = useState(0);
  const [maxKm, setMaxKm] = useState(200);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // UI State
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // --- LOGIQUE API ---
  const fetchRaces = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        lat: userLat.toString(),
        lng: userLng.toString(),
        radius: radius.toString(),
        min_km: minKm.toString(),
        max_km: maxKm.toString(),
        min_dplus: minDplus.toString(),
      });
      if (selectedTypes.length > 0) params.append("types", selectedTypes.join(","));

      const res = await fetch(`/api/races/search?${params.toString()}`);
      if (res.ok) setRaces(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [userLat, userLng, radius, minKm, maxKm, minDplus, selectedTypes]);

  useEffect(() => {
    const timer = setTimeout(() => fetchRaces(), 500);
    return () => clearTimeout(timer);
  }, [fetchRaces]);

  const handleLocateMe = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
      });
    }
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden font-sans text-slate-800">
      {/* --- CARTE EN ARRIÈRE PLAN --- */}
      <div className="absolute inset-0 z-0">
        <Map races={races} center={[userLat, userLng]} />
      </div>

      {/* --- HEADER FLOTTANT (Barre de recherche style iOS) --- */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-1000 w-[90%] max-w-md">
        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl rounded-full p-2 px-4 transition-all hover:bg-white/90">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une ville..."
            className="bg-transparent border-none outline-none text-sm flex-1 placeholder:text-gray-400"
            disabled // À implémenter plus tard avec API Adresse
          />
          <div className="h-6 w-px bg-gray-300 mx-1"></div>
          <button
            onClick={handleLocateMe}
            className="p-2 bg-blue-500/10 text-blue-600 rounded-full hover:bg-blue-500/20 transition">
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* --- PANNEAU DE CONTRÔLE (Glassmorphism) --- */}
      <aside
        className={`absolute top-24 left-4 bottom-4 z-1000 w-full max-w-sm transition-transform duration-300 ease-out ${isPanelOpen ? "translate-x-0" : "-translate-x-[110%]"}`}>
        <div className="flex flex-col h-full bg-white/75 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl overflow-hidden">
          {/* Header du Panneau */}
          <div className="p-6 border-b border-gray-200/50 flex justify-between items-center bg-white/40">
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600">
                Run-Finder
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                {loading ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Recherche...
                  </span>
                ) : (
                  `${races.length} événements trouvés`
                )}
              </p>
            </div>
            <button
              onClick={() => setIsPanelOpen(false)}
              className="md:hidden p-2 bg-gray-100 rounded-full">
              ✕
            </button>
          </div>

          {/* Contenu Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
            {/* Filtre Rayon */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <MapPin className="w-4 h-4 text-blue-500" /> Rayon
                </label>
                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {radius} km
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="200"
                step="5"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Filtre Dénivelé */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Mountain className="w-4 h-4 text-emerald-500" /> Dénivelé Min
                </label>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                  {minDplus} m+
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="3000"
                step="100"
                value={minDplus}
                onChange={(e) => setMinDplus(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Filtre Distance */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Ruler className="w-4 h-4 text-purple-500" /> Distance (km)
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={minKm}
                    onChange={(e) => setMinKm(Number(e.target.value))}
                    className="w-full pl-3 pr-2 py-2 bg-white/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-xs text-gray-400">min</span>
                </div>
                <div className="w-2 h-px bg-gray-400"></div>
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={maxKm}
                    onChange={(e) => setMaxKm(Number(e.target.value))}
                    className="w-full pl-3 pr-2 py-2 bg-white/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-xs text-gray-400">max</span>
                </div>
              </div>
            </div>

            {/* Filtre Types (Tags style Apple) */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Filter className="w-4 h-4 text-orange-500" /> Type de terrain
              </label>
              <div className="flex flex-wrap gap-2">
                {["trail", "road", "marathon", "ultra"].map((type) => {
                  const isActive = selectedTypes.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`
                        px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-200 border
                        ${
                          isActive
                            ? "bg-slate-800 text-white border-slate-800 shadow-md transform scale-105"
                            : "bg-white/50 text-gray-600 border-gray-200 hover:bg-white hover:border-gray-300"
                        }
                      `}>
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer du Panneau */}
          <div className="p-4 bg-white/40 border-t border-gray-200/50">
            <button className="w-full py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all transform hover:scale-[1.02] active:scale-95 text-sm">
              Voir la liste détaillée
            </button>
          </div>
        </div>
      </aside>

      {/* Bouton Toggle Sidebar (Mobile) */}
      {!isPanelOpen && (
        <button
          onClick={() => setIsPanelOpen(true)}
          className="absolute bottom-8 left-4 z-1000 p-3 bg-white text-slate-800 rounded-full shadow-xl hover:scale-110 transition">
          <Filter className="w-6 h-6" />
        </button>
      )}
    </main>
  );
}
