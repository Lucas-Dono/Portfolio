// Script para probar si Puppeteer puede iniciar Chromium correctamente
import puppeteer from 'puppeteer-core';
import { puppeteerOptions } from './server/whatsapp-config.js';

console.log('🔍 Iniciando test de Puppeteer con Chromium...');
console.log('📂 Ruta de Chromium:', puppeteerOptions.executablePath);
console.log('🔧 Opciones:', JSON.stringify(puppeteerOptions.args, null, 2));

(async () => {
    try {
        console.log('🚀 Iniciando navegador...');
        const browser = await puppeteer.launch(puppeteerOptions);

        console.log('✅ Navegador iniciado correctamente');
        console.log('📊 Versión del navegador:', await browser.version());

        console.log('🔍 Abriendo nueva página...');
        const page = await browser.newPage();

        console.log('🌐 Navegando a example.com...');
        await page.goto('https://example.com');

        console.log('📝 Obteniendo título de la página...');
        const title = await page.title();
        console.log('📄 Título:', title);

        console.log('🔄 Cerrando navegador...');
        await browser.close();

        console.log('✅ Test completado exitosamente');
    } catch (error) {
        console.error('❌ Error durante el test de Puppeteer:', error);
        process.exit(1);
    }
})(); 