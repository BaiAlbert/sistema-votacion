import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Input } from '../components/Input';
import { motion } from 'motion/react';

/**
 * Componente de Página de Registro
 *
 * Permite a nuevos usuarios crear una cuenta.
 * Gestiona un formulario complejo con múltiples campos y valida la entrada
 * enviándola al backend a través de `authService`.
 */
function Register() {
	const [formData, setFormData] = useState({
		dni: '',
		username: '',
		password: '',
		nombre: '',
		apellidos: '',
		email: '',
		num_telefono: '',
		provincia: '',
		ciudad: '',
	});
	const [error, setError] = useState('');
	const [invalidField, setInvalidField] = useState('');
	const navigate = useNavigate();

	/**
	 * Manejador genérico para cambios en inputs.
	 * Actualiza el estado y limpia los errores visuales si el usuario está corrigiendo un campo.
	 */
	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});

		// Si el usuario modifica el campo que estaba marcado como inválido, quitamos la alerta roja
		if (invalidField === e.target.name) {
			setInvalidField('');
		}
	};

	/**
	 * Envía los datos de registro al servidor.
	 */
	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setInvalidField('');

		// Validaciones FRONTEND sincronizadas con los requisitos del backend
		const textRegex = /^[\p{L}\s\-']+$/u;
		const dniRegex = /^[0-9]{8}[A-Za-z]$/;
		const phoneRegex = /^[0-9]{9}$/;

		// Comprobación de integridad asignando el campo con error
		if (!dniRegex.test(formData.dni)) {
			setInvalidField('dni');
			return setError('El DNI debe tener 8 números y una letra.');
		}
		if (formData.nombre && !textRegex.test(formData.nombre)) {
			setInvalidField('nombre');
			return setError('El nombre no puede contener números ni caracteres especiales.');
		}
		if (formData.apellidos && !textRegex.test(formData.apellidos)) {
			setInvalidField('apellidos');
			return setError('Los apellidos no pueden contener números ni caracteres especiales.');
		}
		if (formData.provincia && !textRegex.test(formData.provincia)) {
			setInvalidField('provincia');
			return setError('La provincia no puede contener números ni caracteres especiales.');
		}
		if (formData.ciudad && !textRegex.test(formData.ciudad)) {
			setInvalidField('ciudad');
			return setError('La ciudad no puede contener números ni caracteres especiales.');
		}
		if (formData.num_telefono && !phoneRegex.test(formData.num_telefono)) {
			setInvalidField('num_telefono');
			return setError('El teléfono debe tener exactamente 9 números.');
		}

		try {
			// Llamamos al servicio de registro
			await authService.register(formData);

			alert('Registro exitoso');
			// Si es exitoso, redirigimos al login para que el usuario entre
			navigate('/login');
		} catch (err) {
			setError(err.message || 'Error de conexión con el servidor');
		}
	};

	// Estilos "Glassmorphism" reutilizados
	const cardStyle = {
		backgroundColor: 'rgba(30, 41, 59, 0.6)',
		backdropFilter: 'blur(12px)',
		padding: '2rem',
		borderRadius: '16px',
		border: '1px solid rgba(255, 255, 255, 0.1)',
		boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
		color: '#f8fafc',
		maxWidth: '500px',
		width: '100%',
		boxSizing: 'border-box',
	};

	const buttonStyle = {
		width: '100%',
		padding: '0.8rem',
		backgroundColor: '#2563eb',
		color: 'white',
		border: 'none',
		borderRadius: '8px',
		fontWeight: 'bold',
		cursor: 'pointer',
		marginTop: '1rem',
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 30 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -30 }}
			transition={{ duration: 0.5, ease: 'easeOut' }}
			style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				minHeight: '95vh',
				boxSizing: 'border-box',
				width: '100%',
				padding: '60px 1rem 1rem 1rem', // padding de seguridad para evitar solapamientos
			}}
		>
			<div style={cardStyle}>
				<h2 style={{ textAlign: 'center', marginBottom: '1.2rem' }}>Registro</h2>
				{error && <p style={{ color: '#ff6b6b', textAlign: 'center', margin: '0 0 1rem 0', fontSize: '0.95rem' }}>{error}</p>}
				{/* Usamos CSS grid para organizar los inputs en dos columnas */}
				<form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
					<Input
						name="dni"
						placeholder="DNI"
						maxLength="9"
						onChange={handleChange}
						estiloExtra={{ gridColumn: 'span 2' }}
						isInvalid={invalidField === 'dni'}
					></Input>
					<Input name="username" placeholder="Usuario" maxLength="50" onChange={handleChange} isInvalid={invalidField === 'username'}></Input>
					<Input name="password" type="password" placeholder="Contraseña" onChange={handleChange} isInvalid={invalidField === 'password'}></Input>
					<Input name="nombre" type="text" placeholder="Nombre" maxLength="50" onChange={handleChange} isInvalid={invalidField === 'nombre'}></Input>
					<Input name="apellidos" type="text" placeholder="Apellidos" maxLength="100" onChange={handleChange} isInvalid={invalidField === 'apellidos'}></Input>
					<Input
						name="email"
						type="email"
						placeholder="Correo electronico"
						maxLength="100"
						onChange={handleChange}
						estiloExtra={{ gridColumn: 'span 2' }}
						isInvalid={invalidField === 'email'}
					></Input>
					<Input name="num_telefono" type="tel" placeholder="Telefono" maxLength="9" onChange={handleChange} isInvalid={invalidField === 'num_telefono'}></Input>
					<Input name="provincia" type="text" placeholder="Provincia" maxLength="50" onChange={handleChange} isInvalid={invalidField === 'provincia'}></Input>
					<Input
						name="ciudad"
						type="text"
						placeholder="Ciudad"
						maxLength="50"
						onChange={handleChange}
						estiloExtra={{ gridColumn: 'span 2' }}
						isInvalid={invalidField === 'ciudad'}
					></Input>

					<button type="submit" style={{ ...buttonStyle, gridColumn: 'span 2' }}>
						Registrarse
					</button>
				</form>
				<p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
					¿Ya tienes cuenta?{' '}
					<span
						onClick={() => navigate('/login')}
						style={{ color: '#38bdf8', cursor: 'pointer', textDecoration: 'underline' }}
					>
						Inicia sesión
					</span>
				</p>
			</div>
		</motion.div>
	);
}

export default Register;
