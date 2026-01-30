"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { Race } from "../types";

// Icônes (inchangé)
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Petit composant utilitaire pour recentrer la carte quand la position change
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Typage des props
interface MapProps {
  races: Race[];
  center: [number, number];
}

export default function Map({ races, center }: Readonly<MapProps>) {
  return (
    <MapContainer center={center} zoom={10} style={{ height: "100%", width: "100%", zIndex: 0 }}>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController center={center} />

      {races.map((race) => {
        if (!race.location?.coordinates) return null;
        return (
          <Marker
            key={race.id}
            position={[race.location.coordinates[1], race.location.coordinates[0]]}
            icon={icon}>
            <Popup className="glass-popup">
              {" "}
              {/* On pourra ajouter du CSS global pour customiser la classe leaflet */}
              <div className="p-1 min-w-50">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase text-white ${
                      race.types.includes("trail") ? "bg-emerald-500" : "bg-blue-500"
                    }`}>
                    {race.types[0] || "Course"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(race.date).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-800 leading-tight mb-1">
                  {race.name}
                </h3>
                <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">📍 {race.city}</p>

                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <div className="text-center">
                    <p className="text-gray-400">Distance</p>
                    <p className="font-semibold text-slate-700">{race.max_km} km</p>
                  </div>
                  <div className="text-center border-l border-gray-200">
                    <p className="text-gray-400">Dénivelé</p>
                    <p className="font-semibold text-slate-700">
                      {race.max_dplus ? `${race.max_dplus}m` : "-"}
                    </p>
                  </div>
                </div>

                <a
                  href={race.url || "#"}
                  target="_blank"
                  className="mt-3 block w-full text-center py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-md hover:bg-slate-700 transition">
                  Voir détails
                </a>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
