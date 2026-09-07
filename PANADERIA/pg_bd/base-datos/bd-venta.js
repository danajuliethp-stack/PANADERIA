import pool from "./db.js";

/* =====================================================
   bd-ventas.js
   -----------------------------------------------------
   Esto es lo que conecta el pedido "informal" (el que llega
   por WhatsApp / desde pedido.html, guardado en la tabla
   `pedido` con los productos en JSON) con las tablas formales
   de venta (Venta, Detalle_Venta) que ya usan los triggers de
   inventario automático.

   Se llama UNA sola vez por pedido: justo cuando alguien de la
   panadería cambia su estado a "recibido" (ver pedidos-rutas.js).
   ===================================================== */

// Busca la sucursal cuyo nombre esté contenido en el texto del
// campo `sede` del pedido (ej: "Sede Centro — Carrera 10 # 14-28"
// contiene "Centro"). Si el pedido es a domicilio (no tiene sede),
// o no se encuentra ninguna coincidencia, se usa la sede principal
// como respaldo.
async function resolverSucursal(sedeTexto) {
  if (sedeTexto) {
    const [coincidencias] = await pool.execute(
      `SELECT id_sucursal FROM Sucursal
       WHERE estado = 'ACTIVO' AND ? LIKE CONCAT('%', nombre, '%')
       LIMIT 1`,
      [sedeTexto],
    );
    if (coincidencias[0]) return coincidencias[0].id_sucursal;
  }

  // Respaldo: la sede principal (Centro). Ajusta esto si prefieres
  // otra regla para los domicilios (por ejemplo, la sede más cercana
  // a la dirección de entrega).
  const [centro] = await pool.execute(
    `SELECT id_sucursal FROM Sucursal WHERE nombre = 'Centro' LIMIT 1`,
  );
  return centro[0]?.id_sucursal || null;
}

// Busca un Usuario por correo; si no existe, crea uno mínimo con
// rol "Cliente", para que la Venta tenga a quién asignarse
// (Venta.id_usuario es obligatorio). No se le pone contraseña
// utilizable todavía -- esto es solo un registro de "cliente de
// mostrador", no una cuenta con la que alguien inicia sesión.
async function resolverUsuarioCliente({ nombre, correo, telefono }) {
  const [existente] = await pool.execute(
    `SELECT id_usuario FROM Usuario WHERE correo = ? LIMIT 1`,
    [correo],
  );
  if (existente[0]) return existente[0].id_usuario;

  const [rolCliente] = await pool.execute(
    `SELECT id_rol FROM Rol WHERE LOWER(nombre_rol) = 'cliente' LIMIT 1`,
  );
  const idRol = rolCliente[0]?.id_rol || null;

  const [nuevo] = await pool.execute(
    `INSERT INTO Usuario
      (nombre, tipo_documento, num_documento, telefono, correo, contraseña, estado, id_rol)
     VALUES (?, 'cc', 'SIN-DATO', ?, ?, ?, 'ACTIVO', ?)`,
    [
      nombre || "Cliente de mostrador",
      telefono || "0000000000",
      correo,
      // contraseña provisional aleatoria: esta cuenta no se usa para
      // iniciar sesión, solo para poder relacionar la Venta con un
      // usuario. Cuando agreguemos bcrypt, esto se reemplaza por un
      // hash real si la persona decide registrarse de verdad.
      Math.random().toString(36).slice(2),
      idRol,
    ],
  );
  return nuevo.insertId;
}

// -------- La función principal --------
// Recibe el pedido completo (tal como lo devuelve obtenerPedidoPorId)
// y crea su Venta + Detalle_Venta. Devuelve el id_venta creado, o
// null si el pedido no traía ningún producto con id_producto real
// (por ejemplo, viejos pedidos hechos antes de conectar el carrito).
export async function registrarVentaDesdePedido(pedido) {
  const productos = Array.isArray(pedido.productos) ? pedido.productos : [];

  // Solo los ítems que sí tienen un id_producto real y numérico
  // pueden generar Detalle_Venta (y por lo tanto, afectar el stock).
  const itemsValidos = productos
    .map((item) => ({
      ...item,
      idProductoReal: Number(item.idProducto ?? item.id),
    }))
    .filter(
      (item) =>
        Number.isInteger(item.idProductoReal) && item.idProductoReal > 0,
    );

  if (itemsValidos.length === 0) {
    console.warn(
      `Pedido #${pedido.id_pedido}: ningún producto tiene id_producto real, no se generó Venta.`,
    );
    return null;
  }

  const idSucursal = await resolverSucursal(pedido.sede);
  if (!idSucursal) {
    console.warn(
      `Pedido #${pedido.id_pedido}: no se encontró ninguna sucursal, no se generó Venta.`,
    );
    return null;
  }

  const idUsuario = await resolverUsuarioCliente({
    nombre: pedido.cliente,
    correo: pedido.correo,
    telefono: pedido.telefono,
  });

  // 1) La cabecera de la venta
  const [venta] = await pool.execute(
    `INSERT INTO Venta (fecha, total, id_usuario, id_sucursal) VALUES (CURDATE(), ?, ?, ?)`,
    [pedido.total, idUsuario, idSucursal],
  );
  const idVenta = venta.insertId;

  // 2) Un Detalle_Venta por cada producto real del carrito.
  // Cada INSERT aquí es justo el que dispara tr_restar_stock_venta.
  for (const item of itemsValidos) {
    const cantidad = Number(item.cantidad) || 1;
    const precioUnitario = Number(item.precio) || 0;
    const subtotal = precioUnitario * cantidad;

    await pool.execute(
      `INSERT INTO Detalle_Venta (cantidad, precio_unitario, subtotal, id_venta, id_producto)
       VALUES (?, ?, ?, ?, ?)`,
      [cantidad, precioUnitario, subtotal, idVenta, item.idProductoReal],
    );
  }

  return idVenta;
}
