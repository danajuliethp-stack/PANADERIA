import pool from "./db.js";

const tiposDocumento = {
  cc: "C.C",
  ce: "C.E",
  nit: "NIT",
  pasaporte: "NIT",
};

const rolesPermitidos = {
  cliente: "cliente",
  empleado: "empleado",
  proveedor: "proveedor",
  administrador: "administrador",
};

const normalizarRol = (valor = "cliente") => {
  const texto = String(valor || "cliente").trim().toLowerCase();
  return rolesPermitidos[texto] || "cliente";
};

const obtenerRolPorNombre = async (nombreRol = "cliente") => {
  const rolNormalizado = normalizarRol(nombreRol);
  const [rows] = await pool.execute(
    "SELECT id_rol, nombre_rol FROM Rol WHERE LOWER(TRIM(nombre_rol)) = ? LIMIT 1",
    [rolNormalizado],
  );

  if (rows[0]?.id_rol) {
    return rows[0].id_rol;
  }

  await pool.execute(
    "INSERT IGNORE INTO Rol (nombre_rol) VALUES (?)",
    [rolNormalizado],
  );

  const [nuevoRol] = await pool.execute(
    "SELECT id_rol FROM Rol WHERE LOWER(TRIM(nombre_rol)) = ? LIMIT 1",
    [rolNormalizado],
  );

  return nuevoRol[0]?.id_rol || null;
};

const obtenerRolCliente = async () => obtenerRolPorNombre("cliente");

const estadosValidos = ["activo", "inactivo"];

const crearUsuario = async ({
  nombre,
  tipoDocumento,
  documento,
  telefono,
  correo,
  contrasena,
  rol,
}) => {
  const nombreRol = normalizarRol(rol);
  const idRol = await obtenerRolPorNombre(nombreRol);
  if (!idRol) {
    throw new Error("El rol seleccionado no existe en la base de datos");
  }

  const tipoDocumentoDb = tipoDocumento
    ? tiposDocumento[tipoDocumento] || (nombreRol === "proveedor" ? "NIT" : null)
    : nombreRol === "proveedor"
      ? "NIT"
      : "cc";

  if (!tipoDocumentoDb) {
    throw new Error("El tipo de documento no es válido");
  }

  const documentoFinal = String(documento || "").trim();
  if (!documentoFinal) {
    throw new Error("El documento es obligatorio para este tipo de usuario");
  }

  const [result] = await pool.execute(
    `INSERT INTO Usuario
      (nombre, tipo_documento, num_documento, telefono, correo, \`contraseña\`, estado, id_rol)
     VALUES (?, ?, ?, ?, ?, ?, 'activo', ?)`,
    [nombre, tipoDocumentoDb || "", documentoFinal, telefono, correo, contrasena, idRol],
  );

  return result.insertId;
};

const autenticarUsuario = async (correo, contrasena) => {
  const [rows] = await pool.execute(
    `SELECT u.id_usuario, u.nombre, u.correo, u.telefono AS telefono, u.\`contraseña\`, u.estado, u.id_rol, r.nombre_rol
     FROM Usuario u
     INNER JOIN Rol r ON r.id_rol = u.id_rol
     WHERE u.correo = ?
     LIMIT 1`,
    [correo],
  );

  const usuario = rows[0];
  if (!usuario) {
    return null;
  }

  if (String(usuario.estado || "").trim().toLowerCase() !== "activo") {
    return { bloqueado: true, mensaje: "Tu usuario está inactivo. No puedes ingresar." };
  }

  if (usuario.contraseña !== contrasena) {
    return null;
  }

  return {
    id: usuario.id_usuario,
    nombre: usuario.nombre,
    correo: usuario.correo,
    telefono: usuario.telefono,
    idRol: usuario.id_rol,
    rol: usuario.nombre_rol,
  };
};

const obtenerUsuarios = async () => {
  const [rows] = await pool.execute(
    `SELECT u.id_usuario, u.nombre, u.correo, u.telefono,
           u.estado, u.id_rol, COALESCE(r.nombre_rol, 'cliente') AS nombre_rol
     FROM Usuario u
     LEFT JOIN Rol r ON r.id_rol = u.id_rol
     ORDER BY u.id_usuario DESC`,
  );
  return rows;
};

const cambiarRolUsuario = async (idUsuario, nombreRol) => {
  const rolNormalizado = normalizarRol(nombreRol);
  const [roles] = await pool.execute(
    "SELECT id_rol, nombre_rol FROM Rol WHERE LOWER(nombre_rol) = ? LIMIT 1",
    [rolNormalizado],
  );
  const rol = roles[0];
  if (!rol) return null;

  const [resultado] = await pool.execute(
    "UPDATE Usuario SET id_rol = ? WHERE id_usuario = ?",
    [rol.id_rol, idUsuario],
  );
  if (resultado.affectedRows === 0) return null;
  return { id_usuario: Number(idUsuario), id_rol: rol.id_rol, nombre_rol: rol.nombre_rol };
};

const cambiarEstadoUsuario = async (idUsuario, estado) => {
  const estadoNormalizado = String(estado || "").trim().toLowerCase();
  if (!estadosValidos.includes(estadoNormalizado)) return null;

  const [resultado] = await pool.execute(
    "UPDATE Usuario SET estado = ? WHERE id_usuario = ?",
    [estadoNormalizado, idUsuario],
  );
  if (resultado.affectedRows === 0) return null;
  return { id_usuario: Number(idUsuario), estado: estadoNormalizado };
};

const actualizarPerfilUsuario = async (idUsuario, datos) => {
  const [usuarios] = await pool.execute(
    "SELECT id_usuario FROM Usuario WHERE id_usuario = ? LIMIT 1",
    [idUsuario],
  );
  if (usuarios.length === 0) return null;
  const campos = [];
  const valores = [];
  if (datos.nombre !== undefined) {
    campos.push("nombre = ?");
    valores.push(datos.nombre);
  }
  if (datos.correo !== undefined) {
    campos.push("correo = ?");
    valores.push(datos.correo);
  }
  if (datos.telefono !== undefined) {
    campos.push("telefono = ?");
    valores.push(datos.telefono);
  }
  if (datos.contrasena) {
    campos.push("`contraseña` = ?");
    valores.push(datos.contrasena);
  }
  if (!campos.length) return usuarios[0];
  valores.push(idUsuario);
  const [resultado] = await pool.execute(
    `UPDATE Usuario SET ${campos.join(", ")} WHERE id_usuario = ?`,
    valores,
  );
  return { id_usuario: Number(idUsuario), ...datos };
};

const actualizarPerfilPorCorreo = async (correoActual, datos) => {
  const [usuarios] = await pool.execute(
    "SELECT id_usuario FROM Usuario WHERE correo = ? LIMIT 1",
    [correoActual],
  );
  if (usuarios.length === 0) return null;
  return actualizarPerfilUsuario(usuarios[0].id_usuario, datos);
};

export {
  actualizarPerfilUsuario,
  actualizarPerfilPorCorreo,
  autenticarUsuario,
  cambiarEstadoUsuario,
  cambiarRolUsuario,
  crearUsuario,
  obtenerUsuarios,
};
