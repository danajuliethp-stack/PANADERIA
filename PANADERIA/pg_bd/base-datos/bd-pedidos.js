import pool from "./db.js";

export async function crearPedido(datos) {
  const [resultado] = await pool.execute(
    `INSERT INTO pedido
      (cliente, correo, telefono, productos, total, entrega, sede, direccion, ciudad, notas, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
    [
      datos.cliente,
      datos.correo,
      datos.telefono,
      JSON.stringify(datos.productos),
      datos.total,
      datos.entrega,
      datos.sede || null,
      datos.direccion || null,
      datos.ciudad || null,
      datos.notas || null,
    ],
  );
  return { id: resultado.insertId };
}

export async function obtenerPedidos() {
  const [filas] = await pool.execute(
    `SELECT id_pedido, cliente, correo, telefono, productos, total,
            entrega, sede, direccion, ciudad, notas, estado, fecha
     FROM pedido ORDER BY fecha DESC, id_pedido DESC`,
  );
  return filas.map((pedido) => ({
    ...pedido,
    productos:
      typeof pedido.productos === "string"
        ? JSON.parse(pedido.productos)
        : pedido.productos,
  }));
}

export async function obtenerPedidoPorId(id) {
  const [filas] = await pool.execute(
    `SELECT id_pedido, cliente, correo, telefono, productos, total,
            entrega, sede, direccion, ciudad, notas, estado, fecha, id_venta
     FROM pedido WHERE id_pedido = ?`,
    [id],
  );
  if (!filas[0]) return null;
  const pedido = filas[0];
  return {
    ...pedido,
    productos:
      typeof pedido.productos === "string"
        ? JSON.parse(pedido.productos)
        : pedido.productos,
  };
}

export async function cambiarEstadoPedido(id, estado) {
  const [resultado] = await pool.execute(
    "UPDATE pedido SET estado = ? WHERE id_pedido = ?",
    [estado, id],
  );
  if (resultado.affectedRows === 0) {
    return null;
  }
  return { id_pedido: Number(id), estado };
}

// Guarda qué venta se generó para este pedido, para no volver a
// generar otra si alguien cambia el estado a "recibido" de nuevo.
export async function guardarVentaDelPedido(idPedido, idVenta) {
  await pool.execute("UPDATE pedido SET id_venta = ? WHERE id_pedido = ?", [
    idVenta,
    idPedido,
  ]);
}
