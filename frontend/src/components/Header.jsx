import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
		top: '1em',
		left: '50%',
		transform: 'translateX(-50%)',
		width: '94%',
		zIndex: 1000,

		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: '1rem 2rem',

		backgroundColor: 'rgba(245, 245, 245, 0.4)',
		backdropFilter: 'blur(12px)',
		borderRadius: '24px',
		boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
		border: '1px solid rgba(255, 255, 255, 0.4)',
		color: '#333',
	};

	const estiloNav = {
		display: 'flex',
		gap: '1rem',
	};

	const estiloBoton = {
		padding: '0.5rem 1rem',
		border: 'none',
		borderRadius: '4px',
		cursor: 'pointer',
		backgroundColor: '#007bff',
		color: 'white',
		fontWeight: 'bold',
	};

	const estiloBotonSecundario = {
		...estiloBoton,
		backgroundColor: 'transparent',
		color: '#007bff',
		border: '1px solid #007bff',
	};

	return (
		<header style={estiloHeader}>
			<h1 style={{ margin: 0, fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
				{titulo}
			</h1>

			<nav style={estiloNav}>
				<button style={estiloBotonSecundario}>Ayuda</button>
				{/* Renderizado condicional: Si hay usuario, mostramos "Cerrar Sesión", si no "Iniciar Sesión" */}
				{user ? (
					<button
						style={estiloBoton}
						onClick={() => {
							logout(); // Limpia el estado global
							navigate('/login'); // Redirige al login
						}}
					>
						Cerrar Sesión
					</button>
				) : (
					<button style={estiloBoton} onClick={() => navigate('/login')}>
						Iniciar Sesión
					</button>
				)}
			</nav>
		</header>
	);
}
