import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import bcrypt from 'bcrypt';

class UserSql extends Model {
    // Método para comparar contraseñas (equivalente al de Mongoose)
    async comparePassword(candidatePassword) {
        try {
            // Si no hay contraseña (usuario OAuth) o el provider no es 'email', retornar false
            if (!this.password || this.provider !== 'email') return false;

            // Usar bcrypt para comparar la contraseña proporcionada con el hash almacenado
            return await bcrypt.compare(candidatePassword, this.password);
        } catch (error) {
            throw error;
        }
    }
}

// Solo inicializar el modelo si sequelize está disponible
if (sequelize) {
    UserSql.init({
        id: {
            type: DataTypes.STRING(255), // Cambiado de UUID a STRING para soportar IDs de OAuth
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4, // Mantener UUIDV4 como default para usuarios normales
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true, // Permite null para usuarios OAuth
        },
        provider: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'email', // 'email', 'google', 'github'
        },
        providerId: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: true, // Permite null para usuarios con provider 'email'
        },
        avatar: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: '',
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'user', // 'user', 'admin'
        },
        emailVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        verificationToken: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        verificationTokenExpires: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        twoFactorEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        twoFactorSecret: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        twoFactorVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        backupCodes: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: [],
        },
        lastTwoFactorAuth: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        termsAccepted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        termsAcceptedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        lastLogin: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        }
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: true, // Habilita createdAt y updatedAt
        paranoid: true,   // Habilita soft deletes (deletedAt)
        hooks: {
            // Hash de contraseña antes de crear usuario
            beforeCreate: async (user) => {
                // Asegurarse de que el ID tenga formato adecuado para OAuth providers
                if (user.provider !== 'email' && user.providerId) {
                    user.id = `${user.provider}-${user.providerId}`;
                }

                if (user.provider === 'email' && user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            // Hash de contraseña antes de actualizar usuario (si cambia la contraseña)
            beforeUpdate: async (user) => {
                if (user.provider === 'email' && user.changed('password') && user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            }
        }
    });
} else {
    console.log('⚠️ Sequelize no disponible, UserSql funcionará en modo limitado');
}

export default UserSql; 