const fs = require('fs');
const { createServer } = require('http');
const { parse } = require('url');

const next = require('next');

const dev = process.env.NODE_ENV !== 'production';

console.log('Starting Next.js server...');
console.log('Environment:', process.env.NODE_ENV);

// Initialiser l'application Next.js
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialiser l'application Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare()
    .then(() => {
        console.log('Next.js app prepared successfully');

        const server = createServer(async (req, res) => {
            try {
                const parsedUrl = parse(req.url, true);
                await handle(req, res, parsedUrl);
            } catch (err) {
                console.error('Error handling request:', err);
                res.statusCode = 500;
                res.end('Internal Server Error');
            }
        });

        server.on('error', (err) => {
            console.error('Server error:', err);
        });

        // Supprimer le socket Passenger s'il existe
        const passengerSocket = '/tmp/passenger.sock';
        if (fs.existsSync(passengerSocket)) {
            try {
                fs.unlinkSync(passengerSocket);
                console.log('Removed existing Passenger socket');
            } catch (err) {
                console.error('Error removing Passenger socket:', err);
            }
        }

        server.listen('passenger', (err) => {
            if (err) {
                console.error('Failed to start server:', err);
                process.exit(1);
            }
            console.log(`> Server is running on http://${hostname}:${port}`);
        });
    })
    .catch((err) => {
        console.error('Failed to prepare Next.js app:', err);
        process.exit(1);
    });

// Gestion des erreurs non capturées
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
