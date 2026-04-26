import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import { Input } from './Input';
import { Alert } from './Alert';
import { Modal } from './Modal';

export function OrgActions() {
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('mis_orgs'); // 'mis_orgs', 'crear', 'unirse', 'gestionar'
    
    // Estados para "Crear"
    const [nombreOrg, setNombreOrg] = useState('');
    const [descOrg, setDescOrg] = useState('');
    const [sedeOrg, setSedeOrg] = useState('');
    
    // Estados para "Unirse"
    const [codigoOrg, setCodigoOrg] = useState('');
    const [pideAdmin, setPideAdmin] = useState(false);
    
    // Estados para "Gestionar"
    const [solicitudes, setSolicitudes] = useState([]);
    
    // Estados para "Mis Organizaciones"
    const [misOrganizaciones, setMisOrganizaciones] = useState([]);
    
    // Estados globales de UI
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // Obtener token almacenado
    const token = localStorage.getItem('token');

    // Cualquier usuario logueado puede ver la pestaña "Gestionar".
    // El backend se encargará de devolver solo las solicitudes de las organizaciones
    // donde este usuario específico tiene es_admin = 1 en organizacion_miembros.
    const puedeGestionar = !!user;

    useEffect(() => {
        if (isModalOpen && activeTab === 'gestionar' && puedeGestionar) {
            fetchSolicitudes();
        } else if (isModalOpen && activeTab === 'mis_orgs') {
            fetchMisOrganizaciones();
        }
    }, [isModalOpen, activeTab, puedeGestionar]);

    const fetchMisOrganizaciones = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/get_my_organizations.php', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Error al obtener tus organizaciones');
            }
            setMisOrganizaciones(data.organizaciones || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchSolicitudes = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/manage_requests.php', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Error al obtener solicitudes');
            }
            setSolicitudes(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCrear = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const response = await fetch('/api/create_organization.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nombre: nombreOrg,
                    descripcion: descOrg,
                    sede_ciudad: sedeOrg
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Error al crear la organización');
            }
            setSuccess(`Organización creada con éxito. Código de invitación: ${data.codigo_unico}`);
            setNombreOrg('');
            setDescOrg('');
            setSedeOrg('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUnirse = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const response = await fetch('/api/join_organization.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    codigo_unico: codigoOrg,
                    pide_ser_admin: pideAdmin
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Error al unirse a la organización');
            }
            setSuccess('Solicitud enviada correctamente. Espera a que un administrador la acepte.');
            setCodigoOrg('');
            setPideAdmin(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGestionar = async (solicitud_id, accion) => {
        setError('');
        setSuccess('');
        try {
            const response = await fetch('/api/manage_requests.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    solicitud_id,
                    accion
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `Error al ${accion} la solicitud`);
            }
            setSuccess(data.message);
            fetchSolicitudes(); // Recargar la lista
        } catch (err) {
            setError(err.message);
        }
    };

    const handleAbandonar = async (organizacion_id) => {
        if (!window.confirm('¿Estás seguro de que deseas abandonar esta organización?')) return;
        
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const response = await fetch('/api/leave_organization.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    organizacion_id
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Error al abandonar la organización');
            }
            setSuccess(data.message);
            fetchMisOrganizaciones(); // Recargar la lista
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const tabStyle = (isActive) => ({
        padding: '0.5rem 1rem',
        cursor: 'pointer',
        borderBottom: isActive ? '2px solid #38bdf8' : '2px solid transparent',
        color: isActive ? '#38bdf8' : '#94a3b8',
        fontWeight: isActive ? 'bold' : 'normal',
        background: 'none',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        fontSize: '1rem',
        flex: 1,
    });

    return (
        <>
            <Button onClick={() => { setIsModalOpen(true); setError(''); setSuccess(''); }}>
                Organizaciones
            </Button>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} titulo="Gestión de Organizaciones">
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem', overflowX: 'auto' }}>
                    <button style={tabStyle(activeTab === 'mis_orgs')} onClick={() => { setActiveTab('mis_orgs'); setError(''); setSuccess(''); }}>
                        Mis Grupos
                    </button>
                    <button style={tabStyle(activeTab === 'crear')} onClick={() => { setActiveTab('crear'); setError(''); setSuccess(''); }}>
                        Crear
                    </button>
                    <button style={tabStyle(activeTab === 'unirse')} onClick={() => { setActiveTab('unirse'); setError(''); setSuccess(''); }}>
                        Unirse
                    </button>
                    {puedeGestionar && (
                        <button style={tabStyle(activeTab === 'gestionar')} onClick={() => { setActiveTab('gestionar'); setError(''); setSuccess(''); }}>
                            Solicitudes
                        </button>
                    )}
                </div>

                {error && <Alert type="error" message={error} />}
                {success && <Alert type="success" message={success} />}

                {activeTab === 'mis_orgs' && (
                    <div>
                        {loading ? (
                            <p>Cargando tus organizaciones...</p>
                        ) : misOrganizaciones.length === 0 ? (
                            <p>No perteneces a ninguna organización todavía.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {misOrganizaciones.map((org) => (
                                    <div key={org.id} style={{
                                        backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                        padding: '1.5rem',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                            <div>
                                                <h3 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc' }}>{org.nombre}</h3>
                                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                                    {org.descripcion || 'Sin descripción'}
                                                </p>
                                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                                                    <span>📍 {org.sede_ciudad || 'Desconocida'}</span>
                                                    {org.es_admin == 1 && (
                                                        <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>👑 Administrador</span>
                                                    )}
                                                </div>
                                                {org.es_admin == 1 && org.codigo_unico && (
                                                    <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '4px', display: 'inline-block' }}>
                                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>Código de Invitación:</span>
                                                        <span style={{ fontFamily: 'monospace', letterSpacing: '2px', color: '#f8fafc', fontWeight: 'bold' }}>{org.codigo_unico}</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* El creador no puede abandonar la organización */}
                                            {org.creado_por != user?.id && (
                                                <Button 
                                                    secondary 
                                                    onClick={() => handleAbandonar(org.id)} 
                                                    estiloExtra={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', borderColor: 'rgba(220, 38, 38, 0.3)', color: '#ef4444', padding: '0.5rem 1rem' }}
                                                >
                                                    Abandonar
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'crear' && (
                    <form onSubmit={handleCrear}>
                        <Input
                            placeholder="Nombre de la Organización"
                            value={nombreOrg}
                            onChange={(e) => setNombreOrg(e.target.value)}
                        />
                        <Input
                            placeholder="Descripción (opcional)"
                            value={descOrg}
                            onChange={(e) => setDescOrg(e.target.value)}
                        />
                        <Input
                            placeholder="Sede/Ciudad (opcional)"
                            value={sedeOrg}
                            onChange={(e) => setSedeOrg(e.target.value)}
                        />
                        <Button type="submit" width="100%" disabled={loading}>
                            {loading ? 'Creando...' : 'Crear Organización'}
                        </Button>
                    </form>
                )}

                {activeTab === 'unirse' && (
                    <form onSubmit={handleUnirse}>
                        <Input
                            placeholder="Código de 8 dígitos"
                            maxLength="8"
                            value={codigoOrg}
                            onChange={(e) => setCodigoOrg(e.target.value.toUpperCase())}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={pideAdmin}
                                onChange={(e) => setPideAdmin(e.target.checked)}
                            />
                            Solicitar unirse como Administrador
                        </label>
                        <Button type="submit" width="100%" disabled={loading}>
                            {loading ? 'Enviando...' : 'Unirse a la Organización'}
                        </Button>
                    </form>
                )}

                {activeTab === 'gestionar' && puedeGestionar && (
                    <div>
                        {loading ? (
                            <p>Cargando solicitudes...</p>
                        ) : solicitudes.length === 0 ? (
                            <p>No hay solicitudes pendientes.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {solicitudes.map((sol) => (
                                    <div key={sol.solicitud_id} style={{
                                        backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
                                            {sol.nombre} {sol.apellidos}
                                        </p>
                                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                            Organización: {sol.organizacion_nombre} <br />
                                            De: {sol.ciudad}, {sol.provincia} <br />
                                            Solicita ser: <span style={{ color: sol.pide_ser_admin ? '#f59e0b' : '#38bdf8' }}>
                                                {sol.pide_ser_admin ? 'Administrador' : 'Miembro regular'}
                                            </span>
                                        </p>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Button onClick={() => handleGestionar(sol.solicitud_id, 'aceptar')} estiloExtra={{ flex: 1 }}>
                                                Aceptar
                                            </Button>
                                            <Button secondary onClick={() => handleGestionar(sol.solicitud_id, 'denegar')} estiloExtra={{ flex: 1, backgroundColor: 'rgba(220, 38, 38, 0.2)', borderColor: 'rgba(220, 38, 38, 0.5)' }}>
                                                Denegar
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
}
