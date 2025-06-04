import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Promocion } from '../../types/promo';
import * as promocionesAPI from '../../api/promocionesAPI';

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

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 0.8rem 1.5rem;
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  border: none;
  border-bottom: 2px solid ${props => props.active ? '#00FFFF' : 'transparent'};
  color: ${props => props.active ? '#00FFFF' : 'rgba(255, 255, 255, 0.7)'};
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    color: white;
  }
`;

const Card = styled.div`
  background: rgba(17, 17, 17, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const PromocionesTable = styled.table`
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

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
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

const Select = styled.select`
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

const Switch = styled.div`
  display: flex;
  align-items: center;
  
  input {
    height: 0;
    width: 0;
    visibility: hidden;
    position: absolute;
  }
  
  label {
    cursor: pointer;
    width: 50px;
    height: 25px;
    background: rgba(255, 255, 255, 0.2);
    display: block;
    border-radius: 25px;
    position: relative;
    margin-right: 10px;
  }
  
  label:after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 19px;
    height: 19px;
    background: white;
    border-radius: 19px;
    transition: 0.3s;
  }
  
  input:checked + label {
    background: #00FFFF;
  }
  
  input:checked + label:after {
    left: calc(100% - 3px);
    transform: translateX(-100%);
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

const Badge = styled.span<{ tipo: string }>`
  display: inline-block;
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => props.tipo === 'GRATIS'
    ? 'rgba(0, 255, 0, 0.1)'
    : 'rgba(255, 255, 0, 0.1)'
  };
  color: ${props => props.tipo === 'GRATIS' ? '#00ff00' : '#ffff00'};
`;

const StatusBadge = styled.span<{ activa: boolean }>`
  display: inline-block;
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => props.activa
    ? 'rgba(0, 255, 0, 0.1)'
    : 'rgba(255, 0, 0, 0.1)'
  };
  color: ${props => props.activa ? '#00ff00' : '#ff5555'};
`;

const ErrorMessage = styled.div`
  color: #ff5555;
  margin-top: 0.5rem;
  font-size: 0.9rem;
`;

const SuccessMessage = styled.div`
  color: #00ff00;
  margin-top: 0.5rem;
  font-size: 0.9rem;
