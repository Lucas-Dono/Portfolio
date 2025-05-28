import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import pkg from 'pg';

dotenv.config();

// Obtener cliente de PostgreSQL
const { Pool } = pkg;

// Obtener parámetros de conexión desde .env
const DB_NAME = process.env.DB_NAME || 'portfolio';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_SSL = process.env.DB_SSL === 'true';

// Opciones SSL seguras para producción
const sslOptions = DB_SSL ? {
    require: true,
    rejectUnauthorized: false // Para conexiones seguras a Heroku u otros proveedores
} : false;

// Crear la conexión pool
const pool = new Pool({
    user: DB_USER,
    host: DB_HOST,
    database: DB_NAME,
    password: DB_PASSWORD,
    port: DB_PORT,
    ssl: sslOptions,
});

// Configuración de Mercado Pago
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});
const payment = new Payment(client);

// Configuración del transporte de email
const transporter = nodemailer.createTransport({
    host: 'c2830653.ferozo.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.EMAIL_PASS
    }
});

// Crear una solicitud de reembolso
export const requestRefund = async (req, res) => {
    const {
        serviceId,
        reason,
        userId,
        userEmail,
        adminEmail,
        serviceName,
        amount,
        purchaseDate
    } = req.body;

    try {
        // Verificar si el servicio existe y fue comprado hace menos de 7 días
        const purchaseDateTime = new Date(purchaseDate);
        const now = new Date();
        const daysDifference = Math.floor((now - purchaseDateTime) / (1000 * 60 * 60 * 24));

        if (daysDifference > 7) {
            return res.status(400).json({
                success: false,
                message: 'No es posible solicitar un reembolso para compras realizadas hace más de 7 días'
            });
        }

        // Consultar en la base de datos si existe un pago para este servicio
        const paymentQuery = `
            SELECT payment_id, preference_id, status 
            FROM payments 
            WHERE service_id = $1 
            ORDER BY created_at DESC 
            LIMIT 1
        `;
        const paymentResult = await pool.query(paymentQuery, [serviceId]);

        if (paymentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró un pago asociado a este servicio'
            });
        }

        const paymentInfo = paymentResult.rows[0];

        // Insertar la solicitud de reembolso en la base de datos
        const insertQuery = `
            INSERT INTO refund_requests (
                user_id, service_id, reason, status, 
                payment_id, amount, admin_email, user_email,
                service_name, purchase_date
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, created_at
        `;

        const insertResult = await pool.query(insertQuery, [
            userId,
            serviceId,
            reason,
            'pending', // Estado inicial
            paymentInfo.payment_id,
            amount,
            adminEmail,
            userEmail,
            serviceName,
            purchaseDate
        ]);

        const refundRequest = insertResult.rows[0];

        // Enviar email al administrador
        const mailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: process.env.Email || adminEmail, // Usar Email personal si está disponible
            subject: '🔔 Nueva solicitud de reembolso',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
                    <h2 style="color: #333; border-bottom: 2px solid #00ADEF; padding-bottom: 10px;">Nueva Solicitud de Reembolso</h2>
                    
                    <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #00ADEF;">
                        <p><strong>Servicio:</strong> ${serviceName}</p>
                        <p><strong>ID de Servicio:</strong> ${serviceId}</p>
                        <p><strong>Monto:</strong> $${amount}</p>
                        <p><strong>Fecha de compra:</strong> ${new Date(purchaseDate).toLocaleDateString()}</p>
                        <p><strong>Cliente:</strong> ${userEmail}</p>
                        <p><strong>Razón:</strong> ${reason}</p>
                        <p><strong>ID de Solicitud:</strong> ${refundRequest.id}</p>
                        <p><strong>Fecha de Solicitud:</strong> ${new Date(refundRequest.created_at).toLocaleDateString()}</p>
                    </div>
                    
                    <div style="margin-top: 20px; text-align: center;">
                        <a href="${process.env.SITE_URL}/admin/refunds" style="background-color: #00ADEF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Gestionar Solicitud</a>
                    </div>
                    
                    <p style="font-size: 12px; color: #777; margin-top: 30px; text-align: center;">
                        Este correo es automático. Por favor, no responda a este mensaje.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        // Confirmar al usuario
        const userMailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: userEmail,
            subject: '✅ Tu solicitud de reembolso ha sido recibida',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
                    <h2 style="color: #333; border-bottom: 2px solid #00ADEF; padding-bottom: 10px;">Solicitud de Reembolso Recibida</h2>
                    
                    <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #00ADEF;">
                        <p>Hemos recibido tu solicitud de reembolso para el servicio: <strong>${serviceName}</strong>.</p>
                        <p>Monto: <strong>$${amount}</strong></p>
                        <p>ID de Solicitud: <strong>${refundRequest.id}</strong></p>
                        <p>Fecha de Solicitud: <strong>${new Date(refundRequest.created_at).toLocaleDateString()}</strong></p>
                        
                        <p style="margin-top: 20px;">Un administrador revisará tu solicitud en las próximas 24-48 horas. Te notificaremos cuando hayamos tomado una decisión.</p>
                    </div>
                    
                    <p style="font-size: 12px; color: #777; margin-top: 30px; text-align: center;">
                        Si tienes alguna pregunta, no dudes en contactarnos respondiendo a este correo.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(userMailOptions);

        return res.status(201).json({
            success: true,
            message: 'Solicitud de reembolso recibida correctamente',
            refundId: refundRequest.id
        });

    } catch (error) {
        console.error('Error al solicitar reembolso:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al procesar la solicitud de reembolso',
            error: error.message
        });
    }
};

