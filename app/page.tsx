"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  Navigation,
  Filter,
  Ruler,
  Mountain,
  Search,
  Loader2,
  X,
  ChevronDown,
} from "lucide-react";
import { Race } from "./types";

// Import dynamique de la Map (Client Side Only)
const Map = dynamic(() => import("@/app/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-50 text-gray-400 animate-pulse">
      Chargement de la carte...
    </div>
  ),
});

export default function Home() {
  // --- STATE ---
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(false);

  // Position (Défaut: Paris)
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
  const scrollRef = useRef<HTMLDivElement>(null);

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

      if (selectedTypes.length > 0) {
        params.append("types", selectedTypes.join(","));
      }

      const res = await fetch(`/api/races/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRaces(data);
      }
    } catch (error) {
      console.error("Erreur API:", error);
    } finally {
      setLoading(false);
    }
  }, [userLat, userLng, radius, minKm, maxKm, minDplus, selectedTypes]);

  // Debounce sur la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRaces();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchRaces]);

  const handleLocateMe = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
        },
        (err) => {
          console.error("Erreur géolocalisation", err);
          alert("Impossible de vous localiser.");
        },
      );
    }
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden font-sans text-slate-800 bg-gray-100">
      {/* --- 1. CARTE (ARRIÈRE PLAN) --- */}
      <div className="absolute inset-0 z-0">
        <Map races={races} center={[userLat, userLng]} />
      </div>

      {/* --- 2. HEADER FLOTTANT (Recherche) --- */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-1000 w-[95%] max-w-md">
        <div className="flex items-center gap-3 bg-white/90 backdrop-blur-2xl border border-white/40 shadow-xl rounded-full p-2 px-4 transition-all hover:bg-white">
          <Search className="w-5 h-5 text-gray-500" aria-hidden="true" />
          <input
            type="text"
            placeholder="Rechercher une ville..."
            className="bg-transparent border-none outline-none text-sm flex-1 placeholder:text-gray-400 h-10"
            disabled // À connecter plus tard
            aria-label="Rechercher une ville"
          />
          <div className="h-6 w-px bg-gray-300 mx-1"></div>
          <button
            type="button"
            onClick={handleLocateMe}
            className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition"
            aria-label="Me géolocaliser">
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* --- 3. PANNEAU DE CONTRÔLE (Responsive: Bottom Sheet Mobile / Side Panel Desktop) --- */}
      <aside
        className={`
          absolute z-1000 transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]
          bg-white/90 backdrop-blur-2xl border border-white/50 shadow-2xl overflow-hidden flex flex-col
          
          /* MOBILE : Bottom Sheet (fixé en bas, largeur adaptée) */
          bottom-4 left-4 right-4 rounded-3xl max-h-[70vh]
          ${isPanelOpen ? "translate-y-0" : "translate-y-[110%]"}

          /* DESKTOP : Sidebar (fixé à gauche) */
          md:top-24 md:left-4 md:bottom-8 md:right-auto md:w-80 md:rounded-3xl md:max-h-none
          md:${isPanelOpen ? "translate-x-0" : "-translate-x-[120%]"}
        `}>
        {/* Header du Panneau */}
        <div
          className="p-5 border-b border-gray-200/50 flex justify-between items-center bg-white/50 cursor-pointer md:cursor-default"
          onClick={() => window.innerWidth < 768 && setIsPanelOpen(!isPanelOpen)} // Clic pour fermer sur mobile
        >
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-700 to-indigo-600">
              Filtres
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-1">
              {loading ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Mise à jour...
                </span>
              ) : (
                `${races.length} course${races.length > 1 ? "s" : ""} visible${races.length > 1 ? "s" : ""}`
              )}
            </p>
          </div>

          {/* Bouton fermeture Desktop */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPanelOpen(false);
            }}
            className="p-2 hover:bg-black/5 rounded-full transition text-gray-500"
            aria-label="Fermer les filtres">
            {/* Icone change selon mobile/desktop pour UX claire */}
            <span className="md:hidden">
              <ChevronDown className="w-5 h-5" />
            </span>
            <span className="hidden md:block">
              <X className="w-5 h-5" />
            </span>
          </button>
        </div>

        {/* Contenu Scrollable */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
          {/* Filtre Rayon */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label
                htmlFor="radius-slider"
                className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <MapPin className="w-4 h-4 text-blue-500" /> Rayon
              </label>
              <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                {radius} km
              </span>
            </div>
            <input
              id="radius-slider"
              type="range"
              min="5"
              max="200"
              step="5"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          {/* Filtre Dénivelé */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label
                htmlFor="dplus-slider"
                className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <Mountain className="w-4 h-4 text-emerald-500" /> Dénivelé Min
              </label>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                {minDplus} m+
              </span>
            </div>
            <input
              id="dplus-slider"
              type="range"
              min="0"
              max="3000"
              step="100"
              value={minDplus}
              onChange={(e) => setMinDplus(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Filtre Distance */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <Ruler className="w-4 h-4 text-purple-500" /> Distance (km)
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 group">
                <input
                  type="number"
                  value={minKm}
                  onChange={(e) => setMinKm(Number(e.target.value))}
                  className="w-full pl-3 pr-2 py-2.5 bg-white/60 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  aria-label="Distance minimum"
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium group-hover:text-purple-400">
                  min
                </span>
              </div>
              <div className="w-2 h-[1px] bg-gray-300"></div>
              <div className="relative flex-1 group">
                <input
                  type="number"
                  value={maxKm}
                  onChange={(e) => setMaxKm(Number(e.target.value))}
                  className="w-full pl-3 pr-2 py-2.5 bg-white/60 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  aria-label="Distance maximum"
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium group-hover:text-purple-400">
                  max
                </span>
              </div>
            </div>
          </div>

          {/* Filtre Types (Tags) */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <Filter className="w-4 h-4 text-orange-500" /> Type de terrain
            </label>
            <div className="flex flex-wrap gap-2">
              {["trail", "road", "marathon", "ultra"].map((type) => {
                const isActive = selectedTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleType(type)}
                    className={`
                      px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all duration-200 border select-none
                      ${
                        isActive
                          ? "bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-500/20 transform scale-[1.02]"
                          : "bg-white/60 text-slate-600 border-gray-200 hover:bg-white hover:border-gray-300"
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
        <div className="p-4 bg-white/60 border-t border-gray-200/50 backdrop-blur-sm">
          <button
            type="button"
            className="w-full py-3.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all transform active:scale-[0.98] text-sm flex items-center justify-center gap-2">
            Voir la liste détaillée
          </button>
        </div>
      </aside>

      {/* --- 4. BOUTON TOGGLE FLOTTANT (Mobile uniquement quand fermé) --- */}
      {!isPanelOpen && (
        <button
          type="button"
          onClick={() => setIsPanelOpen(true)}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-900 px-6 py-3 bg-slate-900/90 backdrop-blur-md text-white rounded-full shadow-2xl hover:scale-105 transition flex items-center gap-2 font-semibold text-sm border border-white/20"
          aria-label="Ouvrir les filtres">
          <Filter className="w-4 h-4" /> Filtres
          <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{races.length}</span>
        </button>
      )}
    </main>
  );
}
