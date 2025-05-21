-- Tabla para almacenar solicitudes de reembolso
CREATE TABLE IF NOT EXISTS refund_requests (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    service_id VARCHAR(255) NOT NULL,
    payment_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    admin_id VARCHAR(255) NULL,
    admin_notes TEXT NULL,
    mercadopago_refund_id VARCHAR(255) NULL,
    user_email VARCHAR(255) NOT NULL,
    admin_email VARCHAR(255) NOT NULL DEFAULT 'lucasdono391@gmail.com',
    service_name VARCHAR(255) NOT NULL,
    purchase_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    CONSTRAINT fk_refund_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para mejorar el rendimiento de consultas
CREATE INDEX idx_refund_user_id ON refund_requests(user_id);
CREATE INDEX idx_refund_status ON refund_requests(status);
CREATE INDEX idx_refund_created_at ON refund_requests(created_at);

-- Comentarios para documentar la tabla
COMMENT ON TABLE refund_requests IS 'Almacena solicitudes de reembolso de usuarios y su estado de procesamiento';
COMMENT ON COLUMN refund_requests.id IS 'Identificador único de la solicitud de reembolso';
COMMENT ON COLUMN refund_requests.user_id IS 'ID del usuario que solicita el reembolso';
COMMENT ON COLUMN refund_requests.service_id IS 'ID del servicio para el cual se solicita reembolso';
COMMENT ON COLUMN refund_requests.payment_id IS 'ID de pago en Mercado Pago para procesar el reembolso';
COMMENT ON COLUMN refund_requests.amount IS 'Monto a reembolsar';
COMMENT ON COLUMN refund_requests.reason IS 'Razón proporcionada por el usuario para solicitar el reembolso';
COMMENT ON COLUMN refund_requests.status IS 'Estado de la solicitud: pending, approved, rejected, error';
COMMENT ON COLUMN refund_requests.admin_id IS 'ID del administrador que procesó la solicitud';
COMMENT ON COLUMN refund_requests.admin_notes IS 'Notas del administrador sobre la decisión tomada';
COMMENT ON COLUMN refund_requests.mercadopago_refund_id IS 'ID de reembolso en Mercado Pago cuando es aprobado';
COMMENT ON COLUMN refund_requests.user_email IS 'Email del usuario para notificaciones';
COMMENT ON COLUMN refund_requests.admin_email IS 'Email del administrador para notificaciones';
COMMENT ON COLUMN refund_requests.service_name IS 'Nombre del servicio para visualización';
COMMENT ON COLUMN refund_requests.purchase_date IS 'Fecha original de compra del servicio';
COMMENT ON COLUMN refund_requests.created_at IS 'Fecha y hora de creación de la solicitud';
COMMENT ON COLUMN refund_requests.processed_at IS 'Fecha y hora cuando la solicitud fue procesada'; 