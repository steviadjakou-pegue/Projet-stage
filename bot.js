const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pino = require('pino');

// 1. PLACEZ VOTRE CLÉ API GEMINI DIRECTEMENT ICI ENTRÉ LES GUILLEMETS :
const GEMINI_API_KEY = "AIzaSyBVuAR5ZBI_LbnNYSYLZnbnf6mSiFXsOm0";

// Configuration de l'IA Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", system_instruction: "tu es un assistant intelligent et utile, ayant pour nom Ana . Repondre de maniere claire et simple ,si tu ne comprends pas demande des precisions ne donne pas de faussses informations et enfin tu dois etre poli " });

async function startBot() {
    // 2. Gestion de la session locale dans le dossier 'auth_info'
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }), // Désactive les logs système inutiles
        printQRInTerminal: false
    });

    // 3. Gestion de la connexion WhatsApp
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // Affichage du QR code dans Termux
        if (qr) {
            console.log('\n--- SCANNEZ CE QR CODE AVEC WHATSAPP ---');
            qrcode.generate(qr, { small: true });
        }

        // Reconnexion automatique
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connexion interrompue. Reconnexion automatique...', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('Félicitations ! Le bot est connecté à WhatsApp.');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // 4. Écoute et traitement des messages
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];

        if (!msg.message || msg.key.fromMe) return;

        const remoteJid = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (!text) return;
        console.log(`Message reçu : "${text}"`);

        try {
            // Appel direct à Gemini
            const result = await model.generateContent(text);
            const responseText = result.response.text();

            // Réponse sur WhatsApp
            await sock.sendMessage(remoteJid, { text: responseText });
        } catch (error) {
            console.error("Erreur Gemini :", error);
            await sock.sendMessage(remoteJid, { text: "Mince, j'ai rencontré un problème technique avec mon IA." });
        }
    });
}

// Lancement du bot
startBot();

