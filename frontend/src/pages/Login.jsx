import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

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
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		backdropFilter: 'blur(10px)',
		padding: '2rem',
		borderRadius: '16px',
		border: '1px solid rgba(255, 255, 255, 0.2)',
		boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
		color: 'white',
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
		border: '1px solid rgba(255, 255, 255, 0.3)',
		backgroundColor: 'rgba(0, 0, 0, 0.2)',
		color: 'white',
		boxSizing: 'border-box',
	};

	const estiloLoginBoton = {
		width: '100%',
		padding: '0.8rem',
		backgroundColor: '#007bff',
		color: 'white',
		border: 'none',
		borderRadius: '8px',
		fontWeight: 'bold',
		cursor: 'pointer',
	};

	return (
		<div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
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
						style={{ color: '#4facfe', cursor: 'pointer', textDecoration: 'underline' }}
					>
						Regístrate aquí
					</span>
				</p>
			</div>
		</div>
	);
}

export default Login;
