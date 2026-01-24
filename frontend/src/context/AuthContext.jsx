import { createContext, useState, useContext, useEffect } from 'react';

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
	const [user, setUser] = useState(null);

	// Al cargar la app, comprobamos si hay un usuario guardado en localStorage
	useEffect(() => {
		const storedUser = localStorage.getItem('user');
		if (storedUser) {
			setUser(JSON.parse(storedUser));
		}
	}, []);

	/**
	 * Función para iniciar sesión.
	 * Actualiza el estado y guarda el usuario en localStorage.
	 */
	const login = (userData) => {
		setUser(userData);
		localStorage.setItem('user', JSON.stringify(userData));
	};

	/**
	 * Función para cerrar sesión.
	 * Limpia el estado y elimina el usuario de localStorage.
	 */
	const logout = () => {
		setUser(null);
		localStorage.removeItem('user');
	};

	return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

/**
 * Hook personalizado para usar el contexto de autenticación fácilmente.
 * Permite acceder a { user, login, logout } desde cualquier componente.
 */
export const useAuth = () => useContext(AuthContext);
