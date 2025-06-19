import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import * as refundController from './refundController.js';
import crypto from 'crypto';
import { StockManager } from '../models/StockManagement.js';

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

      // Crear notificación de pago exitoso
      try {
        const { notify } = require('./notificationController');
        await notify('PAYMENT_SUCCESS', {
          email: email,
          amount: servicePrice,
          paymentMethod: formData.paymentMethodId || 'Mercado Pago',
          transactionId: result?.id || 'N/A',
          serviceType: serviceType || serviceId,
          customerName: fullName || userName
        });
      } catch (notificationError) {
        console.error('Error creando notificación de pago:', notificationError);
      }
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
    if (!origin) {
      return res.status(400).json({
        error: 'Origen no permitido',
        message: 'Se requiere un origen válido para procesar el pago'
      });
    }

    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-HTTP-Method-Override, ' +
      'x-meli-session-id, device-id, x-idempotency-key, x-flow-id, x-product-id, x-tracking-id, Cookie, Set-Cookie');
    res.header('Access-Control-Expose-Headers', 'Set-Cookie, Content-Disposition');

    // Generar un ID único para la preferencia
    const preferenceId = `pref_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Establecer cookie de preferencia
    res.cookie('mp-preference-id', preferenceId, {
      sameSite: 'none',
      secure: true,
      httpOnly: true,
      path: '/',
      maxAge: 3600000 // 1 hora
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

    // Datos para Checkout API - Configuración simplificada
    const preferenceData = {
      items: [
        {
          id: serviceId,
          title: serviceTitle,
          description: `Servicio de ${serviceTitle}`,
          quantity: 1,
          unit_price: Number(servicePrice),
          currency_id: "ARS"
        }
      ],
      payer: {
        name: userName,
        email: req.body.email || 'cliente@example.com'
      },
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl
      },
      external_reference: `service_${serviceId}_${Date.now()}`,
      site_id: "MLA",
      auto_return: "approved",
      notification_url: `${baseUrl}/api/payments/webhook`,
      statement_descriptor: "CIRCUITPROMPT",
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
    };

    console.log('📋 Creando preferencia con datos simplificados:', JSON.stringify(preferenceData, null, 2));

    // Crear la preferencia
    const preference = new Preference(client);
    const result = await preference.create({ body: preferenceData });

    console.log('✅ Preferencia creada con ID:', result.id);

    // Establecer cookie con el ID de la preferencia creada
    res.cookie('mp-created-preference-id', result.id, {
      sameSite: 'none',
      secure: true,
      httpOnly: true,
      path: '/',
      maxAge: 3600000 // 1 hora
    });

    // Redirigir al checkout
    const checkoutUrl = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${result.id}`;
    console.log('🔄 Iniciando redirección a:', checkoutUrl);

    return res.status(200).json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
      public_key: publicKey
    });

  } catch (error) {
    console.error('❌ Error al crear preferencia:', error);
    return res.status(500).json({
      error: 'Error al crear la preferencia de pago',
      message: error.message
    });
  }
};

/**
 * Recibe notificaciones de pago y otros eventos de Mercado Pago
 */
