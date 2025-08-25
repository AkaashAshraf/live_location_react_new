import { useState, useRef, useEffect } from "react";
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import styles from "../css/LiveDrivers.module.css";

const users = [
  {
    id: 1,
    name: "Ali Khan",
    lat: 33.6844,
    lng: 73.0479,
    status: "online",
    lastUpdated: "2025-08-26 10:20 AM",
    img: "https://i.pravatar.cc/40?img=1",
  },
  {
    id: 2,
    name: "Sara Ahmed",
    lat: 33.6890,
    lng: 73.0550,
    status: "offline",
    lastUpdated: "2025-08-26 09:45 AM",
    img: "https://i.pravatar.cc/40?img=2",
  },
  {
    id: 3,
    name: "Usman Malik",
    lat: 33.6900,
    lng: 73.0500,
    status: "online",
    lastUpdated: "2025-08-26 10:05 AM",
    img: "https://i.pravatar.cc/40?img=3",
  },
];

const containerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: 33.6844, lng: 73.0479 };

export default function LiveDrivers() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyDcu3TPs4TtGv4gt7us_Zax9p9DW8JfqyA",
  });

  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const mapRef = useRef<any>(null);

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (filteredUsers.length > 0 && mapRef.current) {
      mapRef.current.panTo({
        lat: filteredUsers[0].lat,
        lng: filteredUsers[0].lng,
      });
      mapRef.current.setZoom(15);
    }
  }, [search]);

  if (!isLoaded) return <p>Loading Map...</p>;

  // Marker icon generator using direct image URL + colored border
  const getMarkerIcon = (user: typeof users[0]) => {
    const borderColor = user.status === "online" ? "#10b981" : "#ef4444";
    return {
      url: user.img, // direct image URL
      scaledSize: new google.maps.Size(40, 40),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(20, 20),
      labelOrigin: new google.maps.Point(20, 50),
    };
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.header}>🚖 Live Drivers</h2>

      {/* Search Field */}
      <div className={styles.searchWrapper}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search driver..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Map */}
      <div className={styles.mapContainer}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={14}
          onLoad={(map) => (mapRef.current = map)}
        >
          {filteredUsers.map((user) => (
            <Marker
              key={user.id}
              position={{ lat: user.lat, lng: user.lng }}
              icon={getMarkerIcon(user)}
              onClick={() => setSelectedUser(user)}
              label={{
                text: "●", // small dot for border color
                color: user.status === "online" ? "#10b981" : "#ef4444",
                fontSize: "20px",
                fontWeight: "bold",
              }}
            />
          ))}

          {selectedUser && (
            <InfoWindow
              position={{ lat: selectedUser.lat, lng: selectedUser.lng }}
              onCloseClick={() => setSelectedUser(null)}
            >
              <div style={{ minWidth: "180px" }}>
                <h3 style={{ fontWeight: 600 }}>{selectedUser.name}</h3>
                <p style={{ fontSize: "0.875rem" }}>Status: {selectedUser.status}</p>
                <p style={{ fontSize: "0.875rem" }}>Last Updated: {selectedUser.lastUpdated}</p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
