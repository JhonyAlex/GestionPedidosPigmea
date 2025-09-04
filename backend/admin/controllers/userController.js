const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const PostgreSQLClient = require('../../postgres-client');

const dbClient = new PostgreSQLClient();

const userController = {
    // Obtener todos los usuarios
    async getAllUsers(req, res) {
        try {
            // Si no hay base de datos, usar usuarios mock
            if (!dbClient.isInitialized) {
                console.log('🔧 Usando usuarios mock para desarrollo');
                const mockUsers = [
                    {
                        id: 'admin-1',
                        username: 'admin',
                        email: 'admin@pigmea.com',
                        firstName: 'Administrador',
                        lastName: 'Sistema',
                        role: 'ADMIN',
                        isActive: true,
                        lastLogin: new Date().toISOString(),
                        createdAt: '2024-01-01T00:00:00Z',
                        updatedAt: new Date().toISOString(),
                        permissions: ['users.view', 'users.create', 'users.edit', 'users.delete', 'system.admin']
                    },
                    {
                        id: 'admin-2',
                        username: 'supervisor',
                        email: 'supervisor@pigmea.com',
                        firstName: 'Supervisor',
                        lastName: 'General',
                        role: 'SUPERVISOR',
                        isActive: true,
                        lastLogin: new Date(Date.now() - 86400000).toISOString(), // Hace 1 día
                        createdAt: '2024-01-01T00:00:00Z',
                        updatedAt: new Date().toISOString(),
                        permissions: ['users.view', 'users.edit']
                    },
                    {
                        id: 'user-1',
                        username: 'operador1',
                        email: 'operador1@pigmea.com',
                        firstName: 'Juan',
                        lastName: 'Pérez',
                        role: 'OPERATOR',
                        isActive: true,
                        lastLogin: new Date(Date.now() - 3600000).toISOString(), // Hace 1 hora
                        createdAt: '2024-01-15T00:00:00Z',
                        updatedAt: new Date().toISOString(),
                        permissions: ['orders.view', 'orders.edit']
                    },
                    {
                        id: 'user-2',
                        username: 'visor1',
                        email: 'visor1@pigmea.com',
                        firstName: 'María',
                        lastName: 'García',
                        role: 'VIEWER',
                        isActive: false,
                        lastLogin: new Date(Date.now() - 604800000).toISOString(), // Hace 1 semana
                        createdAt: '2024-02-01T00:00:00Z',
                        updatedAt: new Date().toISOString(),
                        permissions: ['view.dashboard']
                    }
                ];

                return res.json(mockUsers);
            }

            const users = await dbClient.getAllAdminUsers();
            
            // Remover password_hash de la respuesta
            const safeUsers = users.map(user => {
                const { password_hash, ...safeUser } = user;
                return {
                    id: safeUser.id,
                    username: safeUser.username,
                    email: safeUser.email,
                    firstName: safeUser.first_name,
                    lastName: safeUser.last_name,
                    role: safeUser.role,
                    isActive: safeUser.is_active,
                    lastLogin: safeUser.last_login,
                    createdAt: safeUser.created_at,
                    updatedAt: safeUser.updated_at,
                    permissions: safeUser.permissions || []
                };
            });

            res.json(safeUsers);
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Obtener usuario por ID
    async getUserById(req, res) {
        try {
            const { id } = req.params;
            const user = await dbClient.getAdminUserById(id);
            
            if (!user) {
                return res.status(404).json({
                    error: 'Usuario no encontrado'
                });
            }

            // Remover password_hash de la respuesta
            const { password_hash, ...safeUser } = user;
            res.json({
                id: safeUser.id,
                username: safeUser.username,
                email: safeUser.email,
                firstName: safeUser.first_name,
                lastName: safeUser.last_name,
                role: safeUser.role,
                isActive: safeUser.is_active,
                lastLogin: safeUser.last_login,
                createdAt: safeUser.created_at,
                updatedAt: safeUser.updated_at,
                permissions: safeUser.permissions || []
            });
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Crear nuevo usuario
    async createUser(req, res) {
        try {
            // Si no hay base de datos, simular creación exitosa
            if (!dbClient.isInitialized || !dbClient.pool) {
                console.log('🔧 Simulando creación de usuario en modo desarrollo');
                const {
                    username,
                    email,
                    firstName,
                    lastName,
                    role,
                    password,
                    permissions = []
                } = req.body;

                // Validaciones básicas
                if (!username || !email || !firstName || !lastName || !role || !password) {
                    return res.status(400).json({
                        error: 'Todos los campos son requeridos'
                    });
                }

                if (password.length < 8) {
                    return res.status(400).json({
                        error: 'La contraseña debe tener al menos 8 caracteres'
                    });
                }

                const validRoles = ['ADMIN', 'SUPERVISOR', 'OPERATOR', 'VIEWER'];
                if (!validRoles.includes(role)) {
                    return res.status(400).json({
                        error: 'Rol inválido'
                    });
                }

                // Simular creación exitosa
                const newUser = {
                    id: `user-${Date.now()}`,
                    username,
                    email,
                    firstName,
                    lastName,
                    role,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    permissions: permissions
                };

                return res.status(201).json({
                    message: 'Usuario creado exitosamente (modo desarrollo)',
                    user: newUser
                });
            }

            const {
                username,
                email,
                firstName,
                lastName,
                role,
                password,
                permissions = []
            } = req.body;

            // Validaciones
            if (!username || !email || !firstName || !lastName || !role || !password) {
                return res.status(400).json({
                    error: 'Todos los campos son requeridos'
                });
            }

            if (password.length < 8) {
                return res.status(400).json({
                    error: 'La contraseña debe tener al menos 8 caracteres'
                });
            }

            const validRoles = ['ADMIN', 'SUPERVISOR', 'OPERATOR', 'VIEWER'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    error: 'Rol inválido'
                });
            }

            // Verificar que el username y email no existan
            const existingUser = await dbClient.getAdminUserByUsername(username);
            if (existingUser) {
                return res.status(400).json({
                    error: 'El nombre de usuario ya existe'
                });
            }

            const existingEmail = await dbClient.getAdminUserByEmail(email);
            if (existingEmail) {
                return res.status(400).json({
                    error: 'El email ya está registrado'
                });
            }

            // Hash de la contraseña
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Crear usuario
            const userId = uuidv4();
            const userData = {
                id: userId,
                username,
                email,
                firstName,
                lastName,
                role,
                passwordHash,
                permissions,
                isActive: true
            };

            const newUser = await dbClient.createAdminUser(userData);

            // Remover password_hash de la respuesta
            const { password_hash, ...safeUser } = newUser;
            res.status(201).json({
                id: safeUser.id,
                username: safeUser.username,
                email: safeUser.email,
                firstName: safeUser.first_name,
                lastName: safeUser.last_name,
                role: safeUser.role,
                isActive: safeUser.is_active,
                lastLogin: safeUser.last_login,
                createdAt: safeUser.created_at,
                updatedAt: safeUser.updated_at,
                permissions: safeUser.permissions || []
            });
        } catch (error) {
            console.error('Error al crear usuario:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Actualizar usuario
    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const {
                email,
                firstName,
                lastName,
                role,
                isActive,
                permissions
            } = req.body;

            // Si no hay base de datos, simular actualización exitosa
            if (!dbClient.isInitialized || !dbClient.pool) {
                console.log('🔧 Simulando actualización de usuario en modo desarrollo');
                
                // Validar role si se proporciona
                if (role) {
                    const validRoles = ['ADMIN', 'SUPERVISOR', 'OPERATOR', 'VIEWER'];
                    if (!validRoles.includes(role)) {
                        return res.status(400).json({
                            error: 'Rol inválido'
                        });
                    }
                }

                // Simular usuario actualizado
                const mockUpdatedUser = {
                    id: id,
                    username: `usuario_${id}`,
                    email: email || `usuario${id}@ejemplo.com`,
                    firstName: firstName || 'Usuario',
                    lastName: lastName || 'Ejemplo',
                    role: role || 'VIEWER',
                    isActive: isActive !== undefined ? isActive : true,
                    lastLogin: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    permissions: permissions || []
                };

                return res.json(mockUpdatedUser);
            }

            // Verificar que el usuario existe
            const existingUser = await dbClient.getAdminUserById(id);
            if (!existingUser) {
                return res.status(404).json({
                    error: 'Usuario no encontrado'
                });
            }

            // Validar role si se proporciona
            if (role) {
                const validRoles = ['ADMIN', 'SUPERVISOR', 'OPERATOR', 'VIEWER'];
                if (!validRoles.includes(role)) {
                    return res.status(400).json({
                        error: 'Rol inválido'
                    });
                }
            }

            // Verificar que el email no esté en uso por otro usuario
            if (email && email !== existingUser.email) {
                const existingEmail = await dbClient.getAdminUserByEmail(email);
                if (existingEmail && existingEmail.id !== id) {
                    return res.status(400).json({
                        error: 'El email ya está registrado por otro usuario'
                    });
                }
            }

            // Construir objeto de actualización
            const updateData = {};
            if (email !== undefined) updateData.email = email;
            if (firstName !== undefined) updateData.firstName = firstName;
            if (lastName !== undefined) updateData.lastName = lastName;
            if (role !== undefined) updateData.role = role;
            if (isActive !== undefined) updateData.isActive = isActive;
            if (permissions !== undefined) updateData.permissions = permissions;

            const updatedUser = await dbClient.updateAdminUser(id, updateData);

            // Remover password_hash de la respuesta
            const { password_hash, ...safeUser } = updatedUser;
            res.json({
                id: safeUser.id,
                username: safeUser.username,
                email: safeUser.email,
                firstName: safeUser.first_name,
                lastName: safeUser.last_name,
                role: safeUser.role,
                isActive: safeUser.is_active,
                lastLogin: safeUser.last_login,
                createdAt: safeUser.created_at,
                updatedAt: safeUser.updated_at,
                permissions: safeUser.permissions || []
            });
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Eliminar usuario
    async deleteUser(req, res) {
        try {
            const { id } = req.params;

            // Si no hay base de datos, simular eliminación exitosa
            if (!dbClient.isInitialized || !dbClient.pool) {
                console.log('🔧 Simulando eliminación de usuario en modo desarrollo');
                
                // No permitir que el usuario se elimine a sí mismo
                if (id === req.user.id) {
                    return res.status(400).json({
                        error: 'No puedes eliminar tu propia cuenta'
                    });
                }

                return res.json({
                    message: 'Usuario eliminado exitosamente (modo desarrollo)'
                });
            }

            // Verificar que el usuario existe
            const existingUser = await dbClient.getAdminUserById(id);
            if (!existingUser) {
                return res.status(404).json({
                    error: 'Usuario no encontrado'
                });
            }

            // No permitir que el usuario se elimine a sí mismo
            if (id === req.user.id) {
                return res.status(400).json({
                    error: 'No puedes eliminar tu propia cuenta'
                });
            }

            await dbClient.deleteAdminUser(id);

            res.json({
                message: 'Usuario eliminado exitosamente'
            });
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Activar usuario
    async activateUser(req, res) {
        try {
            const { id } = req.params;

            const updatedUser = await dbClient.updateAdminUser(id, { isActive: true });
            
            if (!updatedUser) {
                return res.status(404).json({
                    error: 'Usuario no encontrado'
                });
            }

            const { password_hash, ...safeUser } = updatedUser;
            res.json({
                id: safeUser.id,
                username: safeUser.username,
                email: safeUser.email,
                firstName: safeUser.first_name,
                lastName: safeUser.last_name,
                role: safeUser.role,
                isActive: safeUser.is_active,
                lastLogin: safeUser.last_login,
                createdAt: safeUser.created_at,
                updatedAt: safeUser.updated_at,
                permissions: safeUser.permissions || []
            });
        } catch (error) {
            console.error('Error al activar usuario:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Desactivar usuario
    async deactivateUser(req, res) {
        try {
            const { id } = req.params;

            // No permitir que el usuario se desactive a sí mismo
            if (id === req.user.id) {
                return res.status(400).json({
                    error: 'No puedes desactivar tu propia cuenta'
                });
            }

            const updatedUser = await dbClient.updateAdminUser(id, { isActive: false });
            
            if (!updatedUser) {
                return res.status(404).json({
                    error: 'Usuario no encontrado'
                });
            }

            const { password_hash, ...safeUser } = updatedUser;
            res.json({
                id: safeUser.id,
                username: safeUser.username,
                email: safeUser.email,
                firstName: safeUser.first_name,
                lastName: safeUser.last_name,
                role: safeUser.role,
                isActive: safeUser.is_active,
                lastLogin: safeUser.last_login,
                createdAt: safeUser.created_at,
                updatedAt: safeUser.updated_at,
                permissions: safeUser.permissions || []
            });
        } catch (error) {
            console.error('Error al desactivar usuario:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Reset de contraseña de usuario
    async resetUserPassword(req, res) {
        try {
            const { id } = req.params;

            // Verificar que el usuario existe
            const existingUser = await dbClient.getAdminUserById(id);
            if (!existingUser) {
                return res.status(404).json({
                    error: 'Usuario no encontrado'
                });
            }

            // Generar contraseña temporal
            const temporaryPassword = Math.random().toString(36).slice(-12);
            
            // Hash de la contraseña temporal
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(temporaryPassword, saltRounds);

            // Actualizar contraseña
            await dbClient.updateUserPassword(id, passwordHash);

            res.json({
                message: 'Contraseña reseteada exitosamente',
                temporaryPassword: temporaryPassword
            });
        } catch (error) {
            console.error('Error al resetear contraseña:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Obtener actividad de usuarios
    async getUserActivity(req, res) {
        try {
            const activity = await dbClient.getUserActivity();
            res.json(activity);
        } catch (error) {
            console.error('Error al obtener actividad de usuarios:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Obtener permisos disponibles
    async getAvailablePermissions(req, res) {
        try {
            const permissions = [
                { id: 'dashboard.view', name: 'Ver Dashboard', description: 'Acceso al panel principal', module: 'Dashboard' },
                { id: 'users.view', name: 'Ver Usuarios', description: 'Ver lista de usuarios', module: 'Usuarios' },
                { id: 'users.create', name: 'Crear Usuarios', description: 'Crear nuevos usuarios', module: 'Usuarios' },
                { id: 'users.edit', name: 'Editar Usuarios', description: 'Modificar usuarios existentes', module: 'Usuarios' },
                { id: 'users.delete', name: 'Eliminar Usuarios', description: 'Eliminar usuarios', module: 'Usuarios' },
                { id: 'audit.view', name: 'Ver Auditoría', description: 'Acceso a logs de auditoría', module: 'Auditoría' },
                { id: 'audit.export', name: 'Exportar Auditoría', description: 'Exportar reportes de auditoría', module: 'Auditoría' },
                { id: 'system.view', name: 'Ver Sistema', description: 'Ver estado del sistema', module: 'Sistema' },
                { id: 'system.manage', name: 'Gestionar Sistema', description: 'Reiniciar sistema y mantenimiento', module: 'Sistema' },
                { id: 'database.view', name: 'Ver Base de Datos', description: 'Ver información de la base de datos', module: 'Base de Datos' },
                { id: 'database.backup', name: 'Crear Backups', description: 'Crear respaldos de la base de datos', module: 'Base de Datos' },
                { id: 'settings.view', name: 'Ver Configuración', description: 'Ver configuración del sistema', module: 'Configuración' },
                { id: 'settings.edit', name: 'Editar Configuración', description: 'Modificar configuración del sistema', module: 'Configuración' }
            ];

            res.json(permissions);
        } catch (error) {
            console.error('Error al obtener permisos:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Eliminación en lote de usuarios
    async bulkDeleteUsers(req, res) {
        try {
            const { userIds } = req.body;

            if (!Array.isArray(userIds) || userIds.length === 0) {
                return res.status(400).json({
                    error: 'Se requiere un array de IDs de usuarios'
                });
            }

            // Verificar que no se incluya el usuario actual
            if (userIds.includes(req.user.id)) {
                return res.status(400).json({
                    error: 'No puedes eliminar tu propia cuenta'
                });
            }

            const deleteResults = await dbClient.bulkDeleteAdminUsers(userIds);

            res.json({
                message: `${deleteResults.deletedCount} usuarios eliminados exitosamente`,
                deletedCount: deleteResults.deletedCount,
                errors: deleteResults.errors || []
            });
        } catch (error) {
            console.error('Error en eliminación en lote:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Exportar usuarios
    async exportUsers(req, res) {
        try {
            const users = await dbClient.getAllAdminUsers();
            
            // Preparar datos para exportación (sin passwords)
            const exportData = users.map(user => ({
                ID: user.id,
                Usuario: user.username,
                Email: user.email,
                Nombre: user.first_name,
                Apellido: user.last_name,
                Rol: user.role,
                Activo: user.is_active ? 'Sí' : 'No',
                'Último Login': user.last_login ? new Date(user.last_login).toLocaleString('es-ES') : 'Nunca',
                'Fecha Creación': new Date(user.created_at).toLocaleString('es-ES'),
                'Última Actualización': new Date(user.updated_at).toLocaleString('es-ES')
            }));

            // Convertir a CSV
            const csvHeader = Object.keys(exportData[0]).join(',');
            const csvRows = exportData.map(row => 
                Object.values(row).map(value => 
                    typeof value === 'string' && value.includes(',') ? `"${value}"` : value
                ).join(',')
            );
            const csvContent = [csvHeader, ...csvRows].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="usuarios_${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(csvContent);

        } catch (error) {
            console.error('Error al exportar usuarios:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    }
};

module.exports = userController;
