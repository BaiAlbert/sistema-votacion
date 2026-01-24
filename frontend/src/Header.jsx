export function Header({ titulo }) {
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
			<h1 style={{ margin: 0, fontSize: '1.5rem' }}>{titulo}</h1>

			<nav style={estiloNav}>
				<button style={estiloBotonSecundario}>Ayuda</button>
				<button style={estiloBoton}>Iniciar Sesión</button>
			</nav>
		</header>
	);
}
