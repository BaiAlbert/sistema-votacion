import { motion } from 'motion/react';

/**
 * Componente Alert reutilizable para mostrar mensajes de éxito o error.
 *
 * @param {Object} props
 * @param {string} props.type - Tipo de alerta: 'error' o 'success'
 * @param {string} props.message - El texto a mostrar
 * @param {Object} [props.style] - Estilos extra
 */
export function Alert({ type, message, style }) {
    if (!message) return null;

    const isError = type === 'error';

    const baseStyle = {
        textAlign: 'center',
        margin: '0 0 1rem 0',
        fontSize: '0.95rem',
        padding: '10px',
        borderRadius: '8px',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'flex-start', // Use flex-start instead of center since text can wrap
        justifyContent: 'center',
        gap: '8px',
        ...style
    };

    const errorStyle = {
        color: '#ff6b6b',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
    };

    const successStyle = {
        color: '#4ade80',
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        border: '1px solid rgba(74, 222, 128, 0.2)',
    };

    const activeStyle = { ...baseStyle, ...(isError ? errorStyle : successStyle) };

    const icon = isError
        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;

    return (
        <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            style={activeStyle}
        >
            <span style={{ display: 'flex', alignItems: 'center', height: '1.2rem', marginTop: '2px' }}>{icon}</span>
            <span style={{ lineHeight: '1.4' }}>{message}</span>
        </motion.div>
    );
}
