import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import styles from "./NavigatePage.module.css";
import { useNavigate } from 'react-router-dom';
import Tooltip from './Tooltip'; // Adjust path as needed

const NavigatePage = () => {
  const navigate = useNavigate();
  const [applicationExists, setApplicationExists] = useState(false);
  const [idGenerated, setIdGenerated] = useState(false);

  useEffect(() => {
    const storedPersonId = localStorage.getItem("personId");
    const personId = storedPersonId ? JSON.parse(storedPersonId) : null;
    const currentUserEmail = localStorage.getItem("currentUserEmail");

    // Check application exists
    if (personId) {
      fetch(`http://localhost:5265/api/Application/CheckExists/${personId}`)
        .then(res => res.json())
        .then(exists => setApplicationExists(exists))
        .catch(() => setApplicationExists(false));
    }

    // Check if ID was already generated
    if (currentUserEmail) {
      const storageKey = `generatedID_${currentUserEmail}`;
      const generatedID = localStorage.getItem(storageKey);
      setIdGenerated(!!generatedID);
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('personId');
    localStorage.removeItem('currentUserEmail'); 
    navigate('/');
  };

  const handleApplyClick = (e) => {
    if (applicationExists) {
      e.preventDefault();
    }
  };

  return (
    <div className={styles.container}>
      <nav className={styles.sidebar}>
        <h2 className={styles.logoText}>Home Affairs</h2>
        <div className={styles.menu}>
          {applicationExists && (
            <div className={styles.infoMessage}>
              You have already submitted an application.
            </div>
          )}
          {[
  { path: "/apply", label: "Apply" },
  { path: "/dashboard", label: "Applicant Dashboard" },
  { 
    path: "/generate_id", 
    label: "Generate ID",
    disabledTooltip: "You have already generated your ID and cannot generate again."
  },
].map((item) => (
  <div key={item.path} className={styles.menuItem}>
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        isActive ? `${styles.link} ${styles.activeLink}` : styles.link
      }
      onClick={item.label === "Apply" ? handleApplyClick : undefined}
      style={
  item.label === "Apply" && applicationExists
    ? { pointerEvents: "none", opacity: 0.5, cursor: "not-allowed" }
    : {}
}
    >
      {item.label}
    </NavLink>

    {/* Show tooltip only if disabled */}
    {(item.label === "Apply" && applicationExists) ||
    (item.label === "Generate ID" ) ? (
      <Tooltip text={item.disabledTooltip}>
        <span style={{ marginLeft: 8, cursor: 'help', color: '#888' }}></span>
      </Tooltip>
    ) : null}
  </div>
))}
        </div>
        <div className={styles.signOutContainer}>
          <button className={styles.signOutButton} onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </nav>
      <div className={styles.mainContent}>
        <Outlet />
      </div>
    </div>
  );
};

export default NavigatePage;