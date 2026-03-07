import { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';

// Creamos el contexto que almacenará el estado global de autenticación
const AuthContext = createContext(null);

/**
 * Proveedor de Autenticación (AuthProvider)
 *
 * Este componente envuelve la aplicación y proporciona el estado de 'user'
 * a cualquier componente hijo que lo necesite.
 * También gestiona la persistencia del usuario en localStorage para mantener
 * la sesión activa al recargar la página.
 */
export const AuthProvider = ({ children }) => {
	/**
	 * Ejecutamos una funcion en el useState ya que esto se ejecuta 
	 * una sola vez antes de pintar nada en pantalla, obtenemos el user 
	 * del localStorage, si hay user en el localStorage le pasamos los datos
	 * del usuario, y si no, iniciamos el estado en null.
	 */
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	// Efecto que se ejecuta al montar la aplicación para verificar el token si existe
	useEffect(() => {
		const initAuth = async () => {
			const token = localStorage.getItem('token');
			if (token) {
				try {
					// Verificamos el token con el backend para obtener datos frescos
					const userData = await authService.verifyToken(token);
					setUser(userData);
				} catch (error) {
					console.error('El token expiró o es inválido en initAuth:', error.message);
					localStorage.removeItem('token');
					setUser(null);
				}
			}
			setLoading(false);
		};

		initAuth();
	}, []);

	/**
	 * Función para iniciar sesión.
	 * Recibe el TOKEN generado por PHP, y lo usamos para obtener 
	 * de inmediato los datos de usuario y dejarlo guardado.
	 */
	const login = async (token) => {
		localStorage.setItem('token', token);
		try {
			// Aunque el login ya fue exitoso, aprovechamos verifyToken para tener los datos del usuario en el state de forma normalizada
			const userData = await authService.verifyToken(token);
			setUser(userData);
		} catch (error) {
			console.error("Error validando el token recién creado en login:", error.message);
		}
	};

	/**
	 * Función para cerrar sesión.
	 * Limpia el estado y elimina el TOKEN de localStorage.
	 */
	const logout = () => {
		setUser(null);
		localStorage.removeItem('token');
	};

	// Mientras verificamos el token inicial, no renderizamos las rutas para evitar
	// que componentes protegidos se carguen antes de tener el usuario,
	// pero devolvemos null para evitar un "pantallazo" brusco de carga.
	if (loading) {
		return null;
	}

	return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

/**
 * Hook personalizado para usar el contexto de autenticación fácilmente.
 * Permite acceder a { user, login, logout } desde cualquier componente.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
