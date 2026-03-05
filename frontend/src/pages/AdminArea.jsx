import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Header } from '../components/Header';

function AdminArea() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        tipo: 'publica',
        fecha_inicio: '',
        fecha_final: '',
    });
    const [error, setError] = useState('');
    const [invalidField, setInvalidField] = useState('');

    // Redirigir si no es admin (ejecutado en render aunque lo ideal sería un PrivateRoute o Effect, lo hacemos simple aquí o que el Header no de la opción)
    if (!user || (user.rol != "admin_privado" && user.rol != "admin_gobierno")) {
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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setInvalidField('');

        if (!formData.titulo) {
            setInvalidField('titulo');
            return setError('El título es obligatorio.');
        }
        if (!formData.fecha_inicio) {
            setInvalidField('fecha_inicio');
            return setError('La fecha de inicio es obligatoria.');
        }
        if (!formData.fecha_final) {
            setInvalidField('fecha_final');
            return setError('La fecha final es obligatoria.');
        }
        if (new Date(formData.fecha_inicio) >= new Date(formData.fecha_final)) {
            setInvalidField('fecha_final');
            return setError('La fecha de finalización debe ser posterior a la de inicio.');
        }

        try {
            // Simulamos llamada a la API para crear votación
            // await votacionesService.crearVotacion(formData)
            console.log('Datos de votación a enviar:', formData);
            alert('Votación creada exitosamente (Simulado por ahora)');

            // Resetear formulario
            setFormData({
                titulo: '',
                descripcion: '',
                tipo: 'publica',
                fecha_inicio: '',
                fecha_final: '',
            });
        } catch (err) {
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

                    {error && <p style={{ color: '#ff6b6b', textAlign: 'center', margin: '0 0 1rem 0', fontSize: '0.95rem' }}>{error}</p>}

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
                                <Input
                                    name="fecha_inicio"
                                    type="datetime-local"
                                    onChange={handleChange}
                                    isInvalid={invalidField === 'fecha_inicio'}
                                    value={formData.fecha_inicio}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Fecha de fin:</label>
                                <Input
                                    name="fecha_final"
                                    type="datetime-local"
                                    onChange={handleChange}
                                    isInvalid={invalidField === 'fecha_final'}
                                    value={formData.fecha_final}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Tipo de Votación:</label>
                            <select
                                name="tipo"
                                onChange={handleChange}
                                value={formData.tipo}
                                style={selectStyle}
                            >
                                <option value="publica" style={{ color: 'black' }}>Pública</option>
                                <option value="privada" style={{ color: 'black' }}>Privada</option>
                                <option value="gubernamental" style={{ color: 'black' }}>Gubernamental</option>
                            </select>
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
