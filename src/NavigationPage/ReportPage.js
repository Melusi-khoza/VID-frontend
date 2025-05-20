import React, { useState } from "react";
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import styles from "./ReportPage.module.css";

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ReportPage = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const applicationData = {
    labels: ['Approved', 'Rejected'],
    datasets: [{
      label: 'Application Status',
      data: [3, 2],
      backgroundColor: [
        'rgba(75, 192, 192, 0.6)',
        'rgba(255, 99, 132, 0.6)'
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(255, 99, 132, 1)'
      ],
      borderWidth: 1
    }]
  };

  const recentApplications = [
    { id: "1", applicantName: "Thabo Mbeki", status: "Approved" },
    { id: "2", applicantName: "Lerato Khumalo", status: "Rejected" },
    { id: "3", applicantName: "Sibusiso Zuma", status: "Approved" },
    { id: "4", applicantName: "Ayanda Nkosi", status: "Approved" },
    { id: "5", applicantName: "Mandla Sithole", status: "Rejected" }
  ];

  const exportReport = async (format) => {
    if (format === 'pdf') {
      const input = document.getElementById('report-content');
      if (!input) {
        alert('Report content not found!');
        return;
      }
      try {
        const canvas = await html2canvas(input, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('Applications_Report.pdf');
      } catch (error) {
        console.error('PDF export failed:', error);
        alert('PDF export failed. See console.');
      }
    } else if (format === 'csv') {
      try {
        const csvRows = [
          ['Application ID', 'Applicant Name', 'Status'],
          ...recentApplications.map(app => [app.id, app.applicantName, app.status])
        ];
        const csvContent = csvRows.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Applications_Report.csv';
        link.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('CSV export failed:', error);
        alert('CSV export failed. See console.');
      }
    }
  };

  const handleDateChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className={styles.reportContainer}>
      <h1 className={styles.pageTitle}>Applications Report</h1>

      <div className={styles.filterControls}>
        <div className={styles.filterGroup}>
          <label>Date Range:</label>
          <input
            type="date"
            name="startDate"
            value={dateRange.startDate}
            onChange={handleDateChange}
            className={styles.dateInput}
          />
          <span>to</span>
          <input
            type="date"
            name="endDate"
            value={dateRange.endDate}
            onChange={handleDateChange}
            className={styles.dateInput}
          />
        </div>

        <div className={styles.exportButtons}>
          <button 
            onClick={() => exportReport('pdf')}
            className={`${styles.exportBtn} ${styles.pdfBtn}`}
          >
            Export as PDF
          </button>
          <button 
            onClick={() => exportReport('csv')}
            className={`${styles.exportBtn} ${styles.csvBtn}`}
          >
            Export as CSV
          </button>
        </div>
      </div>

      <div id="report-content" className={styles.reportSection}>
        <h2>Applications Analysis Report</h2>
        <p className={styles.reportDate}>Report period: {dateRange.startDate} to {dateRange.endDate}</p>

        <div className={styles.chartContainer}>
          <h3>Application Status</h3>
          <Bar 
            data={applicationData} 
            options={{ 
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Number of Applications'
                  }
                }
              }
            }} 
          />
        </div>

        <div className={styles.reportTable}>
          <h3>Applications Summary</h3>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Status</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Approved</td>
                <td>3</td>
              </tr>
              <tr>
                <td>Rejected</td>
                <td>2</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.reportTable}>
          <h3>Recent Applications</h3>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Application ID</th>
                <th>Applicant Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentApplications.map(app => (
                <tr key={app.id}>
                  <td>{app.id}</td>
                  <td>{app.applicantName}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${app.status.toLowerCase()}`}>
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