// Obtener el estado de un reembolso
export const getRefundStatus = async (req, res) => {
    const { refundId } = req.params;
    const userId = req.user.id; // Del middleware de autenticación

    try {
        const query = `
            SELECT * FROM refund_requests 
            WHERE id = $1 AND user_id = $2
        `;

        const result = await pool.query(query, [refundId, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud de reembolso no encontrada o no tienes permiso para verla'
            });
        }

        return res.status(200).json({
            success: true,
            refund: result.rows[0]
        });

    } catch (error) {
        console.error('Error al obtener estado de reembolso:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener el estado del reembolso',
            error: error.message
        });
    }
};

// [ADMIN] Obtener todas las solicitudes de reembolso
export const getRefundRequests = async (req, res) => {
    try {
        const query = `
            SELECT r.*, u.email as user_email, u.name as user_name
            FROM refund_requests r
            LEFT JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC
        `;

        const result = await pool.query(query);

        return res.status(200).json({
            success: true,
            refunds: result.rows
        });

    } catch (error) {
        console.error('Error al obtener solicitudes de reembolso:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener las solicitudes de reembolso',
            error: error.message
        });
    }
};

// [ADMIN] Aprobar un reembolso
export const approveRefund = async (req, res) => {
    const { refundId } = req.params;
    const adminId = req.user.id; // ID del administrador que aprueba

    try {
        // Obtener información de la solicitud de reembolso
        const queryRefund = `
            SELECT * FROM refund_requests 
            WHERE id = $1 AND status = 'pending'
        `;

        const refundResult = await pool.query(queryRefund, [refundId]);

        if (refundResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud de reembolso no encontrada o ya procesada'
            });
        }

        const refundInfo = refundResult.rows[0];

        // Procesar el reembolso en Mercado Pago
        let mercadoPagoResponse;
        try {
            // Procesar reembolso en Mercado Pago según su documentación
            mercadoPagoResponse = await payment.refunds.create({
                payment_id: refundInfo.payment_id
            });

            console.log('Respuesta de Mercado Pago:', mercadoPagoResponse);

            if (mercadoPagoResponse.status !== 201 && mercadoPagoResponse.status !== 200) {
                throw new Error('Error al procesar reembolso en Mercado Pago');
            }
        } catch (mpError) {
            console.error('Error al procesar reembolso en Mercado Pago:', mpError);

            // Actualizar la solicitud con error
            await pool.query(
                `UPDATE refund_requests SET status = 'error', admin_notes = $1, processed_at = NOW(), admin_id = $2 WHERE id = $3`,
                [`Error al procesar en Mercado Pago: ${mpError.message}`, adminId, refundId]
            );

            return res.status(500).json({
                success: false,
                message: 'Error al procesar el reembolso en Mercado Pago',
                error: mpError.message
            });
        }

        // Actualizar el estado de la solicitud en la base de datos
        const updateQuery = `
            UPDATE refund_requests 
            SET 
                status = 'approved',
                processed_at = NOW(),
                admin_id = $1,
                mercadopago_refund_id = $2
            WHERE id = $3
            RETURNING *
        `;

        const refundId = mercadoPagoResponse.body?.id || 'unknown';
        const updateResult = await pool.query(updateQuery, [adminId, refundId, refundId]);

        // Enviar correo al usuario
        const userMailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: refundInfo.user_email,
            subject: '✅ Tu solicitud de reembolso ha sido aprobada',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
                    <h2 style="color: #333; border-bottom: 2px solid #00ADEF; padding-bottom: 10px;">Reembolso Aprobado</h2>
                    
                    <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #00ADEF;">
                        <p>Nos complace informarte que tu solicitud de reembolso para <strong>${refundInfo.service_name}</strong> ha sido aprobada.</p>
                        <p>Monto reembolsado: <strong>$${refundInfo.amount}</strong></p>
                        <p>ID de la transacción: <strong>${refundId}</strong></p>
                        <p>El reembolso se procesará a través de Mercado Pago y podría tomar de 3 a 15 días hábiles en reflejarse en tu método de pago original, dependiendo de tu entidad bancaria.</p>
                    </div>
                    
                    <p style="font-size: 12px; color: #777; margin-top: 30px; text-align: center;">
                        Gracias por tu paciencia. Si tienes alguna pregunta, no dudes en contactarnos.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(userMailOptions);

        return res.status(200).json({
            success: true,
            message: 'Reembolso aprobado y procesado correctamente',
            refund: updateResult.rows[0]
        });

    } catch (error) {
        console.error('Error al aprobar reembolso:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al aprobar y procesar el reembolso',
            error: error.message
        });
    }
};

