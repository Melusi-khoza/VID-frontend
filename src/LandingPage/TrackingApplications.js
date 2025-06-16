import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './AdminDashboard.module.css';

const TrackingApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5265/api/application');
        if (!response.ok) throw new Error('Failed to fetch applications');
        const data = await response.json();
        setApplications(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter logic
  const filteredApplications = applications.filter(app => {
    let include = true;

    // Search term filter
    if (searchTerm) {
      include =
        Object.values(app).some(val =>
          val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Date range filter
    if (filterDate !== 'all') {
      const createdAt = new Date(app.createdAt);
      const today = new Date();

      if (filterDate === 'today') {
        // include =
        //   createdAt.toDateString() === today.toDateString();
        //   <td>{new Date().toLocaleDateString()}</td>
      } else if (filterDate === 'last7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        include = createdAt >= sevenDaysAgo;
      } else if (filterDate === 'last30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        include = createdAt >= thirtyDaysAgo;
      } else if (filterDate === 'thisMonth') {
        // include =
        //   createdAt.getMonth() === today.getMonth() &&
        //   createdAt.getFullYear() === today.getFullYear();
      }
    }

    return include;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredApplications.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

  // Delete handler
  const handleDeleteApplication = async (id) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;

    try {
      const response = await fetch(`http://localhost:5265/api/application/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete application');

      const updatedApps = applications.filter(a => a.applicationId !== id);
      setApplications(updatedApps);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading tracking data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <button className={styles.retryButton} onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <header className={styles.header}>
        <h1>Tracking ID Applications</h1>
        <div className={styles.headerActions}>
          <Link to="/admin-dashboard" className={styles.navButton}>
            <i className="material-icons"></i> Dashboard
          </Link>
          <button className={styles.refreshButton} onClick={() => window.location.reload()}>
            <i className="material-icons"></i> Refresh
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.primary}`}>
          <div className={styles.statIcon}>
            <i className="material-icons">assignment</i>
          </div>
          <div className={styles.statContent}>
            <h3>Total Applications</h3>
            <p className={styles.statValue}>{filteredApplications.length}</p>
            <p className={styles.statTrend}>Filtered Results</p>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.success}`}>
          <div className={styles.statIcon}>
            <i className="material-icons">check_circle</i>
          </div>
          <div className={styles.statContent}>
            <h3>ID Generated</h3>
            <p className={styles.statValue}>
              <p className={styles.statValue}>{filteredApplications.length}</p>
              {/* {filteredApplications.filter(a => a.identityId).length} */}
            </p>
            <p className={styles.statTrend}>
              {Math.round((filteredApplications.filter(a => a.identityId).length / filteredApplications.length) * 100)}% of total
            </p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <h2>All Applications</h2>
          <div className={styles.tableControls}>
            <div className={styles.searchBox}>
              <i className="material-icons"></i>
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className={styles.filterSelect}
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
            </select>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.usersTable}>
            <thead>
              <tr>
                <th>App ID</th>
                <th>Person ID</th>
                <th>Father ID</th>
                <th>Mother ID</th>
                <th>ID Generated</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((app) => (
                <tr key={app.applicationId}>
                  <td>{app.applicationId}</td>
                  <td>{app.personId}</td>
                  <td>{app.fatherId || 'N/A'}</td>
                  <td>{app.motherId || 'N/A'}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${
                      app.identityId ? styles.approved : styles.pending
                    }`}>
                      {app.identityId ? 'Yes' : 'Yes'}
                    </span>
                  </td>
                  <td>{new Date().toLocaleDateString()}</td>
                  <td>
                    {/* <button className={styles.actionButton}>
                      <i className="material-icons">visibility</i>
                    </button> */}
                    {/* <button className={styles.actionButton}>
                      <i className="material-icons">edit</i>
                    </button> */}
                    <button
                      className={styles.actionButton}
                      onClick={() => handleDeleteApplication(app.applicationId)}
                    >
                      <i className="material-icons">delete</i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={styles.tableFooter}>
          <div className={styles.rowsInfo}>
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredApplications.length)} of {filteredApplications.length} entries
          </div>
          <div className={styles.pagination}>
            <button
                          className={styles.pageButton}
                          disabled={currentPage === totalPages || totalPages === 0}
                          onClick={() => setCurrentPage(prev => prev + 1)}
                        >
                                        <Link to="/" className={styles.navButton}>
                            <i className="material-icons"></i> Home
                          </Link>
                        </button>
            <button
              className={styles.pageButton}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              <Link to="/admin-dashboard" className={styles.navButton}>
                          <i className="material-icons"></i> Previous
                        </Link>
            </button>
            {/* {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                className={`${styles.pageButton} ${currentPage === i + 1 ? styles.active : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
               
              </button>
            ))} */}
            {/* <button
              className={styles.pageButton}
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingApplications;