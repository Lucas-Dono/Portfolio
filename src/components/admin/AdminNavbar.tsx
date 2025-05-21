import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

// Definición de estilos usando styled-components
const NavbarContainer = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #1a1a2e;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #ffffff;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 1.5rem;
`;

const NavLink = styled(Link)`
  color: #e2e2e2;
  text-decoration: none;
  font-size: 1rem;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.3s ease;

  &:hover {
    color: #61dafb;
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const LogoutButton = styled.button`
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #c0392b;
  }
`;

interface AdminNavbarProps {
    title?: string;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({ title = "Panel de Administración" }) => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('auth_token'));

    const handleLogout = () => {
        // Limpiar almacenamiento local
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user_role');

        // Actualizar estado
        setIsLoggedIn(false);

        // Redirigir a la página de inicio
        navigate('/admin/login');
    };

    return (
        <NavbarContainer>
            <Logo>{title}</Logo>

            <NavLinks>
                <NavLink to="/admin">Dashboard</NavLink>
                <NavLink to="/admin/promociones">Promociones</NavLink>
                <NavLink to="/admin/precios">Precios</NavLink>
                <NavLink to="/admin/usuarios">Usuarios</NavLink>
                <NavLink to="/admin/configuracion">Configuración</NavLink>
                <NavLink to="/">Ver Sitio</NavLink>
                {isLoggedIn && (
                    <LogoutButton onClick={handleLogout}>Cerrar Sesión</LogoutButton>
                )}
            </NavLinks>
        </NavbarContainer>
    );
};

export default AdminNavbar; 