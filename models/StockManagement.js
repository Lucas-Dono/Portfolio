import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

// Declarar las clases
class StockConfig extends Model { }
class StockStatus extends Model { }
class StockHistory extends Model { }
class WaitingQueue extends Model { }

// Solo inicializar si sequelize está disponible
if (sequelize) {
    // Modelo para configuración de planes de stock
    StockConfig.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        planType: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        weight: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 10
        },
        estimatedDeliveryDays: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 7
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        sequelize,
        modelName: 'StockConfig',
        tableName: 'stock_configs',
        timestamps: true
    });

    // Modelo para estado actual del stock
    StockStatus.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        currentLoad: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        maxCapacity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 100
        },
        warningThreshold: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 80
        },
        criticalThreshold: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 95
        },
        isAcceptingOrders: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        lastUpdated: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'StockStatus',
        tableName: 'stock_status',
        timestamps: true
    });

    // Modelo para historial de stock
    StockHistory.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        action: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        planType: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        weightChange: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        previousLoad: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        newLoad: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        orderId: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        userId: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        adminId: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'StockHistory',
        tableName: 'stock_history',
        timestamps: true
    });

    // Modelo para cola de espera
    WaitingQueue.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        userEmail: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        userName: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        planType: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        planWeight: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        requestedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        estimatedAvailableDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        status: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'waiting'
        },
        notified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'WaitingQueue',
        tableName: 'waiting_queue',
        timestamps: true
    });
} else {
    console.log('⚠️ Sequelize no disponible, modelos de Stock funcionarán en modo limitado');
}

// Clase de gestión de stock (funciona independientemente de la base de datos)
class StockManager {
    // Verificar disponibilidad de un plan
    static async checkAvailability(planType) {
        if (!sequelize) {
            // Modo fallback - siempre disponible
            return {
                available: true,
                reason: 'Modo desarrollo - siempre disponible',
                estimatedDeliveryDays: 7
            };
        }

        try {
            const config = await StockConfig.findOne({ where: { planType, isActive: true } });
            if (!config) {
                return { available: false, reason: 'Plan no encontrado o inactivo' };
            }

            const status = await this.getCurrentStatus();
            const requiredWeight = config.weight;
            const availableCapacity = status.maxCapacity - status.currentLoad;

            if (availableCapacity >= requiredWeight) {
                return {
                    available: true,
                    estimatedDeliveryDays: config.estimatedDeliveryDays,
                    currentLoad: status.currentLoad,
                    maxCapacity: status.maxCapacity
                };
            } else {
                const estimatedDate = await this.estimateAvailabilityDate(requiredWeight);
                return {
                    available: false,
                    reason: 'Capacidad insuficiente',
                    estimatedAvailableDate: estimatedDate,
                    currentLoad: status.currentLoad,
                    maxCapacity: status.maxCapacity,
                    requiredWeight
                };
            }
        } catch (error) {
            console.error('Error al verificar disponibilidad:', error);
            return { available: false, reason: 'Error interno del servidor' };
        }
    }

    // Reservar stock para un pedido
    static async reserveStock(planType, orderId, userId) {
        if (!sequelize) {
            // Modo fallback - siempre exitoso
            return {
                success: true,
                message: 'Stock reservado (modo desarrollo)',
                estimatedDeliveryDays: 7
            };
        }

        try {
            const availability = await this.checkAvailability(planType);
            if (!availability.available) {
                // Agregar a cola de espera si no está disponible
                return { success: false, reason: availability.reason, shouldQueue: true };
            }

            const config = await StockConfig.findOne({ where: { planType } });
            const status = await this.getCurrentStatus();

            // Actualizar carga actual
            const newLoad = status.currentLoad + config.weight;
            await StockStatus.update(
                {
                    currentLoad: newLoad,
                    lastUpdated: new Date(),
                    isAcceptingOrders: newLoad < status.criticalThreshold
                },
                { where: { id: status.id } }
            );

            // Registrar en el historial
            await StockHistory.create({
                action: 'RESERVE',
                planType,
                weightChange: config.weight,
                previousLoad: status.currentLoad,
                newLoad,
                orderId,
                userId,
                reason: `Reserva de stock para pedido ${orderId}`
            });

            return {
                success: true,
                estimatedDeliveryDays: config.estimatedDeliveryDays,
                newLoad,
                maxCapacity: status.maxCapacity
            };
        } catch (error) {
            console.error('Error al reservar stock:', error);
            return { success: false, reason: 'Error interno del servidor' };
        }
    }

