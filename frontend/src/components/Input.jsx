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
 */
export function Input({ name, type, placeholder, maxLength, onChange, estiloExtra, isInvalid, value }) {
	const estiloInput = {
		display: 'block',
		width: '100%',
		padding: '0.8rem',
		marginBottom: '0.8rem',
		borderRadius: '8px',
		border: '1px solid rgba(255, 255, 255, 0.1)',
		backgroundColor: 'rgba(15, 23, 42, 0.6)',
		color: '#f8fafc',
		boxSizing: 'border-box',
	};

	return (
		<motion.input
			name={name}
			type={type}
			placeholder={placeholder}
			maxLength={maxLength}
			onChange={onChange}
			value={value}
			required
			style={estiloExtra ? { ...estiloInput, ...estiloExtra } : estiloInput}
			animate={
				isInvalid
					? {
						backgroundColor: ['rgba(239, 68, 68, 0.4)', 'rgba(239, 68, 68, 0.1)'], // Flash rojo brillante -> fondo rojo suave
						borderColor: ['rgba(239, 68, 68, 1)', 'rgba(239, 68, 68, 0.5)'],
						x: [-5, 5, -5, 5, 0], // Pequeño temblor (shake) para avisar de error
					}
					: {
						backgroundColor: 'rgba(15, 23, 42, 0.6)',
						borderColor: 'rgba(255, 255, 255, 0.1)',
						x: 0,
					}
			}
			transition={{ duration: 0.4 }}
		/>
	);
}
