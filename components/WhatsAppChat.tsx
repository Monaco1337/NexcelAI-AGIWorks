"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * WhatsApp Chat Button - Apple iOS 26 / Tesla UI Level
 * 
 * Features:
 * - Permanent fixed position (always visible on scroll)
 * - iOS Safe-Area support
 * - Glassmorphism design
 * - GPU-optimized animations
 * - Mobile-first responsive
 * - No layout shifts (CLS = 0)
 */
export default function WhatsAppChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [unreadCount, setUnreadCount] = useState(1);
  const [isAdminPage, setIsAdminPage] = useState(false);

  useEffect(() => {
    // Hide on admin pages
    if (typeof window !== "undefined") {
      setIsAdminPage(window.location.pathname.startsWith("/admin"));
    }
  }, []);

  useEffect(() => {
    // Simulate online status (replace with API later)
    const interval = setInterval(() => {
      setIsOnline(Math.random() > 0.1); // 90% online probability
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Don't render on admin pages
  if (isAdminPage) {
    return null;
  }

  const handleDirectWhatsApp = () => {
    window.open("https://wa.me/message/BTSGZLCN6GLFA1", "_blank", "noopener,noreferrer");
    setUnreadCount(0);
  };

  const handleClose = () => {
    setIsOpen(false);
    setUnreadCount(0);
  };

  const handleWhatsAppClick = () => {
    window.open("https://wa.me/message/BTSGZLCN6GLFA1", "_blank", "noopener,noreferrer");
  };

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <>
      {/* Floating WhatsApp Button - Apple iOS 26 Style - Always Visible */}
      <motion.div
        data-whatsapp-chat
        className="whatsapp-floating-button"
        style={{
          position: "fixed",
          right: "24px",
          bottom: "24px",
          zIndex: 2147483647,
          overflow: "visible",
          background: "transparent",
          border: "none",
          outline: "none",
          padding: "0",
          margin: "0",
          width: "auto",
          height: "auto",
          borderRadius: "0",
          boxShadow: "none",
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 25,
          delay: 0.5 
        }}
      >
        <motion.button
          onClick={handleDirectWhatsApp}
          className="whatsapp-button"
          style={{
            position: "relative",
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "#25d366",
            border: "none",
            outline: "none",
            overflow: "visible",
            padding: "0",
            margin: "0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          whileHover={{ 
            scale: 1.1,
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* WhatsApp Icon */}
          <motion.svg
            className="whatsapp-icon"
            fill="currentColor"
            viewBox="0 0 24 24"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </motion.svg>

          {/* Unread Badge */}
          {unreadCount > 0 && (
            <motion.div
              className="whatsapp-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              <span className="whatsapp-badge-text">{unreadCount}</span>
            </motion.div>
          )}

          {/* Subtle Pulse Ring */}
          <motion.div
            className="whatsapp-pulse-ring"
            animate={{
              scale: [1, 1.5, 2],
              opacity: [0.7, 0.4, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
              repeatDelay: 0.5,
            }}
            style={{
              transformOrigin: "center center",
            }}
          />
        </motion.button>
      </motion.div>

      {/* Chat Modal - High-End Glassmorphism */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="whatsapp-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleClose}
            />

            {/* Chat Dialog */}
            <motion.div
              className="whatsapp-dialog"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 30,
                duration: 0.2 
              }}
            >
              <div className="whatsapp-dialog-content">
                {/* Header */}
                <div className="whatsapp-dialog-header">
                  <div className="whatsapp-dialog-header-left">
                    <div className="whatsapp-dialog-avatar">
                      <svg className="whatsapp-dialog-icon" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                      {isOnline && (
                        <motion.div
                          className="whatsapp-online-indicator"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="whatsapp-dialog-title">NEXCEL AI</h3>
                      <div className="whatsapp-dialog-status">
                        <motion.div
                          className="whatsapp-status-dot"
                          style={{ background: isOnline ? "#10B981" : "#6B7280" }}
                          animate={isOnline ? { opacity: [1, 0.6, 1] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <span>{isOnline ? "Online" : "Offline"}</span>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    onClick={handleClose}
                    className="whatsapp-dialog-close"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>

                {/* Body */}
                <div className="whatsapp-dialog-body">
                  <p className="whatsapp-dialog-text">
                    Haben Sie Fragen? Schreiben Sie uns direkt auf WhatsApp! Wir antworten schnellstmöglich.
                  </p>
                  <motion.button
                    onClick={handleWhatsAppClick}
                    className="whatsapp-dialog-button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
                    <svg className="whatsapp-dialog-button-icon" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    <span>Chat starten</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
