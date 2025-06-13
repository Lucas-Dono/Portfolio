// Configuración para WhatsApp Web.js
export const puppeteerOptions = {
    executablePath: '/usr/bin/chromium-browser',
    headless: 'new',
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-software-rasterizer',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        '--remote-debugging-port=9222'
    ]
};

export default { puppeteerOptions };
