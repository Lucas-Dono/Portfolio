export interface Promocion {
  id: string;
  servicioId: string;  // ID del servicio al que aplica
  tipo: 'GRATIS' | 'DESCUENTO';
  valorDescuento?: number;  // En caso de ser descuento (porcentaje)
  cantidadLimite: number;  // Cuántos usuarios pueden usar esta promoción
  cantidadUsada: number;  // Cuántos ya la usaron
  activa: boolean;  // Si la promoción está activa
  fechaCreacion: Date;
  fechaExpiracion?: Date;  // Opcional, para promociones con tiempo límite
}

export interface ReservaPromocion {
  id: string;
  promocionId: string;
  fechaExpiracion: Date;
}

// Estado de promociones para gestionar en componentes React
export interface PromocionesState {
  [servicioId: string]: Promocion | null;
} 