    // Liberar stock cuando se completa un proyecto
    static async releaseStock(planType, orderId, reason = 'Proyecto completado') {
        if (!sequelize) {
            // Modo fallback - siempre exitoso
            return {
                success: true,
                message: 'Stock liberado (modo desarrollo)'
            };
        }

        try {
            const config = await StockConfig.findOne({ where: { planType } });
            if (!config) {
                return { success: false, reason: 'Plan no encontrado' };
            }

            const status = await this.getCurrentStatus();
            const newLoad = Math.max(0, status.currentLoad - config.weight);

            // Actualizar carga actual
            await StockStatus.update(
                {
                    currentLoad: newLoad,
                    lastUpdated: new Date(),
                    isAcceptingOrders: true // Siempre aceptar órdenes cuando se libera stock
                },
                { where: { id: status.id } }
            );

            // Registrar en el historial
            await StockHistory.create({
                action: 'RELEASE',
                planType,
                weightChange: -config.weight,
                previousLoad: status.currentLoad,
                newLoad,
                orderId,
                reason
            });

            // Procesar cola de espera
            await this.processWaitingQueue();

            return {
                success: true,
                newLoad,
                maxCapacity: status.maxCapacity
            };
        } catch (error) {
            console.error('Error al liberar stock:', error);
            return { success: false, reason: 'Error interno del servidor' };
        }
    }

    // Obtener estado actual del stock
    static async getCurrentStatus() {
        if (!sequelize) {
            // Modo fallback
            return {
                currentLoad: 0,
                maxCapacity: 100,
                warningThreshold: 80,
                criticalThreshold: 95,
                isAcceptingOrders: true,
                utilizationRate: 0
            };
        }

        try {
            let status = await StockStatus.findOne();
            if (!status) {
                // Crear estado inicial si no existe
                status = await StockStatus.create({
                    currentLoad: 0,
                    maxCapacity: 100,
                    warningThreshold: 80,
                    criticalThreshold: 95,
                    isAcceptingOrders: true
                });
            }

            const utilizationRate = (status.currentLoad / status.maxCapacity) * 100;
            return { ...status.toJSON(), utilizationRate: Math.round(utilizationRate) };
        } catch (error) {
            console.error('Error al obtener estado:', error);
            throw error;
        }
    }

    // Agregar usuario a cola de espera
    static async addToWaitingQueue(userId, userEmail, userName, planType) {
        if (!sequelize) {
            // Modo fallback - no hacer nada
            return {
                success: true,
                message: 'Cola de espera no disponible en modo desarrollo'
            };
        }

        try {
            const config = await StockConfig.findOne({ where: { planType } });
            if (!config) {
                return { success: false, reason: 'Plan no encontrado' };
            }

            const estimatedDate = await this.estimateAvailabilityDate(config.weight);
            const expiresAt = new Date(estimatedDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 días después

            const queueEntry = await WaitingQueue.create({
                userId,
                userEmail,
                userName,
                planType,
                planWeight: config.weight,
                estimatedAvailableDate: estimatedDate,
                expiresAt
            });

            return { success: true, queueEntry, estimatedDate };
        } catch (error) {
            console.error('Error al agregar a cola de espera:', error);
            return { success: false, reason: 'Error interno del servidor' };
        }
    }

    // Procesar cola de espera cuando se libera stock
    static async processWaitingQueue() {
        if (!sequelize) return;

        try {
            const status = await this.getCurrentStatus();
            const availableCapacity = status.maxCapacity - status.currentLoad;

            // Obtener usuarios en cola ordenados por fecha de solicitud
            const queueEntries = await WaitingQueue.findAll({
                where: { status: 'waiting' },
                order: [['requestedAt', 'ASC']]
            });

            for (const entry of queueEntries) {
                if (availableCapacity >= entry.planWeight) {
                    // Notificar al usuario que hay disponibilidad
                    await this.notifyUserAvailability(entry);

                    // Marcar como notificado
                    await WaitingQueue.update(
                        {
                            status: 'notified',
                            notified: true
                        },
                        { where: { id: entry.id } }
                    );
                }
            }
        } catch (error) {
            console.error('Error al procesar cola de espera:', error);
        }
    }

    // Notificar a usuario sobre disponibilidad
    static async notifyUserAvailability(queueEntry) {
        if (!sequelize) return;

        try {
            // Aquí implementarías el envío de email
            console.log(`Notificando a ${queueEntry.userEmail} sobre disponibilidad de ${queueEntry.planType}`);

            // Registrar en el historial
            await StockHistory.create({
                action: 'NOTIFY_QUEUE',
                planType: queueEntry.planType,
                weightChange: 0,
                previousLoad: (await this.getCurrentStatus()).currentLoad,
                newLoad: (await this.getCurrentStatus()).currentLoad,
                userId: queueEntry.userId,
                reason: `Notificación de disponibilidad para ${queueEntry.planType}`
            });
        } catch (error) {
            console.error('Error al notificar usuario:', error);
        }
    }

    // Estimar fecha de disponibilidad
    static async estimateAvailabilityDate(requiredWeight) {
        if (!sequelize) {
            const estimatedDate = new Date();
            estimatedDate.setDate(estimatedDate.getDate() + 7);
            return estimatedDate;
        }

        try {
            const status = await this.getCurrentStatus();
            const availableCapacity = status.maxCapacity - status.currentLoad;

            if (availableCapacity >= requiredWeight) {
                return new Date(); // Disponible ahora
            }

            // Calcular basado en proyectos en progreso y tiempo promedio
            const avgCompletionTime = await this.getAverageCompletionTime();
            const estimatedDays = Math.ceil((requiredWeight - availableCapacity) / 10) * avgCompletionTime;

            const estimatedDate = new Date();
            estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);

            return estimatedDate;
        } catch (error) {
            console.error('Error al estimar fecha:', error);
            const fallbackDate = new Date();
            fallbackDate.setDate(fallbackDate.getDate() + 14); // 2 semanas por defecto
            return fallbackDate;
        }
    }

