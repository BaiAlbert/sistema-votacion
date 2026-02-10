const API_URL = 'http://localhost:8000'; // Ajusta si es necesario

/**
 * Servicio de Autenticación
 *
 * Este objeto agrupa todas las llamadas a la API relacionadas con la autenticación.
 * Separa la lógica de red de los componentes de React, haciendo el código más limpio y mantenible.
 */
export const authService = {
	/**
	 * Inicia sesión en el sistema.
	 *
	 * @param {string} email - El correo electrónico del usuario.
	 * @param {string} password - La contraseña del usuario.
	 * @returns {Promise<Object>} - Promesa que devuelve el objeto usuario si el login es exitoso.
	 * @throws {Error} - Lanza un error si las credenciales son incorrectas o falla la conexión.
	 */
	async login(email, password) {
		// Realizamos una petición POST al backend
		const response = await fetch(`${API_URL}/login.php`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ email, password }),
		});

		const data = await response.json();

		// Si la respuesta no es OK (ej. 401 o 500), lanzamos un error
		if (!response.ok) {
			throw new Error(data.error || 'Error en el login');
		}

		return data.user;
	},

	/**
	 * Registra un nuevo usuario en el sistema.
	 *
	 * @param {Object} formData - Objeto con los datos del formulario de registro.
	 * @returns {Promise<Object>} - Promesa con la respuesta del servidor.
	 * @throws {Error} - Lanza un error si falla el registro.
	 */
	async register(formData) {
		const response = await fetch(`${API_URL}/register.php`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(formData),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Error en el registro');
		}
		return data;
	},
};
