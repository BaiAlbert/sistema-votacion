import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export function Modal({ isOpen, onClose, titulo, children }) {
    const overlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    };

    const modalStyle = {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '2rem',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '85vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        color: '#f8fafc',
        position: 'relative',
        marginTop: '5vh', // Push it down slightly
    };

    const closeButtonStyle = {
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        background: 'none',
        border: 'none',
        color: '#94a3b8',
        fontSize: '1.5rem',
        cursor: 'pointer',
        zIndex: 10,
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    style={overlayStyle}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        style={modalStyle}
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button style={closeButtonStyle} onClick={onClose}>
                            &times;
                        </button>
                        {titulo && <h2 style={{ marginTop: 0, color: '#38bdf8', marginBottom: '1.5rem', paddingRight: '2rem' }}>{titulo}</h2>}
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    // Only use portal if document is defined (prevents SSR issues if any, though it's Vite)
    if (typeof document !== 'undefined') {
        return ReactDOM.createPortal(modalContent, document.body);
    }
    return modalContent;
}
