import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';
import process from 'node:process';

// Configuración de conexión a MSSQL
const dbConfig: sql.config = {
  user: process.env.DB_USER as string,
  password: process.env.DB_PASSWORD as string,
  server: process.env.DB_SERVER as string,
  database: process.env.DB_DATABASE as string,
  port: 1433, 
  options: {
    encrypt: true,
    trustServerCertificate: true,
    // --- ESTO ES LO QUE FALTA ---
    enableArithAbort: true,
    cryptoCredentialsDetails: {
      minVersion: 'TLSv1.2' // Fuerza la versión de TLS que usa el túnel de GitHub
    },
    tdsVersion: '7_4' // Versión del protocolo específica para SQL 2019/2022
  },
  pool: {
    max: 1,
    min: 0,
    idleTimeoutMillis: 30000
  },
  connectionTimeout: 30000
};
/**
 * Helper para ejecutar consultas SQL con parámetros
 */
async function executeQuery(queryText: string, params: Record<string, any> = {}) {
  console.log("Intentando conectar a:", dbConfig.server, "en puerto:", dbConfig.port);
  const pool = await sql.connect(dbConfig);
  const request = pool.request();
  Object.entries(params).forEach(([key, value]) => {
    request.input(key, value);
  });
  return await request.query(queryText);
}

/**
 * Formateador de Datos para el Mapa
 * Convierte las filas de SQL al formato AreaFeature que usa tu frontend
 */
function formatToAreaFeature(row: any) {
  const rawId = row.id_area_riego;
  const normalizedId = Array.isArray(rawId) ? rawId[0] : rawId;

  return {
    type: "Feature",
    id: normalizedId,
    geometry: {
      type: "Point",
      coordinates: [row.longitud, row.latitud],
    },
    properties: {
      name: row.nombre_area,
      cultivo: row.tipo_cultivo,
      general: {
        estado_id: row.estado_activo ? 1 : 0,
        superficie_ha: row.superficie_ha,
      },
      suelo: {
        humedad_actual: row.humedad_suelo || 0,
        capacidad_de_campo: row.capacidad_campo || 0,
        punto_de_marchitez: row.punto_marchitez || 0,
        conductividad_electrica_ds_m: row.conductividad_suelo || 0,
        temperatura_suelo_c: row.temperatura || 0,
      },
      riego: {
        sistema_activo: (row.humedad_suelo < row.punto_marchitez),
        consumo_mensual_m3: row.consumo_agua || 0,
        evapotranspiracion_etc_mm_dia: row.evapotranspiracion || 0,
      },
      ambiental: {
        temperatura_aire_c: row.temperatura_aire || 0,
        radiacion_solar_w_m2: row.radiacion_solar || 0,
      }
    },
  };
}

// --- HANDLERS ---

export async function GET(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  const path = resolvedParams.path || [];
  const [resource, id] = path;

  try {
    if (resource === 'area_riego') {
      const sqlText = id 
        ? `SELECT TOP 1 a.*, h.* FROM Area_Riego a 
           LEFT JOIN Datos_Historicos h ON a.id_area_riego = h.id_area_riego 
           WHERE a.id_area_riego = @id`
        : `SELECT a.*, h.* FROM Area_Riego a 
           OUTER APPLY (SELECT TOP 1 * FROM Datos_Historicos WHERE id_area_riego = a.id_area_riego) h`;

      const result = await executeQuery(sqlText, id ? { id } : {});
      
      if (id && result.recordset.length === 0) {
        return NextResponse.json({ message: 'No encontrado' }, { status: 404 });
      }

      const features = result.recordset.map(formatToAreaFeature);
      return NextResponse.json(id ? features[0] : features);
    }

    // CRUD Genérico para otras tablas
    const tableMap: Record<string, string> = {
      'usuarios': 'Usuarios',
      'alertas': 'Alertas',
      'datos_historicos': 'Datos_Historicos'
    };

    const tableName = tableMap[resource];
    if (!tableName) return NextResponse.json({ message: "Recurso no válido" }, { status: 404 });

    const pkName = `id_${resource === 'usuarios' ? 'usuario' : resource}`;
    const queryStr = id ? `SELECT * FROM ${tableName} WHERE ${pkName} = @id` : `SELECT * FROM ${tableName}`;
    
    const result = await executeQuery(queryStr, id ? { id } : {});
    return NextResponse.json(id ? result.recordset[0] : result.recordset);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  const [resource] = resolvedParams.path || [];
  const body = await req.json();

  try {
    if (resource === 'usuarios') {
      const res = await executeQuery(
        `INSERT INTO Usuarios (nombre_completo, email, rol, passwordHash, estado_activo) 
         OUTPUT INSERTED.* VALUES (@nombre_completo, @email, @rol, @passwordHash, 1)`, body
      );
      return NextResponse.json(res.recordset[0], { status: 201 });
    }

    if (resource === 'area_riego') {
      await executeQuery(
        `INSERT INTO Area_Riego (nombre_area, tipo_cultivo, superficie_ha, latitud, longitud, capacidad_campo, punto_marchitez) 
         VALUES (@nombre_area, @tipo_cultivo, @superficie_ha, @latitud, @longitud, @capacidad_campo, @punto_marchitez)`, body
      );
      return NextResponse.json({ message: "Creado" }, { status: 201 });
    }

    return NextResponse.json({ message: "No permitido" }, { status: 405 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  const [resource, id] = resolvedParams.path || [];
  if (!id) return NextResponse.json({ message: "ID requerido" }, { status: 400 });

  try {
    const tableMap: Record<string, { t: string, pk: string }> = {
      'usuarios': { t: 'Usuarios', pk: 'id_usuario' },
      'area_riego': { t: 'Area_Riego', pk: 'id_area_riego' }
    };

    const config = tableMap[resource];
    if (!config) return NextResponse.json({ message: "Error de recurso" }, { status: 405 });

    const result = await executeQuery(`DELETE FROM ${config.t} WHERE ${config.pk} = @id`, { id });
    return result.rowsAffected[0] > 0 ? new NextResponse(null, { status: 204 }) : NextResponse.json({}, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}