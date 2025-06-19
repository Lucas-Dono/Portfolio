import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PromocionesAdmin from './PromocionesAdmin';
import PreciosAdmin from './PreciosAdmin';
import AdminRefunds from './AdminRefunds';
import AdminRatings from './AdminRatings';
import StockAdmin from './StockAdmin';
import MetricsDashboard from './MetricsDashboard';
import NotificationCenter from './NotificationCenter';

// Interfaces para los datos
interface Project {
  id: string;
  userId: string;
  userName: string;
  email: string;
  serviceName: string;
  serviceType: string;
  progress: number;
  status: 'activo' | 'en desarrollo' | 'pendiente';
  createdAt: string;
  updatedAt: string;
  previewImages: PreviewImage[];
  tempLink?: string;
  tempLinkExpiry?: string;
}

interface PreviewImage {
  id: number;
  url: string;
  title: string;
  description: string;
  device: 'desktop' | 'mobile';
}

// URL base de la API
const API_URL = import.meta.env.VITE_API_URL || 'https://circuitprompt.com.ar/api';

// Estilos
const AdminContainer = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
  color: white;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 1rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  background: linear-gradient(90deg, #00d2ff, #3a7bd5);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
`;

const ProjectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
`;

const ProjectCard = styled.div`
  background-color: rgba(30, 30, 30, 0.6);
  border-radius: 12px;
  padding: 1.5rem;
  border-left: 3px solid #00FFFF;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
`;

const ProjectHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const ProjectTitle = styled.h2`
  font-size: 1.4rem;
  margin: 0;
  color: #f5f5f5;
`;

const ProjectStatus = styled.span<{ status: string }>`
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${props =>
    props.status === 'activo' ? 'rgba(72, 187, 120, 0.2)' :
      props.status === 'pendiente' ? 'rgba(246, 173, 85, 0.2)' :
        'rgba(99, 179, 237, 0.2)'
  };
  color: ${props =>
    props.status === 'activo' ? '#48BB78' :
      props.status === 'pendiente' ? '#F6AD55' :
        '#63B3ED'
  };
  display: flex;
  align-items: center;
  gap: 0.3rem;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  
  span {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }
  
  strong {
    color: #ffffff;
  }
`;

const ProgressBar = styled.div`
  height: 10px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  margin: 0.75rem 0;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  width: ${props => props.progress}%;
  background: linear-gradient(to right, #00d2ff, #3a7bd5);
  border-radius: 5px;
  transition: width 0.5s ease;
`;

const ProjectActions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  background-color: rgba(30, 30, 30, 0.8);
  color: #00FFFF;
  border: 1px solid rgba(0, 210, 255, 0.3);
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background-color: rgba(0, 210, 255, 0.1);
    transform: translateY(-2px);
  }
`;

const ActionIcon = styled.span`
  font-size: 1.1rem;
`;

const PreviewSection = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
`;

const PreviewTitle = styled.h3`
  font-size: 1rem;
  margin-bottom: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
`;

const PreviewItem = styled.div`
  display: flex;
  background-color: rgba(20, 20, 20, 0.7);
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  align-items: center;
  gap: 1rem;
`;

const PreviewThumb = styled.div<{ imageUrl: string }>`
  width: 60px;
  height: 40px;
  background-image: url(${props => props.imageUrl});
  background-size: cover;
  background-position: center;
  border-radius: 4px;
`;

const PreviewInfo = styled.div`
  flex: 1;
  
  span {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
  }
`;

const PreviewActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const SmallButton = styled.button`
  background-color: transparent;
  color: rgba(255, 255, 255, 0.7);
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
  
  &:hover {
    color: #00FFFF;
  }
`;

const Modal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  backdrop-filter: blur(5px);
`;

const ModalContent = styled(motion.div)`
  background-color: #1E1E1E;
  border-radius: 12px;
  padding: 2rem;
  max-width: 550px;
  width: 100%;
  position: relative;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #F5F5F5;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: color 0.2s ease;
  
  &:hover {
    color: white;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background-color: rgba(30, 30, 30, 0.7);
  color: white;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #00FFFF;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background-color: rgba(30, 30, 30, 0.7);
  color: white;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #00FFFF;
  }
`;

const UploadArea = styled.div`
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #00FFFF;
    background-color: rgba(0, 210, 255, 0.05);
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 2rem;
  gap: 1rem;
