import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { motion } from 'motion/react';

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

		// Validación de email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return setError('El formato del correo electrónico es inválido.');
		}

		try {
			// Intentamos loguear con el servicio
			const user = await authService.login(email, password);

			// Si funciona, actualizamos el estado global
			login(user);

			// Redirigimos a la home
			navigate('/');
		} catch (err) {
			// Si falla, mostramos el error
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
		margin: '150px auto', // Margen superior para no chocar con el header
	};

	const estiloLoginInput = {
		display: 'block',
		width: '100%',
		padding: '0.8rem',
		marginBottom: '1rem',
		borderRadius: '8px',
		border: '1px solid rgba(255, 255, 255, 0.1)',
		backgroundColor: 'rgba(15, 23, 42, 0.6)',
		color: '#f8fafc',
		boxSizing: 'border-box',
	};

	const estiloLoginBoton = {
		width: '100%',
		padding: '0.8rem',
		backgroundColor: '#2563eb',
		color: 'white',
		border: 'none',
		borderRadius: '8px',
		fontWeight: 'bold',
		cursor: 'pointer',
	};

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1, rotate: 3600, transition: { duration: 30 } }}
			style={{ display: 'flex', justifyContent: 'center', width: '100%' }}
		>
			<div style={estiloLoginCard}>
				<h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Iniciar Sesión</h2>

				{error && <p style={{ color: '#ff6b6b', textAlign: 'center' }}>{error}</p>}

				<form onSubmit={handleSubmit}>
					<input
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						style={estiloLoginInput}
					/>

					<input
						type="password"
						placeholder="Contraseña"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						style={estiloLoginInput}
					/>

					<button type="submit" style={estiloLoginBoton}>
						Entrar
					</button>
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
