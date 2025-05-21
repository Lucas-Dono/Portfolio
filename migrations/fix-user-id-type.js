/**
 * Migración: Cambiar tipo de ID de usuarios de UUID a VARCHAR para permitir IDs de proveedores OAuth
 */

import { sequelize } from '../config/database.js';
import { QueryTypes } from 'sequelize';

export async function up() {
    try {
        console.log('🔄 Iniciando migración para cambiar tipo de ID de usuario...');

        // Verificar el tipo actual de la columna ID
        const checkColumns = await sequelize.query(
            `SELECT data_type 
       FROM information_schema.columns 
       WHERE table_name = 'users' 
       AND column_name = 'id'`,
            { type: QueryTypes.SELECT }
        );

        if (checkColumns.length > 0 && checkColumns[0].data_type === 'uuid') {
            console.log('🔍 Encontrada columna ID de tipo UUID, cambiando a VARCHAR(255)...');

            // Primero eliminar la restricción de clave primaria
            await sequelize.query(`
        ALTER TABLE users 
        DROP CONSTRAINT users_pkey;
      `);
            console.log('✅ Restricción de clave primaria eliminada');

            // Luego cambiar el tipo de la columna
            await sequelize.query(`
        ALTER TABLE users 
        ALTER COLUMN id TYPE VARCHAR(255);
      `);
            console.log('✅ Tipo de columna ID cambiado a VARCHAR(255)');

            // Recrear la restricción de clave primaria
            await sequelize.query(`
        ALTER TABLE users 
        ADD PRIMARY KEY (id);
      `);
            console.log('✅ Restricción de clave primaria recreada');
        } else {
            console.log('⚠️ La columna ID ya no es de tipo UUID o no se encontró');
        }

        // Eliminar columnas duplicadas
        console.log('🔍 Verificando columnas duplicadas...');
        const duplicateColumns = [
            { original: 'twoFactorSecret', duplicate: 'two_factor_secret' },
            { original: 'backupCodes', duplicate: 'backup_codes' },
            { original: 'lastTwoFactorAuth', duplicate: 'last_two_factor_auth' },
            { original: 'twoFactorEnabled', duplicate: 'two_factor_enabled' },
            { original: 'twoFactorVerified', duplicate: 'two_factor_verified' }
        ];

        for (const col of duplicateColumns) {
            try {
                await sequelize.query(`
          ALTER TABLE users 
          DROP COLUMN IF EXISTS ${col.duplicate};
        `);
                console.log(`✅ Columna duplicada ${col.duplicate} eliminada`);
            } catch (err) {
                console.warn(`⚠️ Error al eliminar columna ${col.duplicate}: ${err.message}`);
            }
        }

        console.log('✅ Migración para cambiar tipo de ID completada');
    } catch (error) {
        console.error('❌ Error en migración:', error);
        throw error;
    }
}

export async function down() {
    try {
        // En este caso, no proporcionamos un rollback para cambiar de VARCHAR a UUID
        // ya que podría causar pérdida de datos si hay IDs que no son UUID válidos
        console.log('⚠️ No se puede revertir esta migración automáticamente');
    } catch (error) {
        console.error('❌ Error al revertir migración:', error);
        throw error;
    }
}

export default { up, down }; 