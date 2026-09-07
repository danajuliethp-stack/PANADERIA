import { Router } from "express";
import {
  cambiarEstadoPedido,
  crearPedido,
  obtenerPedidos,
  obtenerPedidoPorId,
  guardarVentaDelPedido,
} from "./bd-pedidos.js";
import { registrarVentaDesdePedido } from "./bd-ventas.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    res.json(await obtenerPedidos());
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      cliente,
      correo,
      telefono,
      productos,
      total,
      entrega,
      sede,
      direccion,
      ciudad,
      notas,
    } = req.body;
    if (
      !cliente ||
      !correo ||
      !telefono ||
      !Array.isArray(productos) ||
      !Number.isFinite(Number(total))
    ) {
      res.status(400).json({ mensaje: "Faltan datos obligatorios del pedido" });
      return;
    }
    const pedido = await crearPedido({
      cliente,
      correo,
      telefono,
      productos,
      total: Number(total),
      entrega,
      sede,
      direccion,
      ciudad,
      notas,
    });

    res.status(201).json(pedido);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/estado", async (req, res, next) => {
  try {
    const estados = ["pendiente", "recibido", "cancelado"];
    const estado = String(req.body?.estado || "").toLowerCase();
    if (!estados.includes(estado)) {
      res.status(400).json({ mensaje: "Estado de pedido no válido" });
      return;
    }
    const pedido = await cambiarEstadoPedido(req.params.id, estado);
    if (!pedido) {
      res.status(404).json({ mensaje: "Pedido no encontrado" });
      return;
    }

    let idVentaGenerada = null;

    // Solo cuando se confirma como "recibido" se convierte en una
    // venta real (esto es lo que dispara el trigger de inventario).
    // Si el pedido ya tenía una venta generada de antes, no se repite.
    if (estado === "recibido") {
      const pedidoCompleto = await obtenerPedidoPorId(req.params.id);
      if (pedidoCompleto && !pedidoCompleto.id_venta) {
        try {
          idVentaGenerada = await registrarVentaDesdePedido(pedidoCompleto);
          if (idVentaGenerada) {
            await guardarVentaDelPedido(req.params.id, idVentaGenerada);
          }
        } catch (errorVenta) {
          // Si algo falla generando la venta, el pedido igual queda
          // marcado como "recibido" (no queremos bloquear al empleado),
          // pero se deja registrado el error para revisarlo después.
          console.error(
            `No se pudo generar la venta del pedido #${req.params.id}:`,
            errorVenta,
          );
        }
      } else if (pedidoCompleto?.id_venta) {
        idVentaGenerada = pedidoCompleto.id_venta;
      }
    }

    res.json({ ...pedido, id_venta: idVentaGenerada });
  } catch (error) {
    next(error);
  }
});

export default router;
