import { useState, useRef, useEffect } from "react";
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import { io } from "socket.io-client";
import styles from "../css/LiveDrivers.module.css";
import { BASE_URL, SOCKET_URL, GOOGLE_MAPS_API_KEY, DEFAULT_DRIVER_IMAGE } from "../config";

// Connect to Socket.io server
const socket = io(SOCKET_URL);

const containerStyle = { width: "100%", height: "100%" };

export default function LiveDrivers() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [autoCenterEnabled, setAutoCenterEnabled] = useState(true);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    // Fetch initial users
    fetch(`${BASE_URL}/trips/get-users`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.users) {
          setUsers(data.users);

          // Extract unique branches
          const branchSet = new Set(data.users.map((u: any) => u.branch_name).filter(Boolean));
          setBranches(["All", ...Array.from(branchSet)]);

          // Center on last updated user
          const lastUpdated = data.users.reduce((a: any, b: any) =>
            new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b
          );
          if (mapRef.current && lastUpdated && autoCenterEnabled) {
            mapRef.current.panTo({ lat: lastUpdated.lat, lng: lastUpdated.lng });
          }
        }
      })
      .catch((err) => console.error(err));

    // Listen for updates from server
    socket.on("driverUpdated", (driver) => {
      setUsers((prev) => {
        const exists = prev.find((u) => u.driver_id === driver.driver_id);
        if (exists) {
          return prev.map((u) => (u.driver_id === driver.driver_id ? driver : u));
        } else {
          return [...prev, driver];
        }
      });

      if (mapRef.current && autoCenterEnabled && !selectedUser) {
        mapRef.current.panTo({ lat: driver.lat, lng: driver.lng });
      }
    });

    return () => socket.off("driverUpdated");
  }, [autoCenterEnabled, selectedUser]);

  // Filter by branch + search
  const filteredUsers = users.filter((user) => {
    const branchMatch = selectedBranch === "All" || user.branch_name === selectedBranch;
    const searchMatch = user.driver_id.toLowerCase().includes(search.toLowerCase());
    return branchMatch && searchMatch;
  });

  useEffect(() => {
    if (filteredUsers.length > 0 && mapRef.current) {
      setAutoCenterEnabled(true);
      mapRef.current.panTo({
        lat: filteredUsers[0].lat,
        lng: filteredUsers[0].lng,
      });
      mapRef.current.setZoom(15);
    }
  }, [search, selectedBranch, filteredUsers]);

  const handleMapClick = () => setAutoCenterEnabled(false);
  const handleMarkerClick = (user: any) => {
    setAutoCenterEnabled(false);
    setSelectedUser(user);
  };
  const handleInfoWindowClose = () => setSelectedUser(null);

  // Marker with image URL
  const getMarkerIcon = (user: any) => {
    const borderColor = user.status === "online" ? "#10b981" : "#ef4444";

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50">
        <circle cx="25" cy="25" r="24" fill="${borderColor}" />
        <clipPath id="clip">
          <circle cx="25" cy="25" r="20" />
        </clipPath>
        <image x="5" y="5" width="40" height="40" href="${
          user.image || DEFAULT_DRIVER_IMAGE
        }" clip-path="url(#clip)" />
      </svg>
    `;

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new google.maps.Size(50, 50),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(25, 25),
    };
  };

  if (!isLoaded) return <p>Loading Map...</p>;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerWrapper}>
        <button className={styles.backButton} onClick={() => window.history.back()}>
          ← Back
        </button>
        <h2 className={styles.header}> Live Drivers View</h2>
      </div>

      {/* Filters */}
      <div className={styles.searchWrapper}>
        {/* Branch Dropdown */}
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className={styles.branchSelect}
        >
          {branches.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>

        {/* Search Input */}
        <div className={styles.searchInputWrapper}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className={styles.searchIcon}
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
            placeholder="Search driver by Name or ID ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Auto-center toggle */}
        <button
          className={styles.autoCenterButton}
          onClick={() => setAutoCenterEnabled(!autoCenterEnabled)}
          title={autoCenterEnabled ? "Auto-center enabled" : "Auto-center disabled"}
        >
          {autoCenterEnabled ? "📍 Re-center" : "❌ Manual"}
        </button>
      </div>

      {/* Map */}
      <div className={styles.mapContainer}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={{ lat: 33.6844, lng: 73.0479 }}
          zoom={14}
          onLoad={(map) => (mapRef.current = map)}
          onClick={handleMapClick}
        >
          {filteredUsers.map((user) => (
            <Marker
              key={user.driver_id}
              position={{ lat: user.lat, lng: user.lng }}
              icon={getMarkerIcon(user)}
              onClick={() => handleMarkerClick(user)}
            />
          ))}

          {selectedUser && (
            <InfoWindow
              position={{ lat: selectedUser.lat, lng: selectedUser.lng }}
              onCloseClick={handleInfoWindowClose}
            >
              <div style={{ minWidth: "180px" }}>
                <h3 style={{ fontWeight: 600 }}>{selectedUser.driver_id}</h3>
                <p style={{ fontSize: "0.875rem" }}>Status: {selectedUser.status}</p>
                <p style={{ fontSize: "0.875rem" }}>
                  Branch: {selectedUser.branch_name || "N/A"}
                </p>
                <p style={{ fontSize: "0.875rem" }}>
                  Last Updated: {new Date(selectedUser.updatedAt).toLocaleString()}
                </p>
                <button
                  onClick={() => {
                    setAutoCenterEnabled(true);
                    mapRef.current.panTo({ lat: selectedUser.lat, lng: selectedUser.lng });
                  }}
                  style={{ marginTop: "8px", padding: "4px 8px" }}
                >
                  Center on this driver
                </button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
