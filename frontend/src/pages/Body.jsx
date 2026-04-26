import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { AnimatePresence } from 'framer-motion';
import AdminArea from './AdminArea';
import ActiveVotings from './ActiveVotings';
import VotingsHistory from './VotingsHistory';

export function Body() {
	const { user } = useAuth();
	const [activeComponent, setActiveComponent] = useState(null);

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

	const isAdmin = !!user;

	return (
		<main style={estiloMainBody}>
			<Section titulo="Panel Principal">
				<Card
					titulo="Crear Nueva Votación"
					descripcion="Organiza y publica nuevas votaciones. Solo administradores autorizados."
				>
					{isAdmin ? (
						<Button
							width="100%"
							estiloExtra={{ marginTop: '1rem' }}
							onClick={() => setActiveComponent(activeComponent === 'adminArea' ? null : 'adminArea')}
						>
							{activeComponent === 'adminArea' ? 'Cerrar Panel de creación' : 'Crear Votación'}
						</Button>
					) : (
						<Button
							width="100%"
							secondary
							disabled
							estiloExtra={{ marginTop: '1rem' }}
							title="Requiere permisos de administrador"
						>
							No disponible
						</Button>
					)}
				</Card>

				<Card
					titulo="Explorar Votaciones"
					descripcion="Descubre y participa en las votaciones activas a nivel nacional, autonómico o en tus organizaciones privadas."
				>
					<Button
						width="100%"
						estiloExtra={{ marginTop: '1rem' }}
						onClick={() => setActiveComponent(activeComponent === 'activeVotings' ? null : 'activeVotings')}
					>
						{activeComponent === 'activeVotings' ? 'Cerrar Panel de Votación' : 'Votar Ahora'}
					</Button>
				</Card>

				<Card
					titulo="Mis Votos e Historial"
					descripcion="Revisa el registro encriptado de tus participaciones y visualiza los resultados de votaciones cerradas."
				>
					<Button
						width="100%"
						secondary
						estiloExtra={{ marginTop: '1rem' }}
						onClick={() =>
							setActiveComponent(activeComponent === 'votingsHistory' ? null : 'votingsHistory')
						}
					>
						{activeComponent === 'votingsHistory' ? 'Cerrar Historial' : 'Ver Historial'}
					</Button>
				</Card>
			</Section>

			{/* Renderizado Dinámico de Componentes */}
			<AnimatePresence mode="wait">
				{activeComponent === 'adminArea' && (
					<div
						key="adminArea"
						style={{ marginTop: '2rem', width: '100%', display: 'flex', justifyContent: 'center' }}
					>
						<AdminArea />
					</div>
				)}
				{activeComponent === 'activeVotings' && (
					<div
						key="activeVotings"
						style={{ marginTop: '2rem', width: '100%', display: 'flex', justifyContent: 'center' }}
					>
						<ActiveVotings />
					</div>
				)}
				{activeComponent === 'votingsHistory' && (
					<div
						key="votingsHistory"
						style={{ marginTop: '2rem', width: '100%', display: 'flex', justifyContent: 'center' }}
					>
						<VotingsHistory />
					</div>
				)}
			</AnimatePresence>
		</main>
	);
}

function Section({ titulo, children }) {
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
			<div style={estiloBodySectionDiv}>{children}</div>
		</section>
	);
}

function Card({ titulo, descripcion, children }) {
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
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'space-between',
	};

	return (
		<div
			style={estiloBodyCard}
			onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
			onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
		>
			<div>
				<h3 style={{ marginTop: 0, color: '#38bdf8' }}>{titulo}</h3>
				<p style={{ opacity: 0.8, fontSize: '0.95rem', lineHeight: '1.5' }}>{descripcion}</p>
			</div>
			<div style={{ marginTop: 'auto' }}>{children}</div>
		</div>
	);
}
