// apps/backend/index.ts
import { Socket } from 'net';

// export const sendToTaxDevice = async (data) => {
//   return new Promise((resolve, reject) => {
//     console.log('📤 Sending data to tax device:', data);
//     resolve(Buffer.from('ACK')); // Simulate an ACK response for testing
    // const taxDeviceIP = '192.168.0.100';
    // const taxDevicePort = 1234;

    // const socket = new Socket();

    // socket.connect(taxDevicePort, taxDeviceIP, () => {
    //   console.log('✅ Connected to tax device');
    //   socket.write(data);
    // });

    // socket.on('data', (response) => {
    //   console.log('📨 Response from tax device:', response);
    //   resolve(response);
    //   socket.end();
    // });

    // socket.on('error', (err) => {
    //   console.error('❌ Socket error:', err);
    //   reject(err);
    // });

    // socket.on('close', () => {
    //   console.log('🔌 Connection closed');
    // });
//   });
// };
