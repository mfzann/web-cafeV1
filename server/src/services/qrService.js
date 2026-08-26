import QRCode from 'qrcode';

export async function generateTableQRCode(tableNumber, hostUrl = 'http://localhost:5188') {
  const orderUrl = `${hostUrl}/order?table=${tableNumber}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(orderUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      scale: 8,
      color: {
        dark: '#1e293b', // Slate 800
        light: '#ffffff'
      }
    });
    return {
      orderUrl,
      qrDataUrl
    };
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
}
