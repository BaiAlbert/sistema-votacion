import { motion } from 'motion/react';

/**
 * Componente de Botón Reutilizable.
 *
 * Estandariza el diseño visual y las animaciones para todos los botones
 * interactivos de la aplicación.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido del botón (texto, iconos...)
 * @param {function} [props.onClick] - Función a ejecutar al hacer clic.
 * @param {string} [props.type="button"] - Tipo de botón ('submit', 'button', 'reset').
 * @param {boolean} [props.secondary=false] - Cambia el estilo al modo secundario (outline).
 * @param {string|number} [props.width] - Ancho personalizado (ej. '100%', '200px', 'auto').
 * @param {Object} [props.estiloExtra] - Estilos adicionales para sobreescribir o añadir.
 * @param {boolean} [props.disabled=false] - Deshabilita el botón visualmente y cancela las animaciones.
 */
export function Button({
	children,
	onClick,
	type = 'button',
	secondary = false,
	width,
	estiloExtra,
	disabled = false,
	...props
}) {
	const estiloBase = {
		display: 'inline-flex',
		justifyContent: 'center',
		alignItems: 'center',
		padding: '0.8rem 1.5rem',
		borderRadius: '8px',
		fontWeight: 'bold',
		cursor: disabled ? 'not-allowed' : 'pointer',
		border: 'none',
		width: width || 'auto',
		opacity: disabled ? 0.5 : 1,
	};

	// Estilo para botón principal (Fondo azul fuerte, texto blanco)
	const estiloPrimario = {
		backgroundColor: '#2563eb',
		color: 'white',
	};

	// Estilo para botón secundario (Transparente, borde fino, texto azul claro)
	const estiloSecundario = {
		backgroundColor: 'transparent',
		color: '#38bdf8',
		border: '1px solid #38bdf8',
	};

	const mergeEstilos = {
		...estiloBase,
		...(secondary ? estiloSecundario : estiloPrimario),
		...estiloExtra,
	};

	return (
		<motion.button
			type={type}
			onClick={disabled ? (e) => e.preventDefault() : onClick}
			style={mergeEstilos}
			whileHover={
				disabled
					? {}
					: {
							scale: 1.02,
							backgroundColor: secondary ? 'rgba(56, 189, 248, 0.1)' : '#1d4ed8',
						}
			}
			whileTap={disabled ? {} : { scale: 0.98 }}
			transition={{ duration: 0.2 }}
			disabled={disabled}
			{...props}
		>
			{children}
		</motion.button>
	);
}
