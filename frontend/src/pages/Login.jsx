import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';

/**
 * Componente de Página de Inicio de Sesión
 *
 * Permite a los usuarios autenticarse en el sistema.
 * Utiliza el servicio `authService` para comunicarse con el backend
 * y el contexto `AuthContext` para actualizar el estado global del usuario.
 */
function Login() {
	// Estados locales para el formulario
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [invalidField, setInvalidField] = useState(''); // Guarda qué campo dio error

	const navigate = useNavigate(); // Hook para navegación
	const { login } = useAuth(); // Obtenemos la función login del contexto

	/**
	 * Maneja el envío del formulario.
	 * Llama al servicio de autenticación y, si es exitoso,
	 * actualiza el contexto y redirige al usuario a la página de inicio.
	 */
	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setInvalidField('');

		// Validación de email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			setInvalidField('email');
			window.scrollTo({ top: 0, behavior: 'smooth' });
			return setError('El formato del correo electrónico es inválido.');
		}

		try {
			// Intentamos loguear con el servicio y obtenemos el token
			const token = await authService.login(email, password);

			// Si funciona, actualizamos el estado global pasándole el token
			await login(token);

			// Redirigimos a la home
			navigate('/');
		} catch (err) {
			// Si falla, mostramos el error
			window.scrollTo({ top: 0, behavior: 'smooth' });
			setError(err.message || 'Error al conectar con el servidor');
		}
	};

	const estiloLoginCard = {
		backgroundColor: 'rgba(30, 41, 59, 0.6)',
		backdropFilter: 'blur(12px)',
		padding: '2rem',
		borderRadius: '16px',
		border: '1px solid rgba(255, 255, 255, 0.1)',
		boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
		color: '#f8fafc',
		maxWidth: '400px',
		width: '100%',
		// Eliminado: margin: '150px auto',
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
			<div style={estiloLoginCard}>
				<h2 style={{ textAlign: 'center', marginBottom: '1.2rem' }}>Iniciar Sesión</h2>

				<Alert type="error" message={error} />

				<form onSubmit={handleSubmit}>
					<Input
						name="email"
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) => { setEmail(e.target.value); if (invalidField === 'email') setInvalidField('') }}
						isInvalid={invalidField === 'email'}
					/>

					<Input
						name="password"
						type="password"
						placeholder="Contraseña"
						value={password}
						onChange={(e) => { setPassword(e.target.value); if (invalidField === 'password') setInvalidField('') }}
						isInvalid={invalidField === 'password'}
					/>

					<Button type="submit" width="100%">
						Entrar
					</Button>
				</form>

				<p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
					¿No tienes cuenta?{' '}
					<span
						onClick={() => navigate('/register')}
						style={{ color: '#38bdf8', cursor: 'pointer', textDecoration: 'underline' }}
					>
						Regístrate aquí
					</span>
				</p>
			</div>
		</motion.div>
	);
}

export default Login;
