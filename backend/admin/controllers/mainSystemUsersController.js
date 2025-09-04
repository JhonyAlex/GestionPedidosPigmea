const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const PostgreSQLClient = require('../../postgres-client');

const dbClient = new PostgreSQLClient();

const mainSystemUsersController = {
    // Obtener todos los usuarios del sistema principal
    async getAllMainUsers(req, res) {
        try {
            // Si no hay base de datos, usar usuarios mock
            if (!dbClient.isInitialized || !dbClient.pool) {
                console.log('🔧 Usando usuarios mock del sistema principal para desarrollo');
                const mockMainUsers = [
                    {
                        id: 'user-1',
                        username: 'operador1',
                        role: 'Operador',
                        displayName: 'Juan Operador',
                        created_at: '2024-01-15T00:00:00Z',
                        last_login: new Date(Date.now() - 3600000).toISOString(), // Hace 1 hora
                        isActive: true
                    },
                    {
                        id: 'user-2',
                        username: 'supervisor1',
                        role: 'Supervisor',
                        displayName: 'María Supervisora',
                        created_at: '2024-01-20T00:00:00Z',
                        last_login: new Date(Date.now() - 7200000).toISOString(), // Hace 2 horas
                        isActive: true
                    },
                    {
                        id: 'user-3',
                        username: 'tecnico1',
                        role: 'Técnico',
                        displayName: 'Carlos Técnico',
                        created_at: '2024-02-01T00:00:00Z',
                        last_login: new Date(Date.now() - 86400000).toISOString(), // Hace 1 día
                        isActive: false
                    },
                    {
                        id: 'user-4',
                        username: 'operador2',
                        role: 'Operador',
                        displayName: 'Ana Operadora',
                        created_at: '2024-02-10T00:00:00Z',
                        last_login: new Date(Date.now() - 1800000).toISOString(), // Hace 30 min
                        isActive: true
                    },
                    {
                        id: 'user-5',
                        username: 'jefe1',
                        role: 'Jefe de Turno',
                        displayName: 'Pedro Jefe',
                        created_at: '2024-01-01T00:00:00Z',
                        last_login: new Date(Date.now() - 900000).toISOString(), // Hace 15 min
                        isActive: true
                    }
                ];

                return res.json(mockMainUsers);
            }

            const users = await dbClient.getAllUsers();
            
            // Mapear a formato consistente
            const formattedUsers = users.map(user => ({
                id: user.id,
                username: user.username,
                role: user.role,
                displayName: user.display_name,
                created_at: user.created_at,
                last_login: user.last_login,
                isActive: true // Por defecto, ya que la tabla users no tiene campo is_active
            }));

            res.json(formattedUsers);
        } catch (error) {
            console.error('Error al obtener usuarios del sistema principal:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Obtener usuario del sistema principal por ID
    async getMainUserById(req, res) {
        try {
            const { id } = req.params;

            // Si no hay base de datos, simular respuesta
            if (!dbClient.isInitialized || !dbClient.pool) {
                console.log('🔧 Simulando obtención de usuario principal en modo desarrollo');
                
                const mockUser = {
                    id: id,
                    username: `usuario_${id}`,
                    role: 'Operador',
                    displayName: `Usuario ${id}`,
                    created_at: '2024-01-01T00:00:00Z',
                    last_login: new Date().toISOString(),
                    isActive: true
                };

                return res.json(mockUser);
            }

            const user = await dbClient.findUserByUsername(id); // Nota: postgres-client no tiene findUserById, usamos username como fallback
            
            if (!user) {
                return res.status(404).json({
                    error: 'Usuario no encontrado'
                });
            }

            res.json({
                id: user.id,
                username: user.username,
                role: user.role,
                displayName: user.display_name,
                created_at: user.created_at,
                last_login: user.last_login,
                isActive: true
            });
        } catch (error) {
            console.error('Error al obtener usuario del sistema principal:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Crear nuevo usuario del sistema principal
    async createMainUser(req, res) {
        try {
            const {
                username,
                password,
                role,
                displayName
            } = req.body;

            // Validaciones
            if (!username || !password || !role) {
                return res.status(400).json({
                    error: 'Username, password y role son requeridos'
                });
            }

            if (username.length < 3) {
                return res.status(400).json({
                    error: 'El username debe tener al menos 3 caracteres'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    error: 'La contraseña debe tener al menos 6 caracteres'
                });
            }

            const validRoles = ['Operador', 'Supervisor', 'Técnico', 'Jefe de Turno', 'Administrador'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    error: 'Rol inválido. Roles permitidos: ' + validRoles.join(', ')
                });
            }

            // Si no hay base de datos, simular creación exitosa
            if (!dbClient.isInitialized || !dbClient.pool) {
                console.log('🔧 Simulando creación de usuario principal en modo desarrollo');
                
                const mockNewUser = {
                    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    username: username.trim(),
                    role: role,
                    displayName: displayName?.trim() || username.trim(),
                    created_at: new Date().toISOString(),
                    last_login: null,
                    isActive: true
                };

                return res.status(201).json(mockNewUser);
            }

            // Verificar que el username no existe
            const existingUser = await dbClient.findUserByUsername(username);
            if (existingUser) {
                return res.status(400).json({
                    error: 'El username ya está registrado'
                });
            }

            // Crear usuario
            const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newUser = {
                id: userId,
                username: username.trim(),
                password: password, // Sin hash para simplicidad (como en el sistema actual)
                role: role,
                displayName: displayName?.trim() || username.trim()
            };

            const createdUser = await dbClient.createUser(newUser);

            res.status(201).json({
                id: createdUser.id,
                username: createdUser.username,
                role: createdUser.role,
                displayName: createdUser.display_name,
                created_at: createdUser.created_at,
                last_login: null,
                isActive: true
            });
        } catch (error) {
            console.error('Error al crear usuario del sistema principal:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Actualizar usuario del sistema principal
    async updateMainUser(req, res) {
        try {
            const { id } = req.params;
            const {
                username,
                role,
                displayName,
                isActive
            } = req.body;

            // Si no hay base de datos, simular actualización exitosa
            if (!dbClient.isInitialized || !dbClient.pool) {
                console.log('🔧 Simulando actualización de usuario principal en modo desarrollo');
                
                const validRoles = ['Operador', 'Supervisor', 'Técnico', 'Jefe de Turno', 'Administrador'];
                if (role && !validRoles.includes(role)) {
                    return res.status(400).json({
                        error: 'Rol inválido. Roles permitidos: ' + validRoles.join(', ')
                    });
                }

                const mockUpdatedUser = {
                    id: id,
                    username: username || `usuario_${id}`,
                    role: role || 'Operador',
                    displayName: displayName || `Usuario ${id}`,
                    created_at: '2024-01-01T00:00:00Z',
                    last_login: new Date().toISOString(),
                    isActive: isActive !== undefined ? isActive : true
                };

                return res.json(mockUpdatedUser);
            }

            // Validar role si se proporciona
            if (role) {
                const validRoles = ['Operador', 'Supervisor', 'Técnico', 'Jefe de Turno', 'Administrador'];
                if (!validRoles.includes(role)) {
                    return res.status(400).json({
                        error: 'Rol inválido. Roles permitidos: ' + validRoles.join(', ')
                    });
                }
            }

            // Nota: Como postgres-client no tiene métodos de actualización para users,
            // esta sería una implementación básica. En producción necesitaríamos
            // agregar estos métodos a postgres-client.js

            return res.status(501).json({
                error: 'Actualización de usuarios del sistema principal no implementada aún en base de datos'
            });
        } catch (error) {
            console.error('Error al actualizar usuario del sistema principal:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Eliminar usuario del sistema principal
    async deleteMainUser(req, res) {
        try {
            const { id } = req.params;

            // Si no hay base de datos, simular eliminación exitosa
            if (!dbClient.isInitialized || !dbClient.pool) {
                console.log('🔧 Simulando eliminación de usuario principal en modo desarrollo');
                
                return res.json({
                    message: 'Usuario del sistema principal eliminado exitosamente (modo desarrollo)'
                });
            }

            // Nota: Como postgres-client no tiene método de eliminación para users,
            // esta sería una implementación básica. En producción necesitaríamos
            // agregar estos métodos a postgres-client.js

            return res.status(501).json({
                error: 'Eliminación de usuarios del sistema principal no implementada aún en base de datos'
            });
        } catch (error) {
            console.error('Error al eliminar usuario del sistema principal:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Resetear contraseña de usuario del sistema principal
    async resetMainUserPassword(req, res) {
        try {
            const { id } = req.params;
            const { newPassword } = req.body;

            if (!newPassword) {
                return res.status(400).json({
                    error: 'Nueva contraseña es requerida'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    error: 'La contraseña debe tener al menos 6 caracteres'
                });
            }

            // Si no hay base de datos, simular reset exitoso
            if (!dbClient.isInitialized || !dbClient.pool) {
                console.log('🔧 Simulando reset de contraseña de usuario principal en modo desarrollo');
                
                return res.json({
                    message: 'Contraseña resetada exitosamente (modo desarrollo)'
                });
            }

            // Nota: Como postgres-client no tiene método de actualización de contraseña para users,
            // esta sería una implementación básica. En producción necesitaríamos
            // agregar estos métodos a postgres-client.js

            return res.status(501).json({
                error: 'Reset de contraseña para usuarios del sistema principal no implementado aún en base de datos'
            });
        } catch (error) {
            console.error('Error al resetear contraseña de usuario del sistema principal:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Obtener estadísticas de usuarios del sistema principal
    async getMainUsersStats(req, res) {
        try {
            // Si no hay base de datos, usar estadísticas mock
            if (!dbClient.isInitialized || !dbClient.pool) {
                console.log('🔧 Usando estadísticas mock de usuarios principales para desarrollo');
                
                const mockStats = {
                    totalUsers: 5,
                    activeUsers: 4,
                    usersByRole: {
                        'Operador': 2,
                        'Supervisor': 1,
                        'Técnico': 1,
                        'Jefe de Turno': 1
                    },
                    recentlyActive: 3, // Usuarios activos en las últimas 24h
                    newUsersThisMonth: 2
                };

                return res.json(mockStats);
            }

            const users = await dbClient.getAllUsers();
            
            const totalUsers = users.length;
            const activeUsers = users.filter(user => user.last_login && 
                new Date(user.last_login) > new Date(Date.now() - 24 * 60 * 60 * 1000)
            ).length;

            // Contar usuarios por rol
            const usersByRole = {};
            users.forEach(user => {
                usersByRole[user.role] = (usersByRole[user.role] || 0) + 1;
            });

            // Usuarios nuevos este mes
            const thisMonth = new Date();
            thisMonth.setDate(1);
            const newUsersThisMonth = users.filter(user => 
                new Date(user.created_at) >= thisMonth
            ).length;

            res.json({
                totalUsers,
                activeUsers,
                usersByRole,
                recentlyActive: activeUsers,
                newUsersThisMonth
            });
        } catch (error) {
            console.error('Error al obtener estadísticas de usuarios del sistema principal:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    }
};

module.exports = mainSystemUsersController;