    // Obtener tiempo promedio de completación
    static async getAverageCompletionTime() {
        if (!sequelize) return 7;

        try {
            const completedProjects = await StockHistory.findAll({
                where: { action: 'RELEASE' },
                limit: 10,
                order: [['createdAt', 'DESC']]
            });

            if (completedProjects.length === 0) {
                return 7; // 7 días por defecto
            }

            // Calcular promedio basado en datos históricos
            return 7; // Simplificado por ahora
        } catch (error) {
            console.error('Error al calcular tiempo promedio:', error);
            return 7;
        }
    }

    // Obtener métricas del sistema (alias para compatibilidad)
    static async getStockMetrics() {
        return await this.getMetrics();
    }

    // Obtener métricas del sistema
    static async getMetrics() {
        if (!sequelize) {
            return {
                utilizationRate: 0,
                ordersInProgress: 0,
                queueLength: 0,
                ordersLast30Days: 0,
                completedLast30Days: 0,
                averageCompletionTime: 7
            };
        }

        try {
            const status = await this.getCurrentStatus();
            const utilizationRate = (status.currentLoad / status.maxCapacity) * 100;

            // Contar proyectos en progreso
            const ordersInProgress = await StockHistory.count({
                where: { action: 'RESERVE' },
                distinct: true,
                col: 'orderId'
            }) - await StockHistory.count({
                where: { action: 'RELEASE' },
                distinct: true,
                col: 'orderId'
            });

            // Contar cola de espera
            const queueLength = await WaitingQueue.count({
                where: { status: 'waiting' }
            });

            // Órdenes de los últimos 30 días
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const ordersLast30Days = await StockHistory.count({
                where: {
                    action: 'RESERVE',
                    createdAt: { [sequelize.Sequelize.Op.gte]: thirtyDaysAgo }
                }
            });

            const completedLast30Days = await StockHistory.count({
                where: {
                    action: 'RELEASE',
                    createdAt: { [sequelize.Sequelize.Op.gte]: thirtyDaysAgo }
                }
            });

            const averageCompletionTime = await this.getAverageCompletionTime();

            return {
                utilizationRate: Math.round(utilizationRate),
                ordersInProgress: Math.max(0, ordersInProgress),
                queueLength,
                ordersLast30Days,
                completedLast30Days,
                averageCompletionTime
            };
        } catch (error) {
            console.error('Error al obtener métricas:', error);
            return {
                utilizationRate: 0,
                ordersInProgress: 0,
                queueLength: 0,
                ordersLast30Days: 0,
                completedLast30Days: 0,
                averageCompletionTime: 7
            };
        }
    }

    // Inicializar configuración por defecto
    static async initializeDefaultConfig() {
        if (!sequelize) {
            return { success: true, message: 'Configuración no disponible en modo desarrollo' };
        }

        try {
            const defaultConfigs = [
                { planType: 'basico', weight: 10, estimatedDeliveryDays: 7 },
                { planType: 'estandar', weight: 30, estimatedDeliveryDays: 14 },
                { planType: 'premium', weight: 70, estimatedDeliveryDays: 21 },
                { planType: 'empresarial', weight: 100, estimatedDeliveryDays: 30 }
            ];

            for (const config of defaultConfigs) {
                await StockConfig.findOrCreate({
                    where: { planType: config.planType },
                    defaults: config
                });
            }

            // Asegurar que existe un estado inicial
            await this.getCurrentStatus();

            return { success: true, message: 'Configuración inicializada correctamente' };
        } catch (error) {
            console.error('Error al inicializar configuración:', error);
            return { success: false, reason: 'Error interno del servidor' };
        }
    }
}

export { StockConfig, StockStatus, StockHistory, WaitingQueue, StockManager };
