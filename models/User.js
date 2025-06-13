import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import uniqueValidator from 'mongoose-unique-validator';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor, proporciona un nombre'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Por favor, proporciona un email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Por favor, proporciona un email válido']
  },
  password: {
    type: String,
    required: function () {
      // Solo requerido si el usuario no se registró con un proveedor OAuth
      return !this.provider || this.provider === 'email';
    },
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false // No incluir password en las consultas por defecto
  },
  provider: {
    type: String,
    enum: ['email', 'google', 'github'],
    default: 'email'
  },
  providerId: {
    type: String,
    unique: true,
    sparse: true // Permite null/undefined para usuarios con provider 'email'
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  // Nuevos campos para verificación de email y autenticación de dos factores
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  verificationTokenExpires: {
    type: Date,
    default: null
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorVerified: {
    type: Boolean,
    default: false
  }
});

// Aplicar el plugin de validación de campos únicos
userSchema.plugin(uniqueValidator, { message: '{PATH} ya está registrado' });

// Actualizar la fecha cada vez que se modifica el documento
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Hash password antes de guardar
userSchema.pre('save', async function (next) {
  // Solo hash la contraseña si ha sido modificada o es nueva
  if (!this.isModified('password')) return next();

  // Si no hay password (usuario OAuth), continuar
  if (!this.password) return next();

  try {
    // Generar un salt
    const salt = await bcrypt.genSalt(10);
    // Hash la contraseña con el salt generado
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para validar contraseña
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    // Si no hay password (usuario OAuth), no se puede validar
    if (!this.password) return false;

    // Usar bcrypt para comparar la contraseña proporcionada con la hash almacenada
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Crear un modelo a partir del esquema
const User = mongoose.model('User', userSchema);

export default User; 