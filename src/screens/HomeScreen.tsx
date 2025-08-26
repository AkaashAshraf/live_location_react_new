import styles from "../css/HomeScreen.module.css";
import { Link } from "react-router-dom";
import { Car, Route } from "lucide-react";

export default function HomeScreen() {
  const cards = [
    {
      title: "View Live Drivers",
      desc: "Track drivers in real-time on the map.",
      icon: <Car />,
      color: "#4f46e5", // Indigo
      link: "/live-drivers",
    },
    {
      title: "Driver Trips",
      desc: "View trip history",
      icon: <Route />,
      color: "#10b981", // Green
      link: "/driver-trip",
    },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1>Driver Dashboard</h1>
        <p className={styles.subheading}>
          Welcome To Live User Dashboard
        </p>
      </header>

      {/* Cards Grid */}
      <main className={styles.grid}>
        {cards.map((card, idx) => (
          <Link
            key={idx}
            to={card.link}
            className={styles.card}
            style={{ borderTop: `4px solid ${card.color}` }}
          >
            <div
              className={styles.icon}
              style={{ backgroundColor: `${card.color}20`, color: card.color }}
            >
              {card.icon}
            </div>
            <h3>{card.title}</h3>
            <p>{card.desc}</p>
          </Link>
        ))}
      </main>
    </div>
  );
}
