import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

/**
 * Componente de Página de Registro
 *
 * Permite a nuevos usuarios crear una cuenta.
 * Gestiona un formulario complejo con múltiples campos y valida la entrada
 * enviándola al backend a través de `authService`.
 */
function Register() {
	// Estado para todos los campos del formulario
	const [formData, setFormData] = useState({
		username: '',
		password: '',
		nombre: '',
		apellidos: '',
		email: '',
		telefono: '',
		provincia: '',
		ciudad: '',
	});
	const [error, setError] = useState('');
	const navigate = useNavigate();

	/**
	 * Manejador genérico para cambios en inputs.
	 * Actualiza el campo correspondiente en el estado `formData` basándose en el atributo `name` del input.
	 */
	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	/**
	 * Envía los datos de registro al servidor.
	 */
	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');

		try {
			// Llamamos al servicio de registro
			await authService.register(formData);

			alert('Registro exitoso');
			// Si es exitoso, redirigimos al login para que el usuario entre
			navigate('/login');
		} catch (err) {
			setError(err.message || 'Error de conexión con el servidor');
		}
	};

	// Estilos "Glassmorphism" reutilizados
	const cardStyle = {
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		backdropFilter: 'blur(10px)',
		padding: '2rem',
		borderRadius: '16px',
		border: '1px solid rgba(255, 255, 255, 0.2)',
		boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
		color: 'white',
		maxWidth: '500px',
		width: '100%',
		margin: '100px auto',
	};

	const inputStyle = {
		display: 'block',
		width: '100%',
		padding: '0.8rem',
		marginBottom: '0.8rem',
		borderRadius: '8px',
		border: '1px solid rgba(255, 255, 255, 0.3)',
		backgroundColor: 'rgba(0, 0, 0, 0.2)',
		color: 'white',
		boxSizing: 'border-box',
	};

	const buttonStyle = {
		width: '100%',
		padding: '0.8rem',
		backgroundColor: '#007bff',
		color: 'white',
		border: 'none',
		borderRadius: '8px',
		fontWeight: 'bold',
		cursor: 'pointer',
		marginTop: '1rem',
	};

	return (
		<div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
			<div style={cardStyle}>
				<h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Registro</h2>
				{error && <p style={{ color: '#ff6b6b', textAlign: 'center' }}>{error}</p>}
				{/* Usamos CSS grid para organizar los inputs en dos columnas */}
				<form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
					<input name="username" placeholder="Usuario" onChange={handleChange} required style={inputStyle} />
					<input
						name="password"
						type="password"
						placeholder="Contraseña"
						onChange={handleChange}
						required
						style={inputStyle}
					/>

					<input name="nombre" placeholder="Nombre" onChange={handleChange} required style={inputStyle} />
					<input
						name="apellidos"
						placeholder="Apellidos"
						onChange={handleChange}
						required
						style={inputStyle}
					/>

					<input
						name="email"
						type="email"
						placeholder="Email"
						onChange={handleChange}
						required
						style={{ ...inputStyle, gridColumn: 'span 2' }}
					/>

					<input name="telefono" placeholder="Teléfono" onChange={handleChange} style={inputStyle} />
					<input
						name="provincia"
						placeholder="Provincia"
						onChange={handleChange}
						required
						style={inputStyle}
					/>

					<input
						name="ciudad"
						placeholder="Ciudad"
						onChange={handleChange}
						required
						style={{ ...inputStyle, gridColumn: 'span 2' }}
					/>

					<button type="submit" style={{ ...buttonStyle, gridColumn: 'span 2' }}>
						Registrarse
					</button>
				</form>
				<p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
					¿Ya tienes cuenta?{' '}
					<span
						onClick={() => navigate('/login')}
						style={{ color: '#4facfe', cursor: 'pointer', textDecoration: 'underline' }}
					>
						Inicia sesión
					</span>
				</p>
			</div>
		</div>
	);
}

export default Register;
