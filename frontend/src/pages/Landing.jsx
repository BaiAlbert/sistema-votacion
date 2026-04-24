import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import { Header } from '../components/Header.jsx';

export function Landing() {
	const navigate = useNavigate();

	const handleCreateOrg = () => {
		alert('Función próximamente disponible');
	};

	const mainContainerStyle = {
		display: 'flex',
		flexDirection: 'column',
		minHeight: '100vh',
		paddingTop: '80px', // Espacio para el header fijo
		color: '#f8fafc',
	};

	const heroSectionStyle = {
		flex: 1,
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		textAlign: 'center',
		padding: '2rem',
		maxWidth: '1200px',
		margin: '0 auto',
	};

	const titleStyle = {
		fontSize: '4rem',
		fontWeight: 'bold',
		marginBottom: '1rem',
		background: 'linear-gradient(to right, #60a5fa, #c084fc)',
		WebkitBackgroundClip: 'text',
		WebkitTextFillColor: 'transparent',
	};

	const subtitleStyle = {
		fontSize: '1.5rem',
		color: '#94a3b8',
		marginBottom: '3rem',
		maxWidth: '800px',
		lineHeight: '1.6',
	};

	const buttonGroupStyle = {
		display: 'flex',
		gap: '1.5rem',
		flexWrap: 'wrap',
		justifyContent: 'center',
		marginBottom: '4rem',
	};

	const featuresContainerStyle = {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
		gap: '2rem',
		width: '100%',
		padding: '2rem 0',
	};

	const featureCardStyle = {
		backgroundColor: 'rgba(30, 41, 59, 0.5)',
		border: '1px solid rgba(255, 255, 255, 0.1)',
		borderRadius: '16px',
		padding: '2rem',
		backdropFilter: 'blur(10px)',
		textAlign: 'left',
		transition: 'transform 0.3s ease, box-shadow 0.3s ease',
	};

	const featureTitleStyle = {
		fontSize: '1.5rem',
		fontWeight: '600',
		marginBottom: '1rem',
		color: '#e2e8f0',
	};

	const featureTextStyle = {
		color: '#94a3b8',
		lineHeight: '1.5',
	};

	return (
		<div style={mainContainerStyle}>
			<Header titulo="VotoTech B2B" />

			<main style={heroSectionStyle}>
				<h1 style={titleStyle}>Elecciones Transparentes para Organizaciones Modernas</h1>
				
				<p style={subtitleStyle}>
					Una plataforma integral diseñada para empresas, sindicatos e instituciones que requieren la máxima 
					seguridad, privacidad y verificabilidad en sus procesos de votación electrónica.
				</p>

				<div style={buttonGroupStyle}>
					<Button onClick={() => navigate('/login')} width="200px">
						Iniciar Sesión
					</Button>
					<Button onClick={() => navigate('/register')} secondary width="200px">
						Registrarse
					</Button>
					<Button onClick={handleCreateOrg} width="250px" estiloExtra={{ backgroundColor: '#10b981', color: 'white' }}>
						Crear una organización
					</Button>
				</div>

				<div style={featuresContainerStyle}>
					<div 
						style={featureCardStyle}
						onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3)'; }}
						onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
					>
						<h3 style={featureTitleStyle}>🔒 Seguridad Criptográfica</h3>
						<p style={featureTextStyle}>
							Protegemos la integridad de cada voto mediante algoritmos criptográficos avanzados, garantizando que los resultados sean inmutables y 100% precisos.
						</p>
					</div>

					<div 
						style={featureCardStyle}
						onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3)'; }}
						onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
					>
						<h3 style={featureTitleStyle}>👁️ Transparencia Absoluta</h3>
						<p style={featureTextStyle}>
							Cada elección puede ser auditada de manera independiente, permitiendo a los participantes verificar que su voto fue contado correctamente sin comprometer su identidad.
						</p>
					</div>

					<div 
						style={featureCardStyle}
						onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3)'; }}
						onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
					>
						<h3 style={featureTitleStyle}>⚡ Alta Disponibilidad</h3>
						<p style={featureTextStyle}>
							Nuestra infraestructura distribuida asegura que la plataforma se mantenga operativa bajo altos volúmenes de tráfico concurrente, ideal para asambleas masivas.
						</p>
					</div>
				</div>
			</main>
		</div>
	);
}
