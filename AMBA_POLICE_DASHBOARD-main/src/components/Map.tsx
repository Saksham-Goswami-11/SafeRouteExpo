import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { Alert } from '../types';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';

// Fix for default marker icon in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

const pulsingIcon = L.divIcon({
    className: 'pulse-icon',
    iconSize: [20, 20]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
    alerts: Alert[];
    selectedAlert: Alert | null;
}

const MapController: React.FC<{ selectedAlert: Alert | null }> = ({ selectedAlert }) => {
    const map = useMap();

    useEffect(() => {
        if (selectedAlert && selectedAlert.latitude && selectedAlert.longitude) {
            map.flyTo([selectedAlert.latitude, selectedAlert.longitude], 16, {
                duration: 1.5
            });
        }
    }, [selectedAlert, map]);

    return null;
};

const Map: React.FC<MapProps> = ({ alerts, selectedAlert }) => {
    const defaultCenter: [number, number] = [28.6139, 77.2090]; // Delhi

    return (
        <div className="flex-1 h-full bg-slate-900 relative z-0">
            <MapContainer
                center={defaultCenter}
                zoom={13}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {alerts
                    .filter(a => a.latitude != null && a.longitude != null)
                    .map(alert => (
                        <Marker
                            key={alert.id}
                            position={[alert.latitude!, alert.longitude!]}
                            icon={alert.status === 'ACTIVE' ? pulsingIcon : DefaultIcon}
                        >
                            <Popup>
                                <div className="text-slate-900">
                                    <div className="font-bold">{alert.profiles?.full_name || alert.user_name || 'Unknown'}</div>
                                    <div className="text-slate-600 text-sm">{alert.status}</div>
                                    {alert.address_snapshot && (
                                        <div className="text-slate-500 text-xs mt-1">{alert.address_snapshot}</div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                <MapController selectedAlert={selectedAlert} />
            </MapContainer>
        </div>
    );
};

export default Map;
