import { Router } from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  obtenerProductos,
  registrarProducto,
  editarProducto,
  cambiarEstadoProducto,
} from "./control.js";

const router = Router();

const carpetaImagenes = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "uploads",
);
fs.mkdirSync(carpetaImagenes, { recursive: true });

const almacenamiento = multer.diskStorage({
  destination: carpetaImagenes,
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}${extension}`);
  },
});
const cargarImagen = multer({
  storage: almacenamiento,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (file.mimetype.startsWith("image/")) {
      callback(null, true);
      return;
    }

    callback(new Error("Solo se permiten archivos de imagen"));
  },
});

router.get("/", obtenerProductos);
router.post(
  "/",
  (req, res, next) => {
    cargarImagen.single("imagen")(req, res, (error) => {
      if (error) {
        return res.status(400).json({ mensaje: error.message });
      }

      next();
    });
  },
  registrarProducto,
);

router.put(
  "/:id",
  (req, res, next) => {
    cargarImagen.single("imagen")(req, res, (error) => {
      if (error) {
        return res.status(400).json({ mensaje: error.message });
      }

      next();
    });
  },
  editarProducto,
);

router.post("/:id/estado", cambiarEstadoProducto);
router.patch("/:id/estado", cambiarEstadoProducto);

export default router;