`;

const CancelButton = styled(Button)`
  background-color: transparent;
  border-color: rgba(255, 0, 0, 0.3);
  color: rgba(255, 0, 0, 0.8);
  
  &:hover {
    background-color: rgba(255, 0, 0, 0.1);
  }
`;

const SubmitButton = styled(Button)`
  background-color: rgba(0, 210, 255, 0.1);
  border-color: rgba(0, 210, 255, 0.5);
  color: #00FFFF;
  
  &:hover {
    background-color: rgba(0, 210, 255, 0.2);
  }
`;

// Componentes para las pestañas
const TabsContainer = styled.div`
  display: flex;
  gap: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
`;

const Tab = styled.button<{ active: boolean }>`
  background: ${props => props.active ? 'rgba(0, 210, 255, 0.1)' : 'transparent'};
  color: ${props => props.active ? '#00FFFF' : 'rgba(255, 255, 255, 0.7)'};
  border: none;
  border-bottom: 2px solid ${props => props.active ? '#00FFFF' : 'transparent'};
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${props => props.active ? '#00FFFF' : 'white'};
    background-color: rgba(0, 210, 255, 0.05);
  }
`;

// Componente principal
const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'proyectos' | 'promociones' | 'precios' | 'reembolsos' | 'valoraciones' | 'stock' | 'metricas' | 'notificaciones'>('proyectos');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [showUpdateProgressModal, setShowUpdateProgressModal] = useState(false);
  const [showCreateLinkModal, setShowCreateLinkModal] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const navigate = useNavigate();

  // Estados para formularios
  const [newImage, setNewImage] = useState<File | null>(null);
  const [imageTitle, setImageTitle] = useState('');
  const [imageDescription, setImageDescription] = useState('');
  const [imageDevice, setImageDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [tempLink, setTempLink] = useState('');
  const [tempLinkDays, setTempLinkDays] = useState(7);

  // Obtener el token de autenticación
  const getAuthToken = () => {
    const token = localStorage.getItem('auth_token');
    console.log('Token recuperado del localStorage:', token ? `${token.substring(0, 15)}...` : 'no disponible');

    // Validar que el token tenga el formato correcto para JWT
    if (token && token.split('.').length !== 3 && !token.startsWith('eyJ')) {
      console.warn('El token no parece tener formato JWT válido');
    }

    return token;
  };

  // Configuración de headers para las peticiones
  const getAuthHeaders = () => {
    const token = getAuthToken();
    if (!token) {
      console.warn('No hay token de autenticación disponible');
    }

    const headers = {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };

    console.log('Headers de autenticación preparados:', headers);
    return { headers };
  };

  // Efecto para verificar autenticación y cargar datos
  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem('auth_token');
    const isAdmin = localStorage.getItem('user_role') === 'admin';

    if (!token || !isAdmin) {
      console.error('No autorizado: Se requiere autenticación como administrador');
      setError('No tienes permisos de administrador. Redirigiendo...');

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/admin/login');
      }, 2000);

      setLoading(false);
      return;
    }

    // Cargar proyectos
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener proyectos desde la API
        console.log('Solicitando proyectos a:', `${API_URL}/admin/projects`);
        console.log('Headers de autenticación:', getAuthHeaders());

        const response = await axios.get<Project[]>(`${API_URL}/admin/projects`, getAuthHeaders());

        // Verificar si la respuesta es exitosa y contiene datos
        if (response.status === 200 && response.data) {
          console.log('Proyectos recibidos:', response.data);
          setProjects(response.data as Project[]);
        } else {
          throw new Error('No se pudieron cargar los proyectos');
        }

        setLoading(false);
      } catch (error: any) {
        console.error('Error al cargar los proyectos:', error);

        // Si es error de autorización, redirigir al login
        if (error.response && error.response.status === 403) {
          setError('No tienes permisos de administrador. Redirigiendo...');

          // Redirigir al login después de 2 segundos
          setTimeout(() => {
            navigate('/admin/login');
          }, 2000);
        } else {
          setError('Error al cargar los proyectos. Por favor, inténtalo de nuevo.');
        }

        setLoading(false);
      }
    };

    fetchProjects();
  }, [navigate]);

  // Función para abrir el modal de añadir imagen
  const handleOpenAddImageModal = (project: Project) => {
    setCurrentProject(project);
    setImageTitle('');
    setImageDescription('');
    setImageDevice('desktop');
    setNewImage(null);
    setShowAddImageModal(true);
  };

  // Función para abrir el modal de actualizar progreso
  const handleOpenUpdateProgressModal = (project: Project) => {
    setCurrentProject(project);
    setProgressPercentage(project.progress);
    setShowUpdateProgressModal(true);
  };

  // Función para abrir el modal de crear enlace temporal
  const handleOpenCreateLinkModal = (project: Project) => {
    setCurrentProject(project);
    setTempLink(project.tempLink || `${API_URL}/preview/${project.id}`);
    setTempLinkDays(7);
    setShowCreateLinkModal(true);
  };

  // Función para manejar el cambio de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewImage(e.target.files[0]);
    }
  };

  // Función para subir una nueva imagen
  const handleUploadImage = async () => {
    if (!currentProject || !newImage) return;

    try {
      // Crear FormData para enviar la imagen
      const formData = new FormData();
      formData.append('image', newImage);
      formData.append('title', imageTitle);
      formData.append('description', imageDescription);
      formData.append('device', imageDevice);
      formData.append('projectId', currentProject.id);

      // Enviar la imagen a la API
      const response = await axios.post<PreviewImage>(
        `${API_URL}/admin/projects/${currentProject.id}/images`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Si la respuesta es exitosa, actualizar el estado
      if (response.status === 201 && response.data) {
        // Actualizar el estado con la nueva imagen
        const updatedProjects = projects.map(p => {
          if (p.id === currentProject.id) {
            return {
              ...p,
              previewImages: [...p.previewImages, response.data]
            };
          }
          return p;
        });

        setProjects(updatedProjects);
        setShowAddImageModal(false);
      }
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      alert('Error al subir la imagen. Por favor, inténtalo de nuevo.');
    }
  };

  // Función para actualizar el progreso
  const handleUpdateProgress = async () => {
    if (!currentProject) return;

    try {
      // Enviar la actualización del progreso a la API
      const response = await axios.put(
        `${API_URL}/admin/projects/${currentProject.id}/progress`,
        { progress: progressPercentage },
        getAuthHeaders()
      );

      // Si la respuesta es exitosa, actualizar el estado
      if (response.status === 200 && response.data) {
        // Actualizar el estado con el nuevo progreso
        const updatedProjects = projects.map(p => {
          if (p.id === currentProject.id) {
            return {
              ...p,
              progress: progressPercentage,
              updatedAt: new Date().toISOString().split('T')[0]
            };
          }
          return p;
        });

        setProjects(updatedProjects);
        setShowUpdateProgressModal(false);
      }
    } catch (error) {
      console.error('Error al actualizar el progreso:', error);
      alert('Error al actualizar el progreso. Por favor, inténtalo de nuevo.');
    }
  };

  // Función para crear enlace temporal
  const handleCreateTempLink = async () => {
    if (!currentProject) return;

    try {
      // Enviar la creación del enlace temporal a la API
      const response = await axios.post<{
        tempLink: string;
        tempLinkExpiry: string;
        updatedAt: string;
      }>(
        `${API_URL}/admin/projects/${currentProject.id}/temp-link`,
        {
          link: tempLink,
          expiryDays: tempLinkDays
        },
        getAuthHeaders()
      );

      // Si la respuesta es exitosa, actualizar el estado
      if (response.status === 201 && response.data) {
        // Actualizar el estado con el nuevo enlace temporal
        const updatedProjects = projects.map(p => {
          if (p.id === currentProject.id) {
            return {
              ...p,
              tempLink: response.data.tempLink,
              tempLinkExpiry: response.data.tempLinkExpiry,
              updatedAt: response.data.updatedAt || new Date().toISOString().split('T')[0]
            };
          }
          return p;
        });

        setProjects(updatedProjects);
        setShowCreateLinkModal(false);
      }
    } catch (error) {
      console.error('Error al crear el enlace temporal:', error);
      alert('Error al crear el enlace temporal. Por favor, inténtalo de nuevo.');
    }
  };

  // Función para eliminar una imagen
  const handleDeleteImage = async (projectId: string, imageId: number) => {
    try {
      // Eliminar la imagen en la API
      const response = await axios.delete(
        `${API_URL}/admin/projects/${projectId}/images/${imageId}`,
        getAuthHeaders()
      );

      // Si la respuesta es exitosa, actualizar el estado
      if (response.status === 200) {
        // Actualizar el estado eliminando la imagen
        const updatedProjects = projects.map(p => {
          if (p.id === projectId) {
            return {
              ...p,
              previewImages: p.previewImages.filter(img => img.id !== imageId)
            };
          }
          return p;
        });

        setProjects(updatedProjects);
      }
    } catch (error) {
      console.error('Error al eliminar la imagen:', error);
      alert('Error al eliminar la imagen. Por favor, inténtalo de nuevo.');
    }
  };

  // Renderizar cada pestaña según la activa
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'promociones':
        return <PromocionesAdmin />;
      case 'precios':
        return <PreciosAdmin />;
      case 'reembolsos':
        return <AdminRefunds />;
      case 'valoraciones':
        return <AdminRatings />;
      case 'stock':
        return <StockAdmin />;
      case 'metricas':
        return <MetricsDashboard />;
      case 'notificaciones':
        return <NotificationCenter />;
      default:
        return (
          <>
            {/* Proyectos */}
            <h2 style={{ marginBottom: '1rem' }}>Proyectos activos</h2>

            {loading ? (
              <div>Cargando...</div>
            ) : error ? (
              <div style={{ color: 'red' }}>{error}</div>
            ) : projects.length === 0 ? (
              <div>No hay proyectos activos. Los nuevos proyectos aparecerán aquí.</div>
            ) : (
              <ProjectsGrid>
                {projects.map(project => (
                  <ProjectCard key={project.id}>
                    <ProjectHeader>
                      <ProjectTitle>{project.serviceName}</ProjectTitle>
                      <ProjectStatus status={project.status}>
                        {project.status === 'activo' ? 'Activo' :
                          project.status === 'pendiente' ? 'Pendiente' :
                            'En desarrollo'}
                      </ProjectStatus>
                    </ProjectHeader>

                    <UserInfo>
                      <span>Cliente: <strong>{project.userName}</strong></span>
                      <span>Email: <strong>{project.email}</strong></span>
                      <span>Creado: <strong>{project.createdAt}</strong></span>
                      <span>Última actualización: <strong>{project.updatedAt}</strong></span>
                    </UserInfo>

                    <div>
                      <span>Progreso: <strong>{project.progress}%</strong></span>
                      <ProgressBar>
                        <ProgressFill progress={project.progress} />
                      </ProgressBar>
                    </div>

                    {project.tempLink && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <span>Enlace temporal: </span>
                        <a
                          href={project.tempLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#00FFFF', textDecoration: 'none' }}
                        >
                          {project.tempLink}
                        </a>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                          Caduca: {project.tempLinkExpiry}
                        </div>
                      </div>
                    )}

                    <PreviewSection>
                      <PreviewTitle>Vistas previas ({project.previewImages.length})</PreviewTitle>
                      {project.previewImages.map(image => (
                        <PreviewItem key={image.id}>
                          <PreviewThumb imageUrl={image.url} />
                          <PreviewInfo>
                            <div>{image.title}</div>
                            <span>{image.device === 'desktop' ? 'Desktop' : 'Móvil'}</span>
                          </PreviewInfo>
                          <PreviewActions>
                            <SmallButton onClick={() => handleDeleteImage(project.id, image.id)}>
                              ❌
                            </SmallButton>
                          </PreviewActions>
                        </PreviewItem>
                      ))}
                    </PreviewSection>

                    <ProjectActions>
                      <Button onClick={() => handleOpenAddImageModal(project)}>
                        <ActionIcon>📸</ActionIcon> Añadir imagen
                      </Button>
                      <Button onClick={() => handleOpenUpdateProgressModal(project)}>
                        <ActionIcon>📊</ActionIcon> Actualizar progreso
                      </Button>
                      <Button onClick={() => handleOpenCreateLinkModal(project)}>
                        <ActionIcon>🔗</ActionIcon> Crear enlace
                      </Button>
                    </ProjectActions>
                  </ProjectCard>
                ))}
              </ProjectsGrid>
            )}
          </>
        );
    }
  };

  return (
    <AdminContainer>
      <Header>
        <Title>Panel de Administración</Title>
      </Header>

      <div style={{ marginBottom: '2rem' }}>
        <TabsContainer>
          <Tab
            active={activeTab === 'proyectos'}
            onClick={() => setActiveTab('proyectos')}
          >
            Proyectos
          </Tab>
          <Tab
            active={activeTab === 'promociones'}
            onClick={() => setActiveTab('promociones')}
          >
            Promociones
          </Tab>
          <Tab
            active={activeTab === 'precios'}
            onClick={() => setActiveTab('precios')}
          >
            Precios
          </Tab>
          <Tab
            active={activeTab === 'reembolsos'}
            onClick={() => setActiveTab('reembolsos')}
          >
            Reembolsos
          </Tab>
          <Tab
            active={activeTab === 'valoraciones'}
            onClick={() => setActiveTab('valoraciones')}
          >
            Valoraciones
          </Tab>
          <Tab
            active={activeTab === 'stock'}
            onClick={() => setActiveTab('stock')}
          >
            Gestión de Stock
          </Tab>
          <Tab
            active={activeTab === 'metricas'}
            onClick={() => setActiveTab('metricas')}
          >
            📊 Métricas
          </Tab>
          <Tab
            active={activeTab === 'notificaciones'}
            onClick={() => setActiveTab('notificaciones')}
          >
            🔔 Notificaciones
          </Tab>
        </TabsContainer>
      </div>

      {renderActiveTab()}

      {/* Modal para añadir imagen */}
      {showAddImageModal && (
        <Modal
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ModalContent
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            <ModalTitle>Añadir imagen de vista previa</ModalTitle>
            <CloseButton onClick={() => setShowAddImageModal(false)}>✕</CloseButton>

            <FormGroup>
              <Label>Tipo de dispositivo</Label>
              <Select
                value={imageDevice}
                onChange={(e) => setImageDevice(e.target.value as 'desktop' | 'mobile')}
              >
                <option value="desktop">Desktop</option>
                <option value="mobile">Móvil</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Título</Label>
              <Input
                type="text"
                value={imageTitle}
                onChange={(e) => setImageTitle(e.target.value)}
                placeholder="Ej: Página de inicio"
              />
            </FormGroup>

            <FormGroup>
              <Label>Descripción</Label>
              <Input
                type="text"
                value={imageDescription}
                onChange={(e) => setImageDescription(e.target.value)}
                placeholder="Ej: Vista principal de la página"
              />
            </FormGroup>

            <FormGroup>
              <Label>Imagen</Label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="upload-image"
              />
              <UploadArea
                onClick={() => document.getElementById('upload-image')?.click()}
              >
                {newImage ? newImage.name : 'Haz clic para seleccionar una imagen'}
              </UploadArea>
            </FormGroup>

            <ModalActions>
              <CancelButton onClick={() => setShowAddImageModal(false)}>
                Cancelar
              </CancelButton>
              <SubmitButton onClick={handleUploadImage} disabled={!newImage || !imageTitle}>
                Subir imagen
              </SubmitButton>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}

      {/* Modal para actualizar progreso */}
      {showUpdateProgressModal && (
        <Modal
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ModalContent
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            <ModalTitle>Actualizar progreso del proyecto</ModalTitle>
            <CloseButton onClick={() => setShowUpdateProgressModal(false)}>✕</CloseButton>

            <FormGroup>
              <Label>Porcentaje de progreso ({progressPercentage}%)</Label>
              <Input
                type="range"
                min="0"
                max="100"
                value={progressPercentage}
                onChange={(e) => setProgressPercentage(parseInt(e.target.value))}
              />
            </FormGroup>

            <ProgressBar>
              <ProgressFill progress={progressPercentage} />
            </ProgressBar>

            <ModalActions>
              <CancelButton onClick={() => setShowUpdateProgressModal(false)}>
                Cancelar
              </CancelButton>
              <SubmitButton onClick={handleUpdateProgress}>
                Actualizar progreso
              </SubmitButton>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}

      {/* Modal para crear enlace temporal */}
      {showCreateLinkModal && (
        <Modal
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ModalContent
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            <ModalTitle>Crear enlace temporal de vista previa</ModalTitle>
            <CloseButton onClick={() => setShowCreateLinkModal(false)}>✕</CloseButton>

            <FormGroup>
              <Label>URL</Label>
              <Input
                type="text"
                value={tempLink}
                onChange={(e) => setTempLink(e.target.value)}
                placeholder="https://preview.ejemplo.com/proyecto"
              />
            </FormGroup>

            <FormGroup>
              <Label>Días de validez ({tempLinkDays} días)</Label>
              <Input
                type="range"
                min="1"
                max="30"
                value={tempLinkDays}
                onChange={(e) => setTempLinkDays(parseInt(e.target.value))}
              />
            </FormGroup>

            <ModalActions>
              <CancelButton onClick={() => setShowCreateLinkModal(false)}>
                Cancelar
              </CancelButton>
              <SubmitButton onClick={handleCreateTempLink} disabled={!tempLink}>
                Crear enlace
              </SubmitButton>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}
    </AdminContainer>
  );
};

export default AdminPanel; 