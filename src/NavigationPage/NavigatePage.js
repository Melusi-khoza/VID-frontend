import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import styles from "./NavigatePage.module.css"; // Ensure correct CSS import

const NavigatePage = () => {
  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <nav className={styles.sidebar}>
        <h2 className={styles.logoText}>Home Affairs</h2>
        <div className={styles.menu}>
          {/* Navigation Links */}
          {[
            { path: "/apply", label: "Apply" },
            { path: "/dashboard", label: "Applicant Dashboard" },
            { path: "/generate_id", label: "Generate ID" },
            { path: "/reports", label: "Reports" }, // Add reports link
            // { path: "/view", label: "View ID" },
            // { path: "/admin-dashboard", label: "Admin Dashboard" },
          ].map((item) => (
            <div key={item.path} className={styles.menuItem}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  isActive ? `${styles.link} ${styles.activeLink}` : styles.link
                }
              >
                {item.label}
              </NavLink>
            </div>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <Outlet /> {/* Nested routes will be rendered here */}
      </div>
    </div>
  );
};

export default NavigatePage;