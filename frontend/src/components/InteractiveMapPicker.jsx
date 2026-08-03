import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, Navigation } from 'lucide-react';

// Fix Leaflet default icon URLs in Vite/Webpack build
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Red Pin Marker Icon for Laundry Outlet Pinning
const redPinIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function InteractiveMapPicker({ 
  initialLat = -6.917464, 
  initialLng = 107.619123, 
  onLocationSelect, 
  height = '240px' 
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);

  const [coords, setCoords] = useState({ lat: Number(initialLat) || -6.917464, lng: Number(initialLng) || 107.619123 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState('');

  // Reverse Geocode (Get Address from Lat & Lng)
  const triggerLocationUpdate = async (lat, lng) => {
    const roundedLat = Number(lat.toFixed(6));
    const roundedLng = Number(lng.toFixed(6));
    setCoords({ lat: roundedLat, lng: roundedLng });

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${roundedLat}&lon=${roundedLng}`);
      const data = await res.json();
      const addr = data && data.display_name ? data.display_name : '';
      setDetectedAddress(addr);
      if (onLocationSelect) {
        onLocationSelect({ lat: roundedLat, lng: roundedLng, address: addr });
      }
    } catch (err) {
      if (onLocationSelect) {
        onLocationSelect({ lat: roundedLat, lng: roundedLng, address: '' });
      }
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const startLat = Number(initialLat) || -6.917464;
    const startLng = Number(initialLng) || 107.619123;

    // Initialize Map if not already created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([startLat, startLng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Create Draggable Red Pin Marker
      const marker = L.marker([startLat, startLng], { 
        draggable: true, 
        icon: redPinIcon 
      }).addTo(map);

      marker.bindPopup('📍 <b>Lokasi Outlet Laundry</b><br>Tarik / Geser pin ini ke lokasi persis toko Anda').openPopup();

      // Handle Marker Drag End
      marker.on('dragend', function () {
        const position = marker.getLatLng();
        triggerLocationUpdate(position.lat, position.lng);
      });

      // Handle Map Click (Move Marker to Clicked Point)
      map.on('click', function (e) {
        marker.setLatLng(e.latlng);
        triggerLocationUpdate(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, []);

  // Quick Address Search using Nominatim OpenStreetMap Geocoder (Free)
  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        const topResult = data[0];
        const newLat = parseFloat(topResult.lat);
        const newLng = parseFloat(topResult.lon);

        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.setView([newLat, newLng], 16);
          markerInstanceRef.current.setLatLng([newLat, newLng]);
        }

        triggerLocationUpdate(newLat, newLng);
      }
    } catch (err) {
      console.log('Geocoding error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Get Current User GPS Location
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;

        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.setView([newLat, newLng], 16);
          markerInstanceRef.current.setLatLng([newLat, newLng]);
        }

        triggerLocationUpdate(newLat, newLng);
      }, (err) => {
        console.log('GPS Error:', err);
      });
    }
  };

  return (
    <div className="space-y-2 font-sans">
      {/* Search & Location Bar */}
      <div className="flex gap-2">
        <form onSubmit={handleSearchLocation} className="flex-1 flex gap-1">
          <input 
            type="text" 
            placeholder="🔍 Ketik nama kota / jalan untuk geser peta..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 p-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button 
            type="submit"
            disabled={isSearching}
            className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow"
          >
            <Search className="w-3.5 h-3.5" /> {isSearching ? 'Cari...' : 'Cari'}
          </button>
        </form>
        <button 
          type="button"
          onClick={handleGetCurrentLocation}
          className="bg-teal-700 hover:bg-teal-800 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow"
          title="Gunakan GPS Perangkat Saat Ini"
        >
          <Navigation className="w-3.5 h-3.5" /> GPS Saya
        </button>
      </div>

      {/* Interactive Map Box */}
      <div 
        ref={mapContainerRef} 
        style={{ height, width: '100%' }} 
        className="rounded-2xl border-2 border-teal-600/40 shadow-inner z-10 relative overflow-hidden"
      />

      {/* Selected Coordinates & Address Status Badge */}
      <div className="bg-teal-50 p-2.5 rounded-xl border border-teal-200 text-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-teal-900 flex items-center gap-1 text-[11px]">
            <MapPin className="w-4 h-4 text-red-600 fill-red-600 animate-bounce" /> 
            Titik Pin Merah: <b className="font-mono text-teal-800">{coords.lat}, {coords.lng}</b>
          </span>
          <span className="text-[10px] text-slate-500 italic">Geser pin merah untuk sesuaikan</span>
        </div>
        {detectedAddress && (
          <p className="text-[11px] text-slate-700 font-semibold border-t border-teal-200/60 pt-1 mt-1 truncate">
            📍 <span className="text-slate-500">Alamat Terdeteksi:</span> {detectedAddress}
          </p>
        )}
      </div>
    </div>
  );
}
