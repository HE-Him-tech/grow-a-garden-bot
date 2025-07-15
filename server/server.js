import http from 'http';

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running\n');
});

server.listen(PORT, () => {
  console.log(`✅ Server is listening on port ${PORT}`);
});