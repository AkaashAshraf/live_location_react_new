import { useState, useRef, useEffect } from "react";
import { GoogleMap, Marker, InfoWindow, Polyline, useJsApiLoader } from "@react-google-maps/api";
import styles from "../css/DriverTrips.module.css";
import { BASE_URL, GOOGLE_MAPS_API_KEY } from "../config";

const containerStyle = { width: "100%", height: "100%" };
const tripColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#f43f5e", "#6366f1"];

export default function DriverTrips() {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });
  const mapRef = useRef<any>(null);

  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: 33.6844, lng: 73.0479 });

  // Fetch drivers on mount
  useEffect(() => {
    fetch(`${BASE_URL}/trips/get-users`)
      .then((res) => res.json())
      .then((data) => { if (data.success && data.users) setDrivers(data.users); })
      .catch(console.error);

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
          if (mapRef.current) {
            mapRef.current.panTo({ lat: position.coords.latitude, lng: position.coords.longitude });
            mapRef.current.setZoom(16);
          }
        },
        (err) => console.error("Geolocation error:", err)
      );
    }
  }, []);

  // Fetch trips when driver or date changes
  const fetchTrips = () => {
    if (!selectedDriver || !date) return;

    fetch(`${BASE_URL}/trips?driver_id=${selectedDriver}&date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.trips) {
          setTrips(data.trips);
          const lastTrip = data.trips[data.trips.length - 1];
          if (lastTrip && lastTrip.locations.length > 0 && mapRef.current) {
            const lastLoc = lastTrip.locations[lastTrip.locations.length - 1];
            mapRef.current.panTo({ lat: lastLoc.lat, lng: lastLoc.long });
            mapRef.current.setZoom(16);
          }
        } else setTrips([]);
      })
      .catch(console.error);
  };

  if (!isLoaded) return <p>Loading Map...</p>;

  return (
    <div className={styles.container}>
      {/* Header with Back button */}
      <div className={styles.headerWrapper}>
        <button className={styles.backButton} onClick={() => window.history.back()}>
          ← Back
        </button>
        <h2 className={styles.header}> Driver Trips</h2>
      </div>

      {/* Driver & Date Selection */}
      <div className={styles.selectionWrapper}>
        <select
          value={selectedDriver}
          onChange={(e) => setSelectedDriver(e.target.value)}
          className={styles.selectInput}
        >
          <option value="">Select Driver</option>
          {drivers.map((d) => (
            <option key={d.driver_id} value={d.driver_id}>{d.driver_id}</option>
          ))}
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={styles.selectInput}
        />

        <button onClick={fetchTrips} className={styles.fetchButton}>
          Get Trips
        </button>
      </div>

      {/* Map */}
      <div className={styles.mapContainer}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={16}
          onLoad={(map) => (mapRef.current = map)}
        >
          {/* Trip lines */}
          {trips.filter(t => t.locations.length > 1).map((trip, idx) => {
            const path = trip.locations.map(loc => ({ lat: loc.lat, lng: loc.long }));
            const color = tripColors[idx % tripColors.length];
            return (
              <Polyline
                key={trip._id}
                path={path}
                options={{ strokeColor: color, strokeOpacity: 0.8, strokeWeight: 6 }}
                onClick={() => setSelectedTrip(trip)}
              />
            );
          })}

          {/* Start & End markers */}
          {trips.filter(t => t.locations.length > 1).flatMap(trip => {
            const start = trip.locations[0];
            const end = trip.locations[trip.locations.length - 1];
            return [
              <Marker
                key={`${trip._id}-start`}
                position={{ lat: start.lat, lng: start.long }}
                label="S"
                icon={{ url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" }}
                onClick={() => setSelectedTrip(trip)}
              />,
              <Marker
                key={`${trip._id}-end`}
                position={{ lat: end.lat, lng: end.long }}
                label="E"
                icon={{ url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" }}
                onClick={() => setSelectedTrip(trip)}
              />,
            ];
          })}

          {/* InfoWindow */}
          {selectedTrip && selectedTrip.locations.length > 0 && (
            <InfoWindow
              position={{
                lat: selectedTrip.locations[0].lat,
                lng: selectedTrip.locations[0].long,
              }}
              onCloseClick={() => setSelectedTrip(null)}
            >
              <div className={styles.infoWindow}>
                <h3>Driver: {selectedTrip.driver_id}</h3>
                <p>Status: {selectedTrip.status}</p>
                <p>Start At: {new Date(selectedTrip.locations[0].created_at).toLocaleString()}</p>
                {selectedTrip.status === "closed" && (
                  <p>Closed At: {new Date(selectedTrip.locations[selectedTrip.locations.length - 1].created_at).toLocaleString()}</p>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
