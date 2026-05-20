"use client";

import { useEffect, useState } from "react";

interface MaintenanceState {
  enabled: boolean;
  message: string;
}

export default function MaintenanceOverlay() {
  const [state, setState] = useState<MaintenanceState | null>(null);

  useEffect(() => {
    // Check on mount
    const check = async () => {
      try {
        const res = await fetch("/api/admin/maintenance");
        if (res.ok) {
          const data = await res.json();
          setState(data);
        }
      } catch {
        // silently fail — don't block users if check fails
      }
    };

    check();

    // Poll every 30 seconds
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  // Skip admins — if sessionStorage has admin flag, don't show overlay
  const isAdmin = typeof window !== "undefined" && sessionStorage.getItem("ashura_admin") === "1";
  if (!state?.enabled || isAdmin) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.96)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      {/* Animated grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(200,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(200,0,0,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          animation: "gridPulse 4s ease-in-out infinite",
        }}
      />

      {/* Glowing orb */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(180,0,0,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
          animation: "orbPulse 3s ease-in-out infinite",
        }}
      />

      <div
        style={{
          position: "relative",
          maxWidth: "520px",
          width: "90%",
          background: "linear-gradient(135deg, rgba(12,0,0,0.98), rgba(8,8,8,0.98))",
          border: "1px solid rgba(200,0,0,0.2)",
          borderRadius: "24px",
          padding: "48px 40px",
          textAlign: "center",
          boxShadow: "0 0 80px rgba(180,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.03)",
        }}
      >
        {/* Icon */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "72px",
            height: "72px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, #8b0000, #cc0000)",
            boxShadow: "0 0 40px rgba(200,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
            marginBottom: "24px",
            animation: "iconPulse 2s ease-in-out infinite",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 900,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#cc3333",
            textShadow: "0 0 20px rgba(200,0,0,0.5)",
            marginBottom: "8px",
          }}
        >
          Under Maintenance
        </h1>

        {/* Animated bar */}
        <div
          style={{
            width: "60px",
            height: "2px",
            background: "linear-gradient(90deg, transparent, #cc0000, transparent)",
            margin: "0 auto 24px",
            animation: "barSlide 2s ease-in-out infinite",
          }}
        />

        {/* Message */}
        <p
          style={{
            fontSize: "15px",
            lineHeight: 1.7,
            color: "rgba(220,220,220,0.75)",
            marginBottom: "32px",
            whiteSpace: "pre-wrap",
          }}
        >
          {state.message || "We are performing scheduled maintenance.\nWe'll be back shortly."}
        </p>

        {/* Status badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(200,0,0,0.08)",
            border: "1px solid rgba(200,0,0,0.2)",
            borderRadius: "100px",
            padding: "8px 20px",
            fontSize: "12px",
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#ff4444",
              animation: "dotBlink 1.2s ease-in-out infinite",
              flexShrink: 0,
            }}
          />
          System Offline
        </div>
      </div>

      <style>{`
        @keyframes gridPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes orbPulse {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.6; }
          50% { transform: translateX(-50%) scale(1.1); opacity: 1; }
        }
        @keyframes iconPulse {
          0%, 100% { box-shadow: 0 0 40px rgba(200,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1); }
          50% { box-shadow: 0 0 60px rgba(200,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1); }
        }
        @keyframes barSlide {
          0%, 100% { width: 40px; opacity: 0.5; }
          50% { width: 80px; opacity: 1; }
        }
        @keyframes dotBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
