import { pool } from './config/pgPool.js';

async function diagnoseBatabase() {
    console.log('🔍 DIAGNÓSTICO COMPLETO DE BASE DE DATOS');
    console.log('='.repeat(50));
    
    try {
        // 1. Verificar conexión
        console.log('\n1. VERIFICANDO CONEXIÓN...');
        await pool.query('SELECT NOW()');
        console.log('✅ Conexión exitosa');
        
        // 2. Listar todas las tablas
        console.log('\n2. TABLAS EXISTENTES:');
        const tablesResult = await pool.query(`
            SELECT table_name, table_type 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        tablesResult.rows.forEach(table => {
            console.log(`   📋 ${table.table_name} (${table.table_type})`);
        });
        
        // 3. Verificar estructura de cada tabla importante
        const importantTables = ['users', 'promociones', 'user_services', 'chat_conversations', 'refund_requests'];
        
        for (const tableName of importantTables) {
            console.log(`\n3. ESTRUCTURA DE TABLA: ${tableName.toUpperCase()}`);
            console.log('-'.repeat(30));
            
            try {
                const structureResult = await pool.query(`
                    SELECT 
                        column_name, 
                        data_type, 
                        is_nullable, 
                        column_default,
                        character_maximum_length
                    FROM information_schema.columns 
                    WHERE table_name = $1 
                    ORDER BY ordinal_position
                `, [tableName]);
                
                if (structureResult.rows.length === 0) {
                    console.log(`   ❌ Tabla '${tableName}' NO EXISTE`);
                } else {
                    structureResult.rows.forEach(col => {
                        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
                        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
                        const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
                        console.log(`   📝 ${col.column_name}: ${col.data_type}${length} ${nullable}${defaultVal}`);
                    });
                }
            } catch (error) {
                console.log(`   ❌ Error al obtener estructura de '${tableName}': ${error.message}`);
            }
        }
        
        // 4. Verificar índices
        console.log('\n4. ÍNDICES EXISTENTES:');
        console.log('-'.repeat(30));
        
        const indexesResult = await pool.query(`
            SELECT 
                schemaname,
                tablename,
                indexname,
                indexdef
            FROM pg_indexes 
            WHERE schemaname = 'public'
            ORDER BY tablename, indexname
        `);
        
        indexesResult.rows.forEach(index => {
            console.log(`   🔗 ${index.tablename}.${index.indexname}`);
        });
        
        // 5. Verificar constraints/foreign keys
        console.log('\n5. FOREIGN KEYS:');
        console.log('-'.repeat(30));
        
        const fkResult = await pool.query(`
            SELECT
                tc.table_name, 
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                tc.constraint_name
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
            ORDER BY tc.table_name
        `);
        
        fkResult.rows.forEach(fk => {
            console.log(`   🔗 ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
        
        // 6. Verificar secuencias/auto-increment
        console.log('\n6. SECUENCIAS (AUTO-INCREMENT):');
        console.log('-'.repeat(30));
        
        const sequencesResult = await pool.query(`
            SELECT 
                sequence_name,
                data_type,
                start_value,
                minimum_value,
                maximum_value,
                increment
            FROM information_schema.sequences
            WHERE sequence_schema = 'public'
            ORDER BY sequence_name
        `);
        
        sequencesResult.rows.forEach(seq => {
            console.log(`   🔢 ${seq.sequence_name}: ${seq.data_type} (start: ${seq.start_value}, inc: ${seq.increment})`);
        });
        
        // 7. Verificar datos de muestra en tablas críticas
        console.log('\n7. DATOS DE MUESTRA:');
        console.log('-'.repeat(30));
        
        for (const tableName of importantTables) {
            try {
                const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
                const count = countResult.rows[0].count;
                console.log(`   📊 ${tableName}: ${count} registros`);
                
                if (count > 0 && count < 5) {
                    // Mostrar algunos registros de muestra
                    const sampleResult = await pool.query(`SELECT * FROM ${tableName} LIMIT 2`);
                    sampleResult.rows.forEach((row, index) => {
                        console.log(`     Registro ${index + 1}:`, JSON.stringify(row, null, 2));
                    });
                }
            } catch (error) {
                console.log(`   ❌ Error al contar registros en '${tableName}': ${error.message}`);
            }
        }
        
        // 8. Verificar problemas específicos conocidos
        console.log('\n8. VERIFICANDO PROBLEMAS CONOCIDOS:');
        console.log('-'.repeat(30));
        
        // Verificar promociones con IDs problemáticos
        try {
            const promoCheck = await pool.query(`
                SELECT id, "servicioId", tipo 
                FROM promociones 
                WHERE id::text ~ '[^0-9]'
                LIMIT 5
            `);
            
            if (promoCheck.rows.length > 0) {
                console.log('   ❌ Promociones con IDs no numéricos encontradas:');
                promoCheck.rows.forEach(promo => {
                    console.log(`     ID: ${promo.id}, ServicioId: ${promo.servicioId}, Tipo: ${promo.tipo}`);
                });
            } else {
                console.log('   ✅ No hay promociones con IDs problemáticos');
            }
        } catch (error) {
            console.log(`   ❌ Error verificando promociones: ${error.message}`);
        }
        
        // 9. Verificar triggers
        console.log('\n9. TRIGGERS:');
        console.log('-'.repeat(30));
        
        const triggersResult = await pool.query(`
            SELECT 
                trigger_name,
                event_object_table,
                action_timing,
                event_manipulation
            FROM information_schema.triggers
            WHERE trigger_schema = 'public'
            ORDER BY event_object_table, trigger_name
        `);
        
        triggersResult.rows.forEach(trigger => {
            console.log(`   ⚡ ${trigger.event_object_table}.${trigger.trigger_name} (${trigger.action_timing} ${trigger.event_manipulation})`);
        });
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ DIAGNÓSTICO COMPLETADO');
        
    } catch (error) {
        console.error('❌ Error durante diagnóstico:', error);
    } finally {
        await pool.end();
    }
}

// Ejecutar diagnóstico
diagnoseBatabase().catch(console.error); 