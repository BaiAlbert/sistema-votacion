export function Body() {
	return (
		<main
			style={{
				paddingTop: '120px',
				paddingBottom: '50px',
				width: '100%',
				maxWidth: '1200px',
				display: 'flex',
				flexDirection: 'column',
				gap: '.5rem',
				paddingRight: '2rem',
				paddingLeft: '2rem',
			}}
		>
			<Section titulo="Votaciones asignadas a mí" />
			<Section titulo="Votaciones creadas por mí" />
			<Section titulo="Elecciones en las que soy elegible" />
		</main>
	);
}

function Section({ titulo }) {
	return (
		<section style={{ width: '100%' }}>
			<h2
				style={{
					color: 'white',
					marginBottom: '1rem',
					fontSize: '2rem',
					textShadow: '0 2px 4px rgba(0,0,0,0.5)',
					textAlign: 'left',
					marginLeft: 0,
					paddingLeft: 0,
				}}
			>
				{titulo}
			</h2>

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
					gap: '2rem',
					width: '100%',
				}}
			>
				<Card titulo="Tarjeta 1" />
				<Card titulo="Tarjeta 2" />
				<Card titulo="Tarjeta 3" />
			</div>
		</section>
	);
}

function Card({ titulo }) {
	const estiloCard = {
		flex: '1',
		minWidth: '250px',
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		backdropFilter: 'blur(10px)',
		padding: '2rem',
		borderRadius: '16px',
		border: '1px solid rgba(255, 255, 255, 0.2)',
		boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
		color: 'white',
		transition: 'transform 0.2s ease',
		cursor: 'pointer',
	};

	return (
		<div style={estiloCard}>
			<h3 style={{ marginTop: 0 }}>{titulo}</h3>
			<p style={{ opacity: 0.8 }}>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
				dolore magna aliqua.
			</p>
			<button
				style={{
					marginTop: '1rem',
					padding: '0.5rem 1rem',
					backgroundColor: 'rgba(255, 255, 255, 0.2)',
					border: 'none',
					borderRadius: '4px',
					color: 'white',
					cursor: 'pointer',
					width: '100%',
				}}
			>
				Ver más
			</button>
		</div>
	);
}