`;

// Datos simulados de servicios
const servicios = [
  { id: 'basic', title: 'Plan Básico' },
  { id: 'standard', title: 'Plan Estándar' },
  { id: 'premium', title: 'Plan Premium' },
  { id: 'enterprise', title: 'Plan Empresarial' },
  { id: 'entrepreneur', title: 'Paquete Emprendedor' },
  { id: 'professional', title: 'Paquete Profesional' }
];

// Interfaces para los formularios
interface PromocionForm {
  servicioId: string;
  tipo: 'GRATIS' | 'DESCUENTO';
  valorDescuento?: number;
  cantidadLimite: number;
  fechaExpiracion?: string;
  activa: boolean;
}

const PromocionesAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'listado' | 'crear' | 'editar'>('listado');
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingPromocion, setEditingPromocion] = useState<Promocion | null>(null);
  const [formData, setFormData] = useState<PromocionForm>({
    servicioId: '',
    tipo: 'GRATIS',
    valorDescuento: 0,
    cantidadLimite: 3,
    activa: true
  });

  // Cargar promociones desde la API
  useEffect(() => {
    cargarPromociones();
  }, []);

  const cargarPromociones = async () => {
    try {
      setCargando(true);
      setError(null);
      const promocionesData = await promocionesAPI.obtenerPromociones();
      setPromociones(promocionesData);
    } catch (error) {
      console.error('Error al cargar promociones:', error);
      setError('Error al cargar las promociones');
    } finally {
      setCargando(false);
    }
  };

  const limpiarMensajes = () => {
    setError(null);
    setSuccess(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    limpiarMensajes();

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSwitchChange = (name: string) => {
    limpiarMensajes();
    setFormData(prev => ({ ...prev, [name]: !prev[name as keyof PromocionForm] }));
  };

  const resetForm = () => {
    setFormData({
      servicioId: '',
      tipo: 'GRATIS',
      valorDescuento: 0,
      cantidadLimite: 3,
      activa: true
    });
    setEditingPromocion(null);
    limpiarMensajes();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      limpiarMensajes();
      setCargando(true);

      if (editingPromocion) {
        // Actualizar promoción existente
        await promocionesAPI.actualizarPromocion(editingPromocion.id, {
          servicioId: formData.servicioId,
          tipo: formData.tipo,
          valorDescuento: formData.tipo === 'DESCUENTO' ? formData.valorDescuento : undefined,
          cantidadLimite: formData.cantidadLimite,
          activa: formData.activa,
          fechaExpiracion: formData.fechaExpiracion ? new Date(formData.fechaExpiracion) : undefined
        });
        setSuccess('Promoción actualizada exitosamente');
      } else {
        // Crear nueva promoción
        await promocionesAPI.crearPromocion({
          servicioId: formData.servicioId,
          tipo: formData.tipo,
          valorDescuento: formData.tipo === 'DESCUENTO' ? formData.valorDescuento : undefined,
          cantidadLimite: formData.cantidadLimite,
          activa: formData.activa,
          fechaExpiracion: formData.fechaExpiracion ? new Date(formData.fechaExpiracion) : undefined
        });
        setSuccess('Promoción creada exitosamente');
      }

      // Recargar promociones
      await cargarPromociones();

      // Reiniciar el formulario y cambiar a la pestaña de listado
      resetForm();
      setActiveTab('listado');

    } catch (error) {
      console.error('Error al guardar promoción:', error);
      setError(editingPromocion ? 'Error al actualizar la promoción' : 'Error al crear la promoción');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (window.confirm('¿Estás seguro que deseas eliminar esta promoción?')) {
      try {
        limpiarMensajes();
        setCargando(true);
        await promocionesAPI.eliminarPromocion(id);
        setSuccess('Promoción eliminada exitosamente');
        await cargarPromociones();
      } catch (error) {
        console.error('Error al eliminar promoción:', error);
        setError('Error al eliminar la promoción');
      } finally {
        setCargando(false);
      }
    }
  };

  const handleEditar = (promocion: Promocion) => {
    setEditingPromocion(promocion);
    setFormData({
      servicioId: promocion.servicioId,
      tipo: promocion.tipo,
      valorDescuento: promocion.valorDescuento || 0,
      cantidadLimite: promocion.cantidadLimite,
      fechaExpiracion: promocion.fechaExpiracion ? promocion.fechaExpiracion.toISOString().split('T')[0] : '',
      activa: promocion.activa
    });
    setActiveTab('editar');
    limpiarMensajes();
  };

  const handleCancelar = () => {
    resetForm();
    setActiveTab('listado');
  };

  const obtenerNombreServicio = (servicioId: string) => {
    return servicios.find(s => s.id === servicioId)?.title || servicioId;
  };

  return (
    <AdminContainer>
      <Title>Gestión de Promociones</Title>

      <TabsContainer>
        <Tab
          active={activeTab === 'listado'}
          onClick={() => setActiveTab('listado')}
        >
          Listado de Promociones
        </Tab>
        <Tab
          active={activeTab === 'crear'}
          onClick={() => {
            resetForm();
            setActiveTab('crear');
          }}
        >
          Crear Nueva Promoción
        </Tab>
        {activeTab === 'editar' && (
          <Tab active={true}>
            Editar Promoción
          </Tab>
        )}
      </TabsContainer>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      {activeTab === 'listado' ? (
        <Card>
          <h2 style={{ marginBottom: '1.5rem' }}>Promociones Activas e Inactivas</h2>

          {cargando ? (
            <p>Cargando promociones...</p>
          ) : promociones.length === 0 ? (
            <p>No hay promociones configuradas</p>
          ) : (
            <PromocionesTable>
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Tipo</th>
                  <th>Disponibles</th>
                  <th>Estado</th>
                  <th>Fecha Creación</th>
                  <th>Fecha Expiración</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {promociones.map(promo => (
                  <tr key={promo.id}>
                    <td>{obtenerNombreServicio(promo.servicioId)}</td>
                    <td>
                      <Badge tipo={promo.tipo}>
                        {promo.tipo === 'GRATIS' ? 'GRATIS' : `${promo.valorDescuento}% DCTO`}
                      </Badge>
                    </td>
                    <td>
                      {promo.cantidadLimite - promo.cantidadUsada} de {promo.cantidadLimite}
                    </td>
                    <td>
                      <StatusBadge activa={promo.activa}>
                        {promo.activa ? 'ACTIVA' : 'INACTIVA'}
                      </StatusBadge>
                    </td>
                    <td>{promo.fechaCreacion.toLocaleDateString()}</td>
                    <td>
                      {promo.fechaExpiracion
                        ? promo.fechaExpiracion.toLocaleDateString()
                        : 'Sin vencimiento'}
                    </td>
                    <td>
                      <ActionButton onClick={() => handleEditar(promo)}>
                        Editar
                      </ActionButton>
                      <ActionButton onClick={() => handleEliminar(promo.id)}>
                        Eliminar
                      </ActionButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </PromocionesTable>
          )}
        </Card>
      ) : (
        <Card>
          <h2 style={{ marginBottom: '1.5rem' }}>
            {editingPromocion ? 'Editar Promoción' : 'Crear Nueva Promoción'}
          </h2>

          <form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="servicioId">Servicio</Label>
              <Select
                id="servicioId"
                name="servicioId"
                value={formData.servicioId}
                onChange={handleFormChange}
                required
              >
                <option value="">Selecciona un servicio</option>
                {servicios.map(servicio => (
                  <option key={servicio.id} value={servicio.id}>
                    {servicio.title}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="tipo">Tipo de Promoción</Label>
              <Select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleFormChange}
                required
              >
                <option value="GRATIS">Producto Gratuito</option>
                <option value="DESCUENTO">Descuento Porcentual</option>
              </Select>
            </FormGroup>

            {formData.tipo === 'DESCUENTO' && (
              <FormGroup>
                <Label htmlFor="valorDescuento">Valor del Descuento (%)</Label>
                <Input
                  id="valorDescuento"
                  name="valorDescuento"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.valorDescuento}
                  onChange={handleFormChange}
                  required={formData.tipo === 'DESCUENTO'}
                />
              </FormGroup>
            )}

            <FormGroup>
              <Label htmlFor="cantidadLimite">Cantidad Límite</Label>
              <Input
                id="cantidadLimite"
                name="cantidadLimite"
                type="number"
                min="1"
                value={formData.cantidadLimite}
                onChange={handleFormChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="fechaExpiracion">Fecha de Expiración (opcional)</Label>
              <Input
                id="fechaExpiracion"
                name="fechaExpiracion"
                type="date"
                value={formData.fechaExpiracion}
                onChange={handleFormChange}
              />
            </FormGroup>

            <FormGroup>
              <Switch>
                <input
                  id="activa"
                  name="activa"
                  type="checkbox"
                  checked={formData.activa}
                  onChange={() => handleSwitchChange('activa')}
                />
                <label htmlFor="activa"></label>
                <span>Promoción Activa</span>
              </Switch>
            </FormGroup>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <Button type="button" onClick={handleCancelar}>
                Cancelar
              </Button>
              <Button type="submit" primary disabled={cargando}>
                {cargando ? 'Guardando...' : (editingPromocion ? 'Actualizar Promoción' : 'Crear Promoción')}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </AdminContainer>
  );
};

export default PromocionesAdmin; 