// [ADMIN] Rechazar un reembolso
export const rejectRefund = async (req, res) => {
    const { refundId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    try {
        // Obtener información de la solicitud
        const queryRefund = `
            SELECT * FROM refund_requests 
            WHERE id = $1 AND status = 'pending'
        `;

        const refundResult = await pool.query(queryRefund, [refundId]);

        if (refundResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud de reembolso no encontrada o ya procesada'
            });
        }

        const refundInfo = refundResult.rows[0];

        // Actualizar el estado de la solicitud
        const updateQuery = `
            UPDATE refund_requests 
            SET 
                status = 'rejected',
                admin_notes = $1,
                processed_at = NOW(),
                admin_id = $2
            WHERE id = $3
            RETURNING *
        `;

        const updateResult = await pool.query(updateQuery, [reason, adminId, refundId]);

        // Enviar correo al usuario
        const userMailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: refundInfo.user_email,
            subject: 'Respuesta a tu solicitud de reembolso',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
                    <h2 style="color: #333; border-bottom: 2px solid #FF5757; padding-bottom: 10px;">Solicitud de Reembolso No Aprobada</h2>
                    
                    <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #FF5757;">
                        <p>Lamentablemente, tu solicitud de reembolso para <strong>${refundInfo.service_name}</strong> no ha sido aprobada.</p>
                        <p><strong>Motivo:</strong> ${reason}</p>
                        <p>Si deseas discutir esta decisión o necesitas más información, por favor contáctanos respondiendo a este correo.</p>
                    </div>
                    
                    <p style="font-size: 12px; color: #777; margin-top: 30px; text-align: center;">
                        Gracias por tu comprensión.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(userMailOptions);

        return res.status(200).json({
            success: true,
            message: 'Reembolso rechazado correctamente',
            refund: updateResult.rows[0]
        });

    } catch (error) {
        console.error('Error al rechazar reembolso:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al rechazar el reembolso',
            error: error.message
        });
    }
};

// [ADMIN] Obtener estadísticas de reembolsos
export const getRefundStats = async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                COUNT(*) as total_requests,
                COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
                COUNT(*) FILTER (WHERE status = 'approved') as approved_requests,
                COUNT(*) FILTER (WHERE status = 'rejected') as rejected_requests,
                COUNT(*) FILTER (WHERE status = 'error') as error_requests,
                SUM(amount) FILTER (WHERE status = 'approved') as total_refunded_amount,
                MIN(created_at) as first_request_date,
                MAX(created_at) as last_request_date
            FROM refund_requests
        `;

        const statsResult = await pool.query(statsQuery);

        // Obtener los reembolsos más recientes (últimos 5)
        const recentQuery = `
            SELECT r.*, u.email as user_email, u.name as user_name
            FROM refund_requests r
            LEFT JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC
            LIMIT 5
        `;

        const recentResult = await pool.query(recentQuery);

        return res.status(200).json({
            success: true,
            statistics: statsResult.rows[0],
            recentRefunds: recentResult.rows
        });

    } catch (error) {
        console.error('Error al obtener estadísticas de reembolsos:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas de reembolsos',
            error: error.message
        });
    }
}; 