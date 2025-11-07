// api/send.js
const axios = require('axios');
const qs = require('qs');
const crypto = require('crypto');

function normalizeNumber(raw) {
  let number = raw.replace(/\D/g, '');
  if (number.startsWith('09')) return '+63' + number.slice(1);
  if (number.startsWith('9') && number.length === 10) return '+63' + number;
  if (number.startsWith('63') && number.length === 12) return '+' + number;
  if (number.startsWith('+63') && number.length === 13) return number;
  return null;
}

function generateDeviceId() {
  return crypto.randomBytes(8).toString('hex'); // fixed 😎 bug
}

function randomUserAgent() {
  const agents = [
    'Dalvik/2.1.0 (Linux; Android 10; TECNO KE5 Build/QP1A.190711.020)',
    'Dalvik/2.1.0 (Linux; Android 11; Infinix X6810 Build/RP1A.200720.011)',
    'Dalvik/2.1.0 (Linux; Android 12; itel L6506 Build/SP1A.210812.016)',
    'Dalvik/2.1.0 (Linux; Android 14; TECNO KL4 Build/UP1A.231005.007)'
  ];
  return agents[Math.floor(Math.random() * agents.length)];
}

// ✅ Export default handler for Vercel
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Only GET allowed' });
  }

  const { number, message, sender = 'Anonymous' } = req.query;
  if (!number || !message) {
    return res.status(400).json({ success: false, error: 'Missing number or message' });
  }

  const normalized = normalizeNumber(number);
  if (!normalized) {
    return res.status(400).json({ success: false, error: 'Invalid number format' });
  }

  const suffix = '-FSMS';
  const messageWithSuffix = message.endsWith(suffix) ? message : `${message} ${suffix}`;
  const formattedMessage = `👤From: ${sender}\n\n${messageWithSuffix}\n`;
  const credits = '\nThis Message was sent using libre text\nMade by: ICT-1 MIL-GROUP3';
  const finalMessage = formattedMessage + credits;

  const payload = [
    'free.text.sms',
    '412',
    normalized,
    'DEVICE',
    'fjsx9-G7QvGjmPgI08MMH0:APA91bGcxiqo05qhojnIdWFYpJMHAr45V8-kdccEshHpsci6UVaxPH4X4I57Mr6taR6T4wfsuKFJ_T-PBcbiWKsKXstfMyd6cwdqwmvaoo7bSsSJeKhnpiM',
    finalMessage,
    ''
  ];

  const postData = qs.stringify({
    humottaee: 'Processing',
    '$Oj0O%K7zi2j18E': JSON.stringify(payload),
    device_id: generateDeviceId()
  });

  try {
    const response = await axios.post('https://sms.m2techtronix.com/v13/sms.php', postData, {
      headers: {
        'User-Agent': randomUserAgent(),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const status = response.data.message || 'Message sent successfully';
    const isSuccess = !status.toLowerCase().includes('not allowed');

    res.json({
      success: isSuccess,
      data: {
        recipient: normalized,
        sender,
        message,
        status,
        credits: 'Web Devs: SairaDevs'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
      details: error.response?.data || error.message
    });
  }
}
