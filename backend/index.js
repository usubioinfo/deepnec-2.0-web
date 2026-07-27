// Author: Naveen Duhan
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const apiPort = process.env.PORT || 3365;
const routes = require('./src/routes/deepnec-routes');

// 1. Security Headers via Helmet
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 2. Production CORS Restriction
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:3365', 'http://127.0.0.1:3000', 'http://127.0.0.1:3365', 'https://kaabil.net'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('CORS policy restriction: Origin not allowed.'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Rate Limiter for Prediction Endpoints
const predictionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 30 prediction requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many prediction requests from this IP, please try again after 15 minutes." }
});

app.use('/api/prediction', predictionLimiter);
app.use('/api/nextpred', predictionLimiter);

// 4. Request Body Size Limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Mount API Routes (Controlled download endpoints handle file access; no public /api/tmp exposure)
app.use("/api", routes);

// 6. Serve the production frontend from the same origin as the API.
const frontendBuild = path.join(__dirname, 'frontend', 'build');
app.use('/deepnec-2.0', express.static(frontendBuild));
app.use('/deepnec-2.0', (req, res, next) => {
    const indexFile = path.join(frontendBuild, 'index.html');
    if (req.method === 'GET' && path.extname(req.path) === '' && require('fs').existsSync(indexFile)) {
        return res.sendFile(indexFile);
    }
    return next();
});

if (require.main === module) {
    app.listen(apiPort, () => console.log(`DeepNEC 2.0 Web server running securely on port ${apiPort}`));
}

module.exports = app;
