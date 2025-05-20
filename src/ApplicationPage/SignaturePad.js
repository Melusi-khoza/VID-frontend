// SignaturePad.js
import React, { useState } from "react";
import SignatureCanvas from "react-signature-canvas";

const SignaturePad = ({ onSaveSignature, onClearSignature }) => {
  const [signature, setSignature] = useState(null);

  const saveSignature = () => {
    const signatureData = document.querySelector(".signature-canvas").toDataURL();
    setSignature(signatureData);
    onSaveSignature(signatureData); // Pass the signature data to the parent component
  };

  const clearSignature = () => {
    setSignature(null);
    onClearSignature(); // Notify parent component to clear the signature
  };

  return (
    <div>
      <label>Signature</label>
      <SignatureCanvas
        penColor="black"
        canvasProps={{
          width: 500,
          height: 200,
          className: "signature-canvas",
        }}
        onEnd={saveSignature}
      />
      <button type="button" onClick={clearSignature}>
        Clear Signature
      </button>
      {signature && (
        <div>
          <h4>Signature Preview:</h4>
          <img src={signature} alt="Signature Preview" />
        </div>
      )}
    </div>
  );
};

export default SignaturePad;
