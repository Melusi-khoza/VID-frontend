import React, { useState, useEffect } from "react";
import styles from "./ApplicantDashbd.module.css";

const ApplicantDashbd = () => {
  const [profile, setProfile] = useState({
    personId: 0,
    identityId: "",
    firstname: "",
    surname: "",
    dateOfBirth: "",
    email: "",
    gender: "",
  });
  const [originalProfile, setOriginalProfile] = useState(null);
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [formErrors, setFormErrors] = useState({});
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setMessage({ text: "User ID not found. Please log in again.", type: "error" });
        return;
      }

      const response = await fetch(`http://localhost:5265/api/Person/${userId}`);

      if (!response.ok) throw new Error("Failed to fetch profile");

      const data = await response.json();
      setProfile(data);
      setOriginalProfile(JSON.parse(JSON.stringify(data)));
    } catch (err) {
      console.error(err);
      setMessage({ text: "Error loading profile", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!profile.firstname?.trim()) errors.firstname = "First name is required";
    if (!profile.surname?.trim()) errors.surname = "Last name is required";
    if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email))
      errors.email = "Please enter a valid email address";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveChanges = async () => {
    if (!validateForm()) {
      setMessage({ text: "Please correct the errors before saving", type: "error" });
      return;
    }

    try {
      setLoading(true);

      // Create a clean copy of the profile for update
      const updatedProfile = {
        ...profile,
        // Ensure identityId is preserved even if it's not displayed
        identityId: profile.identityId || originalProfile.identityId,
        // Ensure proper date format for C# DateOnly type
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : null,
        // Add dateOfBirthString for alternate model
        dateOfBirthString: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : null,
        // Preserve other fields that might not be directly edited
        userPassword: originalProfile.userPassword,
        passwordResetToken: originalProfile.passwordResetToken,
        resetTokenExpires: originalProfile.resetTokenExpires,
      };

      console.log("Sending to API:", updatedProfile);

      const response = await fetch(`http://localhost:5265/api/Person/${profile.personId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile)
      });

      if (!response.ok) {
        let errorMessage = "Failed to update profile";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || JSON.stringify(errorData);
        } catch (e) {
          // If JSON parsing fails, use status text
          errorMessage = `Error (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      setOriginalProfile(JSON.parse(JSON.stringify(updatedProfile)));
      setEditing(false);
      setMessage({ text: "Profile updated successfully", type: "success" });

      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ text: `Error updating profile: ${err.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    if (originalProfile) {
      setProfile(JSON.parse(JSON.stringify(originalProfile)));
    }
    setFormErrors({});
    setEditing(false);
  };

  // New function to handle profile deletion
  const deleteProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5265/api/Person/${profile.personId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Error (${response.status}): ${response.statusText}`);
      }

      // Clear localStorage and redirect to login page
      localStorage.removeItem("userId");
      setMessage({ text: "Profile deleted successfully. Redirecting to login...", type: "success" });
      
      // Give user time to see the success message before redirecting
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      console.error(err);
      setMessage({ text: `Error deleting profile: ${err.message}`, type: "error" });
      setShowDeleteConfirmation(false);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    window.location.href = "/login";
  };

  if (loading && !profile.personId) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <h2 className={styles.title}>Applicant Dashboard</h2>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Confirm Profile Deletion</h3>
            <p>Are you sure you want to delete your profile? This action cannot be undone.</p>
            <div className={styles.modalButtons}>
              <button 
                className={`${styles.button} ${styles.deleteButton}`} 
                onClick={deleteProfile}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Yes, Delete My Profile"}
              </button>
              <button 
                className={`${styles.button} ${styles.cancelButton}`} 
                onClick={() => setShowDeleteConfirmation(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.profileSection}>
          <div className={styles.statusBox}>
            <h3>Visual ID Status</h3>
            <div className={styles.statusIndicator}>
              {status || "Not Generated"}
            </div>
          </div>
        </div>

        <div className={styles.detailsSection}>
          <h3>Personal Information</h3>

          {[
            { label: "First Name", name: "firstname", required: true },
            { label: "Last Name", name: "surname", required: true },
            { label: "Email", name: "email", required: false },
            { label: "Date of Birth", name: "dateOfBirth", type: "date", required: false }
          ].map(({ label, name, required, type = "text" }) => (
            <div className={styles.formRow} key={name}>
              <label>
                {label} {required && <span className={styles.required}>*</span>}
              </label>
              <input
                type={type}
                name={name}
                value={type === "date" && profile[name] ? profile[name].split("T")[0] : profile[name] || ""}
                onChange={handleChange}
                readOnly={!editing}
                className={`${styles.inputField} ${!editing ? styles.readOnly : ""} ${formErrors[name] ? styles.error : ""}`}
              />
              {formErrors[name] && <div className={styles.errorMessage}>{formErrors[name]}</div>}
            </div>
          ))}

          <div className={styles.formRow}>
            <label>Gender</label>
            {editing ? (
              <select
                name="gender"
                value={profile.gender || ""}
                onChange={handleChange}
                className={styles.inputField}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <input
                type="text"
                value={profile.gender || ""}
                readOnly
                className={`${styles.inputField} ${styles.readOnly}`}
              />
            )}
          </div>

          <div className={styles.buttonRow}>
            {editing ? (
              <>
                <button className={`${styles.button} ${styles.saveButton}`} onClick={saveChanges} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button className={`${styles.button} ${styles.cancelButton}`} onClick={cancelEdit}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button className={`${styles.button} ${styles.editButton}`} onClick={() => setEditing(true)}>
                  Edit Profile
                </button>
                <button className={`${styles.button} ${styles.deleteButton}`} onClick={() => setShowDeleteConfirmation(true)}>
                  Delete Profile
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <button className={`${styles.button} ${styles.logoutButton}`} onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default ApplicantDashbd;