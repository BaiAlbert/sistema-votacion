import { createContext, useState, useContext } from 'react';

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
	const [user, setUser] = useState(() => {
		const storedUser = localStorage.getItem('user');
		return storedUser ? JSON.parse(storedUser) : null;
	});

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
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
