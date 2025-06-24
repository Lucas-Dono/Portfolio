import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

// Modelo para las conversaciones de chat
const ChatConversation = sequelize.define('ChatConversation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'user_id'
  },
  projectId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'project_id'
  },
  type: {
    type: DataTypes.ENUM('ai', 'developer'),
    defaultValue: 'ai',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'closed', 'archived'),
    defaultValue: 'active',
    allowNull: false
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'last_message_at'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'chat_conversations',
  timestamps: false, // Manejamos timestamps manualmente
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['project_id']
    },
    {
      fields: ['type']
    },
    {
      fields: ['last_message_at']
    }
  ]
});

// Modelo para los mensajes de chat
const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  conversationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'chat_conversations',
      key: 'id'
    },
    onDelete: 'CASCADE',
    field: 'conversation_id'
  },
  senderType: {
    type: DataTypes.ENUM('user', 'ai', 'developer'),
    allowNull: false,
    field: 'sender_type'
  },
  senderId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'sender_id'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  messageType: {
    type: DataTypes.ENUM('text', 'image', 'file', 'system'),
    defaultValue: 'text',
    field: 'message_type'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'chat_messages',
  timestamps: false,
  indexes: [
    {
      fields: ['conversation_id']
    },
    {
      fields: ['sender_type']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['is_read']
    }
  ]
});

// Modelo para las notificaciones de chat
const ChatNotification = sequelize.define('ChatNotification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'user_id'
  },
  conversationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'chat_conversations',
      key: 'id'
    },
    onDelete: 'CASCADE',
    field: 'conversation_id'
  },
  messageId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'chat_messages',
      key: 'id'
    },
    onDelete: 'CASCADE',
    field: 'message_id'
  },
  type: {
    type: DataTypes.ENUM('message', 'mention', 'system'),
    defaultValue: 'message'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read'
  },
  isEmailSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_email_sent'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'chat_notifications',
  timestamps: false,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['conversation_id']
    },
    {
      fields: ['is_read']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Definir asociaciones
ChatConversation.hasMany(ChatMessage, {
  foreignKey: 'conversationId',
  as: 'messages'
});

ChatMessage.belongsTo(ChatConversation, {
  foreignKey: 'conversationId',
  as: 'conversation'
});

ChatConversation.hasMany(ChatNotification, {
  foreignKey: 'conversationId',
  as: 'notifications'
});

ChatNotification.belongsTo(ChatConversation, {
  foreignKey: 'conversationId',
  as: 'conversation'
});

ChatMessage.hasMany(ChatNotification, {
  foreignKey: 'messageId',
  as: 'notifications'
});

ChatNotification.belongsTo(ChatMessage, {
  foreignKey: 'messageId',
  as: 'message'
});

// Métodos estáticos útiles
ChatConversation.findByUser = async function(userId, projectId = null) {
  const where = { userId };
  if (projectId) {
    where.projectId = projectId;
  }
  
  return await this.findAll({
    where,
    include: [{
      model: ChatMessage,
      as: 'messages',
      limit: 50,
      order: [['createdAt', 'DESC']]
    }],
    order: [['lastMessageAt', 'DESC']]
  });
};

ChatConversation.findOrCreateConversation = async function(userId, projectId, type = 'ai') {
  const [conversation, created] = await this.findOrCreate({
    where: {
      userId,
      projectId,
      type,
      status: 'active'
    },
    defaults: {
      userId,
      projectId,
      type,
      status: 'active'
    }
  });
  
  return { conversation, created };
};

ChatMessage.createMessage = async function(conversationId, senderType, message, senderId = null, messageType = 'text') {
  const newMessage = await this.create({
    conversationId,
    senderType,
    senderId,
    message,
    messageType
  });
  
  // Actualizar timestamp de la conversación (se hace automáticamente por trigger)
  return newMessage;
};

ChatNotification.createNotification = async function(userId, conversationId, messageId, type = 'message') {
  return await this.create({
    userId,
    conversationId,
    messageId,
    type
  });
};

export {
  ChatConversation,
  ChatMessage,
  ChatNotification
}; 