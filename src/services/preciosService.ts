// Interfaces para la gestión de precios
export interface Servicio {
  id: string;
  title: string;
  description: string;
  features?: string[];
  originalPrice: number | null;
  price: number;
  isPaquete: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface AddonServicio {
  id: string;
  name: string;
  description: string;
  price: number;
  includesSetup?: boolean;
  duration?: string;
  oneTime?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Definiciones de DTOs (Data Transfer Objects) para transferencia de datos
export interface ServicioDTO {
  id: string;
  title: string;
  description: string;
  features?: string[];
  originalPrice: number | null;
  price: number;
  isPaquete: boolean;
}

export interface AddonServicioDTO {
  id: string;
  name: string;
  description: string;
  price: number;
  includesSetup?: boolean;
  duration?: string;
  oneTime?: boolean;
}

// Definición de tipos para actualizaciones parciales
export interface ActualizarPreciosDTO {
  price?: number;
  originalPrice?: number | null; 
}

export interface ActualizarPrecioDTO {
  precio: number;
}

// Definición de tipos para respuestas de la API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

 