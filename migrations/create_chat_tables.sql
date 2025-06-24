-- Crear tabla de conversaciones de chat
CREATE TABLE IF NOT EXISTS chat_conversations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    project_id VARCHAR(255),
    type VARCHAR(20) DEFAULT 'ai' CHECK (type IN ('ai', 'developer')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para chat_conversations
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_project_id ON chat_conversations (project_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_type ON chat_conversations (type);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_message ON chat_conversations (last_message_at DESC);

-- Crear tabla de mensajes de chat
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'ai', 'developer')),
    sender_id VARCHAR(255),
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_type ON chat_messages (sender_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON chat_messages (is_read);

-- Crear tabla de notificaciones de chat
CREATE TABLE IF NOT EXISTS chat_notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    conversation_id INTEGER NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    message_id INTEGER NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'message' CHECK (type IN ('message', 'mention', 'system')),
    is_read BOOLEAN DEFAULT FALSE,
    is_email_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para chat_notifications
CREATE INDEX IF NOT EXISTS idx_chat_notifications_user_id ON chat_notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_notifications_conversation_id ON chat_notifications (conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_notifications_is_read ON chat_notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_chat_notifications_created_at ON chat_notifications (created_at DESC);

-- Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_chat_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_conversations 
    SET last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar timestamp cuando se inserta un mensaje
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON chat_messages;
CREATE TRIGGER trigger_update_conversation_timestamp
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_conversation_timestamp();

-- Insertar datos de ejemplo para testing (opcional)
-- INSERT INTO chat_conversations (user_id, project_id, type) 
-- VALUES ('test-user-1', 'project-1', 'ai');

COMMENT ON TABLE chat_conversations IS 'Tabla para almacenar conversaciones de chat híbrido (IA + Developer)';
COMMENT ON TABLE chat_messages IS 'Tabla para almacenar mensajes individuales de chat';
COMMENT ON TABLE chat_notifications IS 'Tabla para gestionar notificaciones de chat en tiempo real'; 