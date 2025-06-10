import { pool } from '../config/pgPool.js';

// Modelo para los servicios de usuario
export class UserService {
    // Obtener todos los servicios de un usuario
    static async getByUserId(userId) {
        try {
            const result = await pool.query(
                'SELECT * FROM user_services WHERE user_id = $1 ORDER BY created_at DESC',
                [userId]
            );
            return result.rows;
        } catch (error) {
            console.error('Error al obtener servicios del usuario:', error);
            throw error;
        }
    }

    // Crear un nuevo servicio
    static async create(serviceData) {
        try {
            const {
                userId,
                serviceType,
                paymentId,
                paymentStatus,
                amount,
                details,
                fullName,
                contactName,
                email,
                phone,
                company,
                status,
                progress
            } = serviceData;

            const result = await pool.query(
                `INSERT INTO user_services (
                  user_id, service_type, payment_id, payment_status, amount,
                  details, full_name, contact_name, email, phone, company,
                  status, progress, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
                RETURNING *`,
                [
                    userId,
                    serviceType,
                    paymentId,
                    paymentStatus,
                    amount,
                    details,
                    fullName,
                    contactName,
                    email,
                    phone,
                    company,
                    status,
                    progress
                ]
            );

            return result.rows[0];
        } catch (error) {
            console.error('Error al crear servicio:', error);
            throw error;
        }
    }

    // Actualizar el progreso de un servicio
    static async updateProgress(serviceId, progress, stage, nextTask) {
        try {
            const result = await pool.query(
                `UPDATE user_services 
                SET progress = $1, stage = $2, next_task = $3, updated_at = NOW()
                WHERE id = $4
                RETURNING *`,
                [progress, stage, nextTask, serviceId]
            );

            return result.rows[0];
        } catch (error) {
            console.error('Error al actualizar progreso:', error);
            throw error;
        }
    }

    // Actualizar los detalles de un servicio
    static async updateDetails(serviceId, details) {
        try {
            const result = await pool.query(
                `UPDATE user_services 
                SET details = $1, updated_at = NOW()
                WHERE id = $2
                RETURNING *`,
                [details, serviceId]
            );

            return result.rows[0];
        } catch (error) {
            console.error('Error al actualizar detalles:', error);
            throw error;
        }
    }

    // Obtener un servicio por su ID
    static async getById(serviceId) {
        try {
            const result = await pool.query(
                'SELECT * FROM user_services WHERE id = $1',
                [serviceId]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error al obtener servicio por ID:', error);
            throw error;
        }
    }
} 