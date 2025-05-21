import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import * as preciosAPI from '../../api/preciosAPI';
import { Servicio, AddonServicio } from '../../services/preciosService';

// Estilos
const AdminContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #00FFFF;
`;

const Card = styled.div`
  background: rgba(17, 17, 17, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const PreciosTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  th {
    color: rgba(255, 255, 255, 0.7);
    font-weight: 600;
  }
  
  tr:last-child td {
    border-bottom: none;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: rgba(255, 255, 255, 0.9);
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: white;
  
  &:focus {
    outline: none;
    border-color: #00FFFF;
  }
`;

const Button = styled.button<{ primary?: boolean }>`
  padding: 0.8rem 1.5rem;
  background: ${props => props.primary ? 'linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%)' : 'transparent'};
  border: 1px solid ${props => props.primary ? 'white' : 'rgba(255, 255, 255, 0.3)'};
  border-radius: 6px;
  color: white;
  font-weight: ${props => props.primary ? '600' : '400'};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.primary ? '0 5px 15px rgba(0, 0, 0, 0.3)' : 'none'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: translateY(0);
    box-shadow: none;
  }
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: #00FFFF;
  cursor: pointer;
  margin-right: 0.5rem;
  
  &:hover {
    color: white;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const InfoText = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin-top: 0.5rem;
  font-style: italic;
`;

const Alert = styled.div<{ type: 'success' | 'error' | 'info' }>`
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 6px;
  background-color: ${props =>
    props.type === 'success' ? 'rgba(72, 187, 120, 0.2)' :
      props.type === 'error' ? 'rgba(245, 101, 101, 0.2)' :
        'rgba(66, 153, 225, 0.2)'
  };
  color: ${props =>
    props.type === 'success' ? '#48BB78' :
      props.type === 'error' ? '#F56565' :
        '#4299E1'
  };
  border-left: 3px solid ${props =>
    props.type === 'success' ? '#48BB78' :
      props.type === 'error' ? '#F56565' :
        '#4299E1'
  };
`;

const PreciosAdmin: React.FC = () => {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [addons, setAddons] = useState<AddonServicio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoAddons, setCargandoAddons] = useState(true);
  const [mensaje, setMensaje] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [editandoAddon, setEditandoAddon] = useState<string | null>(null);
  const [precioEditado, setPrecioEditado] = useState<number>(0);
  const [precioOriginalEditado, setPrecioOriginalEditado] = useState<number | null>(null);
  const [mostrarAddons, setMostrarAddons] = useState<boolean>(false);

  // Estados para la edición completa de un servicio
  const [editandoCompleto, setEditandoCompleto] = useState<string | null>(null);
  const [servicioEnEdicion, setServicioEnEdicion] = useState<Partial<Servicio>>({});

  // Estado para el formulario de nuevo servicio
  const [mostrarFormNuevoServicio, setMostrarFormNuevoServicio] = useState<boolean>(false);
  const [nuevoServicio, setNuevoServicio] = useState<Omit<Servicio, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    description: '',
    features: [],
    isPaquete: false,
    price: 0,
    originalPrice: null
  });

  // Cargar servicios desde la API
  useEffect(() => {
    cargarServicios();

    // Recargar al volver de otra pestaña
    const handleFocus = () => {
      cargarServicios();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Extraer la función de carga para reutilizarla
  const cargarServicios = async () => {
    try {
      setCargando(true);

      // Obtener servicios desde la API
      const serviciosObtenidos = await preciosAPI.obtenerServicios();
      setServicios(serviciosObtenidos);

      setCargando(false);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      setCargando(false);
      setMensaje({
        text: 'Error al cargar los servicios. Por favor, intenta de nuevo.',
        type: 'error'
      });
    }
  };

  // Función para cargar los addons
  const cargarAddons = async () => {
    if (addons.length > 0 && !cargandoAddons) return; // No volver a cargar si ya están cargados

    try {
      setCargandoAddons(true);

      // Obtener addons desde la API
      const addonsObtenidos = await preciosAPI.obtenerAddons();
      setAddons(addonsObtenidos);

      setCargandoAddons(false);
    } catch (error) {
      console.error('Error al cargar addons:', error);
      setCargandoAddons(false);
      setMensaje({
        text: 'Error al cargar los add-ons. Por favor, intenta de nuevo.',
        type: 'error'
      });
    }
  };

  // Cargar addons si se muestra la sección
  useEffect(() => {
    if (mostrarAddons) {
      cargarAddons();
    }
  }, [mostrarAddons]);

  // Función para iniciar la edición de un precio
  const iniciarEdicion = (servicio: Servicio) => {
    setEditando(servicio.id);
    setPrecioEditado(servicio.price);
    setPrecioOriginalEditado(servicio.originalPrice);
  };

  // Función para iniciar la edición de un precio de addon
  const iniciarEdicionAddon = (addon: AddonServicio) => {
    setEditandoAddon(addon.id);
    setPrecioEditado(addon.price);
  };

  // Función para cancelar la edición
  const cancelarEdicion = () => {
    setEditando(null);
    setEditandoAddon(null);
    setPrecioEditado(0);
    setPrecioOriginalEditado(null);
  };

  // Función para guardar el precio editado
  const guardarPrecio = async (servicioId: string) => {
    try {
      // Validar que el precio sea mayor que cero
      if (precioEditado <= 0) {
        setMensaje({
          text: 'El precio debe ser mayor que cero.',
          type: 'error'
        });
        return;
      }

      // Validar que el precio original sea mayor que el precio actual o null
      if (precioOriginalEditado !== null && precioOriginalEditado <= precioEditado) {
        setMensaje({
          text: 'El precio original debe ser mayor que el precio actual o dejarse en blanco.',
          type: 'error'
        });
        return;
      }

      // Actualizar el precio a través de la API
      const servicioActualizado = await preciosAPI.actualizarPreciosServicio(servicioId, {
        price: precioEditado,
        originalPrice: precioOriginalEditado
      });

      // Actualizar el estado local
      setServicios(prev => prev.map(servicio => {
        if (servicio.id === servicioId) {
          return servicioActualizado;
        }
        return servicio;
      }));

      setMensaje({
        text: 'Precios actualizados correctamente.',
        type: 'success'
      });

      setEditando(null);
      setPrecioOriginalEditado(null);

      // Limpiar el mensaje después de 3 segundos
      setTimeout(() => {
        setMensaje(null);
      }, 3000);

    } catch (error: any) {
      console.error('Error al actualizar precio:', error);
      setMensaje({
        text: error.message || 'Error al actualizar el precio. Por favor, intenta de nuevo.',
        type: 'error'
      });
    }
  };

  // Función para guardar el precio editado de un addon
  const guardarPrecioAddon = async (addonId: string) => {
    try {
      // Validar que el precio sea mayor que cero
      if (precioEditado <= 0) {
        setMensaje({
          text: 'El precio debe ser mayor que cero.',
          type: 'error'
        });
        return;
      }

      // Actualizar el precio a través de la API
      const addonActualizado = await preciosAPI.actualizarPrecioAddon(addonId, precioEditado);

      // Actualizar el estado local
      setAddons(prev => prev.map(addon => {
        if (addon.id === addonId) {
          return addonActualizado;
        }
        return addon;
      }));

      setMensaje({
        text: 'Precio del add-on actualizado correctamente.',
        type: 'success'
      });

      setEditandoAddon(null);

      // Limpiar el mensaje después de 3 segundos
      setTimeout(() => {
        setMensaje(null);
      }, 3000);

    } catch (error: any) {
      console.error('Error al actualizar precio del add-on:', error);
      setMensaje({
        text: error.message || 'Error al actualizar el precio del add-on. Por favor, intenta de nuevo.',
        type: 'error'
      });
    }
  };

  // Función para iniciar la edición completa de un servicio
  const iniciarEdicionCompleta = (servicio: Servicio) => {
    setEditandoCompleto(servicio.id);
    setServicioEnEdicion({
      title: servicio.title,
      description: servicio.description,
      features: servicio.features || [],
      isPaquete: servicio.isPaquete,
      price: servicio.price,
      originalPrice: servicio.originalPrice
    });
  };

  // Función para actualizar los campos del servicio en edición
  const actualizarCampoServicio = (campo: string, valor: any) => {
    setServicioEnEdicion(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // Función para actualizar una característica específica
  const actualizarCaracteristica = (index: number, valor: string) => {
    const nuevasCaracteristicas = [...(servicioEnEdicion.features || [])];
    nuevasCaracteristicas[index] = valor;
    actualizarCampoServicio('features', nuevasCaracteristicas);
  };

  // Función para añadir una nueva característica
  const agregarCaracteristica = () => {
    const nuevasCaracteristicas = [...(servicioEnEdicion.features || []), ''];
    actualizarCampoServicio('features', nuevasCaracteristicas);
  };

  // Función para eliminar una característica
  const eliminarCaracteristica = (index: number) => {
    const nuevasCaracteristicas = [...(servicioEnEdicion.features || [])];
    nuevasCaracteristicas.splice(index, 1);
    actualizarCampoServicio('features', nuevasCaracteristicas);
  };

  // Función para guardar el servicio editado
  const guardarServicioEditado = async () => {
    try {
      // Validaciones básicas
      if (!servicioEnEdicion.title || !servicioEnEdicion.description) {
        setMensaje({
          text: 'El título y la descripción son obligatorios.',
          type: 'error'
        });
        return;
      }

      if (!servicioEnEdicion.price || servicioEnEdicion.price <= 0) {
        setMensaje({
          text: 'El precio debe ser mayor que cero.',
          type: 'error'
        });
        return;
      }

      if (servicioEnEdicion.originalPrice !== null &&
        servicioEnEdicion.originalPrice !== undefined &&
        servicioEnEdicion.originalPrice <= servicioEnEdicion.price) {
        setMensaje({
          text: 'El precio original debe ser mayor que el precio actual o dejarse en blanco.',
          type: 'error'
        });
        return;
      }

      // Actualizar el servicio a través de la API
      const servicioActualizado = await preciosAPI.actualizarServicio(
        editandoCompleto!,
        servicioEnEdicion
      );

      // Actualizar el estado local
      setServicios(prev => prev.map(servicio => {
        if (servicio.id === editandoCompleto) {
          return servicioActualizado;
        }
        return servicio;
      }));

      setMensaje({
        text: 'Servicio actualizado correctamente.',
        type: 'success'
      });

      setEditandoCompleto(null);
      setServicioEnEdicion({});

      // Limpiar el mensaje después de 3 segundos
      setTimeout(() => {
        setMensaje(null);
      }, 3000);

    } catch (error: any) {
      console.error('Error al actualizar servicio:', error);
      setMensaje({
        text: error.message || 'Error al actualizar el servicio. Por favor, intenta de nuevo.',
        type: 'error'
      });
    }
  };

  // Función para actualizar campos del nuevo servicio
  const actualizarCampoNuevoServicio = (campo: string, valor: any) => {
    setNuevoServicio(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // Función para actualizar una característica específica del nuevo servicio
  const actualizarCaracteristicaNueva = (index: number, valor: string) => {
    const nuevasCaracteristicas = [...(nuevoServicio.features || [])];
    nuevasCaracteristicas[index] = valor;
    actualizarCampoNuevoServicio('features', nuevasCaracteristicas);
  };

  // Función para añadir una nueva característica al nuevo servicio
  const agregarCaracteristicaNueva = () => {
    const nuevasCaracteristicas = [...(nuevoServicio.features || []), ''];
    actualizarCampoNuevoServicio('features', nuevasCaracteristicas);
  };

  // Función para eliminar una característica del nuevo servicio
  const eliminarCaracteristicaNueva = (index: number) => {
    const nuevasCaracteristicas = [...(nuevoServicio.features || [])];
    nuevasCaracteristicas.splice(index, 1);
    actualizarCampoNuevoServicio('features', nuevasCaracteristicas);
  };

  // Función para crear un nuevo servicio
  const crearNuevoServicio = async () => {
    try {
      // Validaciones básicas
      if (!nuevoServicio.title || !nuevoServicio.description) {
        setMensaje({
          text: 'El título y la descripción son obligatorios.',
          type: 'error'
        });
        return;
      }

      if (!nuevoServicio.price || nuevoServicio.price <= 0) {
        setMensaje({
          text: 'El precio debe ser mayor que cero.',
          type: 'error'
        });
        return;
      }

      if (nuevoServicio.originalPrice !== null &&
        nuevoServicio.originalPrice !== undefined &&
        nuevoServicio.originalPrice <= nuevoServicio.price) {
        setMensaje({
          text: 'El precio original debe ser mayor que el precio actual o dejarse en blanco.',
          type: 'error'
        });
        return;
      }

      // Crear el servicio a través de la API
      const servicioCreado = await preciosAPI.crearServicio(nuevoServicio);

      // Actualizar el estado local
      setServicios(prev => [...prev, servicioCreado]);

      setMensaje({
        text: 'Servicio creado correctamente.',
        type: 'success'
      });

      // Reiniciar el formulario
      setNuevoServicio({
        title: '',
        description: '',
        features: [],
        isPaquete: false,
        price: 0,
        originalPrice: null
      });

      setMostrarFormNuevoServicio(false);

      // Limpiar el mensaje después de 3 segundos
      setTimeout(() => {
        setMensaje(null);
      }, 3000);

    } catch (error: any) {
      console.error('Error al crear servicio:', error);
      setMensaje({
        text: error.message || 'Error al crear el servicio. Por favor, intenta de nuevo.',
        type: 'error'
      });
    }
  };

  return (
    <AdminContainer>
      <Title>Gestión de Precios</Title>

      {mensaje && (
        <Alert type={mensaje.type}>
          {mensaje.text}
        </Alert>
      )}

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>Planes y Servicios</h2>
          <Button
            primary
            onClick={() => setMostrarFormNuevoServicio(!mostrarFormNuevoServicio)}
          >
            {mostrarFormNuevoServicio ? 'Cancelar' : 'Crear Nuevo Servicio'}
          </Button>
        </div>

        {/* Formulario para crear nuevo servicio */}
        {mostrarFormNuevoServicio && (
          <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '1rem' }}>Crear Nuevo Servicio</h3>

            <div style={{ marginBottom: '1rem' }}>
              <Label>Título</Label>
              <Input
                type="text"
                value={nuevoServicio.title}
                onChange={e => actualizarCampoNuevoServicio('title', e.target.value)}
                placeholder="Título del servicio"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <Label>Descripción</Label>
              <Input
                as="textarea"
                value={nuevoServicio.description}
                onChange={e => actualizarCampoNuevoServicio('description', e.target.value)}
                placeholder="Descripción del servicio"
                style={{ height: '100px' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <Label>Tipo</Label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={!nuevoServicio.isPaquete}
                    onChange={() => actualizarCampoNuevoServicio('isPaquete', false)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Plan
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={nuevoServicio.isPaquete}
                    onChange={() => actualizarCampoNuevoServicio('isPaquete', true)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Paquete
                </label>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <Label>Precio (en pesos argentinos)</Label>
              <Input
                type="number"
                value={nuevoServicio.price || ''}
                onChange={e => actualizarCampoNuevoServicio('price', Number(e.target.value))}
                min="1"
                placeholder="Precio actual"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <Label>Precio Original (opcional, para mostrar descuento)</Label>
              <Input
                type="number"
                value={nuevoServicio.originalPrice || ''}
                onChange={e => actualizarCampoNuevoServicio('originalPrice', e.target.value ? Number(e.target.value) : null)}
                min="1"
                placeholder="Sin precio original"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <Label style={{ margin: 0 }}>Características</Label>
                <Button onClick={agregarCaracteristicaNueva} style={{ padding: '0.4rem 0.8rem' }}>
                  + Agregar
                </Button>
              </div>

              {nuevoServicio.features?.map((caracteristica, index) => (
                <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Input
                    type="text"
                    value={caracteristica}
                    onChange={e => actualizarCaracteristicaNueva(index, e.target.value)}
                    placeholder={`Característica ${index + 1}`}
                    style={{ flex: 1 }}
                  />
                  <Button
                    onClick={() => eliminarCaracteristicaNueva(index)}
                    style={{ padding: '0.4rem 0.8rem', background: 'rgba(255, 0, 0, 0.1)' }}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <Button onClick={() => setMostrarFormNuevoServicio(false)}>
                Cancelar
              </Button>
              <Button primary onClick={crearNuevoServicio}>
                Crear Servicio
              </Button>
            </div>
          </div>
        )}

        {cargando ? (
          <p>Cargando servicios...</p>
        ) : servicios.length === 0 ? (
          <p>No hay servicios configurados</p>
        ) : (
          <PreciosTable>
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Descripción</th>
                <th>Tipo</th>
                <th>Precio Original</th>
                <th>Precio Actual</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {servicios
                .sort((a, b) => a.price - b.price) // Ordenar por precio, del más barato al más caro
                .map(servicio => (
                  <React.Fragment key={servicio.id}>
                    <tr>
                      <td>{servicio.title}</td>
                      <td>{servicio.description}</td>
                      <td>{servicio.isPaquete ? 'Paquete' : 'Plan'}</td>
                      <td>
                        {editando === servicio.id ? (
                          <Input
                            type="number"
                            value={precioOriginalEditado || ''}
                            onChange={e => setPrecioOriginalEditado(e.target.value ? Number(e.target.value) : null)}
                            min="1"
                            placeholder="Sin precio original"
                            style={{ width: '150px' }}
                          />
                        ) : (
                          servicio.originalPrice ? (
                            `$${servicio.originalPrice.toLocaleString('es-AR')}`
                          ) : (
                            'N/A'
                          )
                        )}
                      </td>
                      <td>
                        {editando === servicio.id ? (
                          <Input
                            type="number"
                            value={precioEditado}
                            onChange={e => setPrecioEditado(Number(e.target.value))}
                            min="1"
                            style={{ width: '150px' }}
                          />
                        ) : (
                          `$${servicio.price.toLocaleString('es-AR')}`
                        )}
                      </td>
                      <td>
                        {editando === servicio.id ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button primary onClick={() => guardarPrecio(servicio.id)}>
                              Guardar
                            </Button>
                            <Button onClick={cancelarEdicion}>
                              Cancelar
                            </Button>
                          </div>
                        ) : editandoCompleto === servicio.id ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button primary onClick={guardarServicioEditado}>
                              Guardar
                            </Button>
                            <Button onClick={() => setEditandoCompleto(null)}>
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button onClick={() => iniciarEdicion(servicio)}>
                              Editar Precios
                            </Button>
                            <Button onClick={() => iniciarEdicionCompleta(servicio)}>
                              Editar Todo
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* Formulario de edición completa */}
                    {editandoCompleto === servicio.id && (
                      <tr>
                        <td colSpan={6} style={{ padding: '1.5rem', background: 'rgba(0, 0, 0, 0.2)' }}>
                          <div style={{ marginBottom: '1rem' }}>
                            <Label>Título</Label>
                            <Input
                              type="text"
                              value={servicioEnEdicion.title || ''}
                              onChange={e => actualizarCampoServicio('title', e.target.value)}
                              placeholder="Título del servicio"
                            />
                          </div>

                          <div style={{ marginBottom: '1rem' }}>
                            <Label>Descripción</Label>
                            <Input
                              as="textarea"
                              value={servicioEnEdicion.description || ''}
                              onChange={e => actualizarCampoServicio('description', e.target.value)}
                              placeholder="Descripción del servicio"
                              style={{ height: '100px' }}
                            />
                          </div>

                          <div style={{ marginBottom: '1rem' }}>
                            <Label>Tipo</Label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                  type="radio"
                                  checked={!servicioEnEdicion.isPaquete}
                                  onChange={() => actualizarCampoServicio('isPaquete', false)}
                                  style={{ marginRight: '0.5rem' }}
                                />
                                Plan
                              </label>
                              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                  type="radio"
                                  checked={servicioEnEdicion.isPaquete}
                                  onChange={() => actualizarCampoServicio('isPaquete', true)}
                                  style={{ marginRight: '0.5rem' }}
                                />
                                Paquete
                              </label>
                            </div>
                          </div>

                          <div style={{ marginBottom: '1rem' }}>
                            <Label>Precio (en pesos argentinos)</Label>
                            <Input
                              type="number"
                              value={servicioEnEdicion.price || ''}
                              onChange={e => actualizarCampoServicio('price', Number(e.target.value))}
                              min="1"
                              placeholder="Precio actual"
                            />
                          </div>

                          <div style={{ marginBottom: '1rem' }}>
                            <Label>Precio Original (opcional, para mostrar descuento)</Label>
                            <Input
                              type="number"
                              value={servicioEnEdicion.originalPrice || ''}
                              onChange={e => actualizarCampoServicio('originalPrice', e.target.value ? Number(e.target.value) : null)}
                              min="1"
                              placeholder="Sin precio original"
                            />
                          </div>

                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <Label style={{ margin: 0 }}>Características</Label>
                              <Button onClick={agregarCaracteristica} style={{ padding: '0.4rem 0.8rem' }}>
                                + Agregar
                              </Button>
                            </div>

                            {servicioEnEdicion.features?.map((caracteristica, index) => (
                              <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <Input
                                  type="text"
                                  value={caracteristica}
                                  onChange={e => actualizarCaracteristica(index, e.target.value)}
                                  placeholder={`Característica ${index + 1}`}
                                  style={{ flex: 1 }}
                                />
                                <Button
                                  onClick={() => eliminarCaracteristica(index)}
                                  style={{ padding: '0.4rem 0.8rem', background: 'rgba(255, 0, 0, 0.1)' }}
                                >
                                  ✕
                                </Button>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
            </tbody>
          </PreciosTable>
        )}
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Configuración de Add-ons</h2>
          <Button onClick={() => setMostrarAddons(!mostrarAddons)}>
            {mostrarAddons ? 'Ocultar Add-ons' : 'Mostrar Add-ons'}
          </Button>
        </div>

        {mostrarAddons ? (
          cargandoAddons ? (
            <p>Cargando add-ons...</p>
          ) : addons.length === 0 ? (
            <p>No hay add-ons configurados</p>
          ) : (
            <PreciosTable>
              <thead>
                <tr>
                  <th>Add-on</th>
                  <th>Descripción</th>
                  <th>Tipo</th>
                  <th>Precio</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {addons.map(addon => (
                  <tr key={addon.id}>
                    <td>{addon.name}</td>
                    <td>{addon.description}</td>
                    <td>
                      {addon.oneTime ? 'Pago único' : ''}
                      {addon.duration ? `/${addon.duration}` : ''}
                    </td>
                    <td>
                      {editandoAddon === addon.id ? (
                        <Input
                          type="number"
                          value={precioEditado}
                          onChange={e => setPrecioEditado(Number(e.target.value))}
                          min="1"
                          style={{ width: '150px' }}
                        />
                      ) : (
                        `$${addon.price.toLocaleString('es-AR')}`
                      )}
                    </td>
                    <td>
                      {editandoAddon === addon.id ? (
                        <>
                          <ActionButton onClick={() => guardarPrecioAddon(addon.id)}>
                            Guardar
                          </ActionButton>
                          <ActionButton onClick={cancelarEdicion}>
                            Cancelar
                          </ActionButton>
                        </>
                      ) : (
                        <ActionButton onClick={() => iniciarEdicionAddon(addon)}>
                          Editar Precio
                        </ActionButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </PreciosTable>
          )
        ) : (
          <p>Haz clic en "Mostrar Add-ons" para gestionar los precios de los complementos.</p>
        )}
      </Card>
    </AdminContainer>
  );
};

export default PreciosAdmin; 