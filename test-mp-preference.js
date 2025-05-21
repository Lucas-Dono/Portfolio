import { MercadoPagoConfig, Preference } from 'mercadopago';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const TEST_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
if (!TEST_ACCESS_TOKEN) {
  console.error('Error: MP_ACCESS_TOKEN no está definido en .env');
  process.exit(1);
}

// Configurar cliente de Mercado Pago
const client = new MercadoPagoConfig({ 
  accessToken: TEST_ACCESS_TOKEN 
});

async function createTestPreference() {
  try {
    // Datos básicos para la prueba
    const serviceId = 'test-service';
    const serviceTitle = 'Servicio de Prueba';
    const servicePrice = 100;
    const userName = 'Usuario de Prueba';
    
    // URL base para redirecciones
    const baseUrl = 'http://localhost:3000';
    const successUrl = `${baseUrl}/payment/success`;
    const failureUrl = `${baseUrl}/payment/failure`;
    const pendingUrl = `${baseUrl}/payment/pending`;
    
    console.log('URLs de retorno configuradas:', {
      success: successUrl,
      failure: failureUrl,
      pending: pendingUrl
    });
    
    // Datos para Checkout API (sin auto_return)
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
        name: userName,
        email: 'test@example.com'
      },
      payment_methods: {
        excluded_payment_types: [
          { id: 'ticket' },
          { id: 'atm' }
        ],
        installments: 12
      },
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl
      },
      notification_url: `${baseUrl}/api/payments/webhook`,
      external_reference: `service_${serviceId}_${Date.now()}`,
      statement_descriptor: 'Portfolio Services'
    };

    console.log('Datos completos de preferencia:', JSON.stringify(preferenceData, null, 2));

    // Crear la preferencia
    const preference = new Preference(client);
    const result = await preference.create({ 
      body: preferenceData,
      requestOptions: {
        idempotencyKey: `test-payment-${Date.now()}`
      }
    });
    
    console.log('Preferencia creada exitosamente:', {
      id: result.id,
      init_point: result.init_point
    });
    
    // Intentar una segunda prueba con auto_return
    console.log('\n--- Probando con auto_return ---\n');
    
    const preferenceDataWithAutoReturn = {
      ...preferenceData,
      auto_return: 'approved'
    };
    
    try {
      const resultWithAutoReturn = await preference.create({ 
        body: preferenceDataWithAutoReturn,
        requestOptions: {
          idempotencyKey: `test-payment-auto-return-${Date.now()}`
        }
      });
      
      console.log('Preferencia con auto_return creada exitosamente:', {
        id: resultWithAutoReturn.id,
        init_point: resultWithAutoReturn.init_point
      });
    } catch (autoReturnError) {
      console.error('Error al crear preferencia con auto_return:', {
        message: autoReturnError.message,
        error: autoReturnError.error,
        status: autoReturnError.status,
        cause: autoReturnError.cause
      });
    }
    
  } catch (error) {
    console.error('Error al crear preferencia:', {
      message: error.message,
      error: error.error,
      status: error.status,
      cause: error.cause
    });
  }
}

// Ejecutar la prueba
createTestPreference(); 