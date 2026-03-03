export function Body() {
	const estiloMainBody = {
		paddingTop: '120px',
		paddingBottom: '50px',
		width: '100%',
		maxWidth: '1200px',
		display: 'flex',
		flexDirection: 'column',
		gap: '.5rem',
		paddingRight: '2rem',
		paddingLeft: '2rem',
		cursor: 'default',
	};

	return (
		<main style={estiloMainBody}>
			<Section titulo="Votaciones en Curso (Pendientes de tu voto)" />
			<Section titulo="Próximas Votaciones" />
			<Section titulo="Votaciones Pasadas" />
		</main>
	);
}

function Section({ titulo }) {
	const estiloBodySectionH2 = {
		color: 'white',
		marginBottom: '1rem',
		fontSize: '2rem',
		textShadow: '0 2px 4px rgba(0,0,0,0.5)',
		textAlign: 'left',
		marginLeft: 0,
		paddingLeft: 0,
	};

	const estiloBodySectionDiv = {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
		gap: '2rem',
		width: '100%',
	};

	return (
		<section style={{ width: '100%' }}>
			<h2 style={estiloBodySectionH2}>{titulo}</h2>

			<div style={estiloBodySectionDiv}>
				<Card titulo="Tarjeta 1" />
				<Card titulo="Tarjeta 2" />
				<Card titulo="Tarjeta 3" />
			</div>
		</section>
	);
}

function Card({ titulo }) {
	const estiloBodyCard = {
		flex: '1',
		minWidth: '250px',
		backgroundColor: 'rgba(30, 41, 59, 0.6)',
		backdropFilter: 'blur(10px)',
		padding: '2rem',
		borderRadius: '16px',
		border: '1px solid rgba(255, 255, 255, 0.1)',
		boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
		color: '#f8fafc',
		transition: 'transform 0.2s ease',
	};

	const estiloBodyCardButton = {
		marginTop: '1rem',
		padding: '0.5rem 1rem',
		backgroundColor: '#2563eb',
		border: 'none',
		borderRadius: '4px',
		color: 'white',
		cursor: 'pointer',
		width: '100%',
		fontWeight: 'bold',
	};

	return (
		<div style={estiloBodyCard}>
			<h3 style={{ marginTop: 0 }}>{titulo}</h3>

			<p style={{ opacity: 0.8 }}>
				Este texto esta aquí como ejemplo. Este texto esta aquí como ejemplo. Este texto esta aquí como ejemplo.
				Este texto esta aquí como ejemplo.
			</p>

			<button style={estiloBodyCardButton}>Ver más</button>
		</div>
	);
}
