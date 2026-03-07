import { useState } from 'react';
import { motion } from 'motion/react';

/**
 * Componente de Input Reutilizable con Animaciones.
 *
 * @param {Object} props
 * @param {string} props.name
 * @param {string} props.type
 * @param {string} [props.placeholder]
 * @param {function} [props.onChange]
 * @param {Object} [props.estiloExtra]
 * @param {boolean} [props.isInvalid] - Determina si el input tiene un error de validación actual
 * @param {string|number} [props.value] - Valor del input para componentes controlados
 * @param {string} [props.as] - Etiqueta a usar (por defecto "input", permite "textarea")
 */
export function Input({ name, type, placeholder, maxLength, onChange, estiloExtra, isInvalid, value, as = "input" }) {
	const [isFocused, setIsFocused] = useState(false);

	const estiloInput = {
		display: 'block',
		width: '100%',
		padding: '0.8rem',
		marginBottom: '0.8rem',
		borderRadius: '8px',
		border: isFocused && !isInvalid ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
		backgroundColor: 'rgba(15, 23, 42, 0.6)',
		color: '#f8fafc',
		boxSizing: 'border-box',
		outline: 'none', // Removemos el outline azul por defecto del navegador para usar el nuestro
		transition: 'border 0.3s ease',
	};

	const Component = as === "textarea" ? motion.textarea : motion.input;

	return (
		<Component
			name={name}
			type={type}
			placeholder={placeholder}
			maxLength={maxLength}
			onChange={onChange}
			onFocus={() => setIsFocused(true)}
			onBlur={() => setIsFocused(false)}
			value={value}
			required
			style={estiloExtra ? { ...estiloInput, ...estiloExtra } : estiloInput}
			animate={
				isInvalid
					? {
						backgroundColor: ['rgba(239, 68, 68, 0.4)', 'rgba(239, 68, 68, 0.1)'], // Flash rojo brillante -> fondo rojo suave
						borderColor: ['rgba(239, 68, 68, 1)', 'rgba(239, 68, 68, 0.5)'], // Borde rojo brillante -> borde rojo suave
						x: [-5, 5, -5, 5, 0], // Pequeño temblor (shake) para avisar de error
					}
					: {
						backgroundColor: 'rgba(15, 23, 42, 0.6)',
						borderColor: isFocused ? 'rgba(56, 189, 248, 0.5)' : 'rgba(255, 255, 255, 0.1)',
						x: 0,
					}
			}
			transition={{ duration: 0.1 }}
		/>
	);
}
