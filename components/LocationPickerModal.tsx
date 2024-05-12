'use client'
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { OpenStreetMapProvider } from 'leaflet-geosearch';

const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function MapEvents({ setPosition, onSelect }: { setPosition: (pos: L.LatLng) => void, onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Helper to recenter map when position changes from search
function MapCenterer({ position }: { position: L.LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, 13);
  }, [position, map]);
  return null;
}

export default function LocationPickerModal({
  onSelect,
  initialLocation
}: {
  onSelect: (lat: number, lng: number) => void;
  initialLocation?: { lat: number, lng: number };
}) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const provider = useRef(new OpenStreetMapProvider());
  
  useEffect(() => {
    if (initialLocation && !position) {
        setPosition(L.latLng(initialLocation.lat, initialLocation.lng));
    }
  }, [initialLocation, position]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    const results = await provider.current.search({ query: searchQuery });
    if (results && results.length > 0) {
      setSearchResults(results);
    }
  };

  const selectResult = (result: any) => {
    const lat = parseFloat(result.y);
    const lng = parseFloat(result.x);
    setPosition(L.latLng(lat, lng));
    setSearchResults([]);
    setSearchQuery(result.label);
    onSelect(lat, lng);
  };

  const center = position || L.latLng(40.7128, -74.0060);

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900">
          {/* Search Bar */}
          <div className="p-4 flex gap-2 relative z-10 bg-white dark:bg-slate-900 shadow-sm">
             <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                   <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                   <input 
                     type="text" 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Search for a city, landmark, or address..." 
                     className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-brand-primary/50"
                   />
                </div>
                <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primary/90 transition-colors">Search</button>
             </form>
             {searchResults.length > 0 && (
                 <div className="absolute top-full left-4 right-4 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {searchResults.map((res, i) => (
                        <button type="button" key={i} onClick={() => selectResult(res)} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700/50 text-sm text-slate-700 dark:text-slate-300 last:border-none">
                            {res.label}
                        </button>
                    ))}
                 </div>
             )}
          </div>

          {/* Map */}
          <div className="flex-1 relative z-0 bg-slate-100 dark:bg-slate-800">
             <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapEvents setPosition={setPosition} onSelect={onSelect} />
                {position && (
                  <Marker position={position} icon={customIcon} />
                )}
                {position && <MapCenterer position={position} />}
             </MapContainer>
          </div>
    </div>
  );
}
