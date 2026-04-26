import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { votacionesService } from '../services/votacionesService';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Alert } from '../components/Alert';

export default function ActiveVotings() {
	const { user } = useAuth();
	const [votaciones, setVotaciones] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [successMsg, setSuccessMsg] = useState('');

	// State temporal de la opción seleccionada por cada votación
	// Ej: { 15: 42, 16: 55 } donde clave es id_votacion, valor es id_opcion
	const [selectedOptions, setSelectedOptions] = useState({});

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalVotacion, setModalVotacion] = useState(null);
	const [modalOpcion, setModalOpcion] = useState(null);
	const [firmaNombre, setFirmaNombre] = useState('');

	// Close Modal State
	const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
	const [closeModalVotacion, setCloseModalVotacion] = useState(null);
	const [closeReason, setCloseReason] = useState('');

	useEffect(() => {
		let isMounted = true;
		const fetchVotaciones = async () => {
			try {
				const data = await votacionesService.getVotacionesActivas();
				if (isMounted) {
					setVotaciones(data);
				}
			} catch (err) {
				if (isMounted) setError(err.message);
			} finally {
				if (isMounted) setLoading(false);
			}
		};

		fetchVotaciones();
		return () => {
			isMounted = false;
		};
	}, []);

	const handleOptionSelect = (votacionId, opcionId) => {
		setSelectedOptions((prev) => ({
			...prev,
			[votacionId]: opcionId,
		}));
	};

	const openModal = (votacion, opcionId) => {
		setModalVotacion(votacion);
		setModalOpcion(opcionId);
		setFirmaNombre('');
		setError('');
		setSuccessMsg('');
		setIsModalOpen(true);
	};

	const closeModal = () => {
		setIsModalOpen(false);
		setModalVotacion(null);
		setModalOpcion(null);
		setFirmaNombre('');
	};

	const openCloseModal = (votacion) => {
		setCloseModalVotacion(votacion);
		setCloseReason('');
		setError('');
		setSuccessMsg('');
		setIsCloseModalOpen(true);
	};

	const closeCloseModal = () => {
		setIsCloseModalOpen(false);
		setCloseModalVotacion(null);
		setCloseReason('');
	};

	const handleVoteConfirm = async () => {
		if (!firmaNombre.trim()) {
			setError('La firma es obligatoria.');
			return;
		}

		try {
			// 1. Emitir Voto al Backend transaccional
			await votacionesService.emitirVoto({
				id_votacion: modalVotacion.id,
				id_opcion: modalOpcion,
				firma_nombre: firmaNombre,
			});

			// 2. Éxito: Guardar en localStorage para recordar anónimamente qué eligió el usuario
			localStorage.setItem(`voto_votacion_${modalVotacion.id}`, modalOpcion.toString());

			// 3. Actualizar la UI local para reflejar que ya votó
			setVotaciones((prev) => prev.map((v) => (v.id === modalVotacion.id ? { ...v, hasVoted: true } : v)));

			setSuccessMsg('¡Tu voto ha sido encriptado y depositado en la urna con éxito!');
			setTimeout(() => {
				closeModal();
				setSuccessMsg('');
			}, 3000);
		} catch (err) {
			setError(err.message);
		}
	};

	const getVotedOptionFromStorage = (votacionId) => {
		return localStorage.getItem(`voto_votacion_${votacionId}`);
	};

	const handleCloseConfirm = async () => {
		if (!closeReason.trim()) {
			setError('El motivo del cierre es obligatorio.');
			return;
		}

		try {
			await votacionesService.cerrarVotacion({
				id_votacion: closeModalVotacion.id,
				razon_cierre: closeReason,
			});

			setSuccessMsg('Votación cerrada con éxito.');
			setVotaciones((prev) => prev.filter((v) => v.id !== closeModalVotacion.id));

			setTimeout(() => {
				closeCloseModal();
				setSuccessMsg('');
			}, 2000);
		} catch (err) {
			setError(err.message);
		}
	};

	const formatFecha = (fechaStr) => {
		return new Date(fechaStr).toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const cardStyle = {
		backgroundColor: 'rgba(30, 41, 59, 0.7)',
		backdropFilter: 'blur(16px)',
		borderRadius: '16px',
		border: '1px solid rgba(255, 255, 255, 0.1)',
		padding: '2rem',
		boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
		position: 'relative',
		overflow: 'hidden',
		color: 'white',
		marginBottom: '2rem',
	};

	if (loading) {
		return <div style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>Cargando votaciones...</div>;
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.95 }}
			transition={{ duration: 0.4 }}
			style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}
		>
			<h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#38bdf8' }}>
				Panel de Votaciones Activas
			</h2>
			<h3
				style={{
					textAlign: 'center',
					marginBottom: '2rem',
					fontWeight: 'normal',
					color: 'rgba(255,255,255,0.7)',
				}}
			>
				Participa en las elecciones disponibles para ti
			</h3>

			{!isModalOpen && !isCloseModalOpen && <Alert type="success" message={successMsg} />}
			{!isModalOpen && !isCloseModalOpen && <Alert type="error" message={error} />}

			{votaciones.length === 0 ? (
				<div
					style={{
						textAlign: 'center',
						padding: '3rem',
						backgroundColor: 'rgba(255,255,255,0.05)',
						borderRadius: '12px',
					}}
				>
					<p style={{ color: 'rgba(255,255,255,0.6)' }}>
						No hay votaciones activas en tu región o grupos en este momento.
					</p>
				</div>
			) : (
				votaciones.map((votacion) => {
					// Comprobar si hay una opción localRecordada (si hasVoted es true, lo pintamos)
					const votedOptionStr = votacion.hasVoted ? getVotedOptionFromStorage(votacion.id) : null;
					const votedOptionId = votedOptionStr ? parseInt(votedOptionStr, 10) : null;

					return (
						<div key={votacion.id} style={cardStyle}>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'flex-start',
									marginBottom: '1rem',
								}}
							>
								<h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.4rem' }}>{votacion.titulo}</h3>
								<span
									style={{
										fontSize: '0.8rem',
										padding: '4px 10px',
										backgroundColor: 'rgba(56, 189, 248, 0.2)',
										borderRadius: '20px',
										color: '#38bdf8',
										border: '1px solid rgba(56, 189, 248, 0.5)',
									}}
								>
									{votacion.tipo === 'privada' && votacion.organizacion_nombre
										? `PRIVADA: ${votacion.organizacion_nombre.toUpperCase()}`
										: votacion.tipo.toUpperCase()}
								</span>
							</div>

							<p
								style={{
									color: 'rgba(255,255,255,0.8)',
									fontSize: '0.95rem',
									marginBottom: '1.5rem',
									lineHeight: '1.6',
								}}
							>
								{votacion.descripcion || 'Sin descripción adicional.'}
							</p>

							<div
								style={{
									backgroundColor: 'rgba(0,0,0,0.2)',
									padding: '1rem',
									borderRadius: '8px',
									marginBottom: '1.5rem',
								}}
							>
								<p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
									<strong style={{ color: 'rgba(255,255,255,0.9)' }}>Finaliza:</strong>{' '}
									{formatFecha(votacion.fecha_final)}
								</p>
							</div>

							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
									gap: '10px',
									marginBottom: '1.5rem',
								}}
							>
								{votacion.opciones.map((opcion) => {
									const isSelected = selectedOptions[votacion.id] === opcion.id;
									const isTheVotedOne = votedOptionId === opcion.id;

									// Lógica de estilos y bordes según estado del voto
									let borderColor = 'rgba(255,255,255,0.1)';
									let bgColor = 'rgba(255,255,255,0.03)';
									let opacity = votacion.hasVoted && !isTheVotedOne ? 0.4 : 1; // Difumina las opciones no votadas

									if (isTheVotedOne) {
										borderColor = '#10b981'; // Verde pistacho (Votado permanentemente)
										bgColor = 'rgba(16, 185, 129, 0.1)';
									} else if (isSelected && !votacion.hasVoted) {
										borderColor = '#38bdf8'; // Azul (Seleccionado temporalmente pre-voto)
										bgColor = 'rgba(56, 189, 248, 0.1)';
									}

									return (
										<div
											key={opcion.id}
											onClick={() =>
												!votacion.hasVoted && handleOptionSelect(votacion.id, opcion.id)
											}
											style={{
												padding: '1rem',
												borderRadius: '8px',
												border: `1px solid ${borderColor}`,
												backgroundColor: bgColor,
												cursor: votacion.hasVoted ? 'default' : 'pointer',
												transition: 'all 0.2s ease',
												opacity: opacity,
												display: 'flex',
												alignItems: 'center',
												gap: '15px',
											}}
										>
											{!votacion.hasVoted && (
												<div
													style={{
														width: '20px',
														height: '20px',
														borderRadius: '50%',
														border: isSelected
															? '5px solid #38bdf8'
															: '2px solid rgba(255,255,255,0.3)',
														transition: 'all 0.2s ease',
													}}
												></div>
											)}
											{isTheVotedOne && (
												<div
													style={{
														width: '20px',
														height: '20px',
														borderRadius: '50%',
														backgroundColor: '#10b981',
														display: 'flex',
														justifyContent: 'center',
														alignItems: 'center',
													}}
												>
													<span style={{ color: 'white', fontSize: '12px' }}>✓</span>
												</div>
											)}

											<div style={{ flex: 1 }}>
												<strong style={{ display: 'block', fontSize: '1rem' }}>
													{opcion.nombre_opcion}
												</strong>
												{opcion.desc_opcion && (
													<span
														style={{
															display: 'block',
															fontSize: '0.85rem',
															color: 'rgba(255,255,255,0.6)',
															marginTop: '4px',
														}}
													>
														{opcion.desc_opcion}
													</span>
												)}
											</div>
										</div>
									);
								})}
							</div>

							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								{votacion.es_admin_org ? (
									<Button
										secondary
										onClick={() => openCloseModal(votacion)}
										estiloExtra={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', borderColor: 'rgba(220, 38, 38, 0.3)', color: '#ef4444', padding: '0.5rem 1rem' }}
									>
										Cerrar Votación
									</Button>
								) : (
									<div /> // Spacer
								)}
								{votacion.hasVoted ? (
									<Button
										secondary
										disabled
										title="Ya has participado en esta votación. Tu voto está encriptado en la urna."
									>
										Voto Registrado
									</Button>
								) : (
									<Button
										disabled={!selectedOptions[votacion.id]}
										onClick={() => openModal(votacion, selectedOptions[votacion.id])}
									>
										Votar Seleccionado
									</Button>
								)}
							</div>
						</div>
					);
				})
			)}

			{/* Custom Modal superpuesto para la Firma de Confirmación */}
			<AnimatePresence>
				{isModalOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						style={{
							position: 'fixed',
							top: 0,
							left: 0,
							width: '100vw',
							height: '100vh',
							backgroundColor: 'rgba(15, 23, 42, 0.8)',
							backdropFilter: 'blur(5px)',
							zIndex: 9999,
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							padding: '1rem',
						}}
					>
						<motion.div
							initial={{ scale: 0.9, y: 20 }}
							animate={{ scale: 1, y: 0 }}
							exit={{ scale: 0.9, y: 20 }}
							style={{
								backgroundColor: 'rgba(30, 41, 59, 1)',
								border: '1px solid rgba(56, 189, 248, 0.3)',
								borderRadius: '16px',
								padding: '2rem',
								width: '100%',
								maxWidth: '500px',
								boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
								color: 'white',
							}}
						>
							<h3 style={{ marginTop: 0, color: '#38bdf8', marginBottom: '1rem' }}>
								Confirmar y Firmar Voto
							</h3>
							<p
								style={{
									fontSize: '0.9rem',
									color: 'rgba(255,255,255,0.8)',
									marginBottom: '1.5rem',
									lineHeight: '1.5',
								}}
							>
								Estás a punto de emitir tu voto de forma irrevocable en{' '}
								<strong>"{modalVotacion?.titulo}"</strong>. <br />
								<br />
								Para garantizar la integridad del censo y prevenir el fraude, debes{' '}
								<strong>firmar introduciendo tu Nombre y Apellidos exactos</strong>. Este dato se
								verificará contra el censo («Votos Registrados»), autorizando la emisión de una papeleta
								100% anónima («Urna») disociada de tu identidad.
							</p>

							<Alert type="error" message={error} />
							<Alert type="success" message={successMsg} />

							<div style={{ marginBottom: '1.5rem' }}>
								<label
									style={{
										display: 'block',
										fontSize: '0.9rem',
										marginBottom: '0.5rem',
										color: 'rgba(255,255,255,0.6)',
									}}
								>
									Firma (Nombre y Apellidos completos):
								</label>
								<Input
									type="text"
									placeholder={`Ej: ${user?.nombre || 'Juan'} ${user?.apellidos || 'Pérez'}`}
									value={firmaNombre}
									onChange={(e) => setFirmaNombre(e.target.value)}
									isInvalid={!!error}
								/>
							</div>

							<div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
								<Button secondary onClick={closeModal} disabled={!!successMsg}>
									Cancelar
								</Button>
								<Button onClick={handleVoteConfirm} disabled={!!successMsg}>
									Firmar y Emitir Voto
								</Button>
							</div>
						</motion.div>
					</motion.div>
				)}

				{isCloseModalOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						style={{
							position: 'fixed',
							top: 0,
							left: 0,
							width: '100vw',
							height: '100vh',
							backgroundColor: 'rgba(15, 23, 42, 0.8)',
							backdropFilter: 'blur(5px)',
							zIndex: 9999,
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							padding: '1rem',
						}}
					>
						<motion.div
							initial={{ scale: 0.9, y: 20 }}
							animate={{ scale: 1, y: 0 }}
							exit={{ scale: 0.9, y: 20 }}
							style={{
								backgroundColor: 'rgba(30, 41, 59, 1)',
								border: '1px solid rgba(220, 38, 38, 0.3)',
								borderRadius: '16px',
								padding: '2rem',
								width: '100%',
								maxWidth: '500px',
								boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
								color: 'white',
							}}
						>
							<h3 style={{ marginTop: 0, color: '#ef4444', marginBottom: '1rem' }}>
								Clausurar Votación
							</h3>
							<p
								style={{
									fontSize: '0.9rem',
									color: 'rgba(255,255,255,0.8)',
									marginBottom: '1.5rem',
									lineHeight: '1.5',
								}}
							>
								Estás a punto de cerrar manualmente la votación{' '}
								<strong>"{closeModalVotacion?.titulo}"</strong>. <br />
								<br />
								Esta acción adelantará la fecha final, procederá al escrutinio automático para declarar una opción ganadora, y la votación pasará inmediatamente al historial. <strong>Esta acción es irreversible.</strong>
							</p>

							<Alert type="error" message={error} />
							<Alert type="success" message={successMsg} />

							<div style={{ marginBottom: '1.5rem' }}>
								<label
									style={{
										display: 'block',
										fontSize: '0.9rem',
										marginBottom: '0.5rem',
										color: 'rgba(255,255,255,0.6)',
									}}
								>
									Motivo del cierre anticipado (público):
								</label>
								<Input
									type="text"
									placeholder="Ej: Mayoría absoluta alcanzada, urgencia resolutiva..."
									value={closeReason}
									onChange={(e) => setCloseReason(e.target.value)}
									isInvalid={!!error}
								/>
							</div>

							<div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
								<Button secondary onClick={closeCloseModal} disabled={!!successMsg}>
									Cancelar
								</Button>
								<Button onClick={handleCloseConfirm} disabled={!!successMsg} estiloExtra={{ backgroundColor: '#ef4444', borderColor: '#b91c1c' }}>
									Clausurar Definitivamente
								</Button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
