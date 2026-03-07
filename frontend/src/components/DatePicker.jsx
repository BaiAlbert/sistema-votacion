import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * Componente DatePicker animado y personalizado para reemplazar los calendarios nativos del SO.
 * 
 * @param {Object} props
 * @param {string} props.name - El nombre del campo (usado en los eventos)
 * @param {string} props.value - El string de fecha y hora actual seleccionado (YYYY-MM-DDTHH:mm)
 * @param {function} props.onChange - Handler que recibe un evento simulado `{target: {name, value}}`
 * @param {boolean} [props.isInvalid] - Indica si hay un error de validación
 */
export function DatePicker({ name, value, onChange, isInvalid }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Parseo inicial del valor proporcionado o asignación de la fecha actual
    const initialDate = value ? new Date(value) : new Date();

    // Estado para la vista del calendario (el mes/año que estamos visualizando)
    const [viewDate, setViewDate] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

    // Estado para la fecha y hora reales seleccionadas
    const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);

    // Estado para los inputs numéricos de tiempo
    const [time, setTime] = useState({
        hh: value ? String(initialDate.getHours()).padStart(2, '0') : '12',
        mm: value ? String(initialDate.getMinutes()).padStart(2, '0') : '00'
    });

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

    // Lógica de generación del calendario
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // 0 = Domingo, 1 = Lunes. Queremos que Lunes = 0
    let firstDayIndex = new Date(year, month, 1).getDay();
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const dayNames = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

    const handlePrevMonth = (e) => {
        e.stopPropagation();
        setViewDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = (e) => {
        e.stopPropagation();
        setViewDate(new Date(year, month + 1, 1));
    };

    const handleDayClick = (day) => {
        const newDate = new Date(year, month, day);
        if (selectedDate) {
            newDate.setHours(selectedDate.getHours());
            newDate.setMinutes(selectedDate.getMinutes());
        } else {
            newDate.setHours(parseInt(time.hh, 10));
            newDate.setMinutes(parseInt(time.mm, 10));
        }
        setSelectedDate(newDate);
    };

    const handleTimeChange = (field, val) => {
        // Forzar longitud máxima y sólo caracteres numéricos
        let parsed = val.replace(/\D/g, '').slice(0, 2);

        let newTime = { ...time, [field]: parsed };

        // Autocorrección on blur (al perder el foco) / el input se mantiene controlado
        setTime(newTime);

        if (selectedDate) {
            const updatedDate = new Date(selectedDate);
            if (field === 'hh') updatedDate.setHours(parseInt(parsed || '0', 10));
            if (field === 'mm') updatedDate.setMinutes(parseInt(parsed || '0', 10));
            setSelectedDate(updatedDate);
        }
    };

    const handleConfirm = () => {
        if (!selectedDate) {
            // Si hacen clic en confirmar sin elegir un día, seleccionamos hoy
            const now = new Date();
            now.setHours(parseInt(time.hh || '0', 10));
            now.setMinutes(parseInt(time.mm || '0', 10));
            setSelectedDate(now);
            triggerChange(now);
        } else {
            // Aplicar el tiempo directamente antes de disparar el evento por seguridad
            selectedDate.setHours(parseInt(time.hh || '0', 10));
            selectedDate.setMinutes(parseInt(time.mm || '0', 10));
            triggerChange(selectedDate);
        }
        setIsOpen(false);
    };

    const triggerChange = (dateObj) => {
        // Formatear a YYYY-MM-DDTHH:mm exactamente como requiere el estándar datetime-local
        const local = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000));
        const formatted = local.toISOString().slice(0, 16);
        onChange({ target: { name, value: formatted } });
    };

    // Renderizando los Días
    const gridDays = [];
    for (let i = 0; i < firstDayIndex; i++) {
        gridDays.push(<div key={`empty-${i}`} style={{ width: '100%' }} />);
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const isSelected = selectedDate && selectedDate.getDate() === d && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
        const isToday = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year;

        gridDays.push(
            <div key={d} style={{ display: 'flex', justifyContent: 'center' }}>
                <div
                    onClick={() => handleDayClick(d)}
                    style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        backgroundColor: isSelected ? '#38bdf8' : 'transparent',
                        color: isSelected ? '#0f172a' : (isToday ? '#38bdf8' : '#e2e8f0'),
                        fontWeight: isSelected || isToday ? 'bold' : 'normal',
                        border: isToday && !isSelected ? '1px solid #38bdf8' : '1px solid transparent',
                        transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
                    onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                    {d}
                </div>
            </div>
        );
    }

    const displayValue = value ? new Date(value).toLocaleString('es-ES', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'Seleccionar fecha y hora...';

    const baseStyle = {
        width: '100%',
        padding: '0.8rem',
        borderRadius: '8px',
        border: isInvalid ? '1px solid #ff6b6b' : (isOpen ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)'),
        backgroundColor: isInvalid ? 'rgba(239, 68, 68, 0.05)' : 'rgba(15, 23, 42, 0.6)',
        color: '#f8fafc',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxSizing: 'border-box',
        transition: 'all 0.3s ease',
        marginBottom: '0.8rem'
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            <motion.div
                onClick={() => setIsOpen(!isOpen)}
                style={baseStyle}
                animate={isInvalid ? { x: [-5, 5, -5, 5, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
            >
                <span style={{ color: value ? '#f8fafc' : 'rgba(255,255,255,0.4)' }}>{displayValue}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </span>
            </motion.div>

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
                            minWidth: '300px', // Garantizar espacio suficiente para los 7 días + padding
                            width: '100%', // Ocupar el espacio del input si es más ancho
                            marginTop: '8px',
                            padding: '1rem',
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            backdropFilter: 'blur(2px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            zIndex: 60,
                            boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}
                    >
                        {/* Cabecera del Calendario */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '1rem' }}>
                            <button type="button" onClick={handlePrevMonth} style={{ background: 'transparent', border: 'none', color: '#f8fafc', cursor: 'pointer', fontSize: '1.2rem' }}>{"<"}</button>
                            <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>{monthNames[month]} {year}</span>
                            <button type="button" onClick={handleNextMonth} style={{ background: 'transparent', border: 'none', color: '#f8fafc', cursor: 'pointer', fontSize: '1.2rem' }}>{">"}</button>
                        </div>

                        {/* Días de la Semana */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: '0.5rem', width: '100%' }}>
                            {dayNames.map(d => <div key={d}>{d}</div>)}
                        </div>

                        {/* Cuadrícula del Calendario */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', width: '100%' }}>
                            {gridDays}
                        </div>

                        <hr style={{ width: '100%', borderColor: 'rgba(255,255,255,0.05)', margin: '1rem 0' }} />

                        {/* Selector de Hora */}
                        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginRight: '5px' }}>Hora:</span>
                                <input
                                    type="text"
                                    value={time.hh}
                                    onChange={(e) => handleTimeChange('hh', e.target.value)}
                                    onBlur={() => {
                                        let h = parseInt(time.hh || '0', 10);
                                        if (h > 23) h = 23;
                                        handleTimeChange('hh', String(h).padStart(2, '0'));
                                    }}
                                    style={{ width: '40px', padding: '5px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', textAlign: 'center' }}
                                />
                                <span style={{ color: 'white' }}>:</span>
                                <input
                                    type="text"
                                    value={time.mm}
                                    onChange={(e) => handleTimeChange('mm', e.target.value)}
                                    onBlur={() => {
                                        let m = parseInt(time.mm || '0', 10);
                                        if (m > 59) m = 59;
                                        handleTimeChange('mm', String(m).padStart(2, '0'));
                                    }}
                                    style={{ width: '40px', padding: '5px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', textAlign: 'center' }}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleConfirm}
                                style={{
                                    backgroundColor: '#38bdf8',
                                    color: '#0f172a',
                                    border: 'none',
                                    borderRadius: '5px',
                                    padding: '5px 15px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                OK
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
