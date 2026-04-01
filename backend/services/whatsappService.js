import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';

// Initialize the WhatsApp Client
export const whatsappClient = new Client({
    authStrategy: new LocalAuth(),
    // FIX: Force a specific stable web version to prevent "Execution context was destroyed"
    // This ensures the library doesn't crash when WhatsApp updates its web interface
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    },
    puppeteer: {
        headless: true, // Set to true for background stability; false for debugging
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
    }
});

let isReady = false;

// Generate QR Code in the terminal
whatsappClient.on('qr', (qr) => {
    console.clear();
    console.log('\n==================================================');
    console.log('📱 SCAN THIS QR CODE WITH YOUR WHATSAPP TO ENABLE ALERTS');
    console.log('==================================================\n');
    qrcode.generate(qr, { small: true });
    console.log('⏱️ Quick! Scan it here to re-link your account.');
});

// When successfully authenticated
whatsappClient.on('ready', () => {
    console.log('✅ WhatsApp Bot is Ready! Connected successfully.');
    isReady = true;
});

// Handle authentication failures
whatsappClient.on('auth_failure', msg => {
    console.error('❌ WhatsApp Authentication failure. If this persists, delete .wwebjs_auth folder.');
});

// Added disconnection handler to reset state
whatsappClient.on('disconnected', (reason) => {
    console.log('❌ WhatsApp was logged out:', reason);
    isReady = false;
});

// ============================================
// SEND WHATSAPP MESSAGE FUNCTION (TO DONOR)
// ============================================
export const sendWhatsAppAlert = async (phone, bloodGroup, actionLink) => {
    if (!isReady) {
        console.log(`⚠️ WhatsApp is not ready yet. Skipping message to ${phone}`);
        return false;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const chatId = `91${cleanPhone}@c.us`;

    const message = `🚨 *URGENT BLOOD REQUEST* 🚨\n\nA patient nearby is in critical need of *${bloodGroup}* blood.\n\nIf you are ready and available to donate right now, please click the link below to accept the request and save a life:\n\n👉 ${actionLink}\n\n_BloodLocator System_`;

    try {
        await whatsappClient.sendMessage(chatId, message);
        console.log(`✅ WhatsApp Alert successfully sent to +91-${cleanPhone}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send WhatsApp to ${cleanPhone}:`, error.message);
        return false;
    }
};

// ============================================
// SEND WHATSAPP SUCCESS MESSAGE TO PATIENT
// ============================================
export const sendPatientSuccessWhatsApp = async (patientPhone, donorName, donorPhone) => {
    if (!isReady) {
        console.log(`⚠️ WhatsApp is not ready yet. Skipping success message to patient.`);
        return false;
    }

    const cleanPhone = patientPhone.replace(/\D/g, '').slice(-10);
    const chatId = `91${cleanPhone}@c.us`;

    const message = `✅ *GOOD NEWS!*\n\nDonor *${donorName}* has accepted your emergency blood request.\n\nPlease contact them immediately at: ${donorPhone}\n\n_BloodLocator System_`;

    try {
        await whatsappClient.sendMessage(chatId, message);
        console.log(`✅ WhatsApp Success Alert sent to Patient: +91-${cleanPhone}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send WhatsApp to patient ${cleanPhone}:`, error.message);
        return false;
    }
};

// ============================================
// SEND WHATSAPP "STAND-DOWN" TO OTHER DONORS
// ============================================
export const sendRequestClosedWhatsApp = async (phone) => {
    if (!isReady) return false;

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const chatId = `91${cleanPhone}@c.us`;

    const message = `ℹ️ *UPDATE* ℹ️\n\nThank you for your willingness to help! Another donor has just accepted the emergency blood request, so your assistance is no longer needed for this specific emergency.\n\nWe appreciate your commitment to saving lives!\n\n_BloodLocator System_`;

    try {
        await whatsappClient.sendMessage(chatId, message);
        console.log(`ℹ️ WhatsApp 'Request Closed' Alert sent to +91-${cleanPhone}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send closed WhatsApp to ${cleanPhone}:`, error.message);
        return false;
    }
};