import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';

/**
 * Componente de Header
 *
 * Se muestra en la parte superior de la aplicación.
 * Muestra el título y botones de acción.
 * Cambia dinámicamente el botón de acción según si el usuario está logueado o no.
 *
 * @param {Object} props
 * @param {string} props.titulo - El título que se mostrará en la cabecera.
 */
export function Header({ titulo }) {
	// Obtenemos el usuario y la función de logout del contexto
	const { user, logout } = useAuth();
	const navigate = useNavigate();

	// Estilos en línea para el header (simulando "glass effect")
	const estiloHeader = {
		position: 'fixed',
		top: '0',
		left: '0',
		width: '100%',
		zIndex: 1000,
		boxSizing: 'border-box',

		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: '1rem 2rem',

		backgroundColor: 'rgba(15, 23, 42, 0.6)',
		backdropFilter: 'blur(12px)',
		boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
		borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
		color: '#f8fafc',
	};

	const estiloNav = {
		display: 'flex',
		gap: '1rem',
	};

	return (
		<header style={estiloHeader}>
			<h1 style={{ margin: 0, fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
				{titulo}
			</h1>

			<nav style={estiloNav}>
				{/* Renderizado condicional: Si hay usuario, mostramos "Cerrar Sesión", si no "Iniciar Sesión" */}
				{user ? (
					<>
						<p>Bienvenido, {user.username}</p>
						<Button
							onClick={() => {
								logout(); // Limpia el estado global
								navigate('/login'); // Redirige al login
							}}
						>
							Cerrar Sesión
						</Button>
					</>
				) : (
					<Button onClick={() => navigate('/login')}>
						Iniciar Sesión
					</Button>
				)}
				<Button secondary>Ayuda</Button>
			</nav>
		</header>
	);
}
