import { Routes, Route, Link } from "react-router-dom";
import HomeScreen from "./screens/HomeScreen";
import LiveDrivers from "./screens/LiveDrivers";
import DriverTrip from "./screens/DriverTrip";
 

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/live-drivers" element={<LiveDrivers />} />
      <Route path="/driver-trip" element={<DriverTrip />} />
    </Routes>
  );
}
