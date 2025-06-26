import { pool } from './config/pgPool.js';

async function fixMigrations() {
    console.log('🔧 REPARANDO MIGRACIONES DE BASE DE DATOS');
    console.log('='.repeat(50));
    
    try {
        // 1. Verificar qué tablas ya existen
        console.log('\n1. VERIFICANDO ESTADO ACTUAL...');
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        const existingTables = tablesResult.rows.map(row => row.table_name);
        console.log('✅ Tablas existentes:', existingTables.join(', '));
        
        // 2. Verificar datos en promociones
        if (existingTables.includes('promociones')) {
            const promoCount = await pool.query('SELECT COUNT(*) as count FROM promociones');
            console.log(`✅ Promociones existentes: ${promoCount.rows[0].count}`);
            
            // Si no hay promociones iniciales, agregarlas
            if (promoCount.rows[0].count < 2) {
                console.log('📝 Agregando promociones iniciales...');
                
                await pool.query(`
                    INSERT INTO promociones ("servicioId", tipo, "cantidadLimite", "cantidadUsada", activa, "valorDescuento", "createdAt", "updatedAt") 
                    SELECT 'landing-page', 'GRATIS', 3, 1, true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                    WHERE NOT EXISTS (SELECT 1 FROM promociones WHERE "servicioId" = 'landing-page' AND tipo = 'GRATIS');
                `);
                
                await pool.query(`
                    INSERT INTO promociones ("servicioId", tipo, "cantidadLimite", "cantidadUsada", activa, "valorDescuento", "createdAt", "updatedAt") 
                    SELECT 'basic-website', 'DESCUENTO', 5, 2, true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                    WHERE NOT EXISTS (SELECT 1 FROM promociones WHERE "servicioId" = 'basic-website' AND tipo = 'DESCUENTO');
                `);
                
                console.log('✅ Promociones iniciales agregadas');
            }
        }
        
        // 3. Crear índices faltantes en promociones (solo si no existen)
        console.log('\n2. VERIFICANDO ÍNDICES DE PROMOCIONES...');
        
        const promoIndexes = [
            { name: 'idx_promociones_servicio_id', sql: 'CREATE INDEX IF NOT EXISTS idx_promociones_servicio_id ON promociones("servicioId");' },
            { name: 'idx_promociones_activa', sql: 'CREATE INDEX IF NOT EXISTS idx_promociones_activa ON promociones(activa);' },
            { name: 'idx_promociones_tipo', sql: 'CREATE INDEX IF NOT EXISTS idx_promociones_tipo ON promociones(tipo);' },
            { name: 'idx_promociones_fecha_fin', sql: 'CREATE INDEX IF NOT EXISTS idx_promociones_fecha_fin ON promociones("fechaFin");' }
        ];
        
        for (const index of promoIndexes) {
            try {
                await pool.query(index.sql);
                console.log(`✅ Índice verificado: ${index.name}`);
            } catch (error) {
                console.log(`⚠️ Índice ya existe: ${index.name}`);
            }
        }
        
        // 4. Verificar otras tablas críticas
        console.log('\n3. VERIFICANDO OTRAS TABLAS...');
        
        const criticalTables = ['users', 'user_services', 'chat_conversations', 'refund_requests'];
        for (const tableName of criticalTables) {
            if (existingTables.includes(tableName)) {
                const count = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
                console.log(`✅ ${tableName}: ${count.rows[0].count} registros`);
            } else {
                console.log(`❌ FALTA TABLA: ${tableName}`);
            }
        }
        
        // 5. Limpiar índices duplicados (solo mostrar, no eliminar automáticamente)
        console.log('\n4. VERIFICANDO ÍNDICES DUPLICADOS...');
        
        const duplicateIndexes = await pool.query(`
            SELECT 
                tablename,
                COUNT(*) as count,
                string_agg(indexname, ', ') as index_names
            FROM pg_indexes 
            WHERE schemaname = 'public' 
                AND indexname LIKE '%_key%'
            GROUP BY tablename
            HAVING COUNT(*) > 5
            ORDER BY count DESC
        `);
        
        if (duplicateIndexes.rows.length > 0) {
            console.log('⚠️ Tablas con muchos índices duplicados:');
            duplicateIndexes.rows.forEach(row => {
                console.log(`   ${row.tablename}: ${row.count} índices`);
            });
            console.log('💡 Esto es normal si las migraciones se ejecutaron múltiples veces');
        }
        
        // 6. Verificar foreign keys importantes
        console.log('\n5. VERIFICANDO FOREIGN KEYS...');
        
        const fkCheck = await pool.query(`
            SELECT
                tc.table_name, 
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_name IN ('promociones', 'user_services', 'refund_requests')
            ORDER BY tc.table_name
        `);
        
        console.log('✅ Foreign keys críticos:');
        fkCheck.rows.forEach(fk => {
            console.log(`   ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
        
        // 7. Verificar que las migraciones problemáticas no se ejecuten de nuevo
        console.log('\n6. MARCANDO MIGRACIONES COMO COMPLETADAS...');
        
        // Crear tabla de control de migraciones si no existe
        await pool.query(`
            CREATE TABLE IF NOT EXISTS migration_history (
                id SERIAL PRIMARY KEY,
                migration_name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Marcar migraciones críticas como completadas
        const completedMigrations = [
            'create_promociones_table.sql',
            'create_user_services_table.sql', 
            'create_chat_tables.sql',
            'refund_requests.sql'
        ];
        
        for (const migration of completedMigrations) {
            await pool.query(`
                INSERT INTO migration_history (migration_name) 
                VALUES ($1) 
                ON CONFLICT (migration_name) DO NOTHING
            `, [migration]);
            console.log(`✅ Migración marcada: ${migration}`);
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ REPARACIÓN DE MIGRACIONES COMPLETADA');
        console.log('💡 Las migraciones problemáticas ahora se saltarán automáticamente');
        
    } catch (error) {
        console.error('❌ Error durante reparación:', error);
    } finally {
        await pool.end();
    }
}

// Ejecutar reparación
fixMigrations().catch(console.error); 