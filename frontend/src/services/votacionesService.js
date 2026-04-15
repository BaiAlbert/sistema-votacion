const API_URL = '/api'; // Ajustar según el entorno (ej: variables de entorno)

/**
 * Servicio de Votaciones
 *
 * Agrupa todas las llamadas a la API relacionadas con la gestión y visualización de votaciones.
 */
export const votacionesService = {
	/**
	 * Crea un nuevo proceso de votación en el backend.
	 *
	 * @param {Object} formData Datos de la votación (título, tipo, fechas, segmentos, etc)
	 * @returns {Promise<Object>} Promesa con la respuesta de éxito del backend
	 * @throws {Error} Si la validación falla o falta autorización
	 */
	async crearVotacion(formData) {
		const token = localStorage.getItem('token'); // Asumimos que el authContext guarda esto en LocalStorage

		if (!token) {
			throw new Error('No hay token de sesión disponible.');
		}

		const response = await fetch(`${API_URL}/create_votacion.php`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(formData),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Error al crear la votación');
		}

		return data;
	},

	/**
	 * Obtiene los grupos en los que el usuario logueado es admin_privado.
	 *
	 * @returns {Promise<Array>} Promesa con la lista de grupos
	 */
	async getAdminGroups() {
		const token = localStorage.getItem('token');
		if (!token) throw new Error('No hay token de sesión disponible.');

		const response = await fetch(`${API_URL}/get_admin_groups.php`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		const data = await response.json();
		if (!response.ok) throw new Error(data.error || 'Error al cargar los grupos');

		return data.grupos;
	},

	/**
	 * Obtiene todas las votaciones activas en las que el usuario actual
	 * tiene derecho a participar (segmentado por provincia, ciudad y grupos).
	 *
	 * @returns {Promise<Array>} Lista estructurada de Votaciones con Opciones
	 */
	async getVotacionesActivas() {
		const token = localStorage.getItem('token');
		if (!token) throw new Error('No hay token de sesión.');

		const response = await fetch(`${API_URL}/get_votaciones_elegibles.php`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		const data = await response.json();
		if (!response.ok) throw new Error(data.error || 'Error fetching pending votings');

		return data.votaciones || [];
	},

	/**
	 * Emite el voto anónimo en la base de datos tras verificar la firma física.
	 *
	 * @param {Object} payload Contiene id_votacion, id_opcion y firma_nombre
	 * @returns {Promise<Object>} Promesa con éxito de transacción
	 */
	async emitirVoto(payload) {
		const token = localStorage.getItem('token');
		if (!token) throw new Error('No hay token de sesión.');

		const response = await fetch(`${API_URL}/votar.php`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(payload),
		});

		const data = await response.json();
		if (!response.ok) throw new Error(data.error || 'Error registrando el voto. Comprueba tu firma.');

		return data;
	},

	/**
	 * Obtiene todas las votaciones FINALIZADAS en las que el usuario actual
	 * tiene derecho a participar e incluye el total de votos por cada opción de forma anónima.
	 *
	 * @returns {Promise<Array>} Lista estructurada de Votaciones Históricas con conteos
	 */
	async getHistorialVotaciones() {
		const token = localStorage.getItem('token');
		if (!token) throw new Error('No hay token de sesión.');

		const response = await fetch(`${API_URL}/get_votaciones_historial.php`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		const data = await response.json();
		if (!response.ok) throw new Error(data.error || 'Error fetching historical votings');

		return data.votaciones || [];
	},
};
