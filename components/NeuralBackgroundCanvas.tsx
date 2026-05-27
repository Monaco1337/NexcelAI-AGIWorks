"use client";

import { useEffect } from "react";

export default function NeuralBackgroundCanvas() {
  useEffect(() => {
    // Load the neural background script
    const script = document.createElement("script");
    script.src = "/neuralBackground.js";
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <canvas
      id="nexcel-bg"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  );
}

