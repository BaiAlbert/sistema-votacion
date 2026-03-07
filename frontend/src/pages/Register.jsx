import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'motion/react';
import { authService } from '../services/authService';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';

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
			window.scrollTo({ top: 0, behavior: 'smooth' });
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
			window.scrollTo({ top: 0, behavior: 'smooth' });
			return setError('El teléfono debe tener exactamente 9 números.');
		}

		try {
			// Llamamos al servicio de registro
			await authService.register(formData);

			alert('Registro exitoso');
			// Si es exitoso, redirigimos al login para que el usuario entre
			navigate('/login');
		} catch (err) {
			window.scrollTo({ top: 0, behavior: 'smooth' });
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
				<Alert type="error" message={error} />
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

					<Button type="submit" width="100%" estiloExtra={{ gridColumn: 'span 2', marginTop: '1rem' }}>
						Registrarse
					</Button>
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
