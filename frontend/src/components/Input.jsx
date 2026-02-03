/**
 * Componente de Input Reutilizable.
 * * Es un campo de entrada con estilos base predefinidos (tema oscuro/transparente)
 * que permite la inyección de estilos adicionales y manejo de eventos.
 *
 * @param {Object} props - Las propiedades del componente.
 * @param {string} props.name - El nombre del campo (atributo `name`), útil para formularios.
 * @param {string} props.type - El tipo de input HTML (ej: 'text', 'email', 'password', etc.).
 * @param {string} [props.placeholder] - (Opcional) Texto de ayuda que se muestra cuando el campo está vacío.
 * @param {function} [props.onChange] - Función manejadora que se ejecuta al escribir en el input. Recibe el evento.
 * @param {Object} [props.estiloExtra] - Objeto de estilos en línea para sobrescribir o añadir CSS al input.
 * @returns {JSX.Element} Elemento input estilizado.
 * @example
 * // Ejemplo de uso básico:
 * <Input
 * name="email"
 * type="email"
 * placeholder="usuario@ejemplo.com"
 * onChange={(e) => console.log(e.target.value)}
 * />
 * @example
 * // Ejemplo con estilo extra (Grid):
 * <Input
 * name="apellido"
 * type="text"
 * estiloExtra={{ gridColumn: 'span 2', borderColor: 'red' }}
 * />
 */
export function Input({ name, type, placeholder, onChange, estiloExtra }) {
	const estiloInput = {
		display: 'block',
		width: '100%',
		padding: '0.8rem',
		marginBottom: '0.8rem',
		borderRadius: '8px',
		border: '1px solid rgba(255, 255, 255, 0.3)',
		backgroundColor: 'rgba(0, 0, 0, 0.2)',
		color: 'white',
		boxSizing: 'border-box',
	};

	return (
		<input
			name={name}
			type={type}
			placeholder={placeholder}
			onChange={onChange}
			required
			style={estiloExtra ? { ...estiloInput, ...estiloExtra } : estiloInput}
		/>
	);
}
