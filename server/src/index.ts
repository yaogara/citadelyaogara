import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { Server } from 'socket.io';
import { initSocket } from './socket/server';

const app = express();
const http = createServer(app);
const port = process.env.PORT || 8081;

// redirect to https - disabled for local dev
// app.enable('trust proxy');
// app.all('*', (req, res, next) => {
//   if (req.ip !== '::1' && req.ip !== '::ffff:127.0.0.1' && !req.secure) {
//     res.redirect(`https://${req.hostname}${req.url}`);
//   } else {
//     next();
//   }
// });

const io = new Server(http, { path: '/s/' });
initSocket(io);

const uiDistPath = path.join(__dirname, '../../ui/dist');
app.use(express.static(uiDistPath));
app.get('*', (_, res) => {
  res.sendFile(path.join(uiDistPath, 'index.html'));
});

http.listen(port, () => {
  console.log(`Citadels game server listening on http://localhost:${port}`);
});
