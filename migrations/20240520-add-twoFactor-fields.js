/**
 * Migración: Añadir campos para autenticación de dos factores
 */

import { sequelize } from '../config/database.js';
import { QueryTypes } from 'sequelize';

export async function up() {
    try {
        // Verificar si la columna ya existe antes de crearla
        const checkColumns = await sequelize.query(
            `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'users' 
       AND column_name IN ('two_factor_secret', 'backup_codes', 'last_two_factor_auth')`,
            { type: QueryTypes.SELECT }
        );

        const existingColumns = checkColumns.map(col => col.column_name);

        // Agregar columna para el secreto 2FA si no existe
        if (!existingColumns.includes('two_factor_secret')) {
            await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN two_factor_secret VARCHAR(255);
      `);
            console.log('✅ Columna two_factor_secret añadida correctamente');
        } else {
            console.log('⚠️ Columna two_factor_secret ya existe, saltando');
        }

        // Agregar columna para códigos de respaldo si no existe
        if (!existingColumns.includes('backup_codes')) {
            await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN backup_codes JSONB DEFAULT '[]';
      `);
            console.log('✅ Columna backup_codes añadida correctamente');
        } else {
            console.log('⚠️ Columna backup_codes ya existe, saltando');
        }

        // Agregar columna para la última autenticación 2FA si no existe
        if (!existingColumns.includes('last_two_factor_auth')) {
            await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN last_two_factor_auth TIMESTAMP WITH TIME ZONE;
      `);
            console.log('✅ Columna last_two_factor_auth añadida correctamente');
        } else {
            console.log('⚠️ Columna last_two_factor_auth ya existe, saltando');
        }

        // Verificar si la columna two_factor_enabled existe
        const checkTwoFactorEnabled = await sequelize.query(
            `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'users' 
       AND column_name = 'two_factor_enabled'`,
            { type: QueryTypes.SELECT }
        );

        // Si no existe, la creamos
        if (checkTwoFactorEnabled.length === 0) {
            await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false;
      `);
            console.log('✅ Columna two_factor_enabled añadida correctamente');
        } else {
            console.log('⚠️ Columna two_factor_enabled ya existe, saltando');
        }

        // Verificar si la columna two_factor_verified existe
        const checkTwoFactorVerified = await sequelize.query(
            `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'users' 
       AND column_name = 'two_factor_verified'`,
            { type: QueryTypes.SELECT }
        );

        // Si no existe, la creamos
        if (checkTwoFactorVerified.length === 0) {
            await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN two_factor_verified BOOLEAN DEFAULT false;
      `);
            console.log('✅ Columna two_factor_verified añadida correctamente');
        } else {
            console.log('⚠️ Columna two_factor_verified ya existe, saltando');
        }

        console.log('✅ Migración de autenticación de dos factores completada');
    } catch (error) {
        console.error('❌ Error en migración:', error);
        throw error;
    }
}

export async function down() {
    try {
        // Eliminar columnas añadidas (en caso de rollback)
        await sequelize.query(`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS two_factor_secret,
      DROP COLUMN IF EXISTS backup_codes,
      DROP COLUMN IF EXISTS last_two_factor_auth,
      DROP COLUMN IF EXISTS two_factor_enabled,
      DROP COLUMN IF EXISTS two_factor_verified;
    `);
        console.log('✅ Columnas de autenticación de dos factores eliminadas correctamente');
    } catch (error) {
        console.error('❌ Error al eliminar columnas:', error);
        throw error;
    }
}

export default { up, down }; 