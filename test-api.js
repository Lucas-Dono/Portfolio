#!/usr/bin/env node

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

console.log('🔍 Iniciando diagnóstico de API...\n');

// Función para hacer peticiones con timeout
async function makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        clearTimeout(timeoutId);

        const text = await response.text();
        let data;

        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }

        return {
            status: response.status,
            statusText: response.statusText,
            data,
            headers: Object.fromEntries(response.headers.entries())
        };
    } catch (error) {
        clearTimeout(timeoutId);
        return {
            error: error.message,
            status: 0
        };
    }
}

// Tests
async function runTests() {
    const tests = [
        {
            name: 'Health Check (root)',
            url: `${API_BASE}/`,
            method: 'GET'
        },
        {
            name: 'Health Check (/health)',
            url: `${API_BASE}/health`,
            method: 'GET'
        },
        {
            name: 'API Health (/api/health)',
            url: `${API_BASE}/api/health`,
            method: 'GET'
        },
        {
            name: 'Servicios API',
            url: `${API_BASE}/api/servicios`,
            method: 'GET'
        },
        {
            name: 'Addons API',
            url: `${API_BASE}/api/addons`,
            method: 'GET'
        },
        {
            name: 'Auth Register (POST)',
            url: `${API_BASE}/api/auth/register`,
            method: 'POST',
            body: {
                name: 'Test User',
                email: 'test@example.com',
                password: 'test123'
            }
        },
        {
            name: 'Auth Login (POST)',
            url: `${API_BASE}/api/auth/login`,
            method: 'POST',
            body: {
                email: 'test@example.com',
                password: 'test123'
            }
        }
    ];

    for (const test of tests) {
        console.log(`\n🧪 Probando: ${test.name}`);
        console.log(`📍 URL: ${test.url}`);

        const options = {
            method: test.method
        };

        if (test.body) {
            options.body = JSON.stringify(test.body);
        }

        const result = await makeRequest(test.url, options);

        if (result.error) {
            console.log(`❌ Error: ${result.error}`);
        } else {
            console.log(`✅ Status: ${result.status} ${result.statusText}`);

            if (typeof result.data === 'string' && result.data.length > 200) {
                console.log(`📄 Response: ${result.data.substring(0, 200)}...`);
            } else {
                console.log(`📄 Response:`, result.data);
            }

            // Mostrar headers importantes
            const importantHeaders = ['content-type', 'set-cookie', 'access-control-allow-origin'];
            const headers = {};
            importantHeaders.forEach(header => {
                if (result.headers[header]) {
                    headers[header] = result.headers[header];
                }
            });

            if (Object.keys(headers).length > 0) {
                console.log(`📋 Headers importantes:`, headers);
            }
        }
    }

    console.log('\n🏁 Diagnóstico completado');
}

runTests().catch(console.error); 