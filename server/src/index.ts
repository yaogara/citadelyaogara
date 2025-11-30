import express from 'express';
import { createServer } from 'http';
import os from 'os';
import path from 'path';
import { Server } from 'socket.io';
import { initSocket } from './socket/server';

const app = express();
const http = createServer(app);
const port = process.env.PORT || 8081;
const host = process.env.HOST || '0.0.0.0';

function getLanAddresses() {
  const nets = os.networkInterfaces();
  const addresses: string[] = [];
  Object.values(nets).forEach((net) => {
    net?.forEach((details) => {
      if (details.family === 'IPv4' && !details.internal) {
        addresses.push(details.address);
      }
    });
  });
  return addresses;
}

// redirect to https - disabled for local dev
// app.enable('trust proxy');
// app.all('*', (req, res, next) => {
//   if (req.ip !== '::1' && req.ip !== '::ffff:127.0.0.1' && !req.secure) {
//     res.redirect(`https://${req.hostname}${req.url}`);
//   } else {
//     next();
//   }
// });

const io = new Server(http, {
  path: '/s/',
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});
initSocket(io);

const uiDistPath = path.join(__dirname, '../../ui/dist');
app.use(express.static(uiDistPath));
app.get('*', (_, res) => {
  res.sendFile(path.join(uiDistPath, 'index.html'));
});

http.listen(Number(port), host, () => {
  console.log(`Citadels game server listening on http://${host}:${port}`);
  const lanAddresses = getLanAddresses();
  if (lanAddresses.length > 0) {
    console.log('LAN access points:');
    lanAddresses.forEach((addr) => console.log(`  http://${addr}:${port}`));
  }
});
