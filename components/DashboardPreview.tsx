"use client";

import React, { useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { createPortal } from "react-dom";

// Futuristische High-End Icons - 2060 Design
const CalendarIcon = ({ active, theme }: { active: boolean; theme: "dark" | "light" }) => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <defs>
      <linearGradient id="cal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={active 
          ? theme === "dark" ? "rgba(255, 255, 255, 0.95)" : "rgba(0, 0, 0, 0.95)"
          : theme === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)"} />
        <stop offset="100%" stopColor={active 
          ? theme === "dark" ? "rgba(200, 220, 255, 0.8)" : "rgba(124, 58, 237, 0.8)"
          : theme === "dark" ? "rgba(200, 220, 255, 0.2)" : "rgba(124, 58, 237, 0.2)"} />
      </linearGradient>
    </defs>
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="url(#cal-grad)" strokeWidth={1.5} fill="none" />
    <path d="M16 2v4M8 2v4M3 10h18" stroke="url(#cal-grad)" strokeWidth={1.5} strokeLinecap="round" />
    <circle cx="12" cy="15" r="1.5" fill={active 
      ? theme === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)"
      : theme === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"} />
  </svg>
);

const FlowIcon = ({ active, theme }: { active: boolean; theme: "dark" | "light" }) => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <defs>
      <linearGradient id="flow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={active 
          ? theme === "dark" ? "rgba(255, 255, 255, 0.95)" : "rgba(0, 0, 0, 0.95)"
          : theme === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)"} />
        <stop offset="100%" stopColor={active 
          ? theme === "dark" ? "rgba(200, 220, 255, 0.8)" : "rgba(124, 58, 237, 0.8)"
          : theme === "dark" ? "rgba(200, 220, 255, 0.2)" : "rgba(124, 58, 237, 0.2)"} />
      </linearGradient>
    </defs>
    <path d="M13 7l5 5m0 0l-5 5m5-5H6" stroke="url(#flow-grad)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="4" cy="12" r="2" fill={active 
      ? theme === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)"
      : theme === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"} />
    <circle cx="20" cy="12" r="2" fill={active 
      ? theme === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)"
      : theme === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"} />
  </svg>
);

const TasksIcon = ({ active, theme }: { active: boolean; theme: "dark" | "light" }) => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <defs>
      <linearGradient id="task-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={active 
          ? theme === "dark" ? "rgba(255, 255, 255, 0.95)" : "rgba(0, 0, 0, 0.95)"
          : theme === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)"} />
        <stop offset="100%" stopColor={active 
          ? theme === "dark" ? "rgba(200, 220, 255, 0.8)" : "rgba(124, 58, 237, 0.8)"
          : theme === "dark" ? "rgba(200, 220, 255, 0.2)" : "rgba(124, 58, 237, 0.2)"} />
      </linearGradient>
    </defs>
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="url(#task-grad)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SpeditionIcon = ({ active, theme }: { active: boolean; theme: "dark" | "light" }) => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <defs>
      <linearGradient id="sped-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={active 
          ? theme === "dark" ? "rgba(255, 255, 255, 0.95)" : "rgba(0, 0, 0, 0.95)"
          : theme === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)"} />
        <stop offset="100%" stopColor={active 
          ? theme === "dark" ? "rgba(200, 220, 255, 0.8)" : "rgba(124, 58, 237, 0.8)"
          : theme === "dark" ? "rgba(200, 220, 255, 0.2)" : "rgba(124, 58, 237, 0.2)"} />
      </linearGradient>
    </defs>
    <rect x="3" y="8" width="18" height="10" rx="1" stroke="url(#sped-grad)" strokeWidth={1.5} fill="none" />
    <rect x="5" y="6" width="6" height="4" rx="0.5" stroke="url(#sped-grad)" strokeWidth={1.5} fill="none" />
    <circle cx="7" cy="20" r="2" fill={active 
      ? theme === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(124, 58, 237, 0.3)"
      : theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(124, 58, 237, 0.1)"} stroke="url(#sped-grad)" strokeWidth={1.5} />
    <circle cx="17" cy="20" r="2" fill={active 
      ? theme === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(124, 58, 237, 0.3)"
      : theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(124, 58, 237, 0.1)"} stroke="url(#sped-grad)" strokeWidth={1.5} />
    <path d="M3 12h18" stroke="url(#sped-grad)" strokeWidth={1.5} strokeLinecap="round" />
  </svg>
);

const DriverIcon = ({ active, theme }: { active: boolean; theme: "dark" | "light" }) => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <defs>
      <linearGradient id="driver-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={active 
          ? theme === "dark" ? "rgba(255, 255, 255, 0.95)" : "rgba(0, 0, 0, 0.95)"
          : theme === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)"} />
        <stop offset="100%" stopColor={active 
          ? theme === "dark" ? "rgba(200, 220, 255, 0.8)" : "rgba(124, 58, 237, 0.8)"
          : theme === "dark" ? "rgba(200, 220, 255, 0.2)" : "rgba(124, 58, 237, 0.2)"} />
      </linearGradient>
    </defs>
    <circle cx="12" cy="8" r="3" stroke="url(#driver-grad)" strokeWidth={1.5} fill="none" />
    <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="url(#driver-grad)" strokeWidth={1.5} strokeLinecap="round" />
    <circle cx="12" cy="8" r="1.5" fill={active 
      ? theme === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)"
      : theme === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"} />
  </svg>
);

const TimeIcon = ({ active, theme }: { active: boolean; theme: "dark" | "light" }) => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <defs>
      <linearGradient id="time-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={active 
          ? theme === "dark" ? "rgba(255, 255, 255, 0.95)" : "rgba(0, 0, 0, 0.95)"
          : theme === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)"} />
        <stop offset="100%" stopColor={active 
          ? theme === "dark" ? "rgba(200, 220, 255, 0.8)" : "rgba(124, 58, 237, 0.8)"
          : theme === "dark" ? "rgba(200, 220, 255, 0.2)" : "rgba(124, 58, 237, 0.2)"} />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="9" stroke="url(#time-grad)" strokeWidth={1.5} fill="none" />
    <path d="M12 6v6l4 2" stroke="url(#time-grad)" strokeWidth={1.5} strokeLinecap="round" />
    <circle cx="12" cy="12" r="1" fill={active 
      ? theme === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)"
      : theme === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"} />
  </svg>
);

const SettingsIcon = ({ active, theme }: { active: boolean; theme: "dark" | "light" }) => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <defs>
      <linearGradient id="settings-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={active 
          ? theme === "dark" ? "rgba(255, 255, 255, 0.95)" : "rgba(0, 0, 0, 0.95)"
          : theme === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)"} />
        <stop offset="100%" stopColor={active 
          ? theme === "dark" ? "rgba(200, 220, 255, 0.8)" : "rgba(124, 58, 237, 0.8)"
          : theme === "dark" ? "rgba(200, 220, 255, 0.2)" : "rgba(124, 58, 237, 0.2)"} />
      </linearGradient>
    </defs>
    <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke="url(#settings-grad)" strokeWidth={1.5} strokeLinecap="round" />
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="url(#settings-grad)" strokeWidth={1.5} fill="none" />
  </svg>
);

const OverviewIcon = ({ active, theme }: { active: boolean; theme: "dark" | "light" }) => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <defs>
      <linearGradient id="overview-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={active 
          ? theme === "dark" ? "rgba(255, 255, 255, 0.95)" : "rgba(0, 0, 0, 0.95)"
          : theme === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)"} />
        <stop offset="100%" stopColor={active 
          ? theme === "dark" ? "rgba(200, 220, 255, 0.8)" : "rgba(124, 58, 237, 0.8)"
          : theme === "dark" ? "rgba(200, 220, 255, 0.2)" : "rgba(124, 58, 237, 0.2)"} />
      </linearGradient>
    </defs>
    <rect x="3" y="3" width="7" height="7" rx="1" stroke="url(#overview-grad)" strokeWidth={1.5} fill="none" />
    <rect x="14" y="3" width="7" height="7" rx="1" stroke="url(#overview-grad)" strokeWidth={1.5} fill="none" />
    <rect x="3" y="14" width="7" height="7" rx="1" stroke="url(#overview-grad)" strokeWidth={1.5} fill="none" />
    <rect x="14" y="14" width="7" height="7" rx="1" stroke="url(#overview-grad)" strokeWidth={1.5} fill="none" />
  </svg>
);

// View Components
// High-End Chat Interface Component - Responsive & Positioned with Voice
// High-End Chat Interface Component - Memoized for Performance
const ChatInterface = ({ 
  theme, 
  messages, 
  input, 
  onInputChange, 
  onSend, 
  onClose,
  detailSections,
  position,
  isListening,
  onToggleListening,
  isMobile
}: { 
  theme: "dark" | "light"; 
  messages: Array<{ role: "user" | "assistant"; content: string }>; 
  input: string; 
  onInputChange: (value: string) => void; 
  onSend: (message: string) => void; 
  onClose: () => void;
  detailSections: any;
  position: { top: number; left: number; width: number };
  isListening: boolean;
  onToggleListening: () => void;
  isMobile: boolean;
}) => {
  const overlayPositionRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isListening) {
      inputRef.current?.focus();
    }
  }, [isListening]);

  // Speech Recognition Setup - Only in Browser
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SpeechRecognition) return;
      
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "de-DE";

      recognitionRef.current.onresult = (event: any) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const transcript = event.results[0][0].transcript;
          onInputChange(transcript);
          onToggleListening();
        }
      };

      recognitionRef.current.onerror = () => {
        onToggleListening();
      };

      recognitionRef.current.onend = () => {
        onToggleListening();
      };
    } catch (error) {
      console.error("Speech Recognition not available:", error);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    };
  }, [onInputChange, onToggleListening]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Speech recognition error:", e);
        onToggleListening();
      }
    } else if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
    }
  }, [isListening, onToggleListening]);

  const handleSend = () => {
    if (input.trim() && !isListening) {
      onSend(input.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isListening) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Backdrop - Mobile Only */}
      {isMobile && (
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ zIndex: 99998 }}
        />
      )}
      
      {/* Chat Overlay - Always positioned absolutely within preview - GPU-accelerated */}
      <motion.div
        ref={overlayPositionRef}
        className="absolute"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          top: "var(--chat-top, 0px)",
          left: "var(--chat-left, 0px)",
          width: "var(--chat-width, 600px)",
          zIndex: 99999,
          pointerEvents: "auto",
          willChange: "transform, opacity",
          transform: "translateZ(0)",
        }}
      >
        <motion.div
          className="relative w-full rounded-[32px] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          style={{
            height: isMobile ? "85vh" : "70vh",
            maxHeight: isMobile ? "600px" : "700px",
            minHeight: "400px",
            minWidth: "320px",
            background: theme === "dark"
              ? "linear-gradient(180deg, rgba(0, 0, 0, 0.98) 0%, rgba(8, 10, 18, 0.96) 100%)"
              : "linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.96) 100%)",
            backdropFilter: "blur(120px) saturate(250%)",
            WebkitBackdropFilter: "blur(120px) saturate(250%)",
            border: theme === "dark"
              ? "1px solid rgba(255, 255, 255, 0.3)"
              : "1px solid rgba(0, 0, 0, 0.2)",
            boxShadow: theme === "dark"
              ? "0 32px 128px rgba(0, 0, 0, 0.9), 0 0 0 0.5px rgba(255, 255, 255, 0.2) inset, 0 0 120px rgba(168, 85, 247, 0.4), 0 0 180px rgba(139, 92, 246, 0.3), 0 20px 60px rgba(0, 0, 0, 0.6)"
              : "0 32px 128px rgba(0, 0, 0, 0.3), 0 0 0 0.5px rgba(0, 0, 0, 0.12) inset, 0 0 80px rgba(124, 58, 237, 0.25), 0 20px 60px rgba(0, 0, 0, 0.2)",
          }}
        >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{
            borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: theme === "dark"
                  ? "linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(139, 92, 246, 0.2))"
                  : "linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(139, 92, 246, 0.15))",
              }}
            >
              <motion.div
                className="w-3 h-3 rounded-full"
                style={{ background: "#A45CFF" }}
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div>
              <h3
                className="font-semibold text-base"
                style={{ color: theme === "dark" ? "#FFFFFF" : "#0C0F1A" }}
              >
                ChronexAI
              </h3>
              <p
                className="text-xs"
                style={{ color: theme === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)" }}
              >
                Online
              </p>
            </div>
          </div>
          <motion.button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
            }}
            whileHover={{ scale: 1.1, background: theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)" }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div
                className="max-w-[80%] rounded-2xl px-4 py-3"
                style={{
                  background: msg.role === "user"
                    ? theme === "dark"
                      ? "linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(139, 92, 246, 0.2))"
                      : "linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(139, 92, 246, 0.15))"
                    : theme === "dark"
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.05)",
                  border: msg.role === "user"
                    ? theme === "dark"
                      ? "1px solid rgba(168, 85, 247, 0.4)"
                      : "1px solid rgba(124, 58, 237, 0.3)"
                    : theme === "dark"
                    ? "1px solid rgba(255, 255, 255, 0.1)"
                    : "1px solid rgba(0, 0, 0, 0.1)",
                  color: theme === "dark" ? "#FFFFFF" : "#0C0F1A",
                }}
              >
                <p className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</p>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input - High-End with Voice */}
        <div
          className="p-3 sm:p-4 border-t"
          style={{
            borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
          }}
        >
          <div className="flex gap-2 sm:gap-3">
            {/* Voice Input Button */}
            <motion.button
              onClick={onToggleListening}
              className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: isListening
                  ? theme === "dark"
                    ? "linear-gradient(135deg, rgba(255, 59, 48, 0.8), rgba(255, 45, 85, 0.7))"
                    : "linear-gradient(135deg, rgba(239, 68, 68, 0.8), rgba(220, 38, 38, 0.7))"
                  : theme === "dark"
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.08)",
                border: theme === "dark"
                  ? "1px solid rgba(255, 255, 255, 0.15)"
                  : "1px solid rgba(0, 0, 0, 0.1)",
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={isListening ? {
                scale: [1, 1.1, 1],
              } : {}}
              transition={{ duration: 1.5, repeat: isListening ? Infinity : 0 }}
            >
              {isListening ? (
                <motion.div
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                  style={{ background: "#FFFFFF" }}
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </motion.button>
            
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isListening ? "Höre zu..." : "Fragen Sie nach Touren, Fahrern, Terminen..."}
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm"
              style={{
                background: theme === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
                border: theme === "dark" ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.1)",
                color: theme === "dark" ? "#FFFFFF" : "#0C0F1A",
              }}
              disabled={isListening}
            />
            <motion.button
              onClick={handleSend}
              disabled={!input.trim() || isListening}
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-medium text-xs sm:text-sm flex-shrink-0"
              style={{
                background: input.trim() && !isListening
                  ? theme === "dark"
                    ? "linear-gradient(135deg, rgba(168, 85, 247, 0.9), rgba(139, 92, 246, 0.8))"
                    : "linear-gradient(135deg, rgba(124, 58, 237, 0.9), rgba(139, 92, 246, 0.8))"
                  : theme === "dark"
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.1)",
                color: "#FFFFFF",
                opacity: input.trim() && !isListening ? 1 : 0.5,
              }}
              whileHover={input.trim() && !isListening ? { scale: 1.05 } : {}}
              whileTap={input.trim() && !isListening ? { scale: 0.95 } : {}}
            >
              Senden
            </motion.button>
          </div>
          {isListening && (
            <motion.div
              className="mt-2 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-xs sm:text-sm" style={{ color: theme === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)" }}>
                🎤 Höre zu... Sprechen Sie jetzt
              </p>
            </motion.div>
          )}
        </div>
        </motion.div>
      </motion.div>
    </>
  );
};

