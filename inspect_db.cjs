const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function loadEnv() {
    try {
        const envPath = path.join(__dirname, 'backend', '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, '');
                process.env[key] = value;
            }
        });
    } catch (e) {
    }
}

loadEnv();

async function inspect() {
    const config = process.env.DATABASE_URL ? {
        connectionString: process.env.DATABASE_URL,
        ssl: false
    } : {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT) || 5432,
        database: process.env.POSTGRES_DB || 'gestion_pedidos',
        user: process.env.POSTGRES_USER || 'pigmea_user',
        password: process.env.POSTGRES_PASSWORD,
        ssl: false
    };

    const pool = new Pool(config);
    let output = '';

    try {
        const queries = [
            "SELECT count(*) FROM public.pedidos",
            "SELECT count(*) FROM limpio.pedidos",
            "SELECT count(*) FROM public.materiales",
            "SELECT count(*) FROM limpio.materiales"
        ];

        for (const q of queries) {
            try {
                const res = await pool.query(q);
                output += `${q}: ${res.rows[0].count}\n`;
            } catch (e) {
                output += `${q}: ERROR - ${e.message}\n`;
            }
        }

    } catch (e) {
        output += "Connection error: " + e.message + "\n";
    } finally {
        await pool.end();
        fs.writeFileSync('db_report.txt', output);
    }
}

inspect();
