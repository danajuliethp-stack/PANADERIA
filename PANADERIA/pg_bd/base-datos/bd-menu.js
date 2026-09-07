import pool from "./db.js";

const camposProducto =
 "id_producto, nombre, descripcion, precio, imagen, id_categoria, estado";

const getMenu = async () => {
 const [rows] = await pool.execute(`SELECT ${camposProducto} FROM producto`);
 return rows;
};

const getMenuById = async (id) => {
 const [rows] = await pool.execute(
   `SELECT ${camposProducto} FROM producto WHERE id_producto = ?`,
   [id],
 );
 return rows[0] || null;
};

const addMenu = async ({
 nombre,
 descripcion,
 precio,
 imagen,
 id_categoria,
 estado = "activo",
}) => {
 const [result] = await pool.execute(
   `INSERT INTO producto (nombre, descripcion, precio, imagen, id_categoria, estado) VALUES (?, ?, ?, ?, ?, ?)`,
   [nombre, descripcion, precio, imagen || null, id_categoria, estado],
 );
 return getMenuById(result.insertId);
};

const updateMenu = async (
 id,
 { nombre, descripcion, precio, id_categoria, imagen, estado },
) => {
 const [result] = await pool.execute(
  `UPDATE producto
   SET nombre = ?, descripcion = ?, precio = ?, id_categoria = ?, estado = ?,
       imagen = COALESCE(?, imagen)
   WHERE id_producto = ?`,
  [nombre, descripcion, precio, id_categoria, estado, imagen || null, id],
 );

 if (result.affectedRows === 0) return null;
 return getMenuById(id);
};

const updateMenuEstado = async (id, estado) => {
 const [result] = await pool.execute(
  "UPDATE producto SET estado = ? WHERE id_producto = ?",
  [estado, id],
 );
 if (result.affectedRows === 0) return null;
 return getMenuById(id);
};

export { getMenu, getMenuById, addMenu, updateMenu, updateMenuEstado };
