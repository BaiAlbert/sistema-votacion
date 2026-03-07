import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * Componente Select animado y personalizado para reemplazar los dropdowns nativos del SO.
 * 
 * @param {Object} props
 * @param {string} props.name - El nombre del campo (usado en los eventos)
 * @param {string} props.value - El valor seleccionado actualmente
 * @param {Array<{value: string, label: string}>} props.options - Array de objetos con las opciones
 * @param {function} props.onChange - Handler que recibe un evento simulado `{target: {name, value}}`
 * @param {boolean} [props.disabled] - Deshabilita el select nativa y visualmente
 */
export function Select({ name, value, options, onChange, disabled }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Cerrar el dropdown al hacer clic fuera de él
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%', marginBottom: '0.8rem' }}>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '0.8rem',
                    borderRadius: '8px',
                    border: disabled ? '1px solid rgba(255, 255, 255, 0.05)' : isOpen ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: disabled ? 'rgba(15, 23, 42, 0.9)' : 'rgba(15, 23, 42, 0.6)',
                    color: disabled ? 'rgba(255,255,255,0.4)' : '#f8fafc',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease'
                }}
            >
                <span>{selectedOption ? selectedOption.label : 'Selecciona...'}</span>

                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{ fontSize: '0.8em', color: disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)' }}
                >
                    ▼
                </motion.span>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '8px',
                            backgroundColor: 'rgba(30, 41, 59, 0.98)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            zIndex: 50,
                            overflow: 'hidden',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.6)'
                        }}
                    >
                        {options.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => {
                                    onChange({ target: { name, value: option.value } });
                                    setIsOpen(false);
                                }}
                                style={{
                                    padding: '0.8rem 1rem',
                                    cursor: 'pointer',
                                    backgroundColor: value === option.value ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                                    color: value === option.value ? '#38bdf8' : '#e2e8f0',
                                    transition: 'background 0.2s',
                                    borderLeft: value === option.value ? '3px solid #38bdf8' : '3px solid transparent'
                                }}
                                onMouseOver={(e) => {
                                    if (value !== option.value) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                }}
                                onMouseOut={(e) => {
                                    if (value !== option.value) e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                {option.label}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
