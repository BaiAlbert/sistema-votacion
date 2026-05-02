import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { votacionesService } from '../services/votacionesService';

export default function VotingsHistory() {
	const [votaciones, setVotaciones] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		let isMounted = true;
		const fetchHistorial = async () => {
			try {
				const data = await votacionesService.getHistorialVotaciones();
				if (isMounted) {
					setVotaciones(data);
				}
			} catch (err) {
				if (isMounted) setError(err.message);
			} finally {
				if (isMounted) setLoading(false);
			}
		};

		fetchHistorial();
		return () => {
			isMounted = false;
		};
	}, []);

	const getVotedOptionFromStorage = (votacionId) => {
		return localStorage.getItem(`voto_votacion_${votacionId}`);
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
		return (
			<div style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>
				Cargando resultados históricos...
			</div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.95 }}
			transition={{ duration: 0.4 }}
			style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}
		>
			<h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#10b981' }}>Mis Votos e Historial</h2>
			<h3
				style={{
					textAlign: 'center',
					marginBottom: '2rem',
					fontWeight: 'normal',
					color: 'rgba(255,255,255,0.7)',
				}}
			>
				Resultados de elecciones finalizadas
			</h3>

			{error && (
				<div
					style={{
						backgroundColor: 'rgba(239, 68, 68, 0.2)',
						border: '1px solid #ef4444',
						padding: '1rem',
						borderRadius: '8px',
						color: '#fca5a5',
						marginBottom: '1.5rem',
						textAlign: 'center',
					}}
				>
					{error}
				</div>
			)}

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
						No se han encontrado votaciones cerradas en tu región o grupos.
					</p>
				</div>
			) : (
				votaciones.map((votacion) => {
					// Comprobar si hay una opción localRecordada para inyectar el badge "Tu Selección"
					const votedOptionStr = getVotedOptionFromStorage(votacion.id);
					const votedOptionId = votedOptionStr ? parseInt(votedOptionStr, 10) : null;

					// El backend ya nos provee el total_votos a nivel de votación
					const totalVotosVotacion = votacion.total_votos;

					let auditBadgeText = 'Auditoría Pendiente';
					let auditBadgeStyle = {
						fontSize: '0.8rem',
						padding: '4px 10px',
						borderRadius: '20px',
						backgroundColor: 'rgba(251, 191, 36, 0.1)',
						border: '1px solid rgba(251, 191, 36, 0.5)',
						color: '#fbbf24',
					};

					if (votacion.estado_auditoria === 'integra') {
						auditBadgeText = 'Urna Íntegra';
						auditBadgeStyle = {
							...auditBadgeStyle,
							backgroundColor: 'rgba(16, 185, 129, 0.1)',
							border: '1px solid #10b981',
							color: '#10b981',
						};
					} else if (votacion.estado_auditoria === 'corrupta') {
						auditBadgeText = 'Votación Manipulada';
						auditBadgeStyle = {
							...auditBadgeStyle,
							backgroundColor: 'rgba(220, 38, 38, 0.2)',
							border: '2px solid #ef4444',
							color: '#f87171',
							boxShadow: '0 0 10px rgba(239,68,68,0.5)',
						};
					}

					return (
						<div key={votacion.id} style={cardStyle}>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'flex-start',
									marginBottom: '1rem',
									gap: '15px', // <-- NUEVO: Separación mínima entre título y tags
									flexWrap: 'wrap', // <-- NUEVO: Si no caben, los tags bajan a la siguiente línea
								}}
							>
								<h3
									style={{
										margin: 0,
										color: '#10b981',
										fontSize: '1.4rem',
										flex: '1 1 250px', // <-- NUEVO: Ocupa el espacio disponible, mínimo 250px
										wordBreak: 'break-word', // <-- NUEVO: Si meten "aaaaaa...", corta la palabra
									}}
								>
									{votacion.titulo}
								</h3>
								<div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
									<span
										style={{
											fontSize: '0.8rem',
											padding: '4px 10px',
											backgroundColor: 'rgba(16, 185, 129, 0.2)',
											borderRadius: '20px',
											color: '#10b981',
											border: '1px solid rgba(16, 185, 129, 0.5)',
										}}
									>
										{votacion.tipo === 'privada' && votacion.organizacion_nombre
											? `FINALIZADA: ${votacion.organizacion_nombre.toUpperCase()}`
											: 'FINALIZADA'}
									</span>
									<span style={auditBadgeStyle}>{auditBadgeText}</span>
								</div>
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

							{votacion.razon_cierre && (
								<div
									style={{
										backgroundColor: 'rgba(239, 68, 68, 0.1)',
										borderLeft: '4px solid #ef4444',
										padding: '1rem',
										borderRadius: '0 8px 8px 0',
										marginBottom: '1.5rem',
									}}
								>
									<p style={{ margin: 0, fontSize: '0.9rem', color: '#fca5a5' }}>
										<strong style={{ color: '#ef4444' }}>Cierre Anticipado: </strong>
										{votacion.razon_cierre}
									</p>
								</div>
							)}

							<div
								style={{
									backgroundColor: 'rgba(0,0,0,0.2)',
									padding: '1rem',
									borderRadius: '8px',
									marginBottom: '1.5rem',
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
								}}
							>
								<p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
									<strong style={{ color: 'rgba(255,255,255,0.9)' }}>Cerrada el:</strong>{' '}
									{formatFecha(votacion.fecha_final)}
								</p>
								<span
									style={{
										padding: '4px 10px',
										borderRadius: '8px',
										fontSize: '0.85rem',
										backgroundColor: votacion.hasVoted
											? 'rgba(56, 189, 248, 0.1)'
											: 'rgba(255, 255, 255, 0.05)',
										color: votacion.hasVoted ? '#38bdf8' : 'rgba(255,255,255,0.5)',
										border: votacion.hasVoted
											? '1px solid rgba(56, 189, 248, 0.3)'
											: '1px solid rgba(255,255,255,0.1)',
									}}
								>
									{votacion.hasVoted ? 'Participaste' : 'No participaste'}
								</span>
							</div>

							{votacion.estado_auditoria === 'corrupta' ? (
								<div
									style={{
										backgroundColor: 'rgba(220, 38, 38, 0.1)',
										border: '1px solid #ef4444',
										padding: '2rem',
										borderRadius: '8px',
										textAlign: 'center',
										color: '#f87171',
										marginTop: '1rem',
									}}
								>
									<p style={{ fontSize: '1.1rem', margin: 0 }}>
										Los resultados han sido ocultados porque se ha detectado una alteración en la
										cadena de bloques de la base de datos.
									</p>
								</div>
							) : (
								<div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
									{votacion.opciones.map((opcion) => {
										const isTheVotedOne = votedOptionId === opcion.id;
										const percentage = opcion.porcentaje;

										// Lógica de estilos y bordes según estado del voto
										let borderColor = 'rgba(255,255,255,0.1)';
										let bgColor = 'rgba(255,255,255,0.03)';

										if (opcion.isWinner && totalVotosVotacion > 0) {
											borderColor = '#fbbf24'; // Dorado (Ganador)
											bgColor = 'rgba(251, 191, 36, 0.1)';
										} else if (isTheVotedOne) {
											borderColor = '#38bdf8'; // Azul (Selección del usuario)
										}

										return (
											<div
												key={opcion.id}
												style={{
													padding: '1rem',
													borderRadius: '8px',
													border: `1px solid ${borderColor}`,
													backgroundColor: bgColor,
													display: 'flex',
													flexDirection: 'column',
													gap: '10px',
												}}
											>
												<div
													style={{
														display: 'flex',
														justifyContent: 'space-between',
														alignItems: 'center',
													}}
												>
													<div style={{ flex: 1 }}>
														<div
															style={{
																display: 'flex',
																alignItems: 'center',
																gap: '8px',
															}}
														>
															<strong
																style={{
																	display: 'block',
																	fontSize: '1rem',
																	color:
																		opcion.isWinner && totalVotosVotacion > 0
																			? '#fbbf24'
																			: 'white',
																}}
															>
																{opcion.nombre_opcion}
															</strong>
															{opcion.isWinner && totalVotosVotacion > 0 && (
																<span
																	style={{ fontSize: '14px' }}
																	title="Opción Ganadora"
																>
																	🏆
																</span>
															)}
															{isTheVotedOne && (
																<span
																	style={{
																		fontSize: '0.7rem',
																		padding: '2px 6px',
																		backgroundColor: 'rgba(56, 189, 248, 0.2)',
																		color: '#38bdf8',
																		borderRadius: '4px',
																		border: '1px solid rgba(56, 189, 248, 0.4)',
																	}}
																>
																	Tu Selección
																</span>
															)}
														</div>
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
													<div style={{ textAlign: 'right', minWidth: '60px' }}>
														<span
															style={{
																display: 'block',
																fontSize: '1.2rem',
																fontWeight: 'bold',
																color:
																	opcion.isWinner && totalVotosVotacion > 0
																		? '#fbbf24'
																		: 'rgba(255,255,255,0.9)',
															}}
														>
															{percentage}%
														</span>
														<span
															style={{
																fontSize: '0.75rem',
																color: 'rgba(255,255,255,0.5)',
															}}
														>
															{opcion.total_votos} votos
														</span>
													</div>
												</div>

												{/* Barra de progreso */}
												<div
													style={{
														width: '100%',
														height: '8px',
														backgroundColor: 'rgba(255,255,255,0.1)',
														borderRadius: '4px',
														overflow: 'hidden',
													}}
												>
													<motion.div
														initial={{ width: 0 }}
														animate={{ width: `${percentage}%` }}
														transition={{ duration: 1, ease: 'easeOut' }}
														style={{
															height: '100%',
															backgroundColor:
																opcion.isWinner && totalVotosVotacion > 0
																	? '#fbbf24'
																	: isTheVotedOne
																		? '#38bdf8'
																		: 'rgba(255,255,255,0.4)',
														}}
													/>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>
					);
				})
			)}
		</motion.div>
	);
}
