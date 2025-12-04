import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { Server } from 'socket.io';
import history from 'connect-history-api-fallback';
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

app.use(history());

const clientDistPath = path.resolve(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDistPath));

http.listen(port, () => {
  console.log(`Citadels game server listening on http://localhost:${port}`);
});
