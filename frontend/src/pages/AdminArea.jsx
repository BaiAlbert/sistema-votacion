import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { votacionesService } from '../services/votacionesService';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Header } from '../components/Header';
import { Select } from '../components/Select';
import { Alert } from '../components/Alert';
import { DatePicker } from '../components/DatePicker';

/**
 * Componente AdminArea (Panel de Administración)
 * 
 * Vista protegida exclusivamente para usuarios con roles 'admin_privado' o 'admin_gobierno'.
 * Permite la creación dinámica de votaciones (Gubernamentales Nacionales/Provinciales/Locales 
 * o Privadas ligadas a Grupos específicos).
 * 
 * Gestiona localmente un array dinámico de Opciones de votación (permitiendo añadir infinitas
 * opciones pero forzando un mínimo de 2).
 *
 * @returns {JSX.Element} Panel interactivo de creación de votaciones
 */
function AdminArea() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const defaultTipo = user?.rol === 'admin_privado' ? 'privada' : 'gubernamental';

    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        tipo: defaultTipo,
        alcance: 'nacional',
        provincia_target: '',
        ciudad_target: '',
        id_grupo: '',
        fecha_inicio: '',
        fecha_final: '',
        opciones: [
            { nombre_opcion: '', desc_opcion: '' },
            { nombre_opcion: '', desc_opcion: '' }
        ]
    });
    const [error, setError] = useState('');
    const [invalidField, setInvalidField] = useState('');
    const [successMsg, setSuccessMsg] = useState(''); // Estado para mensaje de éxito
    const [adminGroups, setAdminGroups] = useState([]);

    useEffect(() => {
        if (user?.rol === 'admin_privado') {
            const fetchGroups = async () => {
                try {
                    const groups = await votacionesService.getAdminGroups();
                    setAdminGroups(groups);
                } catch (err) {
                    setError('Error al cargar tus grupos: ' + err.message);
                }
            };
            fetchGroups();
        }
    }, [user]);

    // Redirigir si no es admin
    if (!user || (user.rol !== "admin_privado" && user.rol !== "admin_gobierno")) {
        return (
            <div style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>
                <h2>Acceso denegado</h2>
                <Button onClick={() => navigate('/')}>Volver al inicio</Button>
            </div>
        );
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });

        if (invalidField === e.target.name) {
            setInvalidField('');
        }
        setSuccessMsg(''); // Limpiamos mensaje de éxito si el usuario vuelve a escribir
    };

    const handleOptionChange = (index, field, value) => {
        const newOpciones = [...formData.opciones];
        newOpciones[index][field] = value;
        setFormData({ ...formData, opciones: newOpciones });

        if (invalidField === `opcion_${index}`) {
            setInvalidField('');
        }
    };

    const handleAddOption = () => {
        setFormData({
            ...formData,
            opciones: [...formData.opciones, { nombre_opcion: '', desc_opcion: '' }]
        });
    };

    const handleRemoveOption = (index) => {
        if (formData.opciones.length <= 2) return; // Mínimo 2 opciones
        const newOpciones = formData.opciones.filter((_, i) => i !== index);
        setFormData({ ...formData, opciones: newOpciones });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setInvalidField('');

        if (!formData.titulo) {
            setInvalidField('titulo');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return setError('El título es obligatorio.');
        }
        if (!formData.fecha_inicio) {
            setInvalidField('fecha_inicio');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return setError('La fecha de inicio es obligatoria.');
        }
        if (!formData.fecha_final) {
            setInvalidField('fecha_final');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return setError('La fecha final es obligatoria.');
        }
        if (new Date(formData.fecha_inicio) >= new Date(formData.fecha_final)) {
            setInvalidField('fecha_final');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return setError('La fecha de finalización debe ser posterior a la de inicio.');
        }

        // Validaciones específicas según el tipo y alcance
        if (formData.tipo === 'gubernamental') {
            if (formData.alcance === 'provincial' && !formData.provincia_target) {
                setInvalidField('provincia_target');
                return setError('Debe especificar la provincia objetivo.');
            }
            if (formData.alcance === 'local') {
                if (!formData.provincia_target) {
                    setInvalidField('provincia_target');
                    return setError('Debe especificar la provincia objetivo.');
                }
                if (!formData.ciudad_target) {
                    setInvalidField('ciudad_target');
                    return setError('Debe especificar la ciudad objetivo.');
                }
            }
        }

        if (formData.tipo === 'privada' && !formData.id_grupo) {
            setInvalidField('id_grupo');
            return setError('Debe especificar el ID del grupo para votaciones privadas.');
        }

        // Validar que hay al menos 2 opciones reales
        if (formData.opciones.length < 2) {
            return setError('Debe proporcionar al menos 2 opciones para la votación.');
        }

        // Validar que ninguna opción tiene el nombre vacío
        for (let i = 0; i < formData.opciones.length; i++) {
            if (!formData.opciones[i].nombre_opcion.trim()) {
                setInvalidField(`opcion_${i}`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return setError(`El nombre de la Opción ${i + 1} no puede estar vacío.`);
            }
        }

        try {
            // Llamamos al servicio real para crear la votación
            const response = await votacionesService.crearVotacion(formData);

            // Mostramos el mensaje de éxito del backend
            setSuccessMsg(response.message || 'Votación creada exitosamente');

            // Resetear formulario
            setFormData({
                titulo: '',
                descripcion: '',
                tipo: defaultTipo,
                alcance: 'nacional',
                provincia_target: '',
                ciudad_target: '',
                id_grupo: '',
                fecha_inicio: '',
                fecha_final: '',
                opciones: [
                    { nombre_opcion: '', desc_opcion: '' },
                    { nombre_opcion: '', desc_opcion: '' }
                ]
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setError(err.message || 'Error al crear la votación');
        }
    };

    const cardStyle = {
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        backdropFilter: 'blur(12px)',
        padding: '2rem',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        color: '#f8fafc',
        maxWidth: '600px',
        width: '100%',
        boxSizing: 'border-box',
    };

    const selectStyle = {
        display: 'block',
        width: '100%',
        padding: '0.8rem',
        marginBottom: '0.8rem',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        color: '#f8fafc',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
    };

    return (
        <>
            <Header titulo="Sistema de Votación"></Header>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    boxSizing: 'border-box',
                    width: '100%',
                    padding: '100px 1rem 1rem 1rem', // padding superior por el Header
                }}
            >
                <div style={cardStyle}>
                    <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#38bdf8' }}>Panel de Administración</h2>
                    <h3 style={{ textAlign: 'center', marginBottom: '1.2rem', fontWeight: 'normal' }}>Crear Nueva Votación</h3>

                    <Alert type="error" message={error} />
                    <Alert type="success" message={successMsg} />

                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                        <Input
                            name="titulo"
                            type="text"
                            placeholder="Título de la Votación"
                            onChange={handleChange}
                            isInvalid={invalidField === 'titulo'}
                            value={formData.titulo}
                        />

                        <textarea
                            name="descripcion"
                            placeholder="Descripción (opcional)"
                            onChange={handleChange}
                            value={formData.descripcion}
                            style={{ ...selectStyle, resize: 'vertical', minHeight: '100px' }}
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Fecha de inicio:</label>
                                <DatePicker
                                    name="fecha_inicio"
                                    onChange={handleChange}
                                    value={formData.fecha_inicio}
                                    isInvalid={invalidField === 'fecha_inicio'}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Fecha de fin:</label>
                                <DatePicker
                                    name="fecha_final"
                                    onChange={handleChange}
                                    value={formData.fecha_final}
                                    isInvalid={invalidField === 'fecha_final'}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Tipo de Votación:</label>
                            <Select
                                name="tipo"
                                value={formData.tipo}
                                options={[
                                    { value: 'gubernamental', label: 'Gubernamental' },
                                    { value: 'privada', label: 'Privada' }
                                ]}
                                disabled // Forzamos el lock basado en el rol inicial
                            />
                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '-0.3rem', marginBottom: '1rem' }}>* El tipo de votación está bloqueado según tu rol de administrador.</p>
                        </div>

                        {formData.tipo === 'gubernamental' && (
                            <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#38bdf8' }}>Configuración Gubernamental</label>

                                <label style={{ display: 'block', marginBottom: '0.5rem', marginTop: '1rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Alcance de la Votación:</label>
                                <Select
                                    name="alcance"
                                    onChange={handleChange}
                                    value={formData.alcance}
                                    options={[
                                        { value: 'nacional', label: 'Nacional' },
                                        { value: 'provincial', label: 'Provincial' },
                                        { value: 'local', label: 'Local' }
                                    ]}
                                />

                                {(formData.alcance === 'provincial' || formData.alcance === 'local') && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Provincia Objetivo:</label>
                                        <Input
                                            name="provincia_target"
                                            type="text"
                                            placeholder="Ej: Madrid, Valencia..."
                                            onChange={handleChange}
                                            isInvalid={invalidField === 'provincia_target'}
                                            value={formData.provincia_target}
                                        />
                                    </div>
                                )}

                                {formData.alcance === 'local' && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Ciudad Objetivo:</label>
                                        <Input
                                            name="ciudad_target"
                                            type="text"
                                            placeholder="Ej: Móstoles, Gandía..."
                                            onChange={handleChange}
                                            isInvalid={invalidField === 'ciudad_target'}
                                            value={formData.ciudad_target}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {formData.tipo === 'privada' && (
                            <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#38bdf8' }}>Configuración Privada</label>
                                <label style={{ display: 'block', marginBottom: '0.5rem', marginTop: '1rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Grupo Organizador:</label>
                                <Select
                                    name="id_grupo"
                                    value={formData.id_grupo}
                                    onChange={handleChange}
                                    options={[
                                        ...adminGroups.map(g => ({ value: g.id.toString(), label: g.nombre }))
                                    ]}
                                />
                                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>* Solo puedes organizar votaciones para los grupos que administras.</p>
                            </div>
                        )}

                        <div style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '1rem', color: '#38bdf8', fontWeight: 'bold' }}>Opciones de Votación</label>
                                <button type="button" onClick={handleAddOption} style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,0.3)', color: 'white', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }} onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={(e) => e.target.style.background = 'transparent'}>
                                    + Añadir Opción
                                </button>
                            </div>

                            {formData.opciones.map((opcion, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    style={{ display: 'flex', gap: '10px', marginBottom: '1rem', alignItems: 'flex-start', position: 'relative', padding: '15px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: invalidField === `opcion_${index}` ? '1px solid #ff6b6b' : '1px solid transparent' }}
                                >
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <Input
                                            type="text"
                                            placeholder={`Título de la Opción ${index + 1}`}
                                            value={opcion.nombre_opcion}
                                            onChange={(e) => handleOptionChange(index, 'nombre_opcion', e.target.value)}
                                            style={{ margin: 0 }}
                                        />
                                        <textarea
                                            placeholder="Detalles sobre esta opción (Opcional)"
                                            value={opcion.desc_opcion}
                                            onChange={(e) => handleOptionChange(index, 'desc_opcion', e.target.value)}
                                            style={{ ...selectStyle, resize: 'vertical', minHeight: '60px', margin: 0, fontSize: '0.9rem' }}
                                        />
                                    </div>

                                    {formData.opciones.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveOption(index)}
                                            style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', color: '#ff6b6b', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, padding: 0, transition: 'all 0.2s', alignSelf: 'flex-start' }}
                                            title="Eliminar opción"
                                        >
                                            <span style={{ marginTop: '-2px', fontWeight: 'bold' }}>×</span>
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        <Button type="submit" width="100%" estiloExtra={{ marginTop: '1rem' }}>
                            Crear Votación
                        </Button>
                    </form>
                </div>
            </motion.div>
        </>
    );
}

export default AdminArea;
