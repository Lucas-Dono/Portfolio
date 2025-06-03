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
        purchaseDate,
        payment_id_manual
    } = req.body;

    console.log('Solicitud de reembolso recibida en backend:', { serviceId, userId, userEmail, amount, purchaseDate, payment_id_manual });

    try {
        const purchaseDateTime = new Date(purchaseDate);
        const now = new Date();
        const daysDifference = Math.floor((now - purchaseDateTime) / (1000 * 60 * 60 * 24));

        if (daysDifference > 7) {
            console.warn('Intento de reembolso fuera de plazo:', { serviceId, userId, daysDifference });
            return res.status(400).json({
                success: false,
                message: 'No es posible solicitar un reembolso para compras realizadas hace más de 7 días.'
            });
        }

        let paymentInfo;

        if (payment_id_manual) {
            console.log(`Usando payment_id manual: ${payment_id_manual} para servicio ${serviceId}`);
            paymentInfo = { payment_id: payment_id_manual, status: 'approved' };
        } else {
            const paymentQuery = `
                SELECT payment_id, status
                FROM payments
                WHERE service_id = $1 AND (status = 'approved' OR status = 'succeeded')
                ORDER BY created_at DESC
                LIMIT 1
            `;
            const paymentResult = await pool.query(paymentQuery, [serviceId]);

            if (paymentResult.rows.length === 0) {
                console.warn('No se encontró pago aprobado para reembolso:', { serviceId, userId });
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró un pago aprobado asociado a este servicio para reembolsar.'
                });
            }
            paymentInfo = paymentResult.rows[0];
            console.log('Pago encontrado en BD para reembolso:', paymentInfo);
        }

        const existingRefundQuery = `
            SELECT id, status FROM refund_requests
            WHERE payment_id = $1 AND (status = 'pending' OR status = 'approved')
            LIMIT 1
        `;
        const existingRefundResult = await pool.query(existingRefundQuery, [paymentInfo.payment_id]);

        if (existingRefundResult.rows.length > 0) {
            const existingRefund = existingRefundResult.rows[0];
            console.warn('Ya existe una solicitud de reembolso para este pago:', { payment_id: paymentInfo.payment_id, existing_status: existingRefund.status });
            return res.status(409).json({
                success: false,
                message: `Ya existe una solicitud de reembolso con estado "${existingRefund.status}" para el pago asociado a este servicio. ID de solicitud existente: ${existingRefund.id}.`
            });
        }

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
            'pending',
            paymentInfo.payment_id,
            amount,
            adminEmail || process.env.ADMIN_EMAIL_FALLBACK,
            userEmail,
            serviceName,
            purchaseDate
        ]);

        const refundRequest = insertResult.rows[0];
        console.log('Solicitud de reembolso creada en BD:', refundRequest);

        const mailOptionsAdmin = {
            from: process.env.ADMIN_EMAIL,
            to: adminEmail || process.env.ADMIN_EMAIL_FALLBACK,
            subject: '🔔 Nueva Solicitud de Reembolso | Circuit Prompt',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
                    <h2 style="color: #333; border-bottom: 2px solid #00ADEF; padding-bottom: 10px;">Nueva Solicitud de Reembolso</h2>
                    <p>Se ha recibido una nueva solicitud de reembolso:</p>
                    <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #00ADEF;">
                        <p><strong>Servicio:</strong> ${serviceName}</p>
                        <p><strong>ID de Servicio:</strong> ${serviceId}</p>
                        <p><strong>Monto:</strong> $${amount}</p>
                        <p><strong>ID de Pago (Mercado Pago):</strong> ${paymentInfo.payment_id}</p>
                        <p><strong>Fecha de compra:</strong> ${new Date(purchaseDate).toLocaleDateString()}</p>
                        <p><strong>Cliente:</strong> ${userEmail} (ID: ${userId || 'No especificado'})</p>
                        <p><strong>Razón:</strong> ${reason}</p>
                        <p><strong>ID de Solicitud de Reembolso:</strong> ${refundRequest.id}</p>
                        <p><strong>Fecha de Solicitud:</strong> ${new Date(refundRequest.created_at).toLocaleDateString()}</p>
                    </div>
                    <div style="margin-top: 20px; text-align: center;">
                        <a href="${process.env.SITE_URL || 'http://localhost:5173'}/admin/refunds?highlight=${refundRequest.id}" style="background-color: #00ADEF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Gestionar Solicitud</a>
                    </div>
                    <p style="font-size: 12px; color: #777; margin-top: 30px; text-align: center;">
                        Plataforma Circuit Prompt.
                    </p>
                </div>
            `
        };

        transporter.sendMail(mailOptionsAdmin).catch(error => {
            console.error("Error enviando email de notificación de reembolso al admin:", error);
        });

        const mailOptionsUser = {
            from: process.env.ADMIN_EMAIL,
            to: userEmail,
            subject: '✅ Tu Solicitud de Reembolso ha sido Recibida | Circuit Prompt',
            html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
                <h2 style="color: #333; border-bottom: 2px solid #00ADEF; padding-bottom: 10px;">Solicitud de Reembolso Recibida</h2>
                <p>Hola,</p>
                <p>Hemos recibido tu solicitud de reembolso para el servicio: <strong>${serviceName}</strong>.</p>
                <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #00ADEF;">
                    <p><strong>Monto del Reembolso Solicitado:</strong> $${amount}</p>
                    <p><strong>ID de Pago Original (Mercado Pago):</strong> ${paymentInfo.payment_id}</p>
                    <p><strong>ID de Tu Solicitud de Reembolso:</strong> ${refundRequest.id}</p>
                    <p><strong>Fecha de Solicitud:</strong> ${new Date(refundRequest.created_at).toLocaleDateString()}</p>
                </div>
                <p style="margin-top: 20px;">Un administrador revisará tu solicitud lo antes posible (generalmente dentro de las 24-48 horas hábiles). Te notificaremos por este medio una vez que hayamos tomado una decisión.</p>
                <p>Gracias por tu paciencia.</p>
                <p style="font-size: 12px; color: #777; margin-top: 30px; text-align: center;">
                    Atentamente,<br>El equipo de Circuit Prompt<br>
                    Si tienes alguna pregunta, por favor, contacta a nuestro soporte.
                </p>
            </div>
            `
        };
        transporter.sendMail(mailOptionsUser).catch(error => {
            console.error("Error enviando email de confirmación de reembolso al usuario:", error);
        });

        return res.status(201).json({
            success: true,
            message: 'Solicitud de reembolso enviada y recibida correctamente. Te notificaremos la resolución.',
            refundRequestId: refundRequest.id,
            payment_id: paymentInfo.payment_id
        });

    } catch (error) {
        console.error('Error catastrófico al solicitar reembolso:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al procesar la solicitud de reembolso. Por favor, contacta a soporte si el problema persiste.',
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

// [ADMIN] Aprobar una solicitud de reembolso
export const approveRefund = async (req, res) => {
    const { refundRequestId } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user?.id; // Asumiendo que el ID del admin está en req.user.id

    if (!adminId) {
        console.warn('[ADMIN] Intento de aprobar reembolso sin ID de administrador en la sesión.');
        return res.status(401).json({ success: false, message: 'No autorizado: Se requiere sesión de administrador.' });
    }

    console.log(`[ADMIN ID: ${adminId}] Solicitud para aprobar reembolso ID: ${refundRequestId}`);

    try {
        const refundQuery = 'SELECT * FROM refund_requests WHERE id = $1';
        const refundResult = await pool.query(refundQuery, [refundRequestId]);

        if (refundResult.rows.length === 0) {
            console.warn(`[ADMIN ID: ${adminId}] Solicitud de reembolso ID: ${refundRequestId} no encontrada para aprobar.`);
            return res.status(404).json({ success: false, message: 'Solicitud de reembolso no encontrada.' });
        }

        const refundInfo = refundResult.rows[0];
        console.log('[ADMIN ID: ${adminId}] Información de la solicitud a aprobar:', refundInfo);

        if (refundInfo.status === 'approved') {
            console.warn(`[ADMIN ID: ${adminId}] Reembolso ID: ${refundRequestId} ya está aprobado.`);
            return res.status(400).json({ success: false, message: 'Esta solicitud de reembolso ya ha sido aprobada previamente.' });
        }
        if (refundInfo.status === 'rejected') {
            console.warn(`[ADMIN ID: ${adminId}] Reembolso ID: ${refundRequestId} fue rechazado previamente. No se puede aprobar directamente.`);
            return res.status(400).json({ success: false, message: 'Esta solicitud fue rechazada. Para aprobar, crea una nueva solicitud o procesa manualmente.' });
        }
        if (refundInfo.status !== 'pending') {
            console.warn(`[ADMIN ID: ${adminId}] Reembolso ID: ${refundRequestId} no está en estado pendiente. Estado actual: ${refundInfo.status}`);
            return res.status(400).json({ success: false, message: `La solicitud no está en estado pendiente (actual: ${refundInfo.status}).` });
        }

        let mercadoPagoResponse;
        try {
            mercadoPagoResponse = await payment.refunds.create({ payment_id: String(refundInfo.payment_id) });

            console.log('[ADMIN ID: ${adminId}] Respuesta de Mercado Pago al crear reembolso:', {
                status: mercadoPagoResponse?.status,
                id: mercadoPagoResponse?.id,
                payment_id: mercadoPagoResponse?.payment_id,
            });

            if (!mercadoPagoResponse || !mercadoPagoResponse.id) {
                console.error('[ADMIN ID: ${adminId}] Respuesta inválida o ID de reembolso faltante de Mercado Pago:', mercadoPagoResponse);
                throw new Error('Respuesta inválida o ID de reembolso faltante de Mercado Pago.');
            }

        } catch (mpError) {
            console.error('[ADMIN ID: ${adminId}] Error al procesar reembolso con Mercado Pago:', {
                message: mpError.message,
                cause: mpError.cause,
                stack: mpError.stack,
                payment_id: refundInfo.payment_id
            });
            let errorMessage = 'Error al procesar el reembolso con Mercado Pago.';
            if (mpError.cause) {
                try {
                    const causeError = typeof mpError.cause === 'string' ? JSON.parse(mpError.cause) : mpError.cause;
                    if (causeError.message) errorMessage += ` Detalles: ${causeError.message}`;
                    if (causeError.error) errorMessage += ` (${causeError.error})`;
                    if (causeError.status) errorMessage += ` Status MP: ${causeError.status}`;
                } catch (parseError) { /* no hacer nada si no se puede parsear */ }
            }

            const updateFailQuery = `
                UPDATE refund_requests 
                SET status = $1, admin_notes = $2, updated_at = NOW(), processed_by_admin_id = $3
                WHERE id = $4
            `;
            await pool.query(updateFailQuery, [
                'failed_mp',
                `Error Mercado Pago: ${mpError.message.substring(0, 200)}. ${adminNotes || ''}`.trim(),
                adminId, // Guardar el ID del admin que intentó procesar
                refundRequestId
            ]);
            console.log(`[ADMIN ID: ${adminId}] Solicitud de reembolso ID: ${refundRequestId} marcada como 'failed_mp'.`);

            return res.status(500).json({
                success: false,
                message: errorMessage,
                mp_error_details: mpError.cause
            });
        }

        const mercadoPagoRefundId = mercadoPagoResponse.id;
        console.log(`[ADMIN ID: ${adminId}] Reembolso procesado en Mercado Pago. ID de Reembolso MP: ${mercadoPagoRefundId}`);

        const updateQuery = `
            UPDATE refund_requests 
            SET status = $1, mercado_pago_refund_id = $2, admin_notes = $3, approved_at = NOW(), updated_at = NOW(), processed_by_admin_id = $4
            WHERE id = $5
            RETURNING *
        `;
        const updateResult = await pool.query(updateQuery, ['approved', mercadoPagoRefundId, adminNotes, adminId, refundRequestId]);

        if (updateResult.rows.length === 0) {
            console.error(`[ADMIN ID: ${adminId}] No se pudo actualizar la solicitud de reembolso ID: ${refundRequestId} después de la aprobación de MP.`);
            return res.status(500).json({ success: false, message: 'Reembolso procesado en MP, pero falló la actualización local. Por favor, revisa.' });
        }

        const approvedRefundDetails = updateResult.rows[0];
        console.log(`[ADMIN ID: ${adminId}] Solicitud de reembolso ID: ${refundRequestId} actualizada a 'approved' en BD.`);

        const userMailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: refundInfo.user_email,
            subject: '🎉 ¡Tu Solicitud de Reembolso ha sido APROBADA! | Circuit Prompt',
            html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
                <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">¡Reembolso Aprobado!</h2>
                <p>Hola,</p>
                <p>Nos complace informarte que tu solicitud de reembolso para el servicio <strong>${refundInfo.service_name}</strong> (ID de Solicitud: ${refundInfo.id}) ha sido <strong>APROBADA</strong>.</p>
                <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4CAF50;">
                    <p><strong>Monto Reembolsado:</strong> $${refundInfo.amount}</p>
                    <p><strong>ID de Pago Original (Mercado Pago):</strong> ${refundInfo.payment_id}</p>
                    <p><strong>ID de Reembolso (Mercado Pago):</strong> ${mercadoPagoRefundId}</p>
                </div>
                <p style="margin-top: 20px;">El monto debería reflejarse en tu cuenta o tarjeta (dependiendo de tu método de pago original) en los próximos días hábiles. Los tiempos exactos pueden variar según tu banco o emisor de tarjeta.</p>
                <p>Si tienes alguna pregunta sobre este reembolso, por favor, contacta a nuestro soporte.</p>
                <p style="font-size: 12px; color: #777; margin-top: 30px; text-align: center;">
                    Gracias por tu comprensión,<br>El equipo de Circuit Prompt
                </p>
            </div>
            `
        };
        transporter.sendMail(userMailOptions).catch(error => {
            console.error(`[ADMIN ID: ${adminId}] Error enviando email de aprobación de reembolso al usuario ${refundInfo.user_email}:`, error);
        });

        return res.status(200).json({
            success: true,
            message: 'Reembolso aprobado y procesado exitosamente.',
            refund_details: approvedRefundDetails
        });

    } catch (error) {
        console.error(`[ADMIN ID: ${adminId || 'N/A'}] Error catastrófico al aprobar reembolso ID: ${refundRequestId}:`, error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al aprobar el reembolso.',
            error: error.message
        });
    }
};

// [ADMIN] Rechazar una solicitud de reembolso
export const rejectRefund = async (req, res) => {
    const { refundRequestId } = req.params;
    const { adminNotes, rejectionReason } = req.body;
    const adminId = req.user?.id; // Asumiendo que el ID del admin está en req.user.id

    if (!adminId) {
        console.warn('[ADMIN] Intento de rechazar reembolso sin ID de administrador en la sesión.');
        return res.status(401).json({ success: false, message: 'No autorizado: Se requiere sesión de administrador.' });
    }

    if (!rejectionReason || rejectionReason.trim() === "") {
        return res.status(400).json({ success: false, message: "Es necesario proveer una razón de rechazo para el usuario." });
    }
    if (!adminNotes || adminNotes.trim() === "") {
        return res.status(400).json({ success: false, message: "Es necesario proveer notas administrativas para el rechazo." });
    }

    console.log(`[ADMIN ID: ${adminId}] Solicitud para rechazar reembolso ID: ${refundRequestId}`);

    try {
        const refundQuery = 'SELECT * FROM refund_requests WHERE id = $1';
        const refundResult = await pool.query(refundQuery, [refundRequestId]);

        if (refundResult.rows.length === 0) {
            console.warn(`[ADMIN ID: ${adminId}] Solicitud de reembolso ID: ${refundRequestId} no encontrada para rechazar.`);
            return res.status(404).json({ success: false, message: 'Solicitud de reembolso no encontrada.' });
        }

        const refundInfo = refundResult.rows[0];
        console.log('[ADMIN ID: ${adminId}] Información de la solicitud a rechazar:', refundInfo);

        if (refundInfo.status === 'rejected') {
            console.warn(`[ADMIN ID: ${adminId}] Reembolso ID: ${refundRequestId} ya está rechazado.`);
            return res.status(400).json({ success: false, message: 'Esta solicitud de reembolso ya ha sido rechazada previamente.' });
        }
        if (refundInfo.status === 'approved') {
            console.warn(`[ADMIN ID: ${adminId}] Reembolso ID: ${refundRequestId} ya fue aprobado. No se puede rechazar.`);
            return res.status(400).json({ success: false, message: 'Esta solicitud ya fue aprobada y procesada. No se puede rechazar ahora.' });
        }
        if (refundInfo.status !== 'pending') {
            console.warn(`[ADMIN ID: ${adminId}] Reembolso ID: ${refundRequestId} no está en estado pendiente. Estado actual: ${refundInfo.status}`);
            return res.status(400).json({ success: false, message: `La solicitud no está en estado pendiente (actual: ${refundInfo.status}).` });
        }

        const updateQuery = `
            UPDATE refund_requests 
            SET status = $1, admin_notes = $2, rejection_reason_user = $3, rejected_at = NOW(), updated_at = NOW(), processed_by_admin_id = $4
            WHERE id = $5
            RETURNING *
        `;
        const updateResult = await pool.query(updateQuery, ['rejected', adminNotes, rejectionReason, adminId, refundRequestId]);

        if (updateResult.rows.length === 0) {
            console.error(`[ADMIN ID: ${adminId}] No se pudo actualizar la solicitud de reembolso ID: ${refundRequestId} a rechazada.`);
            return res.status(500).json({ success: false, message: 'Error al actualizar el estado de la solicitud de reembolso.' });
        }

        const rejectedRefundDetails = updateResult.rows[0];
        console.log(`[ADMIN ID: ${adminId}] Solicitud de reembolso ID: ${refundRequestId} actualizada a 'rejected' en BD.`);

        const userMailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: refundInfo.user_email,
            subject: '⚠️ Actualización sobre tu Solicitud de Reembolso | Circuit Prompt',
            html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
                <h2 style="color: #333; border-bottom: 2px solid #FF6347; padding-bottom: 10px;">Solicitud de Reembolso No Aprobada</h2>
                <p>Hola,</p>
                <p>Te escribimos para informarte sobre tu solicitud de reembolso para el servicio <strong>${refundInfo.service_name}</strong> (ID de Solicitud: ${refundInfo.id}).</p>
                <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #FF6347;">
                    <p>Después de una cuidadosa revisión, tu solicitud de reembolso <strong>NO ha sido aprobada</strong>.</p>
                    <p><strong>Razón:</strong> ${rejectionReason}</p>
                    <p><strong>Monto Solicitado:</strong> $${refundInfo.amount}</p>
                    <p><strong>ID de Pago Original (Mercado Pago):</strong> ${refundInfo.payment_id}</p>
                </div>
                <p style="margin-top: 20px;">Entendemos que esta puede no ser la noticia que esperabas. Si tienes preguntas sobre esta decisión o deseas proporcionar información adicional, por favor, contacta a nuestro equipo de soporte respondiendo a este correo o visitando nuestra sección de ayuda.</p>
                <p style="font-size: 12px; color: #777; margin-top: 30px; text-align: center;">
                    Atentamente,<br>El equipo de Circuit Prompt
                </p>
            </div>
            `
        };
        transporter.sendMail(userMailOptions).catch(error => {
            console.error(`[ADMIN ID: ${adminId}] Error enviando email de rechazo de reembolso al usuario ${refundInfo.user_email}:`, error);
        });

        return res.status(200).json({
            success: true,
            message: 'Solicitud de reembolso rechazada y usuario notificado.',
            refund_details: rejectedRefundDetails
        });

    } catch (error) {
        console.error(`[ADMIN ID: ${adminId || 'N/A'}] Error catastrófico al rechazar reembolso ID: ${refundRequestId}:`, error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al rechazar el reembolso.',
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