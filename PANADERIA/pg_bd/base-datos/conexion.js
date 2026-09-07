// archivo principal del servidor: arma express, conecta con mysql
// y deja todo listo (tablas, roles, categorias) antes de escuchar peticiones

import express from "express";
import mysql from "mysql2/promise";
import path from "node:path";
import { fileURLToPath } from "node:url";
import productoRoutes from "./rutas.js";
import pedidosRoutes from "./pedidos-rutas.js";
import usuarioRoutes from "./usuarios-rutas.js";
import pool from "./db.js";

const app = express();
const PORT = 3000;
const configuracionBase = {
  host: "localhost",
  user: "root",
  password: "123456",
};

app.use((req, res, next) => {
  const origen = req.headers.origin;
  const esOrigenLocal =
    origen === "null" ||
    (origen && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origen));

  if (esOrigenLocal) {
    res.setHeader("Access-Control-Allow-Origin", origen);
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

// carpeta raiz del proyecto, se usa
// para servir los archivos estaticos (html, css, js, imagenes)
const carpetaProyecto = path.dirname(
  path.dirname(fileURLToPath(import.meta.url)),
);

app.use(express.json()); // permite leer los body en formato JSON
app.use("/api/productos", productoRoutes); // rutas del menu/productos
app.use("/api/pedidos", pedidosRoutes); // rutas de pedidos
app.use("/api/usuarios", usuarioRoutes); // rutas de login/registro/usuarios
app.use("/uploads", express.static(path.join(carpetaProyecto, "uploads"))); // fotos subidas por el usuario
app.use(express.static(carpetaProyecto)); // sirve el resto del sitio (html, css, js sueltos)

// se conecta primero sin indicar base de datos para poder crearla si hace falta,
// y despues va revisando/creando las tablas que necesita el proyecto
const iniciarServidor = async () => {
  const conexionInicial = await mysql.createConnection(configuracionBase);
  await conexionInicial.query(
    "CREATE DATABASE IF NOT EXISTS panaderia_amapola CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
  );
  await conexionInicial.end();

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS Rol (
      id_rol INT AUTO_INCREMENT PRIMARY KEY,
      nombre_rol VARCHAR(50) NOT NULL UNIQUE
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS Usuario (
      id_usuario INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      tipo_documento VARCHAR(10),
      num_documento VARCHAR(30),
      telefono VARCHAR(30),
      correo VARCHAR(150) NOT NULL UNIQUE,
      \`contraseña\` VARCHAR(255) NOT NULL,
      estado VARCHAR(20) NOT NULL DEFAULT 'activo',
      id_rol INT NOT NULL,
      FOREIGN KEY (id_rol) REFERENCES Rol(id_rol)
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS categoria (
      id_categoria INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(50) NOT NULL UNIQUE
    )
  `);

  // tabla de pedidos: los productos van guardados como JSON en una sola
  // columna en vez de una tabla aparte, para simplificar
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS pedido (
      id_pedido INT AUTO_INCREMENT PRIMARY KEY,
      cliente VARCHAR(120) NOT NULL,
      correo VARCHAR(150) NOT NULL,
      telefono VARCHAR(30) NOT NULL,
      productos JSON NOT NULL,
      total DECIMAL(12,2) NOT NULL,
      entrega VARCHAR(30) NOT NULL,
      sede VARCHAR(150),
      direccion VARCHAR(255),
      ciudad VARCHAR(100),
      notas TEXT,
      estado VARCHAR(30) NOT NULL DEFAULT 'nuevo',
      fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS producto (
      id_producto INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(120) NOT NULL,
      descripcion TEXT,
      precio DECIMAL(12,2) NOT NULL,
      imagen VARCHAR(255),
      id_categoria INT NOT NULL,
      estado VARCHAR(20) NOT NULL DEFAULT 'activo',
      FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria)
    )
  `);

  // por si la tabla pedido ya existia de antes sin la columna fecha,
  // se revisa el information_schema y se agrega si falta (migracion simple)
  const [columnasPedido] = await pool.execute(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'pedido'
       AND COLUMN_NAME = 'fecha'`,
  );
  if (columnasPedido.length === 0) {
    await pool.execute(
      "ALTER TABLE pedido ADD COLUMN fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
    );
  }
  await pool.execute(
    "INSERT IGNORE INTO Rol (nombre_rol) VALUES ('cliente'), ('administrador'), ('empleado'), ('proveedor')",
  );
  await pool.execute(`
    DELETE r1
    FROM Rol r1
    INNER JOIN Rol r2
      ON LOWER(TRIM(r1.nombre_rol)) = LOWER(TRIM(r2.nombre_rol))
     AND r1.id_rol > r2.id_rol
  `);
  await pool.execute(
    "INSERT IGNORE INTO categoria (id_categoria, nombre) VALUES (1, 'Panadería'), (2, 'Pastelería'), (3, 'Bizcochería'), (4, 'Bebidas')",
  );

  const [columnas] = await pool.execute(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'producto'
       AND COLUMN_NAME = 'estado'`,
  );
  if (columnas.length === 0) {
    await pool.execute(
      "ALTER TABLE producto ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'activo'",
    );
  }
  await pool.execute(
    "UPDATE producto SET estado = 'activo' WHERE estado IS NULL OR LOWER(estado) = 'disponible'",
  );
  await pool.execute(
    "UPDATE producto SET estado = 'inactivo' WHERE LOWER(estado) = 'suspendido'",
  );

  // migración simple: la columna id_venta en `pedido` guarda qué venta
  // se generó para ese pedido (si ya se generó), para no crear una
  // venta duplicada si alguien marca "recibido" más de una vez.
  const [columnaIdVenta] = await pool.execute(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'pedido'
       AND COLUMN_NAME = 'id_venta'`,
  );
  if (columnaIdVenta.length === 0) {
    await pool.execute("ALTER TABLE pedido ADD COLUMN id_venta INT NULL");
  }

  app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  });
};

// arranca todo, y si algo falla (por ejemplo mysql apagado) lo muestra
// en consola y marca el proceso como fallido en vez de dejarlo colgado
iniciarServidor().catch((error) => {
  console.error("No se pudo iniciar la base de datos:", error);
  process.exitCode = 1;
});
