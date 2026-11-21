const app = require('./src/app');
const config = require('./src/config');

const server = app.listen(config.port, () => {
  console.log(`🚀 Student OD & Leave Backend running on port ${config.port} [${config.nodeEnv}]`);
});

// Keep process active in background
setInterval(() => {}, 1000 * 60 * 60);

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
  server.close(() => {
    process.exit(1);
  });
});
