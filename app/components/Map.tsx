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
            <Popup>
              <div className="text-sm">
                <h3 className="font-bold">{race.name}</h3>
                <p>📅 {new Date(race.date).toLocaleDateString()}</p>
                <p>📍 {race.city}</p>
                <p>🏔️ {race.max_dplus ? `${race.max_dplus}m D+` : "Plat"}</p>
                <p>📏 {race.max_km} km</p>
                <a
                  href={race.url || "#"}
                  target="_blank"
                  className="text-blue-600 hover:underline block mt-1">
                  Voir la course →
                </a>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
