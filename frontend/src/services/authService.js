const API_URL = '/api'; // Ajusta si es necesario

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
	 * @returns {Promise<string>} - Promesa que devuelve el Token JWT si el login es exitoso.
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

		return data.token; // Ahora devolvemos el token, no el user
	},

	/**
	 * Verifica si un token es válido y obtiene los datos más recientes del usuario,
	 * incluyendo por ejemplo si le acaban de cambiar el rol a admin.
	 *
	 * @param {string} token
	 * @returns {Promise<Object>} - El objeto con los datos frescos del usuario
	 */
	async verifyToken(token) {
		const response = await fetch(`${API_URL}/verify.php`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ token }),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Token inválido');
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
