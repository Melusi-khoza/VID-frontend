import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WelcomePage from './LandingPage/WelcomePage';
import Register from './RegisterPage/Register';
import Login from './LoginPage/Login';
import ForgotPassword from './LoginPage/ForgotPassword';
import VerifyOTPPage from './LoginPage/VerifyOTPPage';
import ResetPasswordPage from './LoginPage/ResetPasswordPage';
import NavigatePage from './NavigationPage/NavigatePage';
import ApplicationPg from './ApplicationPage/ApplicationPg';
import ApplicantDashbd from './ApplicantDashboard/ApplicantDashbd';
import ProcessingPage from './ApplicationPage/ProcessingPage';
import GenerateID from './GenerateIDPage/GenerateID';
import ReportPage from './NavigationPage/ReportPage';
import { generateID } from './GenerateIDPage/idUtils';
// import AdminReport from './AdminReportPage/AdminReport';
// import AdminDashboard from './AdminDashboard';
import AdminDashboard from './LandingPage/AdminDashboard';
import TrackingApplications from './LandingPage/TrackingApplications';
import CameraPage from './ApplicationPage/CameraPage';

function App() {
  return (
    <Router>
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/register" element={<Register/>} />
      <Route path="/login" element={<Login/>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTPPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/my_register" element={<NavigatePage />} />
        <Route path="/apply" element={<ApplicationPg />} />
        <Route path="/dashboard" element={<ApplicantDashbd />} />
        <Route path="/generate_id" element={<GenerateID />} />
        <Route path="/processing" element={<ProcessingPage />} />
        <Route path="/reports" element={<ReportPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/tracking-applications" element={<TrackingApplications />} />
        <Route path="/camera" element={<CameraPage />} />
        {/* <Route path="/admin-report" element={<AdminReport />} /> */}
       </Routes>
  </Router>
  );
}

export default App;
