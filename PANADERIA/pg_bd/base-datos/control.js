import {
  getMenu,
  getMenuById,
  addMenu,
  updateMenu,
  updateMenuEstado,
} from "./bd-menu.js";

export const obtenerProductos = async (req, res) => {
  try {
    const productos = await getMenu();
    res.json(productos);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ mensaje: "Error al obtener los productos" });
  }
};

export const registrarProducto = async (req, res) => {
  try {
    const { nombre, descripcion, precio, id_categoria, estado } = req.body;
    const nuevoProducto = await addMenu({
      nombre,
      descripcion,
      precio,
      imagen: req.file ? `/uploads/${req.file.filename}` : null,
      id_categoria,
      estado: estado === "inactivo" ? "inactivo" : "activo",
    });

    res.status(201).json({
      mensaje: "Producto registrado correctamente",
      producto: nuevoProducto,
    });
  } catch (error) {
    console.error("Error al registrar producto:", error);
    res.status(500).json({ mensaje: "Error al registrar el producto" });
  }
};

export const editarProducto = async (req, res) => {
  try {
    const { nombre, descripcion, precio, id_categoria, estado } = req.body;
    const productoActualizado = await updateMenu(req.params.id, {
      nombre,
      descripcion,
      precio,
      id_categoria,
      estado: estado === "inactivo" ? "inactivo" : "activo",
      imagen: req.file ? `/uploads/${req.file.filename}` : null,
    });

    if (!productoActualizado) {
      res.status(404).json({ mensaje: "Producto no encontrado" });
      return;
    }

    res.json({
      mensaje: "Producto actualizado correctamente",
      producto: productoActualizado,
    });
  } catch (error) {
    console.error("Error al editar producto:", error);
    res.status(500).json({ mensaje: "Error al editar el producto" });
  }
};

export const cambiarEstadoProducto = async (req, res) => {
  try {
    const estadoRecibido = String(
      req.query.estado || req.body?.estado || "",
    ).toLowerCase();
    const estadoNormalizado = ["suspendido", "inactivo"].includes(estadoRecibido)
      ? "inactivo"
      : ["disponible", "activo"].includes(estadoRecibido)
        ? "activo"
        : estadoRecibido;
    if (!["activo", "inactivo"].includes(estadoNormalizado)) {
      res.status(400).json({ mensaje: "Estado de producto no válido" });
      return;
    }

    const producto = await updateMenuEstado(req.params.id, estadoNormalizado);
    if (!producto) {
      res.status(404).json({ mensaje: "Producto no encontrado" });
      return;
    }

    res.json({ mensaje: `Producto ${estadoNormalizado}`, producto });
  } catch (error) {
    console.error("Error al cambiar estado del producto:", error);
    res.status(500).json({ mensaje: "No se pudo cambiar el estado del producto" });
  }
};