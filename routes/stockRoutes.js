import express from 'express';
import { StockConfig, StockStatus, StockHistory, WaitingQueue, StockManager } from '../models/StockManagement.js';
import { authenticateToken as auth } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

// Middleware para verificar permisos de administrador
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Se requieren permisos de administrador'
        });
    }
    next();
};

// ==================== RUTAS PÚBLICAS ====================

// Verificar disponibilidad de un plan
router.get('/availability/:planType', async (req, res) => {
    try {
        const { planType } = req.params;

        if (!['basico', 'estandar', 'premium', 'empresarial'].includes(planType)) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de plan inválido'
            });
        }

        const availability = await StockManager.checkAvailability(planType);

        res.json({
            success: true,
            planType,
            ...availability
        });

    } catch (error) {
        console.error('Error al verificar disponibilidad:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener estado general del stock (información pública limitada)
router.get('/status', async (req, res) => {
    try {
        const status = await StockStatus.findOne();
        const configs = await StockConfig.find({ isActive: true }).select('planType weight estimatedDeliveryDays');

        if (!status) {
            return res.status(404).json({
                success: false,
                message: 'Estado de stock no inicializado'
            });
        }

        const utilizationRate = (status.currentLoad / status.maxCapacity) * 100;

        res.json({
            success: true,
            isAcceptingOrders: status.isAcceptingOrders,
            utilizationRate: Math.round(utilizationRate),
            availablePlans: configs,
            lastUpdated: status.lastUpdated
        });

    } catch (error) {
        console.error('Error al obtener estado del stock:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ==================== RUTAS AUTENTICADAS ====================

// Agregar usuario a cola de espera
router.post('/waiting-queue', auth, async (req, res) => {
    try {
        const { planType } = req.body;
        const { id: userId, email: userEmail, name: userName } = req.user;

        if (!['basico', 'estandar', 'premium', 'empresarial'].includes(planType)) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de plan inválido'
            });
        }

        const result = await StockManager.addToWaitingQueue(userId, userEmail, userName, planType);

        res.json(result);

    } catch (error) {
        console.error('Error al agregar a cola de espera:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor'
        });
    }
});

// Obtener posición del usuario en cola
router.get('/waiting-queue/position/:planType', auth, async (req, res) => {
    try {
        const { planType } = req.params;
        const { id: userId } = req.user;

        const position = await StockManager.getQueuePosition(userId, planType);
        const queueEntry = await WaitingQueue.findOne({
            userId,
            planType,
            status: 'waiting'
        });

        res.json({
            success: true,
            position,
            estimatedAvailableDate: queueEntry?.estimatedAvailableDate,
            inQueue: !!queueEntry
        });

    } catch (error) {
        console.error('Error al obtener posición en cola:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Reservar stock para un pedido (usado internamente por el sistema de pagos)
router.post('/reserve', auth, async (req, res) => {
    try {
        const { planType, orderId } = req.body;
        const { id: userId } = req.user;

        if (!planType || !orderId) {
            return res.status(400).json({
                success: false,
                message: 'planType y orderId son requeridos'
            });
        }

        const result = await StockManager.reserveStock(planType, orderId, userId);

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('Error al reservar stock:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor'
        });
    }
});

// ==================== RUTAS DE ADMINISTRADOR ====================

// Obtener métricas completas del stock
router.get('/admin/metrics', auth, requireAdmin, async (req, res) => {
    try {
        const metrics = await StockManager.getStockMetrics();

        res.json({
            success: true,
            ...metrics
        });

    } catch (error) {
        console.error('Error al obtener métricas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Actualizar configuración de un plan
router.put('/admin/config/:planType', auth, requireAdmin, async (req, res) => {
    try {
        const { planType } = req.params;
        const { weight, estimatedDeliveryDays, isActive } = req.body;

        const [config] = await StockConfig.findOrCreate({
            where: { planType },
            defaults: {
                planType,
                weight,
                estimatedDeliveryDays,
                isActive
            }
        });

        // Actualizar si ya existe
        if (config) {
            await config.update({
                weight,
                estimatedDeliveryDays,
                isActive
            });
        }

        // Registrar cambio en historial
        await StockHistory.create({
            action: 'manual_adjustment',
            planType,
            weightChange: 0,
            previousLoad: 0,
            newLoad: 0,
            adminId: req.user.id,
            reason: `Configuración actualizada: peso=${weight}, días=${estimatedDeliveryDays}, activo=${isActive}`
        });

        res.json({
            success: true,
            config
        });

    } catch (error) {
        console.error('Error al actualizar configuración:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Actualizar estado del stock
router.put('/admin/status', auth, requireAdmin, async (req, res) => {
    try {
        const {
            currentLoad,
            maxCapacity,
            warningThreshold,
            criticalThreshold,
            isAcceptingOrders,
            notes
        } = req.body;

        const previousStatus = await StockStatus.findOne();
        const previousLoad = previousStatus ? previousStatus.currentLoad : 0;

        let status;
        if (previousStatus) {
            await previousStatus.update({
                currentLoad,
                maxCapacity,
                warningThreshold,
                criticalThreshold,
                isAcceptingOrders,
                notes,
                lastUpdated: new Date()
            });
            status = previousStatus;
        } else {
            status = await StockStatus.create({
                currentLoad,
                maxCapacity,
                warningThreshold,
                criticalThreshold,
                isAcceptingOrders,
                notes,
                lastUpdated: new Date()
            });
        }

        // Registrar cambio en historial si cambió la carga
        if (currentLoad !== previousLoad) {
            await StockHistory.create({
                action: 'manual_adjustment',
                weightChange: currentLoad - previousLoad,
                previousLoad,
                newLoad: currentLoad,
                adminId: req.user.id,
                reason: 'Ajuste manual del stock'
            });
        }

        // Si se cambió la capacidad, registrarlo
        if (maxCapacity !== previousStatus?.maxCapacity) {
            await StockHistory.create({
                action: 'capacity_changed',
                weightChange: 0,
                previousLoad: currentLoad,
                newLoad: currentLoad,
                adminId: req.user.id,
                reason: `Capacidad cambiada de ${previousStatus?.maxCapacity || 0} a ${maxCapacity}`
            });
        }

        // Procesar cola de espera si se liberó espacio
        if (currentLoad < previousLoad) {
            await StockManager.processWaitingQueue();
        }

        res.json({
            success: true,
            status
        });

    } catch (error) {
        console.error('Error al actualizar estado:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Liberar stock manualmente
router.post('/admin/release', auth, requireAdmin, async (req, res) => {
    try {
        const { planType, orderId, reason } = req.body;

        if (!planType) {
            return res.status(400).json({
                success: false,
                message: 'planType es requerido'
            });
        }

        const result = await StockManager.releaseStock(
            planType,
            orderId || `manual-${Date.now()}`,
            req.user.id,
            reason || 'Liberación manual'
        );

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('Error al liberar stock:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor'
        });
    }
});

// Obtener historial de stock
router.get('/admin/history', auth, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 50, action, planType, startDate, endDate } = req.query;

        const where = {};

        if (action) where.action = action;
        if (planType) where.planType = planType;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = new Date(startDate);
            if (endDate) where.createdAt[Op.lte] = new Date(endDate);
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { rows: history, count: total } = await StockHistory.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            offset,
            limit: parseInt(limit)
        });

        res.json({
            success: true,
            history,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalRecords: total,
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener cola de espera
router.get('/admin/waiting-queue', auth, requireAdmin, async (req, res) => {
    try {
        const { status = 'waiting', planType } = req.query;

        const where = { status };
        if (planType) where.planType = planType;

        const queue = await WaitingQueue.findAll({
            where,
            order: [['requestedAt', 'ASC']]
        });

        res.json({
            success: true,
            queue,
            totalWaiting: queue.length
        });

    } catch (error) {
        console.error('Error al obtener cola de espera:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Notificar manualmente a usuarios en cola
router.post('/admin/notify-queue', auth, requireAdmin, async (req, res) => {
    try {
        const { queueIds } = req.body;

        if (!Array.isArray(queueIds)) {
            return res.status(400).json({
                success: false,
                message: 'queueIds debe ser un array'
            });
        }

        const notified = [];

        for (const queueId of queueIds) {
            const queueEntry = await WaitingQueue.findByPk(queueId);
            if (queueEntry && queueEntry.status === 'waiting') {
                await StockManager.notifyUserStockAvailable(queueEntry);
                queueEntry.status = 'notified';
                queueEntry.notificationSent = true;
                await queueEntry.save();
                notified.push(queueEntry);
            }
        }

        res.json({
            success: true,
            notifiedCount: notified.length,
            notified
        });

    } catch (error) {
        console.error('Error al notificar cola:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Limpiar entradas expiradas de la cola
router.delete('/admin/cleanup-queue', auth, requireAdmin, async (req, res) => {
    try {
        const result = await WaitingQueue.destroy({
            where: {
                [Op.or]: [
                    { expiresAt: { [Op.lt]: new Date() } },
                    { status: { [Op.in]: ['expired', 'converted'] } }
                ]
            }
        });

        res.json({
            success: true,
            deletedCount: result
        });

    } catch (error) {
        console.error('Error al limpiar cola:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Inicializar configuración por defecto
router.post('/admin/initialize', auth, requireAdmin, async (req, res) => {
    try {
        await StockManager.initializeDefaultConfig();

        res.json({
            success: true,
            message: 'Configuración inicializada correctamente'
        });

    } catch (error) {
        console.error('Error al inicializar:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

export default router; 