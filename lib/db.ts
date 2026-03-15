import sql from 'mssql';
import process from 'node:process';

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER!,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

export async function getConnection() {
    try {
        return await sql.connect(config);
    } catch (err) {
        console.error('Error de conexión SQL:', err);
        throw err;
    }
}