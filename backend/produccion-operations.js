/**
 * @fileoverview Gestión de Operaciones de Producción
 * @description Módulo para crear, actualizar y consultar operaciones de producción en tiempo real
 * @module backend/produccion-operations
 */

const { v4: uuidv4 } = require('uuid');

class ProduccionOperations {
    constructor(postgresClient) {
        this.db = postgresClient;
    }

    /**
     * Verifica si la base de datos está disponible
     * @private
     */
    async _checkDbAvailable() {
        if (!this.db.isInitialized) {
            throw new Error('❌ Base de datos no inicializada');
        }
        const healthy = await this.db.isConnectionHealthy();
        if (!healthy) {
            throw new Error('❌ Base de datos no disponible');
        }
    }

    // ============================================
    // OPERACIONES: CRUD Principal
    // ============================================

    /**
     * Inicia una nueva operación de producción
     */
    async iniciarOperacion(data) {
        await this._checkDbAvailable();
        const client = await this.db.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Verificar que el pedido existe
            const pedidoCheck = await client.query(
                'SELECT id, metros, etapa_actual FROM pedidos WHERE id = $1',
                [data.pedidoId]
            );
            
            if (pedidoCheck.rowCount === 0) {
                throw new Error(`Pedido ${data.pedidoId} no encontrado`);
            }
            
            const pedido = pedidoCheck.rows[0];
            
            // Verificar que no hay otra operación activa en este pedido
            const operacionActivaCheck = await client.query(
                'SELECT id FROM operaciones_produccion WHERE pedido_id = $1 AND estado IN ($2, $3)',
                [data.pedidoId, 'en_progreso', 'pausada']
            );
            
            if (operacionActivaCheck.rowCount > 0) {
                throw new Error(`Ya existe una operación activa para el pedido ${data.pedidoId}`);
            }
            
            // Crear la nueva operación
            const operacionId = uuidv4();
            const insertQuery = `
                INSERT INTO operaciones_produccion (
                    id, pedido_id, operador_id, operador_nombre, maquina, etapa,
                    estado, fecha_inicio, metros_objetivo, observaciones, metadata
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, $10)
                RETURNING *;
            `;
            
            const values = [
                operacionId,
                data.pedidoId,
                data.operadorId,
                data.operadorNombre,
                data.maquina,
                data.etapa || pedido.etapa_actual,
                'en_progreso',
                data.metrosObjetivo || pedido.metros,
                data.observaciones || null,
                JSON.stringify(data.metadata || {})
            ];
            
            const result = await client.query(insertQuery, values);
            const operacion = this._mapOperacionFromDb(result.rows[0]);
            
            await client.query('COMMIT');
            
            console.log(`✅ Operación iniciada: ${operacionId} por ${data.operadorNombre} en ${data.maquina}`);
            return operacion;
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Error al iniciar operación:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Pausa una operación en curso
     */
    async pausarOperacion(operacionId, motivo = null) {
        await this._checkDbAvailable();
        const client = await this.db.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            const opCheck = await client.query(
                'SELECT * FROM operaciones_produccion WHERE id = $1',
                [operacionId]
            );
            
            if (opCheck.rowCount === 0) {
                throw new Error(`Operación ${operacionId} no encontrada`);
            }
            
            const operacion = opCheck.rows[0];
            
            if (operacion.estado !== 'en_progreso') {
                throw new Error(`La operación ${operacionId} no está en progreso (estado: ${operacion.estado})`);
            }
            
            const pausaId = uuidv4();
            await client.query(
                `INSERT INTO pausas_operacion (id, operacion_id, fecha_inicio_pausa, motivo)
                 VALUES ($1, $2, NOW(), $3)`,
                [pausaId, operacionId, motivo]
            );
            
            const updateResult = await client.query(
                `UPDATE operaciones_produccion 
                 SET estado = $1, motivo_pausa = $2, updated_at = NOW()
                 WHERE id = $3
                 RETURNING *`,
                ['pausada', motivo, operacionId]
            );
            
            await client.query('COMMIT');
            
            console.log(`⏸️ Operación pausada: ${operacionId}`);
            return this._mapOperacionFromDb(updateResult.rows[0]);
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Error al pausar operación:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Reanuda una operación pausada
     */
    async reanudarOperacion(operacionId) {
        await this._checkDbAvailable();
        const client = await this.db.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            const opCheck = await client.query(
                'SELECT * FROM operaciones_produccion WHERE id = $1',
                [operacionId]
            );
            
            if (opCheck.rowCount === 0) {
                throw new Error(`Operación ${operacionId} no encontrada`);
            }
            
            const operacion = opCheck.rows[0];
            
            if (operacion.estado !== 'pausada') {
                throw new Error(`La operación ${operacionId} no está pausada (estado: ${operacion.estado})`);
            }
            
            await client.query(
                `UPDATE pausas_operacion 
                 SET fecha_fin_pausa = NOW(),
                     duracion_segundos = EXTRACT(EPOCH FROM (NOW() - fecha_inicio_pausa))::INTEGER
                 WHERE operacion_id = $1 AND fecha_fin_pausa IS NULL`,
                [operacionId]
            );
            
            const updateResult = await client.query(
                `UPDATE operaciones_produccion 
                 SET estado = $1, motivo_pausa = NULL, updated_at = NOW()
                 WHERE id = $2
                 RETURNING *`,
                ['en_progreso', operacionId]
            );
            
            await client.query('COMMIT');
            
            console.log(`▶️ Operación reanudada: ${operacionId}`);
            return this._mapOperacionFromDb(updateResult.rows[0]);
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Error al reanudar operación:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Completa una operación de producción
     */
    async completarOperacion(data) {
        await this._checkDbAvailable();
        const client = await this.db.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            const opCheck = await client.query(
                'SELECT * FROM operaciones_produccion WHERE id = $1',
                [data.operacionId]
            );
            
            if (opCheck.rowCount === 0) {
                throw new Error(`Operación ${data.operacionId} no encontrada`);
            }
            
            const operacion = opCheck.rows[0];
            
            if (!['en_progreso', 'pausada'].includes(operacion.estado)) {
                throw new Error(`La operación ${data.operacionId} ya está finalizada`);
            }
            
            if (operacion.estado === 'pausada') {
                await client.query(
                    `UPDATE pausas_operacion 
                     SET fecha_fin_pausa = NOW(),
                         duracion_segundos = EXTRACT(EPOCH FROM (NOW() - fecha_inicio_pausa))::INTEGER
                     WHERE operacion_id = $1 AND fecha_fin_pausa IS NULL`,
                    [data.operacionId]
                );
            }
            
            const tiempoResult = await client.query(
                `SELECT 
                    EXTRACT(EPOCH FROM (NOW() - fecha_inicio))::INTEGER AS tiempo_transcurrido,
                    COALESCE(tiempo_pausado_segundos, 0) AS tiempo_pausado
                 FROM operaciones_produccion
                 WHERE id = $1`,
                [data.operacionId]
            );
            
            const { tiempo_transcurrido, tiempo_pausado } = tiempoResult.rows[0];
            const tiempoTotalTrabajado = tiempo_transcurrido - tiempo_pausado;
            
            const updateResult = await client.query(
                `UPDATE operaciones_produccion 
                 SET estado = $1, 
                     fecha_fin = NOW(), 
                     metros_producidos = $2,
                     tiempo_total_segundos = $3,
                     observaciones = COALESCE($4, observaciones),
                     updated_at = NOW()
                 WHERE id = $5
                 RETURNING *`,
                ['completada', data.metrosProducidos, tiempoTotalTrabajado, data.observaciones, data.operacionId]
            );
            
            const operacionCompleta = this._mapOperacionFromDb(updateResult.rows[0]);
            
            await this.registrarMetraje({
                operacionId: data.operacionId,
                pedidoId: operacion.pedido_id,
                metrosRegistrados: data.metrosProducidos,
                calidad: data.calidad || 'ok',
                registradoPor: operacion.operador_id,
                registradoNombre: operacion.operador_nombre,
                observaciones: data.observaciones
            }, client);
            
            await client.query('COMMIT');
            
            console.log(`✅ Operación completada: ${data.operacionId} - ${data.metrosProducidos}m producidos`);
            return operacionCompleta;
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Error al completar operación:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Cancela una operación de producción
     */
    async cancelarOperacion(operacionId, motivo = null) {
        await this._checkDbAvailable();
        const client = await this.db.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            const updateResult = await client.query(
                `UPDATE operaciones_produccion 
                 SET estado = $1, 
                     fecha_fin = NOW(), 
                     observaciones = COALESCE($2, observaciones),
                     updated_at = NOW()
                 WHERE id = $3 AND estado IN ('en_progreso', 'pausada')
                 RETURNING *`,
                ['cancelada', motivo, operacionId]
            );
            
            if (updateResult.rowCount === 0) {
                throw new Error(`Operación ${operacionId} no encontrada o ya finalizada`);
            }
            
            const operacion = updateResult.rows[0];
            
            await client.query(
                `UPDATE pedidos 
                 SET operador_actual_id = NULL, 
                     operador_actual_nombre = NULL, 
                     operacion_en_curso_id = NULL
                 WHERE id = $1`,
                [operacion.pedido_id]
            );
            
            await client.query('COMMIT');
            
            console.log(`❌ Operación cancelada: ${operacionId}`);
            return this._mapOperacionFromDb(operacion);
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Error al cancelar operación:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    // ============================================
    // CONSULTAS
    // ============================================

    async obtenerOperacionesActivas(filtros = {}) {
        await this._checkDbAvailable();
        const client = await this.db.pool.connect();
        
        try {
            let query = `
                SELECT 
                    op.*,
                    p.numero_pedido_cliente,
                    p.cliente,
                    p.metros AS metros_totales_pedido,
                    p.producto,
                    p.colores,
                    p.prioridad,
                    p.fecha_entrega,
                    p.observaciones AS observaciones_pedido,
                    EXTRACT(EPOCH FROM (NOW() - op.fecha_inicio))::INTEGER AS segundos_desde_inicio
                FROM operaciones_produccion op
                INNER JOIN pedidos p ON op.pedido_id = p.id
                WHERE op.estado IN ('en_progreso', 'pausada')
            `;
            
            const values = [];
            let paramIndex = 1;
            
            if (filtros.operadorId) {
                query += ` AND op.operador_id = $${paramIndex}`;
                values.push(filtros.operadorId);
                paramIndex++;
            }
            
            if (filtros.maquina) {
                query += ` AND op.maquina = $${paramIndex}`;
                values.push(filtros.maquina);
                paramIndex++;
            }
            
            if (filtros.etapa) {
                query += ` AND op.etapa = $${paramIndex}`;
                values.push(filtros.etapa);
                paramIndex++;
            }
            
            query += ` ORDER BY op.fecha_inicio ASC`;
            
            const result = await client.query(query, values);
            return result.rows.map(row => this._mapOperacionActivaCompleta(row));
            
        } finally {
            client.release();
        }
    }

    async obtenerHistorialPedido(pedidoId) {
        await this._checkDbAvailable();
        const client = await this.db.pool.connect();
        
        try {
            const result = await client.query(
                `SELECT * FROM operaciones_produccion 
                 WHERE pedido_id = $1 
                 ORDER BY fecha_inicio DESC`,
                [pedidoId]
            );
            
            return result.rows.map(row => this._mapOperacionFromDb(row));
            
        } finally {
            client.release();
        }
    }

    async obtenerOperacionPorId(operacionId) {
        await this._checkDbAvailable();
        const client = await this.db.pool.connect();
        
        try {
            const result = await client.query(
                'SELECT * FROM operaciones_produccion WHERE id = $1',
                [operacionId]
            );
            
            return result.rowCount > 0 ? this._mapOperacionFromDb(result.rows[0]) : null;
            
        } finally {
            client.release();
        }
    }

    // ============================================
    // METRAJE
    // ============================================

    async registrarMetraje(data, client = null) {
        const shouldReleaseClient = !client;
        
        if (!client) {
            await this._checkDbAvailable();
            client = await this.db.pool.connect();
        }
        
        try {
            const pedidoResult = await client.query(
                'SELECT COALESCE(metros_producidos, 0) AS metros_acumulados FROM pedidos WHERE id = $1',
                [data.pedidoId]
            );
            
            const metrosAcumulados = parseFloat(pedidoResult.rows[0].metros_acumulados) + parseFloat(data.metrosRegistrados);
            
            const metrajeId = uuidv4();
            const insertResult = await client.query(
                `INSERT INTO metraje_produccion (
                    id, operacion_id, pedido_id, metros_registrados, metros_acumulados,
                    observaciones, calidad, registrado_por, registrado_nombre, fecha_registro
                 )
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                 RETURNING *`,
                [
                    metrajeId,
                    data.operacionId,
                    data.pedidoId,
                    data.metrosRegistrados,
                    metrosAcumulados,
                    data.observaciones || null,
                    data.calidad || 'ok',
                    data.registradoPor,
                    data.registradoNombre
                ]
            );
            
            console.log(`📏 Metraje registrado: ${data.metrosRegistrados}m (acumulado: ${metrosAcumulados}m)`);
            return this._mapMetrajeFromDb(insertResult.rows[0]);
            
        } finally {
            if (shouldReleaseClient) {
                client.release();
            }
        }
    }

    async obtenerHistorialMetraje(pedidoId) {
        await this._checkDbAvailable();
        const client = await this.db.pool.connect();
        
        try {
            const result = await client.query(
                'SELECT * FROM metraje_produccion WHERE pedido_id = $1 ORDER BY fecha_registro DESC',
                [pedidoId]
            );
            
            return result.rows.map(row => this._mapMetrajeFromDb(row));
            
        } finally {
            client.release();
        }
    }

    // ============================================
    // OBSERVACIONES
    // ============================================

    async agregarObservacion(data) {
        await this._checkDbAvailable();
        const client = await this.db.pool.connect();
        
        try {
            const observacionId = uuidv4();
            const result = await client.query(
                `INSERT INTO observaciones_produccion (
                    id, operacion_id, pedido_id, observacion, tipo,
                    creado_por, creado_nombre, fecha_creacion
                 )
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                 RETURNING *`,
                [
                    observacionId,
                    data.operacionId,
                    data.pedidoId,
                    data.observacion,
                    data.tipo || 'normal',
                    data.creadoPor,
                    data.creadoNombre
                ]
            );
            
            console.log(`📝 Observación agregada: ${data.tipo}`);
            return this._mapObservacionFromDb(result.rows[0]);
            
        } finally {
            client.release();
        }
    }

    async obtenerObservacionesOperacion(operacionId) {
        await this._checkDbAvailable();
        const client = await this.db.pool.connect();
        
        try {
            const result = await client.query(
                'SELECT * FROM observaciones_produccion WHERE operacion_id = $1 ORDER BY fecha_creacion ASC',
                [operacionId]
            );
            
            return result.rows.map(row => this._mapObservacionFromDb(row));
            
        } finally {
            client.release();
        }
    }

    // ============================================
    // ESTADÍSTICAS
    // ============================================

    async obtenerEstadisticasOperadorHoy(operadorId) {
        await this._checkDbAvailable();
        const client = await this.db.pool.connect();
        
        try {
            const result = await client.query(
                `SELECT * FROM v_estadisticas_operador_hoy WHERE operador_id = $1`,
                [operadorId]
            );
            
            return result.rowCount > 0 ? this._mapEstadisticasFromDb(result.rows[0]) : null;
            
        } finally {
            client.release();
        }
    }

    async obtenerPedidosDisponibles(filtros = {}) {
        await this._checkDbAvailable();
        const client = await this.db.pool.connect();
        
        try {
            let query = 'SELECT * FROM v_pedidos_disponibles_produccion WHERE 1=1';
            const values = [];
            let paramIndex = 1;
            
            if (filtros.etapa) {
                query += ` AND etapa_actual = $${paramIndex}`;
                values.push(filtros.etapa);
                paramIndex++;
            }
            
            const result = await client.query(query, values);
            return result.rows;
            
        } finally {
            client.release();
        }
    }

    // ============================================
    // MAPPERS
    // ============================================

    _mapOperacionFromDb(row) {
        return {
            id: row.id,
            pedidoId: row.pedido_id,
            operadorId: row.operador_id,
            operadorNombre: row.operador_nombre,
            maquina: row.maquina,
            etapa: row.etapa,
            estado: row.estado,
            fechaInicio: row.fecha_inicio?.toISOString(),
            fechaFin: row.fecha_fin?.toISOString(),
            tiempoTotalSegundos: parseInt(row.tiempo_total_segundos) || 0,
            tiempoPausadoSegundos: parseInt(row.tiempo_pausado_segundos) || 0,
            metrosProducidos: parseFloat(row.metros_producidos) || 0,
            metrosObjetivo: row.metros_objetivo ? parseFloat(row.metros_objetivo) : null,
            observaciones: row.observaciones,
            motivoPausa: row.motivo_pausa,
            metadata: row.metadata || {},
            createdAt: row.created_at?.toISOString(),
            updatedAt: row.updated_at?.toISOString()
        };
    }

    _mapOperacionActivaCompleta(row) {
        const operacion = this._mapOperacionFromDb(row);
        
        return {
            ...operacion,
            numeroPedidoCliente: row.numero_pedido_cliente,
            cliente: row.cliente,
            metrosTotalesPedido: parseFloat(row.metros_totales_pedido),
            producto: row.producto,
            colores: row.colores,
            prioridad: row.prioridad,
            fechaEntrega: row.fecha_entrega,
            observacionesPedido: row.observaciones_pedido,
            segundosDesdeInicio: parseInt(row.segundos_desde_inicio),
            tiempoTranscurridoFormateado: this._formatearTiempo(parseInt(row.segundos_desde_inicio))
        };
    }

    _mapMetrajeFromDb(row) {
        return {
            id: row.id,
            operacionId: row.operacion_id,
            pedidoId: row.pedido_id,
            metrosRegistrados: parseFloat(row.metros_registrados),
            metrosAcumulados: parseFloat(row.metros_acumulados),
            observaciones: row.observaciones,
            calidad: row.calidad,
            registradoPor: row.registrado_por,
            registradoNombre: row.registrado_nombre,
            fechaRegistro: row.fecha_registro?.toISOString()
        };
    }

    _mapObservacionFromDb(row) {
        return {
            id: row.id,
            operacionId: row.operacion_id,
            pedidoId: row.pedido_id,
            observacion: row.observacion,
            tipo: row.tipo,
            creadoPor: row.creado_por,
            creadoNombre: row.creado_nombre,
            fechaCreacion: row.fecha_creacion?.toISOString()
        };
    }

    _mapEstadisticasFromDb(row) {
        return {
            operadorId: row.operador_id,
            operadorNombre: row.operador_nombre,
            totalOperaciones: parseInt(row.total_operaciones) || 0,
            operacionesCompletadas: parseInt(row.operaciones_completadas) || 0,
            operacionesEnProgreso: parseInt(row.operaciones_en_progreso) || 0,
            operacionesPausadas: parseInt(row.operaciones_pausadas) || 0,
            metrosProducidosHoy: parseFloat(row.metros_producidos_hoy) || 0,
            tiempoTrabajadoSegundos: parseInt(row.tiempo_trabajado_segundos) || 0,
            tiempoPromedioOperacion: parseFloat(row.tiempo_promedio_operacion) || 0
        };
    }

    _formatearTiempo(segundos) {
        const horas = Math.floor(segundos / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);
        
        if (horas > 0) {
            return `${horas}h ${minutos}m`;
        }
        return `${minutos}m`;
    }
}

module.exports = ProduccionOperations;
