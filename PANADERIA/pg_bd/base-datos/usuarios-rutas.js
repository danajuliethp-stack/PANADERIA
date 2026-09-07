import { Router } from "express";
import {
  autenticarUsuario,
  cambiarEstadoUsuario,
  cambiarRolUsuario,
  crearUsuario,
  obtenerUsuarios,
  actualizarPerfilUsuario,
  actualizarPerfilPorCorreo,
} from "./bd-usuario.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    res.json(await obtenerUsuarios());
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/rol", async (req, res, next) => {
  try {
    const rol = String(req.body?.rol || "").trim().toLowerCase();
    if (!["administrador", "empleado", "cliente", "proveedor"].includes(rol)) {
      res.status(400).json({ mensaje: "Rol no válido" });
      return;
    }
    const usuario = await cambiarRolUsuario(req.params.id, rol);
    if (!usuario) {
      res.status(404).json({ mensaje: "Usuario o rol no encontrado" });
      return;
    }
    res.json(usuario);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/estado", async (req, res, next) => {
  try {
    const estado = String(req.body?.estado || "").trim().toLowerCase();
    if (!["activo", "inactivo"].includes(estado)) {
      res.status(400).json({ mensaje: "Estado no válido" });
      return;
    }
    const usuario = await cambiarEstadoUsuario(req.params.id, estado);
    if (!usuario) {
      res.status(404).json({ mensaje: "Usuario o estado no encontrado" });
      return;
    }
    res.json(usuario);
  } catch (error) {
    next(error);
  }
});

router.patch("/perfil", async (req, res, next) => {
  try {
    const { correoActual, nombre, correo, telefono, contrasena } = req.body;
    if (!correoActual || (!nombre && !correo && !telefono && !contrasena)) {
      res.status(400).json({ mensaje: "Debes cambiar al menos un dato" });
      return;
    }
    if (correo && !String(correo).includes("@")) {
      res.status(400).json({ mensaje: "El correo no es válido" });
      return;
    }
    const usuario = await actualizarPerfilPorCorreo(correoActual, {
      ...(nombre !== undefined && { nombre }),
      ...(correo !== undefined && { correo: correo.toLowerCase() }),
      ...(telefono !== undefined && { telefono }),
      ...(contrasena && { contrasena }),
    });
    if (!usuario) {
      res.status(404).json({ mensaje: "Usuario no encontrado" });
      return;
    }
    res.json(usuario);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      res.status(409).json({ mensaje: "El correo ya está registrado" });
      return;
    }
    next(error);
  }
});

router.patch("/:id/perfil", async (req, res, next) => {
  try {
    const { nombre, correo, telefono, contrasena } = req.body;
    if (!nombre && !correo && !telefono && !contrasena) {
      res.status(400).json({ mensaje: "Debes cambiar al menos un dato" });
      return;
    }
    if (correo && !String(correo).includes("@")) {
      res.status(400).json({ mensaje: "El correo no es válido" });
      return;
    }
    if (contrasena && String(contrasena).length < 6) {
      res.status(400).json({ mensaje: "La contraseña debe tener mínimo 6 caracteres" });
      return;
    }
    const usuario = await actualizarPerfilUsuario(req.params.id, {
      ...(nombre !== undefined && { nombre }),
      ...(correo !== undefined && { correo: correo.toLowerCase() }),
      ...(telefono !== undefined && { telefono }),
      ...(contrasena && { contrasena }),
    });
    if (!usuario) {
      res.status(404).json({ mensaje: "Usuario no encontrado" });
      return;
    }
    res.json(usuario);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      res.status(409).json({ mensaje: "El correo ya está registrado" });
      return;
    }
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ mensaje: "No se pudieron guardar los cambios" });
  }
});

router.post("/registro", async (req, res) => {
  try {
    const {
      nombre,
      tipoDocumento,
      documento,
      telefono,
      correo,
      contrasena,
      rol,
    } = req.body;

    const rolNormalizado = String(rol || "cliente").trim().toLowerCase();
    if (!["cliente", "empleado", "proveedor", "administrador"].includes(rolNormalizado)) {
      res.status(400).json({ mensaje: "El tipo de usuario no es válido" });
      return;
    }

    if (!nombre || !telefono) {
      res.status(400).json({ mensaje: "Nombre y teléfono son obligatorios" });
      return;
    }

    if (!documento) {
      res.status(400).json({ mensaje: "El documento es obligatorio para este tipo de usuario" });
      return;
    }

    const tipoDocumentoNormalizado = String(
      tipoDocumento ||
      (rolNormalizado === "proveedor" ? "nit" : "cc"),
    ).trim().toLowerCase();

    if (!["cc", "ce", "nit", "pasaporte"].includes(tipoDocumentoNormalizado)) {
      res.status(400).json({ mensaje: "El tipo de documento no es válido" });
      return;
    }

    const correoNormalizado = rolNormalizado === "proveedor"
      ? `${String(documento).replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}-${Date.now()}@proveedor.local`
      : String(correo || "").trim().toLowerCase();
    const contrasenaNormalizada = rolNormalizado === "proveedor"
      ? "proveedor123"
      : String(contrasena || "").trim();

    if (rolNormalizado !== "proveedor" && (!correoNormalizado || !correoNormalizado.includes("@"))) {
      res.status(400).json({ mensaje: "El correo no es válido" });
      return;
    }

    if (rolNormalizado !== "proveedor" && (!contrasenaNormalizada || contrasenaNormalizada.length < 6)) {
      res.status(400).json({ mensaje: "La contraseña debe tener mínimo 6 caracteres" });
      return;
    }

    const idUsuario = await crearUsuario({
      nombre,
      tipoDocumento: tipoDocumentoNormalizado,
      documento,
      telefono,
      correo: correoNormalizado,
      contrasena: contrasenaNormalizada,
      rol: rolNormalizado,
    });

    res.status(201).json({ mensaje: "Usuario registrado correctamente", idUsuario });
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(409).json({
        mensaje: "El correo o documento ya está registrado",
      });
      return;
    }
    res.status(500).json({
      mensaje: error.sqlMessage || error.message || "No se pudo registrar el usuario",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) {
      res.status(400).json({ mensaje: "Correo y contraseña son obligatorios" });
      return;
    }

    const usuario = await autenticarUsuario(correo, contrasena);
    if (!usuario) {
      res.status(401).json({ mensaje: "Correo o contraseña incorrectos" });
      return;
    }
    if (usuario.bloqueado) {
      res.status(403).json({ mensaje: usuario.mensaje });
      return;
    }

    res.json({ usuario });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).json({ mensaje: "No se pudo iniciar sesión" });
  }
});

export default router;
