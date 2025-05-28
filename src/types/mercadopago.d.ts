// Definición de tipos para el SDK de MercadoPago
interface MercadoPagoInstance {
    checkout: (options: {
        preference: {
            id: string;
        };
        render: {
            container: string;
            label?: string;
            type?: 'wallet' | 'link' | 'button';
        };
        theme?: {
            elementsColor?: string;
            headerColor?: string;
        };
        autoOpen?: boolean;
        callbacks?: {
            onError?: (error: any) => void;
            onSubmit?: (data: any) => void;
            onReady?: () => void;
            onOpen?: () => void;
            onClose?: () => void;
        };
    }) => any;

    createCardToken: (cardInfo: any, callback?: (error: any, token: any) => void) => Promise<any>;
    getIdentificationTypes: (callback?: (error: any, data: any) => void) => Promise<any>;
    getPaymentMethods: (options: any, callback?: (error: any, data: any) => void) => Promise<any>;

    // Añadir el método bricks para la nueva versión del SDK
    bricks: () => {
        create: (type: string, elementId: string, options: any) => any;
    };
}

interface Window {
    MercadoPago: {
        new(publicKey: string, options?: any): MercadoPagoInstance;
    };
} 