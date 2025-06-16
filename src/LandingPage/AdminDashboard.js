import React, { useState, useEffect } from 'react';
import styles from './AdminDashboard.module.css';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [stats, setStats] = useState({
    totalUsers: 0,
    males: 0,
    females: 0,
    averageAge: 0,
    ageDistribution: []
  });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5265/api/person');
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        setPersons(data);
        calculateStatistics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate stats
  const calculateStatistics = (users) => {
    const now = new Date();
    const currentYear = now.getFullYear();

    const males = users.filter(u => u.gender?.toLowerCase() === 'male').length;
    const females = users.filter(u => u.gender?.toLowerCase() === 'female').length;

    const ages = users
      .filter(u => u.dateOfBirth)
      .map(u => currentYear - new Date(u.dateOfBirth).getFullYear());

    const averageAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;

    const ageGroups = {
      '0-17': 0,
      '18-25': 0,
      '26-35': 0,
      '36-50': 0,
      '51+': 0
    };

    ages.forEach(age => {
      if (age <= 17) ageGroups['0-17']++;
      else if (age <= 25) ageGroups['18-25']++;
      else if (age <= 35) ageGroups['26-35']++;
      else if (age <= 50) ageGroups['36-50']++;
      else ageGroups['51+']++;
    });

    setStats({
      totalUsers: users.length,
      males,
      females,
      averageAge,
      ageDistribution: Object.entries(ageGroups).map(([group, count]) => ({
        group,
        count,
        percentage: Math.round((count / users.length) * 100) || 0
      }))
    });
  };

  // Filter logic
  const filteredPersons = persons.filter(person => {
    let include = true;

    if (filterType === 'male') include = person.gender?.toLowerCase() === 'male';
    else if (filterType === 'female') include = person.gender?.toLowerCase() === 'female';
    else if (filterType === 'under18') {
      const dob = new Date(person.dateOfBirth);
      const age = new Date().getFullYear() - dob.getFullYear();
      include = age < 18;
    } else if (filterType === 'adults') {
      const dob = new Date(person.dateOfBirth);
      const age = new Date().getFullYear() - dob.getFullYear();
      include = age >= 18 && age <= 50;
    } else if (filterType === 'senior') {
      const dob = new Date(person.dateOfBirth);
      const age = new Date().getFullYear() - dob.getFullYear();
      include = age > 50;
    }

    if (searchTerm) {
      include =
        Object.values(person).some(val =>
          val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    return include;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPersons.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPersons.length / itemsPerPage);

  // Delete user
  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`http://localhost:5265/api/person/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete user');

      const updatedUsers = persons.filter(u => u.personId !== id);
      setPersons(updatedUsers);
      calculateStatistics(updatedUsers);
    } catch (err) {
      alert(err.message);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!persons.length) return;

    const headers = ['ID', 'Firstname', 'Surname', 'Email', 'Identity Number', 'Gender', 'Date of Birth'];
    const rows = persons.map(p => [
      p.personId,
      p.firstname,
      p.surname,
      p.email,
      p.identityId,
      p.gender,
      p.dateOfBirth
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(item => `"${item || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'user_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading dashboard data...</p>
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
        <h1>Admin Dashboard</h1>
        <div className={styles.headerActions}>
          <button className={styles.exportButton} onClick={handleExportCSV}>
            <i className="material-icons"></i> CSV
          </button>
          <button className={styles.refreshButton} onClick={() => window.location.reload()}>
            <i className="material-icons"></i> Refresh
          </button>
          {/* <Link to="/tracking-applications" className={styles.navButton}>
            <i className="material-icons"></i> Tracking Applications
          </Link> */}
        </div>
      </header>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.primary}`}>
          <div className={styles.statIcon}><i className="material-icons">people</i></div>
          <div className={styles.statContent}>
            <h3>Total Users</h3>
            <p className={styles.statValue}>{stats.totalUsers}</p>
            <p className={styles.statTrend}>↑ 12% from last month</p>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.success}`}>
          <div className={styles.statIcon}><i className="material-icons">man</i></div>
          <div className={styles.statContent}>
            <h3>Male Users</h3>
            <p className={styles.statValue}>{stats.males}</p>
            <p className={styles.statTrend}>{Math.round((stats.males / stats.totalUsers) * 100)}% of total</p>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.info}`}>
          <div className={styles.statIcon}><i className="material-icons">woman</i></div>
          <div className={styles.statContent}>
            <h3>Female Users</h3>
            <p className={styles.statValue}>{stats.females}</p>
            <p className={styles.statTrend}>{Math.round((stats.females / stats.totalUsers) * 100)}% of total</p>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.warning}`}>
          <div className={styles.statIcon}><i className="material-icons">cake</i></div>
          <div className={styles.statContent}>
            <h3>Average Age</h3>
            <p className={styles.statValue}>{stats.averageAge}</p>
            <p className={styles.statTrend}>years old</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className={styles.chartsSection}>
        <div className={styles.chartCard}>
          <h2>Age Distribution</h2>
          <div className={styles.ageBars}>
            {stats.ageDistribution.map(({ group, count, percentage }) => (
              <div key={group} className={styles.ageBarContainer}>
                <div className={styles.ageBarLabel}>
                  <span>{group}</span>
                  <span>{count} ({percentage}%)</span>
                </div>
                <div className={styles.ageBarTrack}>
                  <div className={styles.ageBarFill} style={{ width: `${percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.chartCard}>
          <h2>Gender Distribution</h2>
          <div className={styles.pieChart}>
            <div 
              className={styles.pieSegment}
              style={{
                background: `conic-gradient(
                  #4e79a7 0% ${(stats.males / stats.totalUsers) * 100}%,
                  #e15759 ${(stats.males / stats.totalUsers) * 100}% 100%
                )`
              }}
            ></div>
            <div className={styles.pieLegend}>
              <div className={styles.legendItem}>
                <span className={`${styles.legendColor} ${styles.male}`}></span>
                <span>Male: {stats.males}</span>
              </div>
              <div className={styles.legendItem}>
                <span className={`${styles.legendColor} ${styles.female}`}></span>
                <span>Female: {stats.females}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <h2>User Records</h2>
          <div className={styles.tableControls}>
            <div className={styles.searchBox}>
              <i className="material-icons"></i>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className={styles.filterSelect}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Users</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="under18">Under 18</option>
              <option value="adults">18-50</option>
              <option value="senior">Over 50</option>
            </select>
          </div>
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.usersTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Identity Number</th>
                <th>Gender</th>
                <th>Age</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((person) => {
                const age = person.dateOfBirth
                  ? new Date().getFullYear() - new Date(person.dateOfBirth).getFullYear()
                  : 'N/A';

                return (
                  <tr key={person.personId}>
                    <td>{person.personId}</td>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.userAvatar}>
                          {person.firstname?.charAt(0)}{person.surname?.charAt(0)}
                        </div>
                        <div>
                          <div className={styles.userName}>
                            {person.firstname || 'N/A'} {person.surname || ''}
                          </div>
                          <div className={styles.userEmail}>
                            {person.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{person.identityId || 'N/A'}</td>
                    <td>
                      <span className={`${styles.genderBadge} ${
                        person.gender?.toLowerCase() === 'male'
                          ? styles.maleBadge
                          : person.gender?.toLowerCase() === 'female'
                          ? styles.femaleBadge
                          : styles.otherBadge
                      }`}>
                        {person.gender || 'N/A'}
                      </span>
                    </td>
                    <td>{age}</td>
                    <td>
                      {/* <button className={styles.actionButton}>
                        <i className="material-icons">visibility</i>
                      </button>
                      <button className={styles.actionButton}>
                        <i className="material-icons">edit</i>
                      </button> */}
                      <button
                        className={styles.actionButton}
                        onClick={() => handleDeleteUser(person.personId)}
                      >
                        <i className="material-icons">delete</i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={styles.tableFooter}>
          <div className={styles.rowsInfo}>
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPersons.length)} of {filteredPersons.length} entries
          </div>
          <div className={styles.pagination}>
            {/* <button
              className={styles.pageButton}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </button> */}
            
            {/* {[...Array(totalPages)].map((_, i) => (
              <Link to="/" className={styles.navButton}>
            <i className="material-icons"></i> Home
          </Link>
            ))} */}

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
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
                            <Link to="/tracking-applications" className={styles.navButton}>
                <i className="material-icons"></i> Next
              </Link>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;