export const handleWebhook = async (req, res) => {
  try {
    console.log('Webhook recibido:', {
      method: req.method,
      query: req.query,
      headers: req.headers,
      body: req.body
    });

    // Validar la firma del webhook (¡MUY IMPORTANTE para producción!)
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (secret) {
      const xSignature = req.headers['x-signature'];
      const xRequestId = req.headers['x-request-id'];

      if (!xSignature || !xRequestId) {
        console.warn('Webhook sin firma o request-id. Ignorando.');
        return res.status(400).send('Firma o Request ID faltante.');
      }

      const [ts, hash] = xSignature.split(',');
      if (!ts || !hash) {
        console.warn('Formato de firma inválido:', xSignature);
        return res.status(400).send('Formato de firma inválido.');
      }
      const key = hash.substring(3);

      const manifest = `id:${req.query.id};request-id:${xRequestId};ts:${ts.substring(3)};`;

      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(manifest);
      const expectedSignature = hmac.digest('hex');

      if (key !== expectedSignature) {
        console.warn('Firma de Webhook inválida.', {
          receivedSignature: key,
          expectedSignature: expectedSignature,
          manifest: manifest,
        });
        return res.status(403).send('Firma inválida.');
      }
      console.log('Firma de Webhook validada exitosamente.');
    } else {
      console.warn('MP_WEBHOOK_SECRET no está configurado. La validación de firma se omitirá (NO RECOMENDADO PARA PRODUCCIÓN).');
    }

    const { topic, id, type, action } = req.query;

    if (topic === 'payment' || type === 'payment') {
      const paymentId = id || req.body?.data?.id;

      if (!paymentId) {
        console.error('No se pudo obtener paymentId del webhook:', req.query, req.body);
        return res.status(400).send('ID de pago faltante.');
      }

      const paymentInstance = new Payment(client);
      const paymentInfo = await paymentInstance.get({ id: paymentId });

      console.log('Notificación de Pago/Estado recibida:', {
        id: paymentInfo.id,
        status: paymentInfo.status,
        status_detail: paymentInfo.status_detail,
        external_reference: paymentInfo.external_reference,
        topic: topic,
        type: type,
        action: action
      });

      switch (paymentInfo.status) {
        case 'approved':
          console.log('Pago aprobado:', paymentInfo.id);
          break;
        case 'pending':
        case 'in_process':
          console.log('Pago pendiente/en proceso:', paymentInfo.id, paymentInfo.status);
          break;
        case 'rejected':
        case 'cancelled':
          console.log('Pago rechazado/cancelado:', paymentInfo.id, paymentInfo.status);
          break;
        case 'refunded':
          console.log('Pago reembolsado:', paymentInfo.id);
          break;
        case 'charged_back':
          console.log('Contracargo recibido para el pago:', paymentInfo.id);
          break;
        default:
          console.log('Estado de pago no manejado explícitamente:', paymentInfo.status, paymentInfo.id);
      }

    } else if (topic === 'merchant_order' || type === 'merchant_order') {
      const merchantOrderId = id || req.body?.data?.id;
      console.log('Notificación de Orden de Comerciante recibida:', { merchantOrderId, query: req.query, body: req.body });

    } else if (topic === 'refund' || type === 'refund') {
      const refundId = id || req.body?.resource?.match(/refunds\/(\d+)/)?.[1] || req.body?.data?.id;
      if (!refundId) {
        console.error('No se pudo obtener refundId del webhook de reembolso:', req.query, req.body);
        return res.status(400).send('ID de reembolso faltante.');
      }
      console.log('Notificación de Reembolso recibida:', { refundId, query: req.query, body: req.body });

    } else if (topic === 'chargebacks' || type === 'chargebacks') {
      const chargebackId = id || req.body?.data?.id;
      if (!chargebackId) {
        console.error('No se pudo obtener chargebackId del webhook de contracargo:', req.query, req.body);
        return res.status(400).send('ID de contracargo faltante.');
      }
      console.log('Notificación de Contracargo recibida:', { chargebackId, query: req.query, body: req.body });

    } else {
      console.log('Webhook con topic/type no manejado explícitamente:', { topic, type, id });
    }

    return res.status(200).send('OK');

  } catch (error) {
    console.error('Error fatal al procesar webhook:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor al procesar webhook' });
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

// Función para mapear serviceId a planType para el sistema de stock
function mapServiceToPlanType(serviceId) {
  const servicePlanMap = {
    'landing-basico': 'basico',
    'landing-estandar': 'estandar',
    'landing-premium': 'premium',
    'landing-empresarial': 'empresarial',
    'ecommerce-basico': 'basico',
    'ecommerce-estandar': 'estandar',
    'ecommerce-premium': 'premium',
    'ecommerce-empresarial': 'empresarial',
    'blog-basico': 'basico',
    'blog-estandar': 'estandar',
    'blog-premium': 'premium',
    'blog-empresarial': 'empresarial',
    'portfolio-basico': 'basico',
    'portfolio-estandar': 'estandar',
    'portfolio-premium': 'premium',
    'portfolio-empresarial': 'empresarial'
  };

  // Si no encuentra mapeo específico, intentar extraer el plan del serviceId
  if (servicePlanMap[serviceId]) {
    return servicePlanMap[serviceId];
  }

  // Fallback: buscar palabras clave en el serviceId
  if (serviceId.includes('empresarial')) return 'empresarial';
  if (serviceId.includes('premium')) return 'premium';
  if (serviceId.includes('estandar')) return 'estandar';

  // Por defecto, asignar plan básico
  return 'basico';
}

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

    // **INTEGRACIÓN CON SISTEMA DE STOCK**
    // Determinar el tipo de plan y reservar stock antes de registrar el servicio
    const planType = mapServiceToPlanType(serviceId);
    console.log(`📦 Reservando stock para plan: ${planType} (servicio: ${serviceId})`);

    try {
      // Verificar disponibilidad del stock
      const availability = await StockManager.checkAvailability(planType);

      if (!availability.available) {
        console.error(`❌ Stock no disponible para plan ${planType}:`, availability.reason);

        // Si no hay stock disponible, agregar a cola de espera
        if (userEmail && fullName) {
          try {
            await StockManager.addToWaitingQueue(
              userId || `temp_${Date.now()}`,
              userEmail,
              fullName || contactName || 'Usuario',
              planType
            );
            console.log(`📋 Usuario agregado a cola de espera para plan ${planType}`);
          } catch (queueError) {
            console.error('Error al agregar a cola de espera:', queueError);
          }
        }

        throw new Error(`Stock no disponible para el plan ${planType}. ${availability.reason}`);
      }

      // Reservar stock para este pedido
      const stockReservation = await StockManager.reserveStock(
        planType,
        paymentId || `payment_${Date.now()}`,
        userId || `user_${Date.now()}`
      );

      console.log(`✅ Stock reservado exitosamente:`, stockReservation);

      // Agregar información del stock al serviceData
      serviceData.stockInfo = {
        planType,
        reservedWeight: stockReservation.reservedWeight,
        estimatedDelivery: stockReservation.estimatedDelivery,
        stockReservedAt: new Date().toISOString()
      };

    } catch (stockError) {
      console.error('❌ Error en gestión de stock:', stockError.message);

      // En caso de error de stock, no proceder con el registro del servicio
      throw new Error(`Error de stock: ${stockError.message}`);
    }

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