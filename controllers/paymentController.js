import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import * as refundController from './refundController.js';

dotenv.config();

// Configurar Mercado Pago con el token de acceso
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

/**
 * Procesa un pago con Mercado Pago
 */
export const processPayment = async (req, res) => {
  try {
    // Capturar explícitamente los datos del cliente
    const {
      formData,
      serviceId,
      servicePrice,
      userName,
      email,
      // Datos de cliente adicionales - opcionales
      fullName,
      contactName,
      // Datos opcionales que podrían no estar presentes
      phone = "",
      company = "",
      // Datos que vienen del servicio
      serviceType
    } = req.body;

    console.log('POST /api/payments/process - Datos recibidos:', {
      serviceId,
      serviceType,
      formData: formData ? '✅ Presente' : '❌ Faltante',
      price: servicePrice,
      email,
      userName,
      fullName: fullName || userName,
      contactName: contactName || fullName || userName
    });

    // Crear un pago utilizando la API de Mercado Pago
    const payment_data = {
      transaction_amount: Number(servicePrice),
      token: formData.token,
      description: `Servicio: ${serviceId}`,
      installments: formData.installments || 1,
      payment_method_id: formData.paymentMethodId,
      payer: {
        email: formData.payer.email,
        identification: {
          type: formData.payer.identification.type,
          number: formData.payer.identification.number
        }
      }
    };

    // Creamos un header único para idempotencia
    const requestOptions = {
      idempotencyKey: `payment-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
    };

    // Realizamos la petición a Mercado Pago
    const payment = new Payment(client);
    const result = await payment.create({ body: payment_data, requestOptions });

    // Añadir: Registrar el servicio adquirido
    try {
      // Registrar el servicio del usuario
      const registrationData = {
        serviceId: serviceId,
        serviceType: serviceType || serviceId,
        userEmail: email,
        userId: req.user?.userId || null,
        amount: servicePrice,
        paymentId: result?.id || `direct_${Date.now()}`,
        status: 'approved',
        // Datos explícitos del cliente
        fullName: fullName || userName,
        contactName: contactName || fullName || userName,
        // Campos opcionales
        phone: phone || "",
        company: company || "",
        // Pasar los datos adicionales del pago
        additionalInfo: {
          payer: {
            firstName: fullName || userName || 'Usuario',
            lastName: '',
            email: email || ''
          }
        }
      };

      // Registrar el servicio
      const registeredService = await registerUserService(registrationData, req);
      console.log('✅ Servicio registrado después del pago:', registeredService.id);
    } catch (registerError) {
      console.error('❌ Error al registrar el servicio:', registerError);
      // No fallar el proceso completo si el registro falla
    }

    // Responder con el resultado del pago
    return res.status(200).json({
      status: result.status,
      id: result.id,
      detail: result.status_detail
    });
  } catch (error) {
    console.error('Error al procesar el pago:', error);

    // Responder con el error
    return res.status(500).json({
      status: 'rejected',
      id: '',
      detail: error.message || 'Error al procesar el pago'
    });
  }
};

/**
 * Crea una preferencia de pago para Checkout Pro
 */
export const createPreference = async (req, res) => {
  try {
    // Log completo del request
    console.log('📩 Recibido request para crear preferencia:');
    console.log('- Headers:', req.headers);
    console.log('- Body:', req.body);
    console.log('- Cookies:', req.cookies);

    // Verificar si req.body está vacío o es undefined
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('❌ Error: req.body está vacío o es undefined');
      return res.status(400).json({
        error: 'Datos de la solicitud vacíos o inválidos',
        message: 'El cuerpo de la solicitud (body) está vacío o no se pudo parsear correctamente',
        public_key: process.env.VITE_MP_PUBLIC_KEY || 'TEST-064a6d85-da9f-4dea-9587-d0e7da336abc'
      });
    }

    // Extraer valores con valores predeterminados
    const serviceId = req.body.serviceId || 'unknown';
    const serviceTitle = req.body.serviceTitle || 'Servicio';
    const servicePrice = req.body.servicePrice || 0;
    const userName = req.body.userName || 'Cliente';

    // Configurar cabeceras para permitir cookies de terceros
    const origin = req.headers.origin;
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-HTTP-Method-Override, ' +
      'x-meli-session-id, device-id, x-idempotency-key, x-flow-id, x-product-id, x-tracking-id, Cookie, Set-Cookie');
    res.header('Access-Control-Expose-Headers', 'Set-Cookie, Content-Disposition');

    // Establecer cookies de prueba con diferentes combinaciones de opciones
    res.cookie('mp-preference-id', 'test-cookie', {
      sameSite: 'none',
      secure: true,
      httpOnly: false,
      path: '/'
    });

    // Asegurar que tengamos la clave pública y de acceso
    const publicKey = process.env.VITE_MP_PUBLIC_KEY || 'TEST-064a6d85-da9f-4dea-9587-d0e7da336abc';
    const accessToken = process.env.MP_ACCESS_TOKEN || 'TEST-1234567890123456-123456-12345678901234567890123456789012-123456789';

    console.log('🔑 Usando clave pública de MP:', publicKey);
    console.log('🔑 Usando access token (primeros 10 caracteres):', accessToken.substring(0, 10) + '...');

    // URL base para redirecciones - Aseguramos que siempre tengamos un valor válido y con protocolo
    const corsUrl = process.env.CORS_FRONT || 'http://localhost:3000';

    // Construir URLs de retorno absolutas (con protocolo)
    const baseUrl = corsUrl.startsWith('http') ? corsUrl : `http://${corsUrl}`;
    const successUrl = `${baseUrl}/payment/success`;
    const failureUrl = `${baseUrl}/payment/failure`;
    const pendingUrl = `${baseUrl}/payment/pending`;

    console.log('🌐 URLs de retorno configuradas:', {
      success: successUrl,
      failure: failureUrl,
      pending: pendingUrl
    });

    // Datos para Checkout API - Configuración MUY simplificada solo con lo mínimo esencial
    const preferenceData = {
      items: [
        {
          id: serviceId,
          title: serviceTitle,
          description: `Servicio de ${serviceTitle}`,
          quantity: 1,
          unit_price: Number(servicePrice),
          currency_id: 'ARS'
        }
      ],
      payer: {
        name: userName || 'Cliente',
        email: req.body.email || 'cliente@example.com'
      },
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl
      },
      external_reference: `service_${serviceId}_${Date.now()}`,
      site_id: 'MLA'
    };

    console.log('📋 Creando preferencia con datos simplificados:', JSON.stringify(preferenceData, null, 2));

    try {
      // Crear preferencia con opciones mínimas
      const preference = new Preference(client);
      const result = await preference.create({
        body: preferenceData,
        requestOptions: {
          idempotencyKey: `payment-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
        }
      });

      console.log('✅ Preferencia creada con ID:', result.id);
      console.log('🔄 Iniciando redirección a:', result.init_point);

      // También guardar el ID de preferencia como una cookie para referencia
      res.cookie('mp-created-preference-id', result.id, {
        sameSite: 'none',
        secure: true,
        httpOnly: false
      });

      // Siempre enviamos la public_key junto con el ID de la preferencia
      return res.json({
        id: result.id,
        init_point: result.init_point,
        public_key: publicKey,
        serviceInfo: {
          id: serviceId,
          title: serviceTitle,
          price: Number(servicePrice)
        }
      });
    } catch (error) {
      console.error('❌ Error al crear preferencia:', error);

      // Si el error es específico de Mercado Pago, extraer el detalle
      let errorDetails = 'Error al crear preferencia';
      if (error.cause) {
        try {
          const apiError = typeof error.cause === 'string'
            ? JSON.parse(error.cause)
            : error.cause;

          if (apiError.error) {
            errorDetails = apiError.error;
          } else if (apiError.message) {
            errorDetails = apiError.message;
          }

          console.error('Detalles del error de MP:', apiError);
        } catch (e) {
          console.error('Error al parsear causa del error:', e);
        }
      }

      return res.status(500).json({
        error: error.message || 'Error al crear preferencia',
        details: errorDetails,
        public_key: publicKey
      });
    }
  } catch (error) {
    console.error('❌ Error general al crear preferencia:', error);
    return res.status(500).json({
      error: error.message || 'Error al crear preferencia',
      details: error.cause,
      public_key: process.env.VITE_MP_PUBLIC_KEY || 'TEST-064a6d85-da9f-4dea-9587-d0e7da336abc'
    });
  }
};

/**
 * Recibe notificaciones de pago de Mercado Pago
 */
export const handleWebhook = async (req, res) => {
  try {
    // Permitir cookies cross-origin de Mercado Pago
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-meli-session-id');

    console.log('Webhook recibido:', req.method, req.query);

    // Para notificaciones IPN (Instant Payment Notification)
    if (req.query.topic === 'payment') {
      const paymentId = req.query.id;

      // Obtener información del pago
      const payment = new Payment(client);
      const result = await payment.get({ id: paymentId });

      console.log('Notificación IPN de pago recibida:', {
        id: result.id,
        status: result.status,
        status_detail: result.status_detail,
        external_reference: result.external_reference
      });

      // Si el pago fue aprobado, procesar la información
      if (result.status === 'approved') {
        // Aquí deberíamos guardar en la base de datos o realizar otras acciones
        // como enviar un email de confirmación, actualizar inventario, etc.

        // Ejemplo de registro
        console.log('¡Pago aprobado!', {
          payment_id: result.id,
          amount: result.transaction_amount,
          status: result.status,
          external_reference: result.external_reference
        });
      }
    }

    // Siempre responder OK a Mercado Pago
    return res.status(200).send('OK');
  } catch (error) {
    console.error('Error al procesar webhook:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Procesa un pago directo con Checkout API usando CardForm
 */
export const processApiPayment = async (req, res) => {
  try {
    const { formData, serviceId, servicePrice, userName, email: bodyEmail } = req.body;

    console.log('Procesando pago directo con Checkout API:', {
      serviceId,
      token: formData.token ? formData.token.substring(0, 10) + '...' : 'no token',
      amount: servicePrice,
      email: bodyEmail || formData.cardholderEmail || 'no proporcionado'
    });

    if (!formData || !formData.token) {
      return res.status(400).json({
        status: 'rejected',
        detail: 'Datos de tarjeta inválidos o faltantes'
      });
    }

    // Crear un pago utilizando la API de Checkout API
    const payment_data = {
      transaction_amount: Number(servicePrice),
      token: formData.token,
      description: `Servicio de ${serviceId}`,
      installments: Number(formData.installments) || 1,
      payment_method_id: formData.paymentMethodId,
      issuer_id: formData.issuerId,
      payer: {
        email: formData.cardholderEmail || bodyEmail || 'cliente@example.com',
        identification: {
          type: formData.identificationType,
          number: formData.identificationNumber
        }
      }
    };

    // Agregar device_id si está disponible
    const deviceId = req.headers['x-meli-session-id'] || '';
    if (deviceId) {
      console.log('Device ID recibido para pago:', deviceId.substring(0, 10) + '...');
    }

    // Creamos un header único para idempotencia
    const requestOptions = {
      idempotencyKey: `payment-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
    };

    // Realizamos la petición a Mercado Pago
    const payment = new Payment(client);
    const result = await payment.create({ body: payment_data, requestOptions });

    console.log('Resultado del pago:', {
      status: result.status,
      status_detail: result.status_detail,
      id: result.id
    });

    // Responder con el resultado del pago
    return res.status(200).json({
      status: result.status,
      detail: result.status_detail,
      id: result.id
    });
  } catch (error) {
    console.error('Error al procesar pago API:', error);

    // Manejo específico de errores conocidos
    let errorDetail = error.message || 'Error desconocido al procesar el pago';

    // Si es un error de Mercado Pago, extraer detalles específicos
    if (error.cause) {
      try {
        const apiError = typeof error.cause === 'string'
          ? JSON.parse(error.cause)
          : error.cause;

        if (apiError.error) {
          errorDetail = apiError.error;
        } else if (apiError.message) {
          errorDetail = apiError.message;
        }
      } catch (e) {
        console.error('Error al parsear causa del error:', e);
      }
    }

    return res.status(500).json({
      status: 'rejected',
      detail: errorDetail,
      error: true
    });
  }
};

/**
 * Registra un intento de pago desde el frontend
 */
export const notifyPaymentAttempt = async (req, res) => {
  try {
    const { serviceId, paymentMethod, preference, email, amount } = req.body;

    console.log('Intento de pago notificado:', {
      serviceId,
      method: paymentMethod,
      preference,
      email
    });

    // Aquí podríamos guardar esta información en una base de datos
    // para fines de seguimiento, remarketing, etc.

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error al registrar intento de pago:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error desconocido'
    });
  }
};

// Función para registrar el servicio adquirido después de un pago
async function registerUserService(paymentData, req) {
  try {
    // Extraer datos relevantes del pago
    const {
      serviceId,
      userEmail,
      userId,
      amount,
      paymentId,
      status,
      // Datos del cliente
      fullName,
      contactName,
      // Campos opcionales
      phone = "",
      company = "",
    } = paymentData;

    // Obtener información adicional del pago
    let payerInfo = null;
    if (paymentData.additionalInfo && paymentData.additionalInfo.payer) {
      payerInfo = {
        name: paymentData.additionalInfo.payer.firstName + ' ' + (paymentData.additionalInfo.payer.lastName || ''),
        email: paymentData.additionalInfo.payer.email,
        identification: paymentData.additionalInfo.payer.identification
      };
    }

    // Construir petición a la API
    const serviceData = {
      serviceId,
      serviceType: serviceId, // Usar el mismo ID como tipo por defecto
      paymentId: paymentId || `mp_${Date.now()}`,
      paymentStatus: status || 'approved',
      userEmail,
      amount,
      // Datos explícitos de cliente
      fullName: fullName || (payerInfo ? payerInfo.name : null),
      contactName: contactName || fullName || (payerInfo ? payerInfo.name : null),
      email: userEmail || (payerInfo ? payerInfo.email : null),
      // Datos opcionales
      phone,
      company,
      // Información del pagador
      payerInfo,
      // Datos adicionales
      details: {
        fullName: fullName || (payerInfo ? payerInfo.name : null) || 'Usuario',
        contactName: contactName || fullName || (payerInfo ? payerInfo.name : null) || 'Usuario',
        email: userEmail || (payerInfo ? payerInfo.email : null) || '',
        phone,
        company,
        serviceId,
        paymentDate: new Date().toISOString(),
        paymentAmount: amount,
        paymentStatus: status || 'approved'
      }
    };

    console.log('🔄 Registrando servicio de usuario con datos:', JSON.stringify(serviceData, null, 2));

    // Configurar los headers de autorización
    let headers = {};
    if (req && req.headers.authorization) {
      headers.authorization = req.headers.authorization;
    } else if (userId) {
      // Crear un token JWT temporal
      const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
      headers.authorization = `Bearer ${token}`;
    }

    // Registrar el servicio en la API
    const response = await fetch(`${process.env.VITE_API_URL || 'http://localhost:5001/api'}/users/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(serviceData)
    });

    if (!response.ok) {
      throw new Error(`Error al registrar servicio: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Servicio registrado correctamente:', result);

    return result;
  } catch (error) {
    console.error('❌ Error en registerUserService:', error.message);
    throw error;
  }
}

// Implementaciones para las rutas de reembolso
export const requestRefund = (req, res) => {
  // Redirigir a la implementación en refundController
  return refundController.requestRefund(req, res);
};

export const processRefund = async (req, res) => {
  // Implementación básica 
  try {
    // Verificar autorización
    if (!req.headers.authorization) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Reembolso procesado exitosamente'
    });
  } catch (error) {
    console.error('Error al procesar reembolso:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar el reembolso',
      error: error.message
    });
  }
};

export const getRefundsList = async (req, res) => {
  // Implementación básica
  try {
    return res.status(200).json({
      success: true,
      refunds: []
    });
  } catch (error) {
    console.error('Error al obtener lista de reembolsos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de reembolsos',
      error: error.message
    });
  }
}; 