const OverviewView = () => {
  const { theme } = useTheme();
  const [pulseValues, setPulseValues] = useState<number[]>([0, 0, 0, 0, 0]);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseValues((prev) => prev.map((_, i) => (Math.random() > 0.7 ? 1 : 0)));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      label: "TOUREN HEUTE",
      value: "247",
      subtitle: "17 abgeschlossen",
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      iconBg: theme === "dark" ? "rgba(0, 225, 255, 0.15)" : "rgba(124, 58, 237, 0.15)",
      number: "17",
      gradient: theme === "dark" 
        ? "linear-gradient(135deg, rgba(0, 225, 255, 0.25), rgba(164, 92, 255, 0.15))"
        : "linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(124, 58, 237, 0.15))",
      glow: theme === "dark" ? "0 0 30px rgba(0, 225, 255, 0.3)" : "0 0 30px rgba(124, 58, 237, 0.2)",
      onClick: () => console.log("TOUREN HEUTE clicked"),
    },
    {
      label: "AKTIVE TOUREN",
      value: "12",
      subtitle: "8 gestartet, 4 unterwegs",
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      iconBg: theme === "dark" ? "rgba(164, 92, 255, 0.15)" : "rgba(124, 58, 237, 0.15)",
      number: null,
      gradient: theme === "dark"
        ? "linear-gradient(135deg, rgba(164, 92, 255, 0.25), rgba(0, 225, 255, 0.15))"
        : "linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(124, 58, 237, 0.15))",
      glow: theme === "dark" ? "0 0 30px rgba(164, 92, 255, 0.3)" : "0 0 30px rgba(124, 58, 237, 0.2)",
      onClick: () => console.log("AKTIVE TOUREN clicked"),
    },
    {
      label: "FREIE FAHRER",
      value: "8",
      subtitle: "12 gesamt",
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      iconBg: theme === "dark" ? "rgba(0, 255, 150, 0.15)" : "rgba(34, 197, 94, 0.15)",
      number: null,
      gradient: theme === "dark"
        ? "linear-gradient(135deg, rgba(0, 255, 150, 0.25), rgba(0, 225, 255, 0.15))"
        : "linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(124, 58, 237, 0.15))",
      glow: theme === "dark" ? "0 0 30px rgba(0, 255, 150, 0.3)" : "0 0 30px rgba(34, 197, 94, 0.2)",
      onClick: () => console.log("FREIE FAHRER clicked"),
    },
    {
      label: "FAHRZEUGE UNTERWEGS",
      value: "15",
      subtitle: "28 gesamt",
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      iconBg: theme === "dark" ? "rgba(255, 200, 100, 0.15)" : "rgba(251, 191, 36, 0.15)",
      number: null,
      gradient: theme === "dark"
        ? "linear-gradient(135deg, rgba(255, 200, 100, 0.25), rgba(255, 150, 50, 0.15))"
        : "linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(124, 58, 237, 0.15))",
      glow: theme === "dark" ? "0 0 30px rgba(255, 200, 100, 0.3)" : "0 0 30px rgba(251, 191, 36, 0.2)",
      onClick: () => console.log("FAHRZEUGE UNTERWEGS clicked"),
    },
    {
      label: "OFFENE AUFTRÄGE",
      value: "23",
      subtitle: "47 gesamt",
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      iconBg: theme === "dark" ? "rgba(0, 225, 255, 0.15)" : "rgba(124, 58, 237, 0.15)",
      number: null,
      gradient: theme === "dark"
        ? "linear-gradient(135deg, rgba(0, 225, 255, 0.25), rgba(164, 92, 255, 0.15))"
        : "linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(124, 58, 237, 0.15))",
      glow: theme === "dark" ? "0 0 30px rgba(0, 225, 255, 0.3)" : "0 0 30px rgba(124, 58, 237, 0.2)",
      onClick: () => console.log("OFFENE AUFTRÄGE clicked"),
    },
  ];

  const detailSections = [
    {
      title: "Aktive Touren",
      items: [
        { id: 1247, destination: "München", driver: "Max M.", eta: "14:30", status: "Unterwegs" },
        { id: 1248, destination: "Berlin", driver: "Anna K.", eta: "16:45", status: "Gestartet" },
        { id: 1249, destination: "Hamburg", driver: "Tom S.", eta: "18:20", status: "Unterwegs" },
      ],
    },
    {
      title: "Fahrzeuge unterwegs",
      items: [
        { type: "LKW", id: "LKW-12", driver: "Max M.", destination: "München", status: "Aktiv" },
        { type: "LKW", id: "LKW-08", driver: "Anna K.", destination: "Berlin", status: "Aktiv" },
        { type: "Transporter", id: "TR-15", driver: "Tom S.", destination: "Hamburg", status: "Aktiv" },
      ],
    },
    {
      title: "Heutige Termine",
      items: [
        { time: "09:00", type: "Abholung", location: "München", status: "Geplant" },
        { time: "14:30", type: "Zustellung", location: "Berlin", status: "Geplant" },
        { time: "16:45", type: "Abholung", location: "Hamburg", status: "Geplant" },
      ],
    },
    {
      title: "Freie Fahrer",
      items: [
        { name: "Max Mustermann", status: "Verfügbar", tours: 3, rating: 4.8 },
        { name: "Anna Schmidt", status: "Verfügbar", tours: 2, rating: 4.9 },
        { name: "Tom Weber", status: "Verfügbar", tours: 1, rating: 4.7 },
      ],
    },
    {
      title: "Offene Aufträge",
      items: [
        { id: "A-1247", priority: "Hoch", destination: "München", status: "Wartend" },
        { id: "A-1248", priority: "Mittel", destination: "Berlin", status: "Wartend" },
        { id: "A-1249", priority: "Hoch", destination: "Hamburg", status: "Wartend" },
      ],
    },
  ];

  const systemMetrics = [
    { label: "System-Performance", value: "98%", color: theme === "dark" ? "#00E1FF" : "#7C3AED", progress: 98 },
    { label: "Route-Optimierung", value: "94%", color: theme === "dark" ? "#A45CFF" : "#7C3AED", progress: 94 },
    { label: "KI-Genauigkeit", value: "96%", color: theme === "dark" ? "#00FF96" : "#34C25E", progress: 96 },
    { label: "Automatisierung", value: "92%", color: theme === "dark" ? "#FFC864" : "#FBBF24", progress: 92 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h4 className={`text-xl sm:text-2xl font-bold mb-2 transition-colors duration-500 ${
          theme === "dark" ? "text-white" : "text-[#0C0F1A]"
        }`}>Übersicht</h4>
        <p className={`text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed transition-colors duration-500 ${
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        }`}>
          Deine KI-gestützte Übersicht über Termine, Fahrer, Fahrzeuge und Aufträge.
        </p>
        
        {/* 5 KPI Cards - High-End Interactive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {stats.map((stat, index) => (
            <motion.button
              key={index}
              className="relative rounded-xl p-4 sm:p-5 min-h-[140px] sm:min-h-[160px] flex flex-col justify-between overflow-hidden text-left cursor-pointer group"
              style={{
                background: selectedCard === index
                  ? stat.gradient
                  : theme === "dark" 
                    ? "rgba(255, 255, 255, 0.03)" 
                    : "rgba(0, 0, 0, 0.03)",
                border: selectedCard === index
                  ? theme === "dark"
                    ? "1px solid rgba(0, 225, 255, 0.4)"
                    : "1px solid rgba(124, 58, 237, 0.4)"
                  : theme === "dark"
                    ? "1px solid rgba(255, 255, 255, 0.1)"
                    : "1px solid rgba(0, 0, 0, 0.1)",
                boxShadow: selectedCard === index
                  ? stat.glow
                  : theme === "dark"
                    ? "0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                    : "0 4px 20px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(0, 0, 0, 0.05)",
              }}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: selectedCard === index ? 1.02 : 1,
              }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{
                scale: 1.05,
                y: -4,
                borderColor: theme === "dark" 
                  ? "rgba(0, 225, 255, 0.5)" 
                  : "rgba(124, 58, 237, 0.5)",
                boxShadow: stat.glow,
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedCard(selectedCard === index ? null : index);
                stat.onClick();
              }}
            >
              {/* Animated Background Gradient */}
              <motion.div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: stat.gradient,
                }}
                animate={{ 
                  opacity: selectedCard === index ? 0.3 : pulseValues[index] * 0.2 + 0.1 
                }}
                transition={{ duration: 0.6 }}
              />
              
              {/* Glow Effect */}
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${theme === "dark" ? "rgba(0, 225, 255, 0.1)" : "rgba(124, 58, 237, 0.1)"} 0%, transparent 70%)`,
                }}
                animate={{ 
                  opacity: selectedCard === index ? 0.5 : pulseValues[index] * 0.3 + 0.1 
                }}
                transition={{ duration: 0.8 }}
              />
              
              <div className="flex items-start justify-between mb-3 relative z-10">
                <motion.div
                  className="p-2.5 rounded-xl transition-all duration-300"
                  style={{ 
                    background: stat.iconBg,
                    boxShadow: selectedCard === index 
                      ? `0 0 20px ${theme === "dark" ? "rgba(0, 225, 255, 0.4)" : "rgba(124, 58, 237, 0.4)"}`
                      : "none",
                  }}
                  whileHover={{ scale: 1.15, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className={theme === "dark" ? "text-white" : "text-[#0C0F1A]"}>{stat.icon}</div>
                </motion.div>
                {stat.number && (
                  <motion.div
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${
                      theme === "dark" ? "text-white" : "text-[#0C0F1A]"
                    }`}
                    style={{ 
                      background: theme === "dark" 
                        ? "rgba(0, 225, 255, 0.25)" 
                        : "rgba(124, 58, 237, 0.25)",
                      boxShadow: `0 0 15px ${theme === "dark" ? "rgba(0, 225, 255, 0.5)" : "rgba(124, 58, 237, 0.5)"}`,
                    }}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 300 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    {stat.number}
                  </motion.div>
                )}
              </div>
              <div className="flex-1 flex flex-col justify-center relative z-10">
                <motion.div 
                  className={`text-2xl sm:text-3xl font-bold mb-2 leading-tight bg-gradient-to-r bg-clip-text ${
                    theme === "dark" 
                      ? "text-transparent bg-gradient-to-r from-white via-[#00E1FF] to-white" 
                      : "text-transparent bg-gradient-to-r from-[#0C0F1A] via-[#7C3AED] to-[#0C0F1A]"
                  }`}
                  style={{
                    backgroundImage: theme === "dark"
                      ? "linear-gradient(135deg, #FFFFFF, #00E1FF, #A45CFF, #FFFFFF)"
                      : "linear-gradient(135deg, #0C0F1A, #7C3AED, #7C3AED, #0C0F1A)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1, type: "spring", stiffness: 200 }}
                  whileHover={{ scale: 1.1 }}
                >
                  {stat.value}
                </motion.div>
                <div className={`text-xs sm:text-sm font-semibold mb-1.5 leading-tight ${
                  theme === "dark" ? "text-white/90" : "text-[#1B2030]/90"
                }`}>{stat.label}</div>
                <div className={`text-xs leading-relaxed ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>{stat.subtitle}</div>
              </div>
              
              {/* Click Indicator */}
              {selectedCard === index && (
                <motion.div
                  className="absolute top-2 right-2 w-2 h-2 rounded-full"
                  style={{
                    background: theme === "dark" ? "#00E1FF" : "#7C3AED",
                    boxShadow: `0 0 10px ${theme === "dark" ? "rgba(0, 225, 255, 0.8)" : "rgba(124, 58, 237, 0.8)"}`,
                  }}
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 6 Detail Cards in 2 Columns - Interactive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {detailSections.map((section, index) => (
          <motion.div
            key={index}
            className="rounded-xl p-5 sm:p-6 min-h-[180px] sm:min-h-[200px] flex flex-col justify-between transition-all duration-500 cursor-pointer group relative overflow-hidden"
            style={{
              background: theme === "dark" 
                ? "rgba(255, 255, 255, 0.02)" 
                : "rgba(0, 0, 0, 0.02)",
              border: theme === "dark"
                ? "1px solid rgba(255, 255, 255, 0.1)"
                : "1px solid rgba(0, 0, 0, 0.1)",
              boxShadow: theme === "dark"
                ? "0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                : "0 8px 24px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(0, 0, 0, 0.05)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{
              borderColor: theme === "dark" 
                ? "rgba(0, 225, 255, 0.4)" 
                : "rgba(124, 58, 237, 0.4)",
              scale: 1.02,
              y: -4,
              boxShadow: theme === "dark"
                ? "0 12px 40px rgba(0, 225, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                : "0 12px 40px rgba(124, 58, 237, 0.2), inset 0 1px 0 rgba(0, 0, 0, 0.1)",
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => console.log(`${section.title} clicked`)}
          >
            {/* Hover Gradient */}
            <motion.div
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: theme === "dark"
                  ? "linear-gradient(135deg, rgba(0, 225, 255, 0.1), rgba(164, 92, 255, 0.05))"
                  : "linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(124, 58, 237, 0.05))",
              }}
            />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h5 className={`text-base sm:text-lg font-bold leading-tight transition-colors duration-500 ${
                  theme === "dark" ? "text-white" : "text-[#0C0F1A]"
                }`}>{section.title}</h5>
                <motion.div
                  className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors duration-300 ${
                    theme === "dark" 
                      ? "bg-white/10 text-white/60 group-hover:bg-white/20 group-hover:text-white" 
                      : "bg-black/10 text-gray-600 group-hover:bg-black/20 group-hover:text-[#0C0F1A]"
                  }`}
                  whileHover={{ scale: 1.1 }}
                >
                  {section.items.length}
                </motion.div>
              </div>
              <div className="space-y-3">
                {section.items.map((item, i) => (
                  <motion.button
                    key={i}
                    className="w-full text-left flex items-center justify-between py-3 px-3 rounded-lg transition-all duration-300 group/item relative overflow-hidden"
                    style={{
                      background: theme === "dark" 
                        ? "rgba(255, 255, 255, 0.02)" 
                        : "rgba(0, 0, 0, 0.02)",
                      border: theme === "dark"
                        ? "1px solid rgba(255, 255, 255, 0.05)"
                        : "1px solid rgba(0, 0, 0, 0.05)",
                    }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 + i * 0.05 }}
                    whileHover={{
                      scale: 1.02,
                      x: 4,
                      borderColor: theme === "dark" 
                        ? "rgba(0, 225, 255, 0.3)" 
                        : "rgba(124, 58, 237, 0.3)",
                      background: theme === "dark"
                        ? "rgba(0, 225, 255, 0.08)"
                        : "rgba(124, 58, 237, 0.08)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`${section.title} - Item ${i} clicked`, item);
                    }}
                  >
                    {/* Item Hover Glow */}
                    <motion.div
                      className="absolute inset-0 rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"
                      style={{
                        background: theme === "dark"
                          ? "linear-gradient(90deg, rgba(0, 225, 255, 0.1), transparent)"
                          : "linear-gradient(90deg, rgba(124, 58, 237, 0.1), transparent)",
                      }}
                    />
                    
                    <div className="flex-1 relative z-10">
                      {section.title === "Aktive Touren" && "id" in item && "destination" in item && (
                        <div className={`text-sm font-medium transition-colors duration-500 ${
                          theme === "dark" ? "text-white" : "text-[#0C0F1A]"
                        }`}>
                          Tour #{item.id} → <span className="font-semibold">{item.destination}</span>
                        </div>
                      )}
                      {section.title === "Fahrzeuge unterwegs" && "id" in item && "type" in item && "destination" in item && (
                        <div className={`text-sm font-medium transition-colors duration-500 ${
                          theme === "dark" ? "text-white" : "text-[#0C0F1A]"
                        }`}>
                          <span className="font-semibold">{item.type} {item.id}</span> → {item.destination}
                        </div>
                      )}
                      {section.title === "Heutige Termine" && "time" in item && "type" in item && "location" in item && (
                        <div className={`text-sm font-medium transition-colors duration-500 ${
                          theme === "dark" ? "text-white" : "text-[#0C0F1A]"
                        }`}>
                          <span className="font-mono text-[#00E1FF]">{item.time}</span> - {item.type} <span className="font-semibold">{item.location}</span>
                        </div>
                      )}
                      {section.title === "Freie Fahrer" && "name" in item && "tours" in item && "rating" in item && (
                        <div className={`text-sm font-medium transition-colors duration-500 ${
                          theme === "dark" ? "text-white" : "text-[#0C0F1A]"
                        }`}>
                          <span className="font-semibold">{item.name}</span> • {item.tours} Touren • <span className="text-yellow-400">⭐ {item.rating}</span>
                        </div>
                      )}
                      {section.title === "Offene Aufträge" && "id" in item && "destination" in item && (
                        <div className={`text-sm font-medium transition-colors duration-500 ${
                          theme === "dark" ? "text-white" : "text-[#0C0F1A]"
                        }`}>
                          <span className="font-semibold">{item.id}</span> → {item.destination}
                        </div>
                      )}
                      <div className={`text-xs mt-1.5 transition-colors duration-500 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}>
                        {section.title === "Aktive Touren" && "driver" in item && "eta" in item && `Fahrer: ${item.driver} • ETA: ${item.eta}`}
                        {section.title === "Fahrzeuge unterwegs" && "driver" in item && "status" in item && `Fahrer: ${item.driver} • Status: ${item.status}`}
                        {section.title === "Heutige Termine" && "status" in item && `Status: ${item.status}`}
                        {section.title === "Freie Fahrer" && "status" in item && `Status: ${item.status} • Verfügbar`}
                        {section.title === "Offene Aufträge" && "priority" in item && "status" in item && `${item.priority} Priorität • ${item.status}`}
                      </div>
                    </div>
                    {section.title === "Aktive Touren" && (
                      <motion.div 
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold ml-3 transition-all duration-300 relative z-10 ${
                          item.status === "Unterwegs"
                            ? theme === "dark"
                              ? "bg-[#00E1FF]/20 text-[#00E1FF] border border-[#00E1FF]/30"
                              : "bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30"
                            : theme === "dark"
                              ? "bg-white/15 text-white/80 border border-white/20"
                              : "bg-[#7C3AED]/15 text-[#7C3AED]/80 border border-[#7C3AED]/20"
                        }`}
                        whileHover={{ scale: 1.1 }}
                        style={{
                          boxShadow: item.status === "Unterwegs"
                            ? `0 0 15px ${theme === "dark" ? "rgba(0, 225, 255, 0.4)" : "rgba(124, 58, 237, 0.4)"}`
                            : "none",
                        }}
                      >
                        {item.status}
                      </motion.div>
                    )}
                    {section.title === "Offene Aufträge" && "priority" in item && (
                      <motion.div 
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold ml-3 transition-all duration-300 relative z-10 ${
                          item.priority === "Hoch"
                            ? theme === "dark"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-red-500/20 text-red-600 border border-red-500/30"
                            : theme === "dark"
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              : "bg-yellow-500/20 text-yellow-600 border border-yellow-500/30"
                        }`}
                        whileHover={{ scale: 1.1 }}
                      >
                        {item.priority}
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
        
        {/* System-Übersicht Card - High-End Performance Dashboard */}
        <motion.div
          className="rounded-xl p-5 sm:p-6 min-h-[180px] sm:min-h-[200px] flex flex-col justify-between transition-all duration-500 cursor-pointer group relative overflow-hidden md:col-span-1"
          style={{
            background: theme === "dark" 
              ? "rgba(255, 255, 255, 0.02)" 
              : "rgba(0, 0, 0, 0.02)",
            border: theme === "dark"
              ? "1px solid rgba(255, 255, 255, 0.1)"
              : "1px solid rgba(0, 0, 0, 0.1)",
            boxShadow: theme === "dark"
              ? "0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
              : "0 8px 24px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(0, 0, 0, 0.05)",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 + detailSections.length * 0.1, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{
            borderColor: theme === "dark" 
              ? "rgba(0, 225, 255, 0.4)" 
              : "rgba(124, 58, 237, 0.4)",
            scale: 1.02,
            y: -4,
            boxShadow: theme === "dark"
              ? "0 12px 40px rgba(0, 225, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
              : "0 12px 40px rgba(124, 58, 237, 0.2), inset 0 1px 0 rgba(0, 0, 0, 0.1)",
          }}
          whileTap={{ scale: 0.98 }}
          onClick={() => console.log("System-Übersicht clicked")}
        >
          {/* Hover Gradient */}
          <motion.div
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: theme === "dark"
                ? "linear-gradient(135deg, rgba(0, 225, 255, 0.1), rgba(164, 92, 255, 0.05))"
                : "linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(124, 58, 237, 0.05))",
            }}
          />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h5 className={`text-base sm:text-lg font-bold leading-tight transition-colors duration-500 ${
                theme === "dark" ? "text-white" : "text-[#0C0F1A]"
              }`}>System-Übersicht</h5>
              <motion.div
                className={`w-2 h-2 rounded-full ${
                  theme === "dark" ? "bg-[#00FF96]" : "bg-[#34C25E]"
                }`}
                animate={{ 
                  opacity: [1, 0.5, 1],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  boxShadow: `0 0 10px ${theme === "dark" ? "rgba(0, 255, 150, 0.8)" : "rgba(34, 197, 94, 0.8)"}`,
                }}
              />
            </div>
            
            {/* Performance Metrics */}
            <div className="space-y-4">
              {systemMetrics.map((metric, i) => (
                <motion.div
                  key={i}
                  className="space-y-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <div className={`text-xs font-medium transition-colors duration-500 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>{metric.label}</div>
                    <div 
                      className="text-sm font-bold transition-colors duration-500"
                      style={{ color: metric.color }}
                    >
                      {metric.value}
                    </div>
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden transition-colors duration-500 ${
                    theme === "dark" ? "bg-white/5" : "bg-black/5"
                  }`}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${metric.color}, ${metric.color}dd)`,
                        boxShadow: `0 0 10px ${metric.color}66`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.progress}%` }}
                      transition={{ duration: 1.5, delay: 0.6 + i * 0.1, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Quick Stats */}
            <div className="mt-6 pt-4 border-t"
              style={{
                borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
              }}
            >
              <div className="grid grid-cols-3 gap-3">
                {[
                  { 
                    label: "Heute", 
                    value: "247", 
                    icon: (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="dashboardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={theme === "dark" ? "#00E1FF" : "#7C3AED"} />
                            <stop offset="100%" stopColor={theme === "dark" ? "#A45CFF" : "#7C3AED"} />
                          </linearGradient>
                        </defs>
                        <rect x="3" y="3" width="6" height="6" rx="1" fill="url(#dashboardGrad)" opacity="0.8" />
                        <rect x="13" y="3" width="6" height="6" rx="1" fill="url(#dashboardGrad)" opacity="0.6" />
                        <rect x="3" y="13" width="6" height="6" rx="1" fill="url(#dashboardGrad)" opacity="0.4" />
                        <rect x="13" y="13" width="6" height="6" rx="1" fill="url(#dashboardGrad)" opacity="0.9" />
                      </svg>
                    )
                  },
                  { 
                    label: "Woche", 
                    value: "1.2K", 
                    icon: (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="trendGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={theme === "dark" ? "#00E1FF" : "#7C3AED"} />
                            <stop offset="100%" stopColor={theme === "dark" ? "#A45CFF" : "#7C3AED"} />
                          </linearGradient>
                        </defs>
                        <path 
                          d="M3 18 L7 12 L11 14 L15 8 L19 10 L21 6" 
                          stroke="url(#trendGrad)" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          fill="none"
                        />
                        <circle cx="3" cy="18" r="1.5" fill={theme === "dark" ? "#00E1FF" : "#7C3AED"} />
                        <circle cx="21" cy="6" r="1.5" fill={theme === "dark" ? "#A45CFF" : "#7C3AED"} />
                      </svg>
                    )
                  },
                  { 
                    label: "Monat", 
                    value: "5.1K", 
                    icon: (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="rocketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={theme === "dark" ? "#00FF96" : "#34C25E"} />
                            <stop offset="100%" stopColor={theme === "dark" ? "#00E1FF" : "#7C3AED"} />
                          </linearGradient>
                        </defs>
                        <path 
                          d="M12 2 L15 8 L12 10 L9 8 Z" 
                          fill="url(#rocketGrad)" 
                          opacity="0.9"
                        />
                        <rect x="11" y="10" width="2" height="8" rx="1" fill="url(#rocketGrad)" opacity="0.8" />
                        <path 
                          d="M8 12 L12 14 L16 12" 
                          stroke="url(#rocketGrad)" 
                          strokeWidth="1.5" 
                          strokeLinecap="round" 
                          fill="none"
                        />
                        <circle cx="10" cy="16" r="0.8" fill={theme === "dark" ? "#00FF96" : "#34C25E"} opacity="0.6" />
                        <circle cx="14" cy="16" r="0.8" fill={theme === "dark" ? "#00FF96" : "#34C25E"} opacity="0.6" />
                        <path 
                          d="M6 20 L12 18 L18 20" 
                          stroke="url(#rocketGrad)" 
                          strokeWidth="1.5" 
                          strokeLinecap="round" 
                          fill="none"
                          opacity="0.7"
                        />
                      </svg>
                    )
                  },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    className="text-center p-2 rounded-lg transition-all duration-300 cursor-pointer flex flex-col items-center"
                    style={{
                      background: theme === "dark" 
                        ? "rgba(255, 255, 255, 0.03)" 
                        : "rgba(0, 0, 0, 0.03)",
                    }}
                    whileHover={{
                      scale: 1.1,
                      background: theme === "dark"
                        ? "rgba(0, 225, 255, 0.1)"
                        : "rgba(124, 58, 237, 0.1)",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`${stat.label} clicked`);
                    }}
                  >
                    <motion.div 
                      className="mb-2 flex items-center justify-center"
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      {stat.icon}
                    </motion.div>
                    <div 
                      className={`text-sm font-bold transition-colors duration-500 ${
                        theme === "dark" ? "text-white" : "text-[#0C0F1A]"
                      }`}
                    >
                      {stat.value}
                    </div>
                    <div className={`text-xs transition-colors duration-500 ${
                      theme === "dark" ? "text-gray-500" : "text-gray-600"
                    }`}>
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const CalendarView = () => {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<"tag" | "woche" | "monat" | "jahr">("tag");
  const [selectedDate, setSelectedDate] = useState(new Date(2025, 11, 12)); // Dezember 12, 2025
  const [dayEvents, setDayEvents] = useState([
    { id: 1, time: "09:00", title: "Abholung München", type: "Abholung", duration: 60, color: "#00E1FF" },
    { id: 2, time: "11:30", title: "Tour #1247 Start", type: "Tour", duration: 120, color: "#A45CFF" },
    { id: 3, time: "14:00", title: "Zustellung Berlin", type: "Zustellung", duration: 45, color: "#00E1FF" },
    { id: 4, time: "16:15", title: "Abholung Hamburg", type: "Abholung", duration: 30, color: "#00FF96" },
    { id: 5, time: "18:00", title: "Tour #1248 Start", type: "Tour", duration: 90, color: "#A45CFF" },
  ]);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEventForm, setNewEventForm] = useState({
    time: "09:00",
    title: "",
    type: "Termin",
    duration: 60,
  });
  
  // Function to add new event
  const handleAddEvent = () => {
    if (!newEventForm.title.trim()) {
      alert("Bitte geben Sie einen Titel ein.");
      return;
    }
    
    const eventTypes = {
      "Abholung": "#00E1FF",
      "Tour": "#A45CFF",
      "Zustellung": "#00E1FF",
      "Termin": theme === "dark" ? "#00E1FF" : "#7C3AED",
    };
    
    const newEvent = {
      id: Math.max(...dayEvents.map(e => e.id), 0) + 1,
      time: newEventForm.time,
      title: newEventForm.title,
      type: newEventForm.type,
      duration: newEventForm.duration,
      color: eventTypes[newEventForm.type as keyof typeof eventTypes] || "#00E1FF",
    };
    setDayEvents([...dayEvents, newEvent].sort((a, b) => a.time.localeCompare(b.time)));
    setIsAddingEvent(false);
    setNewEventForm({ time: "09:00", title: "", type: "Termin", duration: 60 });
  };
  
  // Function to check if events overlap and calculate column position
  const getEventPositions = () => {
    const positions = new Map<number, { column: number; totalColumns: number }>();
    
    // Convert events to time-based format
    const eventsWithTime = dayEvents.map(event => {
      const [hour, minute] = event.time.split(":").map(Number);
      const start = hour * 60 + minute;
      const end = start + event.duration;
      return { ...event, start, end };
    });
    
    // Sort by start time, then by duration (shorter first)
    const sortedEvents = [...eventsWithTime].sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return a.end - b.end;
    });
    
    // Group overlapping events
    const columns: Array<Array<typeof eventsWithTime[0]>> = [];
    
    sortedEvents.forEach(event => {
      // Find a column where this event doesn't overlap
      let placed = false;
      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        const column = columns[colIndex];
        // Check if event doesn't overlap with any event in this column
        const noOverlap = column.every(existingEvent => 
          event.end <= existingEvent.start || event.start >= existingEvent.end
        );
        
        if (noOverlap) {
          column.push(event);
          positions.set(event.id, { column: colIndex, totalColumns: columns.length });
          placed = true;
          break;
        }
      }
      
      // If no column found, create a new one
      if (!placed) {
        columns.push([event]);
        positions.set(event.id, { column: columns.length - 1, totalColumns: columns.length });
      }
    });
    
    return positions;
  };
  
  const eventPositions = getEventPositions();
  
  const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const today = new Date();
  const currentDate = selectedDate.getDate();
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  
  // Get week dates (current week)
  const getWeekDates = () => {
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    startOfWeek.setDate(diff);
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  };
  
  const weekDates = getWeekDates();
  
  // Events data
  const events = [
    { date: 1, month: 11, year: 2025, count: 1 },
    { date: 5, month: 11, year: 2025, count: 1 },
    { date: 12, month: 11, year: 2025, count: 2 },
  ];
  
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Check if date has events
  const hasEvents = (date: number, month?: number, year?: number) => {
    return events.some(e => 
      e.date === date && 
      (month === undefined || e.month === month) &&
      (year === undefined || e.year === year)
    );
  };
  
  // Get events for date
  const getEventsForDate = (date: number) => {
    return events.filter(e => e.date === date && e.month === currentMonth && e.year === currentYear);
  };

  const navigateMonth = (direction: number) => {
    setSelectedDate(new Date(currentYear, currentMonth + direction, 1));
  };
  
  const navigateWeek = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction * 7));
    setSelectedDate(newDate);
  };
  
  const navigateDay = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + direction);
    setSelectedDate(newDate);
  };
  
  const goToToday = () => {
    setSelectedDate(new Date());
  };
  
  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Monday = 0
  
  // Get dates array with empty cells for days before month starts
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyCells = Array.from({ length: adjustedFirstDay }, (_, i) => null);
  
  // Render Month Calendar
  const renderMonthCalendar = (month: number, year: number, isCurrent: boolean = false) => {
    const monthDays = new Date(year, month + 1, 0).getDate();
    const monthFirstDay = new Date(year, month, 1).getDay();
    const monthAdjustedFirstDay = monthFirstDay === 0 ? 6 : monthFirstDay - 1;
    const monthDates = Array.from({ length: monthDays }, (_, i) => i + 1);
    const monthEmptyCells = Array.from({ length: monthAdjustedFirstDay }, (_, i) => null);
    const monthEvents = events.filter(e => e.month === month && e.year === year);
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className={`text-lg font-bold transition-colors duration-500 ${
              theme === "dark" ? "text-white" : "text-[#0C0F1A]"
            }`}>
              {months[month]}
            </h3>
            {isCurrent && (
              <span className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors duration-500 ${
                theme === "dark" 
                  ? "bg-[#7C3AED]/20 text-[#A45CFF] border border-[#7C3AED]/30"
                  : "bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30"
              }`}>
                Aktuell
              </span>
            )}
          </div>
          {monthEvents.length > 0 && (
            <span className={`text-xs font-medium transition-colors duration-500 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>
              {monthEvents.length} Termine
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((day) => (
            <div key={day} className={`text-center text-xs font-semibold py-1.5 transition-colors duration-500 ${
              theme === "dark" ? "text-gray-500" : "text-gray-600"
            }`}>
              {day}
            </div>
          ))}
          
          {monthEmptyCells.map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          
          {monthDates.map((date) => {
            const isSelected = date === currentDate && month === currentMonth && year === currentYear;
            const hasEvent = hasEvents(date, month);
            
            return (
              <motion.button
                key={date}
                className={`aspect-square rounded-lg text-sm font-medium transition-all duration-300 relative ${
                  isSelected
                    ? theme === "dark"
                      ? "bg-[#7C3AED] text-white"
                      : "bg-[#7C3AED] text-white"
                    : theme === "dark"
                      ? "text-gray-300 hover:bg-white/5"
                      : "text-gray-700 hover:bg-black/5"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDate(new Date(year, month, date))}
              >
                {date}
                {hasEvent && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                    <div className={`w-1 h-1 rounded-full ${
                      theme === "dark" ? "bg-[#7C3AED]" : "bg-[#7C3AED]"
                    }`} />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* View Mode Switcher */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {(["tag", "woche", "monat", "jahr"] as const).map((mode) => (
          <motion.button
            key={mode}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 capitalize ${
              viewMode === mode
                ? theme === "dark"
                  ? "bg-[#7C3AED] text-white"
                  : "bg-[#7C3AED] text-white"
                : theme === "dark"
                  ? "text-gray-400 hover:text-white hover:bg-white/5"
                  : "text-gray-600 hover:text-[#7C3AED] hover:bg-[#7C3AED]/5"
            }`}
            onClick={() => setViewMode(mode)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {mode}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "tag" && (
          <motion.div
            key="tag"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Time Axis - Left */}
            <div className="lg:col-span-2 space-y-4 flex flex-col" style={{ maxHeight: "calc(100vh - 300px)" }}>
              <div className="flex items-center justify-between mb-4">
                <motion.button
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    theme === "dark"
                      ? "bg-[#7C3AED]/20 text-[#A45CFF] border border-[#7C3AED]/30"
                      : "bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToToday}
                >
                  Heute
                </motion.button>
                <div className="flex items-center gap-2">
                  <motion.button
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigateDay(-1)}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </motion.button>
                  <motion.button
                    className={`px-3 py-1 rounded text-sm font-medium transition-all duration-300 ${
                      theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={goToToday}
                  >
                    Heute
                  </motion.button>
                  <motion.button
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigateDay(1)}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.button>
                </div>
              </div>
              
              <div className={`rounded-xl p-6 transition-all duration-500 relative overflow-hidden flex-1 min-h-0 ${
                theme === "dark"
                  ? "bg-white/5 border border-white/10"
                  : "bg-white border border-gray-200"
              }`} style={{ maxHeight: "calc(100vh - 300px)", overflowY: "auto", overflowX: "hidden" }}>
                {/* Add Event Button */}
                <motion.button
                  className={`absolute top-4 right-4 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 z-20 ${
                    theme === "dark"
                      ? "bg-[#7C3AED]/20 text-[#A45CFF] border border-[#7C3AED]/30 hover:bg-[#7C3AED]/30"
                      : "bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30 hover:bg-[#7C3AED]/30"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAddingEvent(true)}
                >
                  + Termin hinzufügen
                </motion.button>
                
                {/* Add Event Modal */}
                <AnimatePresence>
                  {isAddingEvent && (
                    <motion.div
                      className="fixed inset-0 z-50 flex items-center justify-center p-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsAddingEvent(false)}
                    >
                      <motion.div
                        className={`rounded-2xl p-6 w-full max-w-md transition-all duration-500 relative ${
                          theme === "dark"
                            ? "bg-[#0C0F1A] border border-white/10"
                            : "bg-white border border-gray-200"
                        }`}
                        style={{
                          boxShadow: theme === "dark"
                            ? "0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(124, 58, 237, 0.2)"
                            : "0 20px 60px rgba(0, 0, 0, 0.2), 0 0 40px rgba(124, 58, 237, 0.1)",
                        }}
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between mb-6">
                          <h3 className={`text-xl font-bold transition-colors duration-500 ${
                            theme === "dark" ? "text-white" : "text-[#0C0F1A]"
                          }`}>
                            Neuen Termin hinzufügen
                          </h3>
                          <motion.button
                            className={`p-2 rounded-lg transition-all duration-300 ${
                              theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/10"
                            }`}
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsAddingEvent(false)}
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </motion.button>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className={`block text-sm font-semibold mb-2 transition-colors duration-500 ${
                              theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}>
                              Titel
                            </label>
                            <input
                              type="text"
                              value={newEventForm.title}
                              onChange={(e) => setNewEventForm({ ...newEventForm, title: e.target.value })}
                              className={`w-full px-4 py-3 rounded-lg text-sm transition-all duration-300 ${
                                theme === "dark"
                                  ? "bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-[#7C3AED]/50"
                                  : "bg-black/5 border border-gray-200 text-[#0C0F1A] placeholder-gray-400 focus:border-[#7C3AED]/50"
                              }`}
                              placeholder="z.B. Abholung München"
                              autoFocus
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className={`block text-sm font-semibold mb-2 transition-colors duration-500 ${
                                theme === "dark" ? "text-gray-300" : "text-gray-700"
                              }`}>
                                Zeit
                              </label>
                              <input
                                type="time"
                                value={newEventForm.time}
                                onChange={(e) => setNewEventForm({ ...newEventForm, time: e.target.value })}
                                className={`w-full px-4 py-3 rounded-lg text-sm transition-all duration-300 ${
                                  theme === "dark"
                                    ? "bg-white/5 border border-white/10 text-white focus:border-[#7C3AED]/50"
                                    : "bg-black/5 border border-gray-200 text-[#0C0F1A] focus:border-[#7C3AED]/50"
                                }`}
                              />
                            </div>
                            
                            <div>
                              <label className={`block text-sm font-semibold mb-2 transition-colors duration-500 ${
                                theme === "dark" ? "text-gray-300" : "text-gray-700"
                              }`}>
                                Dauer (Min)
                              </label>
                              <input
                                type="number"
                                value={newEventForm.duration}
                                onChange={(e) => setNewEventForm({ ...newEventForm, duration: parseInt(e.target.value) || 60 })}
                                min="15"
                                step="15"
                                className={`w-full px-4 py-3 rounded-lg text-sm transition-all duration-300 ${
                                  theme === "dark"
                                    ? "bg-white/5 border border-white/10 text-white focus:border-[#7C3AED]/50"
                                    : "bg-black/5 border border-gray-200 text-[#0C0F1A] focus:border-[#7C3AED]/50"
                                }`}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className={`block text-sm font-semibold mb-2 transition-colors duration-500 ${
                              theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}>
                              Typ
                            </label>
                            <select
                              value={newEventForm.type}
                              onChange={(e) => setNewEventForm({ ...newEventForm, type: e.target.value })}
                              className={`w-full px-4 py-3 rounded-lg text-sm transition-all duration-300 ${
                                theme === "dark"
                                  ? "bg-white/5 border border-white/10 text-white focus:border-[#7C3AED]/50"
                                  : "bg-black/5 border border-gray-200 text-[#0C0F1A] focus:border-[#7C3AED]/50"
                              }`}
                            >
                              <option value="Termin">Termin</option>
                              <option value="Abholung">Abholung</option>
                              <option value="Tour">Tour</option>
                              <option value="Zustellung">Zustellung</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center gap-3 pt-2">
                            <motion.button
                              className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                                theme === "dark"
                                  ? "bg-[#7C3AED] text-white hover:bg-[#7C3AED]/90"
                                  : "bg-[#7C3AED] text-white hover:bg-[#7C3AED]/90"
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={handleAddEvent}
                            >
                              Termin hinzufügen
                            </motion.button>
                            <motion.button
                              className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                                theme === "dark"
                                  ? "bg-white/5 text-gray-300 hover:bg-white/10"
                                  : "bg-black/5 text-gray-700 hover:bg-black/10"
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setIsAddingEvent(false);
                                setNewEventForm({ time: "09:00", title: "", type: "Termin", duration: 60 });
                              }}
                            >
                              Abbrechen
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="relative space-y-0" style={{ minHeight: `${24 * 60}px`, maxHeight: "1440px" }}>
                  {/* Render hour markers first */}
                  {hours.map((hour) => {
                    return (
                      <div key={hour} className="relative flex items-start gap-4 min-h-[60px] py-1">
                        <div className={`text-sm font-mono w-16 pt-2 flex-shrink-0 transition-colors duration-500 ${
                          theme === "dark" ? "text-gray-500" : "text-gray-600"
                        }`}>
                          {String(hour).padStart(2, "0")}:00
                        </div>
                        <div className="flex-1 relative min-h-[60px]">
                          <div className={`absolute left-0 right-0 top-0 h-px transition-colors duration-500 ${
                            theme === "dark" ? "bg-white/5" : "bg-gray-200"
                          }`} />
                          
                          {/* Clickable area to add event */}
                          <motion.div
                            className={`absolute inset-0 rounded transition-all duration-300 cursor-pointer opacity-0 hover:opacity-100 ${
                              theme === "dark" ? "hover:bg-white/2" : "hover:bg-black/2"
                            }`}
                            whileHover={{ backgroundColor: theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)" }}
                            onClick={() => {
                              const newEvent = {
                                id: Math.max(...dayEvents.map(e => e.id), 0) + 1,
                                time: `${String(hour).padStart(2, "0")}:00`,
                                title: "Neuer Termin",
                                type: "Termin",
                                duration: 60,
                                color: theme === "dark" ? "#00E1FF" : "#7C3AED",
                              };
                              setDayEvents([...dayEvents, newEvent].sort((a, b) => a.time.localeCompare(b.time)));
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Render all events once, positioned absolutely relative to container */}
                  {dayEvents.map((event) => {
                    const [eventHour, eventMinute] = event.time.split(":").map(Number);
                    const eventStart = eventHour * 60 + eventMinute;
                    const eventEnd = eventStart + event.duration;
                    const topOffset = eventStart; // Position from top in pixels
                    const height = Math.max(event.duration, 70);
                    
                    // Ensure event doesn't exceed container bounds
                    const maxTop = 24 * 60; // 24 hours * 60 minutes
                    const constrainedHeight = eventEnd > maxTop ? maxTop - topOffset : height;
                    
                    // Get position from calculated positions
                    const position = eventPositions.get(event.id) || { column: 0, totalColumns: 1 };
                    const gap = 6;
                    const totalColumns = position.totalColumns;
                    const timeColumnWidth = 64;
                    // Calculate width and position to stay within container
                    const columnWidth = `calc((100% - ${timeColumnWidth}px - ${gap}px - ${(totalColumns - 1) * gap}px) / ${totalColumns})`;
                    const left = `calc(${timeColumnWidth}px + ${position.column} * (${columnWidth} + ${gap}px))`;
                    
                    return (
                      <motion.div
                        key={event.id}
                        className={`absolute rounded-lg cursor-pointer group/event transition-all duration-300 overflow-hidden ${
                          theme === "dark"
                            ? "border border-white/10"
                            : "border border-gray-200"
                        }`}
                        style={{
                          top: `${topOffset}px`,
                          height: `${Math.max(constrainedHeight, 50)}px`,
                          width: columnWidth,
                          left: left,
                          maxWidth: `calc(100% - ${timeColumnWidth}px - ${gap}px)`,
                          background: `${event.color}15`,
                          borderColor: `${event.color}40`,
                          zIndex: 10,
                        }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + event.id * 0.05 }}
                        whileHover={{
                          scale: 1.02,
                          y: -2,
                          boxShadow: `0 8px 24px ${event.color}40`,
                          zIndex: 20,
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => console.log(`Event ${event.id} clicked`)}
                      >
                        <div className="h-full flex flex-col p-3">
                          <div className="flex items-start justify-between gap-2 flex-shrink-0 mb-1">
                            <div className="flex-1 min-w-0">
                              <div className={`text-xs font-mono font-semibold mb-0.5 transition-colors duration-500 whitespace-nowrap ${
                                theme === "dark" ? "text-white" : "text-[#0C0F1A]"
                              }`}>
                                {event.time}
                              </div>
                              <div className={`text-sm font-semibold transition-colors duration-500 line-clamp-2 leading-tight ${
                                theme === "dark" ? "text-white" : "text-[#0C0F1A]"
                              }`}>
                                {event.title}
                              </div>
                            </div>
                            <motion.button
                              className={`p-1 rounded transition-all duration-300 opacity-0 group-hover/event:opacity-100 flex-shrink-0 ${
                                theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/10"
                              }`}
                              whileHover={{ scale: 1.1, rotate: 90 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDayEvents(dayEvents.filter(e => e.id !== event.id));
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </motion.button>
                          </div>
                          <div className={`text-xs transition-colors duration-500 mt-auto whitespace-nowrap ${
                            theme === "dark" ? "text-gray-400" : "text-gray-600"
                          }`}>
                            {event.type} • {event.duration} Min
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  {/* Render hour markers */}
                  {hours.map((hour) => {
                    return (
                      <div key={hour} className="relative flex items-start gap-4 min-h-[60px] py-1 pointer-events-none">
                        <div className={`text-sm font-mono w-16 pt-2 flex-shrink-0 transition-colors duration-500 ${
                          theme === "dark" ? "text-gray-500" : "text-gray-600"
                        }`}>
                          {String(hour).padStart(2, "0")}:00
                        </div>
                        <div className="flex-1 relative min-h-[60px]">
                          <div className={`absolute left-0 right-0 top-0 h-px transition-colors duration-500 ${
                            theme === "dark" ? "bg-white/5" : "bg-gray-200"
                          }`} />
                          
                          {/* Clickable area to add event */}
                          <motion.div
                            className={`absolute inset-0 rounded transition-all duration-300 cursor-pointer opacity-0 hover:opacity-100 pointer-events-auto ${
                              theme === "dark" ? "hover:bg-white/2" : "hover:bg-black/2"
                            }`}
                            whileHover={{ backgroundColor: theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)" }}
                            onClick={() => {
                              const newEvent = {
                                id: Math.max(...dayEvents.map(e => e.id), 0) + 1,
                                time: `${String(hour).padStart(2, "0")}:00`,
                                title: "Neuer Termin",
                                type: "Termin",
                                duration: 60,
                                color: theme === "dark" ? "#00E1FF" : "#7C3AED",
                              };
                              setDayEvents([...dayEvents, newEvent].sort((a, b) => a.time.localeCompare(b.time)));
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Calendar Widget - Right */}
            <div className="space-y-4">
              <div className={`rounded-xl p-5 transition-all duration-500 ${
                theme === "dark"
                  ? "bg-white/5 border border-white/10"
                  : "bg-white border border-gray-200"
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold transition-colors duration-500 ${
                    theme === "dark" ? "text-white" : "text-[#0C0F1A]"
                  }`}>
                    {months[currentMonth]} {currentYear}
                  </h3>
                  <div className="flex items-center gap-2">
                    <motion.button
                      className={`p-1.5 rounded transition-all duration-300 ${
                        theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => navigateMonth(-1)}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </motion.button>
                    <motion.button
                      className={`p-1.5 rounded transition-all duration-300 ${
                        theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => navigateMonth(1)}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.button>
                  </div>
                </div>
                
                <motion.button
                  className={`w-full mb-4 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    theme === "dark"
                      ? "bg-[#7C3AED]/20 text-[#A45CFF] border border-[#7C3AED]/30"
                      : "bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={goToToday}
                >
                  Heute
                </motion.button>
                
                <div className="grid grid-cols-7 gap-1.5 mb-2">
                  {days.map((day) => (
                    <div key={day} className={`text-center text-xs font-semibold py-1 transition-colors duration-500 ${
                      theme === "dark" ? "text-gray-500" : "text-gray-600"
                    }`}>
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1.5">
                  {emptyCells.map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {dates.map((date) => {
                    const isSelected = date === currentDate;
                    const hasEvent = hasEvents(date, currentMonth);
                    
                    return (
                      <motion.button
                        key={date}
                        className={`aspect-square rounded-lg text-sm font-medium transition-all duration-300 relative ${
                          isSelected
                            ? theme === "dark"
                              ? "bg-[#7C3AED] text-white"
                              : "bg-[#7C3AED] text-white"
                            : theme === "dark"
                              ? "text-gray-300 hover:bg-white/5"
                              : "text-gray-700 hover:bg-black/5"
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedDate(new Date(currentYear, currentMonth, date))}
                      >
                        {date}
                        {hasEvent && (
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                            <div className={`w-1 h-1 rounded-full ${
                              theme === "dark" ? "bg-[#7C3AED]" : "bg-[#7C3AED]"
                            }`} />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
              
              {/* Tagesübersicht - Extended */}
              <div className={`rounded-xl p-5 transition-all duration-500 flex flex-col ${
                theme === "dark"
                  ? "bg-white/5 border border-white/10"
                  : "bg-white border border-gray-200"
              }`} style={{ maxHeight: "calc(100vh - 350px)", minHeight: "400px" }}>
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <h4 className={`text-sm font-bold transition-colors duration-500 ${
                    theme === "dark" ? "text-white" : "text-[#0C0F1A]"
                  }`}>
                    Tagesübersicht
                  </h4>
                  <span className={`text-xs font-medium px-2 py-1 rounded transition-colors duration-500 ${
                    theme === "dark"
                      ? "bg-[#7C3AED]/20 text-[#A45CFF]"
                      : "bg-[#7C3AED]/20 text-[#7C3AED]"
                  }`}>
                    {dayEvents.length} Termine
                  </span>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto pr-2 min-h-0" style={{ maxHeight: "calc(100vh - 450px)" }}>
                  {dayEvents.length > 0 ? (
                    dayEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        className={`p-3 rounded-lg transition-all duration-300 cursor-pointer group/item ${
                          theme === "dark"
                            ? "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
                            : "bg-black/5 border border-gray-200 hover:bg-black/10 hover:border-gray-300"
                        }`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        onClick={() => console.log(`Event ${event.id} clicked`)}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ 
                                background: event.color,
                                boxShadow: `0 0 8px ${event.color}60`,
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className={`text-xs font-mono font-semibold mb-1 transition-colors duration-500 ${
                                theme === "dark" ? "text-white" : "text-[#0C0F1A]"
                              }`}>
                                {event.time}
                              </div>
                              <div className={`text-sm font-semibold mb-1 transition-colors duration-500 truncate ${
                                theme === "dark" ? "text-white" : "text-[#0C0F1A]"
                              }`}>
                                {event.title}
                              </div>
                              <div className={`text-xs transition-colors duration-500 ${
                                theme === "dark" ? "text-gray-400" : "text-gray-600"
                              }`}>
                                {event.type} • {event.duration} Min
                              </div>
                            </div>
                          </div>
                          <motion.button
                            className={`p-1.5 rounded opacity-0 group-hover/item:opacity-100 transition-all duration-300 flex-shrink-0 ${
                              theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/10"
                            }`}
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDayEvents(dayEvents.filter(e => e.id !== event.id));
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </motion.button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <p className={`text-sm text-center transition-colors duration-500 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}>
                        Keine Termine für heute
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {viewMode === "woche" && (
          <motion.div
            key="woche"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`rounded-xl p-6 transition-all duration-500 ${
              theme === "dark"
                ? "bg-white/5 border border-white/10"
                : "bg-white border border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <motion.button
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  theme === "dark"
                    ? "bg-[#7C3AED]/20 text-[#A45CFF] border border-[#7C3AED]/30"
                    : "bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToToday}
              >
                Aktuelle Woche
              </motion.button>
              <div className="flex items-center gap-2">
                <motion.button
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigateWeek(-1)}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
                <motion.button
                  className={`px-3 py-1 rounded text-sm font-medium transition-all duration-300 ${
                    theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToToday}
                >
                  Heute
                </motion.button>
                <motion.button
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigateWeek(1)}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            </div>
            
            <div className="grid grid-cols-8 gap-2">
              <div className="space-y-1">
                {hours.slice(0, 10).map((hour) => (
                  <div key={hour} className={`h-16 flex items-start pt-1 transition-colors duration-500 ${
                    theme === "dark" ? "text-gray-500" : "text-gray-600"
                  }`}>
                    <span className="text-xs font-mono">{String(hour).padStart(2, "0")}:00</span>
                  </div>
                ))}
              </div>
              
              {weekDates.map((date, dayIndex) => {
                const isSelected = date.getDate() === currentDate && date.getMonth() === currentMonth;
                const dayName = days[dayIndex];
                const dayNumber = date.getDate();
                
                return (
                  <div key={dayIndex} className="space-y-1">
                    <div className={`text-center py-2 mb-1 rounded-lg transition-all duration-300 ${
                      isSelected
                        ? theme === "dark"
                          ? "bg-[#7C3AED] text-white"
                          : "bg-[#7C3AED] text-white"
                        : theme === "dark"
                          ? "hover:bg-white/5"
                          : "hover:bg-black/5"
                    }`}>
                      <div className="text-xs font-semibold">{dayName}</div>
                      <div className="text-sm font-bold">{dayNumber}</div>
                    </div>
                    {hours.slice(0, 10).map((hour) => (
                      <div
                        key={hour}
                        className={`h-16 border transition-colors duration-300 cursor-pointer ${
                          theme === "dark"
                            ? "border-white/5 hover:border-white/10 hover:bg-white/2"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
        
        {viewMode === "monat" && (
          <motion.div
            key="monat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <motion.button
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    theme === "dark"
                      ? "bg-[#7C3AED]/20 text-[#A45CFF] border border-[#7C3AED]/30"
                      : "bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToToday}
                >
                  Aktueller Monat
                </motion.button>
                <h3 className={`text-xl font-bold transition-colors duration-500 ${
                  theme === "dark" ? "text-white" : "text-[#0C0F1A]"
                }`}>
                  {months[currentMonth]} {currentYear}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigateMonth(-1)}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
                <motion.button
                  className={`px-3 py-1 rounded text-sm font-medium transition-all duration-300 ${
                    theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToToday}
                >
                  Heute
                </motion.button>
                <motion.button
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigateMonth(1)}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            </div>
            
            <motion.div
              className={`rounded-xl p-6 transition-all duration-500 ${
                theme === "dark"
                  ? "bg-white/5 border border-white/10"
                  : "bg-white border border-gray-200"
              }`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="grid grid-cols-7 gap-2 mb-4">
                {days.map((day, i) => (
                  <motion.div
                    key={day}
                    className={`text-center text-xs font-bold py-2 transition-colors duration-500 ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    {day}
                  </motion.div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {emptyCells.map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {dates.map((date) => {
                  const isSelected = date === currentDate;
                  const isToday = date === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                  const hasEvent = hasEvents(date, currentMonth);
                  
                  return (
                    <motion.button
                      key={date}
                      className={`aspect-square rounded-lg text-sm font-medium transition-all duration-300 relative group/date overflow-hidden ${
                        isSelected
                          ? theme === "dark"
                            ? "bg-[#7C3AED] text-white"
                            : "bg-[#7C3AED] text-white"
                          : isToday
                            ? theme === "dark"
                              ? "bg-gradient-to-br from-[#00E1FF]/20 to-[#A45CFF]/20 border border-[#00E1FF]/40"
                              : "bg-gradient-to-br from-[#7C3AED]/20 to-[#7C3AED]/10 border border-[#7C3AED]/40"
                            : theme === "dark"
                              ? "text-gray-300 hover:bg-white/5 hover:border-white/15 border border-white/5"
                              : "text-gray-700 hover:bg-black/5 hover:border-black/15 border border-black/5"
                      }`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + date * 0.01, type: "spring", stiffness: 200 }}
                      whileHover={{
                        scale: 1.1,
                        y: -2,
                        boxShadow: isSelected || isToday
                          ? `0 8px 20px ${theme === "dark" ? "rgba(124, 58, 237, 0.4)" : "rgba(124, 58, 237, 0.4)"}`
                          : theme === "dark"
                            ? "0 4px 12px rgba(255, 255, 255, 0.1)"
                            : "0 4px 12px rgba(0, 0, 0, 0.1)",
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDate(new Date(currentYear, currentMonth, date))}
                    >
                      {/* Today Indicator Glow */}
                      {isToday && !isSelected && (
                        <motion.div
                          className="absolute inset-0 rounded-lg"
                          style={{
                            background: theme === "dark"
                              ? "radial-gradient(circle, rgba(0, 225, 255, 0.2), transparent 70%)"
                              : "radial-gradient(circle, rgba(124, 58, 237, 0.2), transparent 70%)",
                          }}
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                      
                      <span className={`relative z-10 transition-colors duration-300 ${
                        isSelected
                          ? "text-white"
                          : isToday
                            ? theme === "dark"
                              ? "text-white"
                              : "text-[#7C3AED]"
                            : theme === "dark"
                              ? "text-gray-300 group-hover/date:text-white"
                              : "text-gray-700 group-hover/date:text-[#7C3AED]"
                      }`}>
                        {date}
                      </span>
                      
                      {hasEvent && (
                        <motion.div
                          className="absolute bottom-1 left-1/2 transform -translate-x-1/2 relative z-10"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2 + date * 0.01, type: "spring", stiffness: 300 }}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            theme === "dark" ? "bg-[#7C3AED]" : "bg-[#7C3AED]"
                          }`}
                          style={{
                            boxShadow: `0 0 6px ${theme === "dark" ? "rgba(124, 58, 237, 0.8)" : "rgba(124, 58, 237, 0.8)"}`,
                          }}
                          />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
            
            {/* Month Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Termine", value: getEventsForDate(currentDate).length, color: theme === "dark" ? "#00E1FF" : "#7C3AED" },
                { label: "Touren", value: "12", color: theme === "dark" ? "#A45CFF" : "#7C3AED" },
                { label: "Fahrzeuge", value: "8", color: theme === "dark" ? "#00FF96" : "#34C25E" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  className={`rounded-xl p-5 transition-all duration-500 cursor-pointer group relative overflow-hidden ${
                    theme === "dark"
                      ? "bg-white/5 border border-white/10"
                      : "bg-white border border-gray-200"
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  whileHover={{
                    scale: 1.02,
                    y: -4,
                    borderColor: theme === "dark"
                      ? "rgba(124, 58, 237, 0.4)"
                      : "rgba(124, 58, 237, 0.4)",
                  }}
                  onClick={() => console.log(`${stat.label} clicked`)}
                >
                  <div className={`text-2xl font-bold mb-2 transition-colors duration-500 ${
                    theme === "dark" ? "text-white" : "text-[#0C0F1A]"
                  }`}
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${stat.color}, ${stat.color}dd)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                  >
                    {stat.value}
                  </div>
                  <div className={`text-sm font-medium transition-colors duration-500 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        
        {viewMode === "jahr" && (
          <motion.div
            key="jahr"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-end gap-2 mb-4">
              <motion.button
                className={`p-2 rounded-lg transition-all duration-300 ${
                  theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedDate(new Date(currentYear - 1, currentMonth, 1))}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
              <motion.button
                className={`px-3 py-1 rounded text-sm font-medium transition-all duration-300 ${
                  theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToToday}
              >
                Heute
              </motion.button>
              <motion.button
                className={`p-2 rounded-lg transition-all duration-300 ${
                  theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedDate(new Date(currentYear + 1, currentMonth, 1))}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[11, 0, 1].map((monthOffset) => {
                const month = (currentMonth + monthOffset) % 12;
                const year = currentYear + Math.floor((currentMonth + monthOffset) / 12);
                const isCurrent = month === currentMonth && year === currentYear;
                
                return (
                  <motion.div
                    key={`${year}-${month}`}
                    className={`rounded-xl p-5 transition-all duration-500 ${
                      theme === "dark"
                        ? "bg-white/5 border border-white/10"
                        : "bg-white border border-gray-200"
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: monthOffset * 0.1 }}
                  >
                    {renderMonthCalendar(month, year, isCurrent)}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FlowView = () => {
  const { theme } = useTheme();
  const [flows, setFlows] = useState([
    { id: 1, name: "Tour-Planung", status: "Aktiv", progress: 85, steps: 5, currentStep: 4, icon: "📋" },
    { id: 2, name: "Fahrer-Zuweisung", status: "Aktiv", progress: 60, steps: 3, currentStep: 2, icon: "👤" },
    { id: 3, name: "Route-Optimierung", status: "Abgeschlossen", progress: 100, steps: 4, currentStep: 4, icon: "🗺️" },
    { id: 4, name: "Dokumentation", status: "Wartend", progress: 0, steps: 2, currentStep: 0, icon: "📄" },
  ]);
  const [isAddingFlow, setIsAddingFlow] = useState(false);
  const [newFlowForm, setNewFlowForm] = useState({
    name: "",
    status: "Wartend",
    steps: 3,
    currentStep: 0,
    icon: "📋",
  });
  
  // Function to add new flow
  const handleAddFlow = () => {
    if (!newFlowForm.name.trim()) {
      alert("Bitte geben Sie einen Namen ein.");
      return;
    }
    
    const progress = newFlowForm.steps > 0 
      ? Math.round((newFlowForm.currentStep / newFlowForm.steps) * 100)
      : 0;
    
    const newFlow = {
      id: Math.max(...flows.map(f => f.id), 0) + 1,
      name: newFlowForm.name,
      status: newFlowForm.status,
      progress: progress,
      steps: newFlowForm.steps,
      currentStep: newFlowForm.currentStep,
      icon: newFlowForm.icon,
    };
    setFlows([...flows, newFlow]);
    setIsAddingFlow(false);
    setNewFlowForm({ name: "", status: "Wartend", steps: 3, currentStep: 0, icon: "📋" });
  };

  const workflowDiagram = [
    { id: 1, name: "Auftrag", x: 0, y: 0, status: "completed" },
    { id: 2, name: "Planung", x: 150, y: 0, status: "active" },
    { id: 3, name: "Zuweisung", x: 300, y: 0, status: "pending" },
    { id: 4, name: "Ausführung", x: 450, y: 0, status: "pending" },
    { id: 5, name: "Abschluss", x: 600, y: 0, status: "pending" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className={`text-xl sm:text-2xl font-bold mb-2 transition-colors duration-500 ${
            theme === "dark" ? "text-white" : "text-[#0C0F1A]"
          }`}>Workflow</h4>
          <p className={`text-xs sm:text-sm mb-6 leading-relaxed transition-colors duration-500 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            Automatisierte Prozesse und Workflows im Überblick.
          </p>
        </div>
        <motion.button
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
            theme === "dark"
              ? "bg-[#7C3AED]/20 text-[#A45CFF] border border-[#7C3AED]/30 hover:bg-[#7C3AED]/30"
              : "bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30 hover:bg-[#7C3AED]/30"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAddingFlow(true)}
        >
          + Flow hinzufügen
        </motion.button>
      </div>

      {/* Workflow Diagram */}
      <div className="rounded-xl p-6 overflow-x-auto transition-all duration-500"
        style={{
          background: theme === "dark" 
            ? "rgba(255, 255, 255, 0.02)" 
            : "rgba(0, 0, 0, 0.02)",
          border: theme === "dark"
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "1px solid rgba(0, 0, 0, 0.08)",
        }}
      >
        <div className="relative h-32 min-w-[750px]">
          {workflowDiagram.map((step, i) => (
            <div key={step.id} className="absolute" style={{ left: `${step.x}px`, top: `${step.y}px` }}>
              {/* Connection Line */}
              {i < workflowDiagram.length - 1 && (
                <motion.div
                  className="absolute top-8 left-16 w-34 h-0.5"
                  style={{
                    background: step.status === "completed" || step.status === "active"
                      ? theme === "dark"
                        ? "linear-gradient(90deg, rgba(0,225,255,0.6), rgba(164,92,255,0.6))"
                        : "linear-gradient(90deg, rgba(124,58,237,0.6), rgba(124,58,237,0.6))"
                      : theme === "dark"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: step.status === "completed" ? 1 : step.status === "active" ? 0.5 : 0 }}
                  transition={{ duration: 0.8, delay: i * 0.2 }}
                />
              )}
              
              {/* Step Node */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <div
                  className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl transition-all duration-500 ${
                    step.status === "completed"
                      ? theme === "dark"
                        ? "bg-[#00E1FF]/20 border-2 border-[#00E1FF]"
                        : "bg-[#7C3AED]/20 border-2 border-[#7C3AED]"
                      : step.status === "active"
                      ? theme === "dark"
                        ? "bg-[#A45CFF]/20 border-2 border-[#A45CFF]"
                        : "bg-[#7C3AED]/20 border-2 border-[#7C3AED]"
                      : theme === "dark"
                        ? "bg-white/5 border-2 border-white/10"
                        : "bg-black/5 border-2 border-black/10"
                  }`}
                  style={{
                    boxShadow: step.status === "active"
                      ? `0 0 20px ${theme === "dark" ? "rgba(164,92,255,0.4)" : "rgba(124,58,237,0.4)"}`
                      : "none",
                  }}
                >
                  {step.status === "completed" && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      style={{ color: theme === "dark" ? "#00E1FF" : "#7C3AED" }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className={`text-xs text-center mt-2 font-medium transition-colors duration-500 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>
                  {step.name}
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      {/* Flow Cards */}
      <div className="space-y-4">
        {flows.map((flow, i) => (
          <motion.div
            key={flow.id}
            className="rounded-xl p-5 transition-all duration-500"
            style={{
              background: theme === "dark" 
                ? "rgba(255, 255, 255, 0.02)" 
                : "rgba(0, 0, 0, 0.02)",
              border: theme === "dark"
                ? "1px solid rgba(255, 255, 255, 0.08)"
                : "1px solid rgba(0, 0, 0, 0.08)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ 
              scale: 1.01, 
              borderColor: theme === "dark" 
                ? "rgba(255, 255, 255, 0.15)" 
                : "rgba(0, 0, 0, 0.15)" 
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{flow.icon}</div>
                <div>
                  <div className={`font-semibold transition-colors duration-500 ${
                    theme === "dark" ? "text-white" : "text-[#0C0F1A]"
                  }`}>{flow.name}</div>
                  <div className={`text-xs mt-1 transition-colors duration-500 ${
                    theme === "dark" ? "text-gray-500" : "text-gray-600"
                  }`}>{flow.status}</div>
                </div>
              </div>
              <div className={`font-bold text-xl transition-colors duration-500 ${
                theme === "dark" ? "text-white" : "text-[#0C0F1A]"
              }`}>{flow.progress}%</div>
            </div>
            
            {/* Step Indicators */}
            <div className="flex items-center gap-2 mb-3">
              {Array.from({ length: flow.steps }).map((_, stepIndex) => (
                <div
                  key={stepIndex}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                    stepIndex < flow.currentStep
                      ? theme === "dark"
                        ? "bg-[#00E1FF]"
                        : "bg-[#7C3AED]"
                      : stepIndex === flow.currentStep && flow.status === "Aktiv"
                      ? theme === "dark"
                        ? "bg-[#A45CFF]"
                        : "bg-[#7C3AED]"
                      : theme === "dark"
                        ? "bg-white/10"
                        : "bg-black/10"
                  }`}
                  style={{
                    boxShadow: stepIndex === flow.currentStep && flow.status === "Aktiv"
                      ? `0 0 8px ${theme === "dark" ? "rgba(164,92,255,0.6)" : "rgba(124,58,237,0.6)"}`
                      : "none",
                  }}
                />
              ))}
            </div>
            
            {/* Progress Bar */}
            <div className={`h-2 rounded-full overflow-hidden transition-colors duration-500 ${
              theme === "dark" ? "bg-white/5" : "bg-black/5"
            }`}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: theme === "dark"
                    ? "linear-gradient(90deg, rgba(0,225,255,0.4), rgba(164,92,255,0.6))"
                    : "linear-gradient(90deg, rgba(124,58,237,0.4), rgba(124,58,237,0.6))",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${flow.progress}%` }}
                transition={{ duration: 1, delay: i * 0.1 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Add Flow Modal */}
      <AnimatePresence>
        {isAddingFlow && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAddingFlow(false)}
          >
            <motion.div
              className={`rounded-2xl p-6 w-full max-w-md transition-all duration-500 relative ${
                theme === "dark"
                  ? "bg-[#0C0F1A] border border-white/10"
                  : "bg-white border border-gray-200"
              }`}
              style={{
                boxShadow: theme === "dark"
                  ? "0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(124, 58, 237, 0.2)"
                  : "0 20px 60px rgba(0, 0, 0, 0.2), 0 0 40px rgba(124, 58, 237, 0.1)",
              }}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold transition-colors duration-500 ${
                  theme === "dark" ? "text-white" : "text-[#0C0F1A]"
                }`}>
                  Neuen Flow hinzufügen
                </h3>
                <motion.button
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/10"
                  }`}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsAddingFlow(false)}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 transition-colors duration-500 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={newFlowForm.name}
                    onChange={(e) => setNewFlowForm({ ...newFlowForm, name: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg text-sm transition-all duration-300 ${
                      theme === "dark"
                        ? "bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-[#7C3AED]/50"
                        : "bg-black/5 border border-gray-200 text-[#0C0F1A] placeholder-gray-400 focus:border-[#7C3AED]/50"
                    }`}
                    placeholder="z.B. Tour-Planung"
                    autoFocus
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 transition-colors duration-500 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Status
                    </label>
                    <select
                      value={newFlowForm.status}
                      onChange={(e) => setNewFlowForm({ ...newFlowForm, status: e.target.value })}
                      className={`w-full px-4 py-3 rounded-lg text-sm transition-all duration-300 ${
                        theme === "dark"
                          ? "bg-white/5 border border-white/10 text-white focus:border-[#7C3AED]/50"
                          : "bg-black/5 border border-gray-200 text-[#0C0F1A] focus:border-[#7C3AED]/50"
                      }`}
                    >
                      <option value="Wartend">Wartend</option>
                      <option value="Aktiv">Aktiv</option>
                      <option value="Abgeschlossen">Abgeschlossen</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold mb-2 transition-colors duration-500 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Icon
                    </label>
                    <select
                      value={newFlowForm.icon}
                      onChange={(e) => setNewFlowForm({ ...newFlowForm, icon: e.target.value })}
                      className={`w-full px-4 py-3 rounded-lg text-sm transition-all duration-300 ${
                        theme === "dark"
                          ? "bg-white/5 border border-white/10 text-white focus:border-[#7C3AED]/50"
                          : "bg-black/5 border border-gray-200 text-[#0C0F1A] focus:border-[#7C3AED]/50"
                      }`}
                    >
                      <option value="📋">📋 Planung</option>
                      <option value="👤">👤 Personal</option>
                      <option value="🗺️">🗺️ Route</option>
                      <option value="📄">📄 Dokument</option>
                      <option value="🚚">🚚 Transport</option>
                      <option value="⚙️">⚙️ System</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 transition-colors duration-500 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Schritte
                    </label>
                    <input
                      type="number"
                      value={newFlowForm.steps}
                      onChange={(e) => {
                        const steps = parseInt(e.target.value) || 1;
                        setNewFlowForm({ 
                          ...newFlowForm, 
                          steps: Math.max(1, steps),
                          currentStep: Math.min(newFlowForm.currentStep, steps - 1)
                        });
                      }}
                      min="1"
                      max="10"
                      className={`w-full px-4 py-3 rounded-lg text-sm transition-all duration-300 ${
                        theme === "dark"
                          ? "bg-white/5 border border-white/10 text-white focus:border-[#7C3AED]/50"
                          : "bg-black/5 border border-gray-200 text-[#0C0F1A] focus:border-[#7C3AED]/50"
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold mb-2 transition-colors duration-500 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Aktueller Schritt
                    </label>
                    <input
                      type="number"
                      value={newFlowForm.currentStep}
                      onChange={(e) => {
                        const step = parseInt(e.target.value) || 0;
                        setNewFlowForm({ 
                          ...newFlowForm, 
                          currentStep: Math.max(0, Math.min(step, newFlowForm.steps - 1))
                        });
                      }}
                      min="0"
                      max={newFlowForm.steps - 1}
                      className={`w-full px-4 py-3 rounded-lg text-sm transition-all duration-300 ${
                        theme === "dark"
                          ? "bg-white/5 border border-white/10 text-white focus:border-[#7C3AED]/50"
                          : "bg-black/5 border border-gray-200 text-[#0C0F1A] focus:border-[#7C3AED]/50"
                      }`}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-3 pt-2">
                  <motion.button
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      theme === "dark"
                        ? "bg-[#7C3AED] text-white hover:bg-[#7C3AED]/90"
                        : "bg-[#7C3AED] text-white hover:bg-[#7C3AED]/90"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddFlow}
                  >
                    Flow hinzufügen
                  </motion.button>
                  <motion.button
                    className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      theme === "dark"
                        ? "bg-white/5 text-gray-300 hover:bg-white/10"
                        : "bg-black/5 text-gray-700 hover:bg-black/10"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setIsAddingFlow(false);
                      setNewFlowForm({ name: "", status: "Wartend", steps: 3, currentStep: 0, icon: "📋" });
                    }}
                  >
                    Abbrechen
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TasksView = () => {
  const { theme } = useTheme();
  const tasks = [
    { id: 1, title: "Tour #1247 dokumentieren", priority: "Hoch", completed: false, dueDate: "Heute", category: "Dokumentation" },
    { id: 2, title: "Fahrer-Zuweisung prüfen", priority: "Mittel", completed: true, dueDate: "Gestern", category: "Personal" },
    { id: 3, title: "Route für Tour #1248 optimieren", priority: "Hoch", completed: false, dueDate: "Morgen", category: "Logistik" },
    { id: 4, title: "Dokumente für Abrechnung vorbereiten", priority: "Niedrig", completed: false, dueDate: "Übermorgen", category: "Finanzen" },
    { id: 5, title: "Fahrzeug-Wartung planen", priority: "Mittel", completed: false, dueDate: "Diese Woche", category: "Wartung" },
  ];

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    highPriority: tasks.filter(t => t.priority === "Hoch" && !t.completed).length,
  };

  const priorityColors = {
    Hoch: theme === "dark" ? "rgba(255, 100, 100, 0.3)" : "rgba(239, 68, 68, 0.2)",
    Mittel: theme === "dark" ? "rgba(255, 200, 100, 0.3)" : "rgba(251, 191, 36, 0.2)",
    Niedrig: theme === "dark" ? "rgba(100, 200, 255, 0.3)" : "rgba(59, 130, 246, 0.2)",
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className={`text-xl sm:text-2xl font-bold mb-2 transition-colors duration-500 ${
          theme === "dark" ? "text-white" : "text-[#0C0F1A]"
        }`}>Aufgaben</h4>
        <p className={`text-xs sm:text-sm mb-6 leading-relaxed transition-colors duration-500 ${
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        }`}>
          Deine Aufgaben und To-Dos im Überblick.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Gesamt", value: taskStats.total, color: theme === "dark" ? "rgba(0, 225, 255, 0.2)" : "rgba(124, 58, 237, 0.2)" },
          { label: "Erledigt", value: taskStats.completed, color: theme === "dark" ? "rgba(0, 255, 150, 0.2)" : "rgba(34, 197, 94, 0.2)" },
          { label: "Hohe Priorität", value: taskStats.highPriority, color: theme === "dark" ? "rgba(255, 100, 100, 0.2)" : "rgba(239, 68, 68, 0.2)" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            className="rounded-xl p-4 transition-all duration-500"
            style={{
              background: stat.color,
              border: theme === "dark"
                ? "1px solid rgba(255, 255, 255, 0.08)"
                : "1px solid rgba(0, 0, 0, 0.08)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className={`text-2xl font-bold mb-1 transition-colors duration-500 ${
              theme === "dark" ? "text-white" : "text-[#0C0F1A]"
            }`}>{stat.value}</div>
            <div className={`text-xs transition-colors duration-500 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Progress Chart */}
      <div className="rounded-xl p-5 transition-all duration-500 mb-6"
        style={{
          background: theme === "dark" 
            ? "rgba(255, 255, 255, 0.02)" 
            : "rgba(0, 0, 0, 0.02)",
          border: theme === "dark"
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "1px solid rgba(0, 0, 0, 0.08)",
        }}
      >
        <div className={`text-sm font-semibold mb-3 transition-colors duration-500 ${
          theme === "dark" ? "text-white" : "text-[#0C0F1A]"
        }`}>Fortschritt</div>
        <div className="flex items-center gap-2">
          <div className={`flex-1 h-3 rounded-full overflow-hidden transition-colors duration-500 ${
            theme === "dark" ? "bg-white/5" : "bg-black/5"
          }`}>
            <motion.div
              className="h-full rounded-full"
              style={{
                background: theme === "dark"
                  ? "linear-gradient(90deg, rgba(0,255,150,0.6), rgba(0,225,255,0.6))"
                  : "linear-gradient(90deg, rgba(34,197,94,0.6), rgba(124,58,237,0.6))",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${(taskStats.completed / taskStats.total) * 100}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <div className={`text-sm font-bold transition-colors duration-500 ${
            theme === "dark" ? "text-white" : "text-[#0C0F1A]"
          }`}>
            {Math.round((taskStats.completed / taskStats.total) * 100)}%
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((task, i) => (
          <motion.div
            key={task.id}
            className="rounded-xl p-4 transition-all duration-500"
            style={{
              background: task.completed
                ? theme === "dark"
                  ? "rgba(255, 255, 255, 0.02)"
                  : "rgba(0, 0, 0, 0.02)"
                : priorityColors[task.priority as keyof typeof priorityColors],
              border: theme === "dark"
                ? "1px solid rgba(255, 255, 255, 0.08)"
                : "1px solid rgba(0, 0, 0, 0.08)",
              opacity: task.completed ? 0.6 : 1,
            }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: task.completed ? 0.6 : 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ 
              scale: 1.02, 
              borderColor: theme === "dark" 
                ? "rgba(255, 255, 255, 0.15)" 
                : "rgba(0, 0, 0, 0.15)" 
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors duration-300 flex-shrink-0 mt-0.5 ${
                  task.completed
                    ? theme === "dark"
                      ? "bg-white/20 border-white/40"
                      : "bg-[#7C3AED]/20 border-[#7C3AED]/40"
                    : theme === "dark"
                      ? "border-white/30 hover:border-white/50"
                      : "border-[#7C3AED]/30 hover:border-[#7C3AED]/50"
                }`}
              >
                {task.completed && (
                  <svg className={`w-3 h-3 transition-colors duration-300 ${
                    theme === "dark" ? "text-white" : "text-[#7C3AED]"
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className={`font-medium transition-colors duration-500 ${task.completed ? "line-through" : ""} ${
                    theme === "dark" ? "text-white" : "text-[#0C0F1A]"
                  }`}>
                    {task.title}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 transition-colors duration-300 ${
                    task.priority === "Hoch"
                      ? theme === "dark"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-red-500/20 text-red-600"
                      : task.priority === "Mittel"
                      ? theme === "dark"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-yellow-500/20 text-yellow-600"
                      : theme === "dark"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-blue-500/20 text-blue-600"
                  }`}>
                    {task.priority}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className={`transition-colors duration-500 ${
                    theme === "dark" ? "text-gray-500" : "text-gray-600"
                  }`}>{task.category}</div>
                  <div className={`transition-colors duration-500 ${
                    theme === "dark" ? "text-gray-500" : "text-gray-600"
                  }`}>•</div>
                  <div className={`transition-colors duration-500 ${
                    theme === "dark" ? "text-gray-500" : "text-gray-600"
                  }`}>{task.dueDate}</div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const SpeditionView = () => {
  const { theme } = useTheme();
  const tours = [
    { id: 1247, destination: "München", driver: "Max M.", status: "Unterwegs", eta: "14:30", progress: 75, distance: "320 km", vehicle: "LKW-12" },
    { id: 1248, destination: "Berlin", driver: "Anna K.", status: "Gestartet", eta: "16:45", progress: 30, distance: "580 km", vehicle: "LKW-08" },
    { id: 1249, destination: "Hamburg", driver: "Tom S.", status: "Unterwegs", eta: "18:20", progress: 60, distance: "450 km", vehicle: "LKW-15" },
    { id: 1250, destination: "Köln", driver: "Lisa W.", status: "Geplant", eta: "20:15", progress: 0, distance: "280 km", vehicle: "LKW-22" },
  ];

  const tourStats = {
    active: tours.filter(t => t.status === "Unterwegs" || t.status === "Gestartet").length,
    total: tours.length,
    totalDistance: tours.reduce((sum, t) => sum + parseInt(t.distance), 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className={`text-xl sm:text-2xl font-bold mb-2 transition-colors duration-500 ${
          theme === "dark" ? "text-white" : "text-[#0C0F1A]"
        }`}>Spedition</h4>
        <p className={`text-xs sm:text-sm mb-6 leading-relaxed transition-colors duration-500 ${
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        }`}>
          Alle Touren und Logistik-Operationen im Überblick.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Aktive Touren", value: tourStats.active, color: theme === "dark" ? "rgba(0, 225, 255, 0.2)" : "rgba(124, 58, 237, 0.2)" },
          { label: "Gesamt Touren", value: tourStats.total, color: theme === "dark" ? "rgba(164, 92, 255, 0.2)" : "rgba(124, 58, 237, 0.2)" },
          { label: "Gesamt Distanz", value: `${tourStats.totalDistance} km`, color: theme === "dark" ? "rgba(0, 255, 150, 0.2)" : "rgba(34, 197, 94, 0.2)" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            className="rounded-xl p-4 transition-all duration-500"
            style={{
              background: stat.color,
              border: theme === "dark"
                ? "1px solid rgba(255, 255, 255, 0.08)"
                : "1px solid rgba(0, 0, 0, 0.08)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className={`text-2xl font-bold mb-1 transition-colors duration-500 ${
              theme === "dark" ? "text-white" : "text-[#0C0F1A]"
            }`}>{stat.value}</div>
            <div className={`text-xs transition-colors duration-500 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Tour Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tours.map((tour, i) => (
          <motion.div
            key={tour.id}
            className="rounded-xl p-5 transition-all duration-500"
            style={{
              background: theme === "dark" 
                ? "rgba(255, 255, 255, 0.02)" 
                : "rgba(0, 0, 0, 0.02)",
              border: theme === "dark"
                ? "1px solid rgba(255, 255, 255, 0.08)"
                : "1px solid rgba(0, 0, 0, 0.08)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ 
              scale: 1.02, 
              borderColor: theme === "dark" 
                ? "rgba(255, 255, 255, 0.15)" 
                : "rgba(0, 0, 0, 0.15)" 
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`font-bold text-lg transition-colors duration-500 ${
                theme === "dark" ? "text-white" : "text-[#0C0F1A]"
              }`}>Tour #{tour.id}</div>
              <div
                className={`px-2 py-1 rounded text-xs font-medium transition-colors duration-300 ${
                  tour.status === "Unterwegs"
                    ? theme === "dark"
                      ? "bg-white/20 text-white"
                      : "bg-[#7C3AED]/20 text-[#7C3AED]"
                    : tour.status === "Gestartet"
                    ? theme === "dark"
                      ? "bg-white/15 text-white/80"
                      : "bg-[#7C3AED]/15 text-[#7C3AED]/80"
                    : theme === "dark"
                      ? "bg-white/10 text-white/60"
                      : "bg-[#7C3AED]/10 text-[#7C3AED]/60"
                }`}
              >
                {tour.status}
              </div>
            </div>
            
            {/* Progress Bar */}
            {tour.progress > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`text-xs transition-colors duration-500 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>Fortschritt</div>
                  <div className={`text-xs font-semibold transition-colors duration-500 ${
                    theme === "dark" ? "text-white" : "text-[#0C0F1A]"
                  }`}>{tour.progress}%</div>
                </div>
                <div className={`h-2 rounded-full overflow-hidden transition-colors duration-500 ${
                  theme === "dark" ? "bg-white/5" : "bg-black/5"
                }`}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: theme === "dark"
                        ? "linear-gradient(90deg, rgba(0,225,255,0.6), rgba(164,92,255,0.6))"
                        : "linear-gradient(90deg, rgba(124,58,237,0.6), rgba(124,58,237,0.6))",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${tour.progress}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <div className={`flex items-center gap-2 transition-colors duration-500 ${
                theme === "dark" ? "text-white/80" : "text-[#0C0F1A]/80"
              }`}>
                <span className="text-lg">→</span>
                <span className="font-medium">{tour.destination}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className={`transition-colors duration-500 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}>Fahrer: {tour.driver}</div>
                <div className={`transition-colors duration-500 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}>Fahrzeug: {tour.vehicle}</div>
                <div className={`transition-colors duration-500 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}>Distanz: {tour.distance}</div>
                <div className={`transition-colors duration-500 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}>ETA: {tour.eta}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const DriverView = () => {
  const { theme } = useTheme();
  const drivers = [
    { name: "Max Mustermann", status: "Verfügbar", tours: 3, rating: 4.8, hours: 8.5, efficiency: 95 },
    { name: "Anna Schmidt", status: "Unterwegs", tours: 1, rating: 4.9, hours: 6.0, efficiency: 98 },
    { name: "Tom Weber", status: "Verfügbar", tours: 2, rating: 4.7, hours: 7.5, efficiency: 92 },
    { name: "Lisa Müller", status: "Pause", tours: 0, rating: 4.9, hours: 0, efficiency: 96 },
  ];

  const driverStats = {
    total: drivers.length,
    available: drivers.filter(d => d.status === "Verfügbar").length,
    onRoad: drivers.filter(d => d.status === "Unterwegs").length,
    avgRating: (drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length).toFixed(1),
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className={`text-xl sm:text-2xl font-bold mb-2 transition-colors duration-500 ${
          theme === "dark" ? "text-white" : "text-[#0C0F1A]"
        }`}>Fahrer</h4>
        <p className={`text-xs sm:text-sm mb-6 leading-relaxed transition-colors duration-500 ${
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        }`}>
          Übersicht über alle Fahrer und deren Status.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Gesamt", value: driverStats.total, color: theme === "dark" ? "rgba(0, 225, 255, 0.2)" : "rgba(124, 58, 237, 0.2)" },
          { label: "Verfügbar", value: driverStats.available, color: theme === "dark" ? "rgba(0, 255, 150, 0.2)" : "rgba(34, 197, 94, 0.2)" },
          { label: "Unterwegs", value: driverStats.onRoad, color: theme === "dark" ? "rgba(164, 92, 255, 0.2)" : "rgba(124, 58, 237, 0.2)" },
          { label: "Ø Bewertung", value: driverStats.avgRating, color: theme === "dark" ? "rgba(255, 200, 100, 0.2)" : "rgba(251, 191, 36, 0.2)" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            className="rounded-xl p-4 transition-all duration-500"
            style={{
              background: stat.color,
              border: theme === "dark"
                ? "1px solid rgba(255, 255, 255, 0.08)"
                : "1px solid rgba(0, 0, 0, 0.08)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className={`text-2xl font-bold mb-1 transition-colors duration-500 ${
              theme === "dark" ? "text-white" : "text-[#0C0F1A]"
            }`}>{stat.value}</div>
            <div className={`text-xs transition-colors duration-500 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Driver Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {drivers.map((driver, i) => (
          <motion.div
            key={i}
            className="rounded-xl p-5 transition-all duration-500"
            style={{
              background: theme === "dark" 
                ? "rgba(255, 255, 255, 0.02)" 
                : "rgba(0, 0, 0, 0.02)",
              border: theme === "dark"
                ? "1px solid rgba(255, 255, 255, 0.08)"
                : "1px solid rgba(0, 0, 0, 0.08)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ 
              scale: 1.02, 
              borderColor: theme === "dark" 
                ? "rgba(255, 255, 255, 0.15)" 
                : "rgba(0, 0, 0, 0.15)" 
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`font-semibold transition-colors duration-500 ${
                theme === "dark" ? "text-white" : "text-[#0C0F1A]"
              }`}>{driver.name}</div>
              <div
                className={`px-2 py-1 rounded text-xs font-medium transition-colors duration-300 ${
                  driver.status === "Verfügbar"
                    ? theme === "dark"
                      ? "bg-white/20 text-white"
                      : "bg-[#7C3AED]/20 text-[#7C3AED]"
                    : driver.status === "Unterwegs"
                    ? theme === "dark"
                      ? "bg-white/15 text-white/80"
                      : "bg-[#7C3AED]/15 text-[#7C3AED]/80"
                    : theme === "dark"
                      ? "bg-white/10 text-white/60"
                      : "bg-[#7C3AED]/10 text-[#7C3AED]/60"
                }`}
              >
                {driver.status}
              </div>
            </div>
            
            {/* Rating Stars */}
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, starIndex) => (
                <svg
                  key={starIndex}
                  className={`w-4 h-4 transition-colors duration-300 ${
                    starIndex < Math.floor(driver.rating)
                      ? theme === "dark" ? "text-yellow-400" : "text-yellow-500"
                      : theme === "dark" ? "text-gray-600" : "text-gray-300"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className={`text-xs ml-1 transition-colors duration-500 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>({driver.rating})</span>
            </div>
            
            {/* Efficiency Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <div className={`text-xs transition-colors duration-500 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>Effizienz</div>
                <div className={`text-xs font-semibold transition-colors duration-500 ${
                  theme === "dark" ? "text-white" : "text-[#0C0F1A]"
                }`}>{driver.efficiency}%</div>
              </div>
              <div className={`h-1.5 rounded-full overflow-hidden transition-colors duration-500 ${
                theme === "dark" ? "bg-white/5" : "bg-black/5"
              }`}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: theme === "dark"
                      ? "linear-gradient(90deg, rgba(0,255,150,0.6), rgba(0,225,255,0.6))"
                      : "linear-gradient(90deg, rgba(34,197,94,0.6), rgba(124,58,237,0.6))",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${driver.efficiency}%` }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className={`transition-colors duration-500 ${
                theme === "dark" ? "text-gray-500" : "text-gray-600"
              }`}>Aktive Touren: {driver.tours}</div>
              <div className={`transition-colors duration-500 ${
                theme === "dark" ? "text-gray-500" : "text-gray-600"
              }`}>Arbeitszeit: {driver.hours}h</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const TimeView = () => {
  const { theme } = useTheme();
  const timeEntries = [
    { driver: "Max M.", start: "08:00", end: "16:30", hours: 8.5, status: "Aktiv", progress: 85 },
    { driver: "Anna K.", start: "09:00", end: "17:00", hours: 8.0, status: "Aktiv", progress: 75 },
    { driver: "Tom S.", start: "07:30", end: "15:30", hours: 8.0, status: "Beendet", progress: 100 },
    { driver: "Lisa W.", start: "10:00", end: "18:00", hours: 0, status: "Geplant", progress: 0 },
  ];

  const timeStats = {
    totalHours: timeEntries.reduce((sum, e) => sum + e.hours, 0),
    active: timeEntries.filter(e => e.status === "Aktiv").length,
    completed: timeEntries.filter(e => e.status === "Beendet").length,
    avgHours: (timeEntries.filter(e => e.hours > 0).reduce((sum, e) => sum + e.hours, 0) / timeEntries.filter(e => e.hours > 0).length || 0).toFixed(1),
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className={`text-xl sm:text-2xl font-bold mb-2 transition-colors duration-500 ${
          theme === "dark" ? "text-white" : "text-[#0C0F1A]"
        }`}>Zeiterfassung</h4>
        <p className={`text-xs sm:text-sm mb-6 leading-relaxed transition-colors duration-500 ${
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        }`}>
          Übersicht über Arbeitszeiten und Zeiterfassung.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Gesamt Stunden", value: `${timeStats.totalHours}h`, color: theme === "dark" ? "rgba(0, 225, 255, 0.2)" : "rgba(124, 58, 237, 0.2)" },
          { label: "Aktiv", value: timeStats.active, color: theme === "dark" ? "rgba(164, 92, 255, 0.2)" : "rgba(124, 58, 237, 0.2)" },
          { label: "Beendet", value: timeStats.completed, color: theme === "dark" ? "rgba(0, 255, 150, 0.2)" : "rgba(34, 197, 94, 0.2)" },
          { label: "Ø Stunden", value: `${timeStats.avgHours}h`, color: theme === "dark" ? "rgba(255, 200, 100, 0.2)" : "rgba(251, 191, 36, 0.2)" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            className="rounded-xl p-4 transition-all duration-500"
            style={{
              background: stat.color,
              border: theme === "dark"
                ? "1px solid rgba(255, 255, 255, 0.08)"
                : "1px solid rgba(0, 0, 0, 0.08)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className={`text-2xl font-bold mb-1 transition-colors duration-500 ${
              theme === "dark" ? "text-white" : "text-[#0C0F1A]"
            }`}>{stat.value}</div>
            <div className={`text-xs transition-colors duration-500 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Timeline Visualization */}
      <div className="rounded-xl p-5 mb-6 transition-all duration-500"
        style={{
          background: theme === "dark" 
            ? "rgba(255, 255, 255, 0.02)" 
            : "rgba(0, 0, 0, 0.02)",
          border: theme === "dark"
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "1px solid rgba(0, 0, 0, 0.08)",
        }}
      >
        <div className={`text-sm font-semibold mb-4 transition-colors duration-500 ${
          theme === "dark" ? "text-white" : "text-[#0C0F1A]"
        }`}>Tagesübersicht</div>
        <div className="relative h-24">
          {timeEntries.filter(e => e.hours > 0).map((entry, i) => {
            const startHour = parseInt(entry.start.split(":")[0]);
            const endHour = parseInt(entry.end.split(":")[0]);
            const left = (startHour / 24) * 100;
            const width = ((endHour - startHour) / 24) * 100;
            return (
              <motion.div
                key={i}
                className="absolute h-8 rounded-lg flex items-center justify-center text-xs font-medium"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  background: entry.status === "Aktiv"
                    ? theme === "dark"
                      ? "rgba(164, 92, 255, 0.3)"
                      : "rgba(124, 58, 237, 0.3)"
                    : theme === "dark"
                      ? "rgba(0, 225, 255, 0.3)"
                      : "rgba(124, 58, 237, 0.3)",
                  border: `1px solid ${entry.status === "Aktiv" 
                    ? theme === "dark" ? "rgba(164, 92, 255, 0.6)" : "rgba(124, 58, 237, 0.6)"
                    : theme === "dark" ? "rgba(0, 225, 255, 0.6)" : "rgba(124, 58, 237, 0.6)"}`,
                  top: `${i * 32}px`,
                  color: theme === "dark" ? "white" : "#0C0F1A",
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                {entry.driver} ({entry.hours}h)
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Time Entries */}
      <div className="space-y-3">
        {timeEntries.map((entry, i) => (
          <motion.div
            key={i}
            className="rounded-xl p-5 transition-all duration-500"
            style={{
              background: theme === "dark" 
                ? "rgba(255, 255, 255, 0.02)" 
                : "rgba(0, 0, 0, 0.02)",
              border: theme === "dark"
                ? "1px solid rgba(255, 255, 255, 0.08)"
                : "1px solid rgba(0, 0, 0, 0.08)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ 
              scale: 1.02, 
              borderColor: theme === "dark" 
                ? "rgba(255, 255, 255, 0.15)" 
                : "rgba(0, 0, 0, 0.15)" 
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`font-semibold transition-colors duration-500 ${
                theme === "dark" ? "text-white" : "text-[#0C0F1A]"
              }`}>{entry.driver}</div>
              <div className={`font-mono transition-colors duration-500 ${
                theme === "dark" ? "text-white" : "text-[#0C0F1A]"
              }`}>{entry.start} - {entry.end}</div>
            </div>
            
            {entry.progress > 0 && (
              <div className="mb-3">
                <div className={`h-1.5 rounded-full overflow-hidden transition-colors duration-500 ${
                  theme === "dark" ? "bg-white/5" : "bg-black/5"
                }`}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: theme === "dark"
                        ? "linear-gradient(90deg, rgba(0,225,255,0.6), rgba(164,92,255,0.6))"
                        : "linear-gradient(90deg, rgba(124,58,237,0.6), rgba(124,58,237,0.6))",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${entry.progress}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className={`text-sm transition-colors duration-500 ${
                theme === "dark" ? "text-gray-500" : "text-gray-600"
              }`}>{entry.hours > 0 ? `${entry.hours} Stunden` : "Noch nicht gestartet"}</div>
              <div className={`px-2 py-1 rounded text-xs font-medium transition-colors duration-300 ${
                entry.status === "Aktiv"
                  ? theme === "dark"
                    ? "bg-white/20 text-white"
                    : "bg-[#7C3AED]/20 text-[#7C3AED]"
                  : entry.status === "Beendet"
                  ? theme === "dark"
                    ? "bg-white/15 text-white/80"
                    : "bg-[#7C3AED]/15 text-[#7C3AED]/80"
                  : theme === "dark"
                    ? "bg-white/10 text-white/60"
                    : "bg-[#7C3AED]/10 text-[#7C3AED]/60"
              }`}>
                {entry.status}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const SettingsView = () => {
  const { theme } = useTheme();
  const settings = [
    { category: "Benachrichtigungen", icon: "🔔", items: [
      { name: "E-Mail", enabled: true },
      { name: "Push", enabled: true },
      { name: "SMS", enabled: false },
    ]},
    { category: "Automatisierung", icon: "⚙️", items: [
      { name: "Auto-Routing", enabled: true },
      { name: "Auto-Zuweisung", enabled: true },
      { name: "Auto-Dokumentation", enabled: false },
    ]},
    { category: "Daten", icon: "💾", items: [
      { name: "Backup", enabled: true },
      { name: "Export", enabled: true },
      { name: "Synchronisation", enabled: true },
    ]},
    { category: "Sicherheit", icon: "🔒", items: [
      { name: "2FA", enabled: false },
      { name: "Verschlüsselung", enabled: true },
      { name: "Audit-Log", enabled: true },
    ]},
  ];

  const systemInfo = {
    version: "2.4.1",
    lastBackup: "Vor 2 Stunden",
    storage: "12.4 GB / 50 GB",
    uptime: "99.9%",
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className={`text-xl sm:text-2xl font-bold mb-2 transition-colors duration-500 ${
          theme === "dark" ? "text-white" : "text-[#0C0F1A]"
        }`}>Einstellungen</h4>
        <p className={`text-xs sm:text-sm mb-6 leading-relaxed transition-colors duration-500 ${
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        }`}>
          Systemeinstellungen und Konfiguration.
        </p>
      </div>

      {/* System Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Version", value: systemInfo.version, color: theme === "dark" ? "rgba(0, 225, 255, 0.2)" : "rgba(124, 58, 237, 0.2)" },
          { label: "Letztes Backup", value: systemInfo.lastBackup, color: theme === "dark" ? "rgba(0, 255, 150, 0.2)" : "rgba(34, 197, 94, 0.2)" },
          { label: "Speicher", value: systemInfo.storage, color: theme === "dark" ? "rgba(164, 92, 255, 0.2)" : "rgba(124, 58, 237, 0.2)" },
          { label: "Uptime", value: systemInfo.uptime, color: theme === "dark" ? "rgba(255, 200, 100, 0.2)" : "rgba(251, 191, 36, 0.2)" },
        ].map((info, i) => (
          <motion.div
            key={i}
            className="rounded-xl p-4 transition-all duration-500"
            style={{
              background: info.color,
              border: theme === "dark"
                ? "1px solid rgba(255, 255, 255, 0.08)"
                : "1px solid rgba(0, 0, 0, 0.08)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className={`text-sm font-semibold mb-1 transition-colors duration-500 ${
              theme === "dark" ? "text-white" : "text-[#0C0F1A]"
            }`}>{info.value}</div>
            <div className={`text-xs transition-colors duration-500 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>{info.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Settings Categories */}
      <div className="space-y-4">
        {settings.map((setting, i) => (
          <motion.div
            key={i}
            className="rounded-xl p-5 transition-all duration-500"
            style={{
              background: theme === "dark" 
                ? "rgba(255, 255, 255, 0.02)" 
                : "rgba(0, 0, 0, 0.02)",
              border: theme === "dark"
                ? "1px solid rgba(255, 255, 255, 0.08)"
                : "1px solid rgba(0, 0, 0, 0.08)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ 
              scale: 1.01, 
              borderColor: theme === "dark" 
                ? "rgba(255, 255, 255, 0.15)" 
                : "rgba(0, 0, 0, 0.15)" 
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">{setting.icon}</div>
              <div className={`font-semibold transition-colors duration-500 ${
                theme === "dark" ? "text-white" : "text-[#0C0F1A]"
              }`}>{setting.category}</div>
            </div>
            <div className="space-y-3">
              {setting.items.map((item, j) => (
                <div key={j} className="flex items-center justify-between py-2 border-b border-transparent last:border-0"
                  style={{
                    borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <span className={`text-sm transition-colors duration-500 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>{item.name}</span>
                  <div 
                    className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${
                      item.enabled
                        ? theme === "dark"
                          ? "bg-[#00E1FF]/30"
                          : "bg-[#7C3AED]/30"
                        : theme === "dark"
                          ? "bg-white/10"
                          : "bg-black/10"
                    }`}
                  >
                    <motion.div
                      className={`w-5 h-5 rounded-full absolute top-0.5 transition-colors duration-300 ${
                        item.enabled
                          ? theme === "dark"
                            ? "bg-[#00E1FF]"
                            : "bg-[#7C3AED]"
                          : theme === "dark"
                            ? "bg-white/30"
                            : "bg-gray-400"
                      }`}
                      animate={{ x: item.enabled ? 22 : 2 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      style={{
                        boxShadow: item.enabled
                          ? `0 0 8px ${theme === "dark" ? "rgba(0, 225, 255, 0.5)" : "rgba(124, 58, 237, 0.5)"}`
                          : "none",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default function DashboardPreview() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNavIndex, setActiveNavIndex] = useState(0); // Übersicht ist Standard
  const [dragX, setDragX] = useState(0);
  const x = useMotionValue(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "Hallo! Ich bin ChronexAI. Wie kann ich Ihnen helfen? Fragen Sie mich nach aktiven Touren, freien Fahrern, Terminen oder offenen Aufträgen." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatButtonRef = useRef<HTMLButtonElement>(null);
  const previewRootRef = useRef<HTMLDivElement>(null);
  const [overlayRoot, setOverlayRoot] = useState<HTMLDivElement | null>(null);
  const [chatPosition, setChatPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Create overlay root
  useEffect(() => {
    if (typeof document === "undefined" || !previewRootRef.current || overlayRoot) return;
    
    const overlayRootElement = document.createElement("div");
    overlayRootElement.id = "previewOverlayRoot";
    overlayRootElement.style.cssText = "position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 99999;";
    previewRootRef.current.appendChild(overlayRootElement);
    setOverlayRoot(overlayRootElement);
    
    return () => {
      if (overlayRootElement && overlayRootElement.parentNode) {
        overlayRootElement.parentNode.removeChild(overlayRootElement);
      }
    };
  }, [overlayRoot]);

  // Overlay position ref for direct DOM updates (no React state per scroll)
  const overlayPositionRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);

  // Update chat position - High-End Performance: requestAnimationFrame + CSS Variables
  useEffect(() => {
    if (typeof window === "undefined" || !chatOpen || !chatButtonRef.current || !previewRootRef.current || !overlayPositionRef.current) return;
    
    const updatePosition = () => {
      if (!chatButtonRef.current || !previewRootRef.current || !overlayPositionRef.current) return;
      
      try {
        const previewRect = previewRootRef.current.getBoundingClientRect();
        const buttonRect = chatButtonRef.current.getBoundingClientRect();
        const previewScrollTop = previewRootRef.current.scrollTop;
        
        // Calculate relative position within preview
        const buttonRelativeTop = buttonRect.top - previewRect.top + previewScrollTop;
        
        const previewWidth = previewRect.width;
        const previewHeight = previewRect.height;
        const isMobile = previewWidth < 640;
        
        // Calculate optimal width (responsive)
        const padding = 16;
        const chatWidth = isMobile 
          ? previewWidth - (padding * 2)
          : Math.min(600, previewWidth - (padding * 2));
        
        // Horizontal: Always centered in preview
        const left = (previewWidth - chatWidth) / 2;
        
        // Vertical: Below button + preview scroll offset
        const chatHeight = isMobile ? Math.min(previewHeight * 0.85, 600) : Math.min(previewHeight * 0.8, 700);
        let top = buttonRelativeTop + buttonRect.height + 16;
        
        // Viewport clamp: Ensure overlay stays within preview bounds
        const maxTop = previewHeight - chatHeight - padding;
        const minTop = padding;
        
        if (isMobile) {
          top = Math.max(minTop, Math.min(maxTop, (previewHeight - chatHeight) / 2));
        } else {
          top = Math.max(minTop, Math.min(maxTop, top));
        }
        
        // Direct DOM update via CSS custom properties (no React state update per scroll)
        overlayPositionRef.current.style.setProperty("--chat-top", `${top}px`);
        overlayPositionRef.current.style.setProperty("--chat-left", `${left}px`);
        overlayPositionRef.current.style.setProperty("--chat-width", `${chatWidth}px`);
        
        // Update state only for initial render and resize (not per scroll)
        setChatPosition({ top, left, width: chatWidth });
      } catch (e) {
        console.error("Error updating chat position:", e);
      }
    };
    
    // Initial position (synchronous)
    updatePosition();
    
    // RAF-based scroll handler (only when overlay is open)
    const handleScroll = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        updatePosition();
        rafIdRef.current = null;
      });
    };
    
    const handleResize = () => {
      updatePosition();
    };
    
    // Only attach listeners when overlay is open
    previewRootRef.current.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (previewRootRef.current) {
        previewRootRef.current.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [chatOpen]);

  // Dashboard Data - Defined before callbacks
  const detailSections = [
    {
      title: "Aktive Touren",
      items: [
        { id: 1247, destination: "München", driver: "Max M.", eta: "14:30", status: "Unterwegs" },
        { id: 1248, destination: "Berlin", driver: "Anna K.", eta: "16:45", status: "Gestartet" },
        { id: 1249, destination: "Hamburg", driver: "Tom S.", eta: "18:20", status: "Unterwegs" },
      ],
    },
    {
      title: "Fahrzeuge unterwegs",
      items: [
        { type: "LKW", id: "LKW-12", driver: "Max M.", destination: "München", status: "Aktiv" },
        { type: "LKW", id: "LKW-08", driver: "Anna K.", destination: "Berlin", status: "Aktiv" },
        { type: "Transporter", id: "TR-15", driver: "Tom S.", destination: "Hamburg", status: "Aktiv" },
      ],
    },
    {
      title: "Heutige Termine",
      items: [
        { time: "09:00", type: "Abholung", location: "München", status: "Geplant" },
        { time: "14:30", type: "Zustellung", location: "Berlin", status: "Geplant" },
        { time: "16:45", type: "Abholung", location: "Hamburg", status: "Geplant" },
      ],
    },
    {
      title: "Freie Fahrer",
      items: [
        { name: "Max Mustermann", status: "Verfügbar", tours: 3, rating: 4.8 },
        { name: "Anna Schmidt", status: "Verfügbar", tours: 2, rating: 4.9 },
        { name: "Tom Weber", status: "Verfügbar", tours: 1, rating: 4.7 },
      ],
    },
    {
      title: "Offene Aufträge",
      items: [
        { id: "A-1247", priority: "Hoch", destination: "München", status: "Wartend" },
        { id: "A-1248", priority: "Mittel", destination: "Berlin", status: "Wartend" },
        { id: "A-1249", priority: "Hoch", destination: "Hamburg", status: "Wartend" },
      ],
    },
  ];

  const navItems = [
    { label: "Übersicht", icon: OverviewIcon, view: OverviewView },
    { label: "Kalender", icon: CalendarIcon, view: CalendarView },
    { label: "Flow", icon: FlowIcon, view: FlowView },
    { label: "Aufgaben", icon: TasksIcon, view: TasksView },
    { label: "Spedition", icon: SpeditionIcon, view: SpeditionView },
    { label: "Fahrer", icon: DriverIcon, view: DriverView },
    { label: "Zeit", icon: TimeIcon, view: TimeView },
    { label: "Einstellungen", icon: SettingsIcon, view: SettingsView },
  ];

  const CurrentViewComponent = navItems[activeNavIndex]?.view || OverviewView;

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold && activeNavIndex > 0) {
      setActiveNavIndex(activeNavIndex - 1);
    } else if (info.offset.x < -threshold && activeNavIndex < navItems.length - 1) {
      setActiveNavIndex(activeNavIndex + 1);
    }
    setDragX(0);
  };

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // AI Response Generator
  const generateAIResponse = (userMessage: string, sections: typeof detailSections): string => {
    const message = userMessage.toLowerCase();
    
    // Aktive Touren
    if (message.includes("aktive") || message.includes("touren") || message.includes("unterwegs")) {
      const activeTours = sections.find(s => s.title === "Aktive Touren");
      if (activeTours && "items" in activeTours) {
        const tours = activeTours.items.filter((item: any) => "destination" in item && "driver" in item);
        if (tours.length > 0) {
          const tourList = tours.map((tour: any) => 
            `• Tour ${tour.id} nach ${tour.destination} mit Fahrer ${tour.driver}, ETA: ${tour.eta}, Status: ${tour.status}`
          ).join("\n");
          return `Aktuell sind ${tours.length} Touren aktiv:\n\n${tourList}`;
        }
        return "Es sind aktuell keine aktiven Touren vorhanden.";
      }
    }
    
    // Freie Fahrer
    if (message.includes("freie") || message.includes("fahrer") || message.includes("verfügbar")) {
      const freeDrivers = sections.find(s => s.title === "Freie Fahrer");
      if (freeDrivers && "items" in freeDrivers) {
        const drivers = freeDrivers.items.filter((item: any) => "name" in item && "status" in item);
        if (drivers.length > 0) {
          const driverList = drivers.map((driver: any) => 
            `• ${driver.name} - ${driver.status}, ${driver.tours} Touren, Bewertung: ${driver.rating}/5.0`
          ).join("\n");
          return `Es sind ${drivers.length} freie Fahrer verfügbar:\n\n${driverList}`;
        }
        return "Aktuell sind keine freien Fahrer verfügbar.";
      }
    }
    
    // Heutige Termine
    if (message.includes("termine") || message.includes("heute") || message.includes("termin")) {
      const todayAppointments = sections.find(s => s.title === "Heutige Termine");
      if (todayAppointments && "items" in todayAppointments) {
        const appointments = todayAppointments.items.filter((item: any) => "time" in item && "type" in item);
        if (appointments.length > 0) {
          const appointmentList = appointments.map((apt: any) => 
            `• ${apt.time} - ${apt.type} in ${apt.location}, Status: ${apt.status}`
          ).join("\n");
          return `Heute sind ${appointments.length} Termine geplant:\n\n${appointmentList}`;
        }
        return "Heute sind keine Termine geplant.";
      }
    }
    
    // Offene Aufträge
    if (message.includes("offene") || message.includes("aufträge") || message.includes("auftrag")) {
      const openOrders = sections.find(s => s.title === "Offene Aufträge");
      if (openOrders && "items" in openOrders) {
        const orders = openOrders.items.filter((item: any) => "id" in item && "priority" in item);
        if (orders.length > 0) {
          const orderList = orders.map((order: any) => 
            `• ${order.id} nach ${order.destination}, Priorität: ${order.priority}, Status: ${order.status}`
          ).join("\n");
          return `Es gibt ${orders.length} offene Aufträge:\n\n${orderList}`;
        }
        return "Es sind aktuell keine offenen Aufträge vorhanden.";
      }
    }
    
    // Fahrzeuge
    if (message.includes("fahrzeug") || message.includes("fahrzeuge") || message.includes("lkw") || message.includes("transporter")) {
      const vehicles = sections.find(s => s.title === "Fahrzeuge unterwegs");
      if (vehicles && "items" in vehicles) {
        const vehicleList = vehicles.items.map((vehicle: any) => 
          `• ${vehicle.type} ${vehicle.id} mit Fahrer ${vehicle.driver} nach ${vehicle.destination}, Status: ${vehicle.status}`
        ).join("\n");
        return `Aktuell sind ${vehicles.items.length} Fahrzeuge unterwegs:\n\n${vehicleList}`;
      }
    }
    
    // Allgemeine Antworten
    if (message.includes("hilfe") || message.includes("help") || message.includes("was kann")) {
      return "Ich kann Ihnen helfen mit:\n\n• Aktive Touren anzeigen\n• Freie Fahrer auflisten\n• Heutige Termine zeigen\n• Offene Aufträge anzeigen\n• Fahrzeuge unterwegs auflisten\n\nStellen Sie einfach eine Frage zu einem dieser Themen!";
    }
    
    return "Entschuldigung, ich habe Ihre Frage nicht vollständig verstanden. Fragen Sie mich nach aktiven Touren, freien Fahrern, Terminen, offenen Aufträgen oder Fahrzeugen.";
  };

  // Memoized callbacks to prevent unnecessary re-renders
  const handleChatSend = useCallback((message: string) => {
    setChatMessages((prev) => [...prev, { role: "user", content: message }]);
    setChatInput("");
    setTimeout(() => {
      const response = generateAIResponse(message, detailSections);
      setChatMessages((prev) => [...prev, { role: "assistant", content: response }]);
    }, 500);
  }, [detailSections]);

  const handleChatClose = useCallback(() => {
    setChatOpen(false);
  }, []);

  const handleToggleListening = useCallback(() => {
    setIsListening((prev) => !prev);
  }, []);

  return (
    <div className="relative w-full max-w-7xl mx-auto">
      <motion.div
        className="relative rounded-2xl overflow-hidden transition-all duration-500"
        style={{
          position: "relative",
          minHeight: "100vh",
          background: theme === "dark" 
            ? "rgba(8, 10, 18, 0.95)" 
            : "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          border: theme === "dark"
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow: theme === "dark"
            ? "0 25px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.06)"
            : "0 25px 80px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(0, 0, 0, 0.05)",
        }}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <motion.div
          className={`px-4 sm:px-6 py-4 border-b transition-colors duration-500 ${
            theme === "dark" ? "border-white/5" : "border-black/5"
          }`}
          style={{ 
            background: theme === "dark" 
              ? "rgba(255, 255, 255, 0.02)" 
              : "rgba(0, 0, 0, 0.02)" 
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <motion.h3
                className={`text-sm sm:text-base md:text-lg font-semibold leading-tight transition-colors duration-500 ${
                  theme === "dark" ? "text-white" : "text-[#0C0F1A]"
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                HEUTE <span className="hidden sm:inline">{formattedDate.toUpperCase()}</span>
                <span className="sm:hidden">{formattedDate.split(",")[0].toUpperCase()}</span>
              </motion.h3>
              <div className="flex items-center gap-2 flex-wrap">
                <motion.button
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-white whitespace-nowrap"
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                  }}
                  whileHover={{ scale: 1.05, background: "rgba(255, 255, 255, 0.12)" }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <span className="hidden sm:inline">Administrator (admin)</span>
                  <span className="sm:hidden">Admin</span>
                </motion.button>
                <motion.button
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-white flex items-center gap-2 whitespace-nowrap"
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    willChange: "transform",
                  }}
                  whileHover={{ scale: 1.05, background: "rgba(255, 255, 255, 0.12)" }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setChatOpen(true);
                  }}
                  ref={chatButtonRef}
                >
                  <motion.span
                    className="w-2 h-2 rounded-full bg-white"
                    style={{ boxShadow: "0 0 8px rgba(255, 255, 255, 0.8)" }}
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="hidden sm:inline">ChronexAI Chat starten</span>
                  <span className="sm:hidden">Chat</span>
                </motion.button>
              </div>
            </div>
            <motion.div
              className="relative w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Suche nach Terminen, Fahrern oder Aufträgen..."
                className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-300 text-sm ${
                  theme === "dark"
                    ? "bg-black/30 border-white/10 text-white placeholder-gray-500 focus:border-white/20 focus:ring-white/10"
                    : "bg-white/50 border-black/10 text-[#0C0F1A] placeholder-gray-400 focus:border-black/20 focus:ring-black/10"
                } focus:outline-none focus:ring-1`}
              />
              <motion.svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                animate={{ rotate: searchQuery ? 360 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </motion.svg>
            </motion.div>
          </div>
        </motion.div>

        {/* Content - Swipeable */}
        <motion.div
          className="p-4 sm:p-6 min-h-[800px] overflow-visible pb-24"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          style={{ x }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeNavIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <CurrentViewComponent />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Bottom Navigation - Ultra High-End Apple Intelligence Design - Always Visible - Floating */}
        <motion.div
          className="sticky bottom-0 left-0 right-0 z-50 group/nav"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{
            padding: "0 16px 16px 16px",
          }}
        >
          {/* Ultra Glassmorphic Container - Highest Level - Floating with Rounded Corners */}
          <div
            className="relative mx-auto max-w-5xl px-4 sm:px-6 md:px-8 py-3 sm:py-4 transition-all duration-700 ease-out overflow-hidden"
            style={{
              background: theme === "dark"
                ? "linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.55) 50%, rgba(0, 0, 0, 0.6) 100%)"
                : "linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.90) 50%, rgba(255, 255, 255, 0.95) 100%)",
              backdropFilter: "blur(120px) saturate(250%)",
              WebkitBackdropFilter: "blur(120px) saturate(250%)",
              border: theme === "dark"
                ? "1px solid rgba(255, 255, 255, 0.3)"
                : "1px solid rgba(0, 0, 0, 0.2)",
              borderRadius: "32px",
              boxShadow: theme === "dark"
                ? "0 -8px 40px rgba(0, 0, 0, 0.8), 0 8px 40px rgba(0, 0, 0, 0.6), 0 0 0 0.5px rgba(255, 255, 255, 0.15) inset, 0 2px 4px rgba(255, 255, 255, 0.1) inset, 0 -2px 2px rgba(0, 0, 0, 0.4) inset, 0 0 120px rgba(168, 85, 247, 0.25), 0 0 180px rgba(139, 92, 246, 0.15), 0 20px 60px rgba(0, 0, 0, 0.5)"
                : "0 -8px 40px rgba(0, 0, 0, 0.3), 0 8px 40px rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(0, 0, 0, 0.1) inset, 0 2px 4px rgba(0, 0, 0, 0.05) inset, 0 -2px 2px rgba(255, 255, 255, 0.95) inset, 0 0 80px rgba(124, 58, 237, 0.15), 0 20px 60px rgba(0, 0, 0, 0.2)",
            }}
          >
            {/* Top Highlight - Ultra Refined */}
            <div
              className="absolute top-0 left-0 right-0 h-[1.5px] rounded-t-[32px] opacity-60 group-hover/nav:opacity-100 transition-opacity duration-700"
              style={{
                background: theme === "dark"
                  ? "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), rgba(168, 85, 247, 0.6), rgba(255, 255, 255, 0.5), transparent)"
                  : "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), rgba(124, 58, 237, 0.4), rgba(255, 255, 255, 0.8), transparent)",
                boxShadow: theme === "dark"
                  ? "0 0 20px rgba(168, 85, 247, 0.4)"
                  : "0 0 15px rgba(124, 58, 237, 0.3)",
              }}
            />
            
            {/* Bottom Highlight - Ultra Refined */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-b-[32px] opacity-40 group-hover/nav:opacity-80 transition-opacity duration-700"
              style={{
                background: theme === "dark"
                  ? "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), rgba(168, 85, 247, 0.4), rgba(255, 255, 255, 0.3), transparent)"
                  : "linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.2), rgba(124, 58, 237, 0.3), rgba(0, 0, 0, 0.2), transparent)",
                boxShadow: theme === "dark"
                  ? "0 0 15px rgba(168, 85, 247, 0.3)"
                  : "0 0 10px rgba(124, 58, 237, 0.2)",
              }}
            />
            
            {/* Gloss Shine Animation */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover/nav:opacity-100 transition-opacity duration-700 overflow-hidden"
              initial={{ x: "-100%", y: "-100%" }}
              animate={{
                x: ["-100%", "200%"],
                y: ["-100%", "200%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "linear",
              }}
              style={{
                background: theme === "dark"
                  ? "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(168, 85, 247, 0.05) 100%)"
                  : "linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%, rgba(124, 58, 237, 0.1) 100%)",
                width: "150%",
                height: "150%",
              }}
            />
            
            {/* Inner Glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: theme === "dark"
                  ? "radial-gradient(circle at center, rgba(168, 85, 247, 0.15) 0%, transparent 70%)"
                  : "radial-gradient(circle at center, rgba(124, 58, 237, 0.1) 0%, transparent 70%)",
              }}
            />
            
            <div className="flex items-center justify-between relative z-10">
            <AnimatePresence mode="wait">
              {navItems.map((item, index) => {
                const IconComponent = item.icon;
                const isActive = index === activeNavIndex;
                
                return (
                  <motion.button
                    key={index}
                    className="relative flex flex-col items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl transition-all duration-500 group/btn overflow-hidden"
                    style={{
                      color: isActive 
                        ? theme === "dark" ? "rgba(255, 255, 255, 0.95)" : "rgba(0, 0, 0, 0.95)"
                        : theme === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
                    }}
                    onClick={() => setActiveNavIndex(index)}
                    whileHover={{
                      scale: 1.08,
                      y: -2,
                      color: theme === "dark" ? "rgba(255, 255, 255, 0.95)" : "rgba(0, 0, 0, 0.95)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.05, type: "spring", stiffness: 300 }}
                  >
                    {/* Active Background - High-End Glassmorphism */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-2xl transition-colors duration-500"
                        style={{
                          background: theme === "dark"
                            ? "linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.10) 50%, rgba(255, 255, 255, 0.08) 100%)"
                            : "linear-gradient(180deg, rgba(0, 0, 0, 0.12) 0%, rgba(0, 0, 0, 0.08) 50%, rgba(0, 0, 0, 0.06) 100%)",
                          backdropFilter: "blur(20px) saturate(180%)",
                          WebkitBackdropFilter: "blur(20px) saturate(180%)",
                          border: theme === "dark"
                            ? "1px solid rgba(255, 255, 255, 0.25)"
                            : "1px solid rgba(0, 0, 0, 0.15)",
                          boxShadow: theme === "dark"
                            ? "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 0.5px rgba(255, 255, 255, 0.15) inset, 0 2px 4px rgba(255, 255, 255, 0.1) inset, 0 -2px 2px rgba(0, 0, 0, 0.3) inset, 0 0 40px rgba(168, 85, 247, 0.2)"
                            : "0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 0.5px rgba(0, 0, 0, 0.1) inset, 0 2px 4px rgba(0, 0, 0, 0.05) inset",
                        }}
                        layoutId="activeNavBg"
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    
                    {/* Hover Background - Subtle Glow */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover/btn:opacity-100 transition-all duration-300"
                      style={{
                        background: theme === "dark"
                          ? "linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.05) 100%)"
                          : "linear-gradient(180deg, rgba(0, 0, 0, 0.06) 0%, rgba(0, 0, 0, 0.03) 100%)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        border: theme === "dark"
                          ? "1px solid rgba(255, 255, 255, 0.12)"
                          : "1px solid rgba(0, 0, 0, 0.08)",
                      }}
                    />
                    
                    {/* Gloss Shine on Hover */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover/btn:opacity-100 overflow-hidden"
                      initial={{ x: "-100%" }}
                      animate={{
                        x: ["-100%", "200%"],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatType: "loop",
                        ease: "linear",
                      }}
                      style={{
                        background: theme === "dark"
                          ? "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent)"
                          : "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                    
                    <motion.div
                      className="relative z-10"
                      animate={{
                        scale: isActive ? [1, 1.1, 1] : 1,
                      }}
                      transition={{ duration: 0.4, repeat: isActive ? Infinity : 0, repeatDelay: 3 }}
                    >
                      <IconComponent active={isActive} theme={theme} />
                    </motion.div>
                    
                    <motion.span
                      className="text-xs font-medium text-center leading-tight relative z-10"
                      style={{
                        letterSpacing: "0.02em",
                        fontWeight: isActive ? 600 : 500,
                      }}
                    >
                      {item.label}
                    </motion.span>
                    
                    {isActive && (
                      <motion.div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full transition-colors duration-500"
                        style={{ 
                          background: theme === "dark"
                            ? "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), transparent)"
                            : "linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.9), transparent)",
                          boxShadow: theme === "dark"
                            ? "0 0 8px rgba(255, 255, 255, 0.5)"
                            : "0 0 8px rgba(0, 0, 0, 0.3)",
                        }}
                        layoutId="activeIndicator"
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Chat Interface Portal - Rendered in previewOverlayRoot */}
      {mounted && overlayRoot && createPortal(
        <AnimatePresence>
          {chatOpen && (
            <ChatInterface
              theme={theme}
              messages={chatMessages}
              input={chatInput}
              onInputChange={setChatInput}
              onSend={handleChatSend}
              onClose={handleChatClose}
              detailSections={detailSections}
              position={chatPosition}
              isListening={isListening}
              onToggleListening={handleToggleListening}
              isMobile={previewRootRef.current ? previewRootRef.current.getBoundingClientRect().width < 640 : false}
            />
          )}
        </AnimatePresence>,
        overlayRoot
      )}
    </div>
  );
}
