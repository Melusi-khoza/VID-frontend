import React from "react";
import styles from "./IDCardPreview.module.css"; // Import the CSS module

const IDCardPreview = ({ idImage }) => {
  return (
    <div className={styles.previewContainer}>
      <div className={styles.idImageContainer}>
        <img
          src={idImage}
          alt="Generated ID"
          className={styles.idImage} // Use the CSS class for the image
        />
      </div>
    </div>
  );
};

export default IDCardPreview;