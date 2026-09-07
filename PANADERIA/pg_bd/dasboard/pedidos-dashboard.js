const API_PEDIDOS = "http://127.0.0.1:3000/api/pedidos";
const CLAVE_SYNC_ESTADO_PEDIDO = "pedido-estado-actualizado";
const modalConfirmacion = document.getElementById("modalConfirmarCancelacion");
const confirmarCancelacionBtn = document.getElementById("confirmarCancelacionBtn");
let pedidoPendienteCancelacion = null;

const formatoFecha = (valor) =>
  new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(valor));
const formatoHora = (valor) =>
  new Intl.DateTimeFormat("es-CO", { timeStyle: "short" }).format(new Date(valor));
const formatoTotal = (valor) =>
  `$${Number(valor).toLocaleString("es-CO")} COP`;

function normalizarEstadoPedido(estado) {
  return String(estado || "pendiente").trim().toLowerCase();
}

function etiquetaEstadoPedido(estado) {
  const etiquetas = {
    pendiente: "Pendiente",
    recibido: "Recibido",
    cancelado: "Cancelado",
  };
  return etiquetas[estado] || "Pendiente";
}

function obtenerSedePedido(pedido) {
  const valor = String(pedido?.sede || pedido?.puntoRecigida || pedido?.puntoRecogida || pedido?.sedeEntrega || "").trim();
  if (!valor) {
    return pedido?.entrega === "domicilio" ? "domicilio" : "sin-sede";
  }
  const texto = valor.toLowerCase();
  if (texto.includes("centro")) return "centro";
  if (texto.includes("olaya")) return "olaya";
  if (texto.includes("magdalena")) return "magdalena";
  if (texto.includes("domicilio")) return "domicilio";
  return "otra";
}

function nombreSedePedido(pedido) {
  const valor = String(pedido?.sede || pedido?.puntoRecogida || pedido?.sedeEntrega || "").trim();
  if (!valor) return pedido?.entrega === "domicilio" ? "Domicilio" : "Sin sede";
  const texto = valor.toLowerCase();
  if (texto.includes("centro")) return "Centro";
  if (texto.includes("olaya")) return "Olaya";
  if (texto.includes("magdalena")) return "Magdalena";
  if (texto.includes("domicilio")) return "Domicilio";
  return valor;
}

function filtrarPedidos(pedidos) {
  const estadoFiltro = document.getElementById("estadoFiltro")?.value || "todos";
  const sedeFiltro = document.getElementById("sedeFiltro")?.value || "todas";

  return pedidos.filter((pedido) => {
    const estadoPedido = normalizarEstadoPedido(pedido?.estado);
    const sedePedido = obtenerSedePedido(pedido);

    const coincideEstado =
      estadoFiltro === "todos" || estadoPedido === estadoFiltro;
    const coincideSede =
      sedeFiltro === "todas" || sedePedido === sedeFiltro;

    return coincideEstado && coincideSede;
  });
}

function actualizarTarjetasResumen(pedidos) {
  const hoy = new Date();
  const pedidosHoy = pedidos.filter((pedido) => {
    if (!pedido?.fecha) return false;
    const fechaPedido = new Date(pedido.fecha);
    return !Number.isNaN(fechaPedido.getTime()) &&
      fechaPedido.getFullYear() === hoy.getFullYear() &&
      fechaPedido.getMonth() === hoy.getMonth() &&
      fechaPedido.getDate() === hoy.getDate();
  });

  const pendientes = pedidos.filter((pedido) => {
    const estado = normalizarEstadoPedido(pedido?.estado);
    return estado === "pendiente";
  });

  const totalVentasHoy = pedidosHoy.reduce((total, pedido) => total + Number(pedido.total || 0), 0);

  const pedidosHoyEl = document.getElementById("resumen-pedidos-hoy");
  const pendientesEl = document.getElementById("resumen-pendientes");
  const ventasHoyEl = document.getElementById("resumen-ventas-dia");

  if (pedidosHoyEl) pedidosHoyEl.textContent = String(pedidosHoy.length);
  if (pendientesEl) pendientesEl.textContent = String(pendientes.length);
  if (ventasHoyEl) ventasHoyEl.textContent = formatoTotal(totalVentasHoy);
}

function sincronizarEstadoPedidoCliente(pedidoId, nuevoEstado) {
  if (!pedidoId) return;
  const payload = {
    id_pedido: String(pedidoId),
    estado: nuevoEstado,
    actualizado: Date.now(),
  };
  localStorage.setItem(CLAVE_SYNC_ESTADO_PEDIDO, JSON.stringify(payload));
  try {
    window.dispatchEvent(new CustomEvent("pedido-estado-actualizado", { detail: payload }));
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ tipo: "pedido-estado-actualizado", ...payload }, "*");
    }
  } catch (error) {
    console.warn("No se pudo emitir la sincronización del estado del pedido:", error.message);
  }
}

function abrirModalCancelacion(pedidoId) {
  pedidoPendienteCancelacion = pedidoId;
  if (modalConfirmacion) {
    modalConfirmacion.hidden = false;
  }
}

function cerrarModalCancelacion() {
  pedidoPendienteCancelacion = null;
  if (modalConfirmacion) {
    modalConfirmacion.hidden = true;
  }
}

function renderProductosMasPedidos(pedidos) {
  const lista = document.querySelector(".lista-platillos");
  if (!lista) return;

  const productos = new Map();
  pedidos.forEach((pedido) => {
    (Array.isArray(pedido.productos) ? pedido.productos : []).forEach((producto) => {
      const clave = producto.id || producto.nombre;
      if (!clave) return;
      const actual = productos.get(clave) || {
        nombre: producto.nombre || "Producto",
        img: producto.img || "",
        cantidad: 0,
      };
      actual.cantidad += Number(producto.cantidad) || 1;
      if (!actual.img && producto.img) actual.img = producto.img;
      productos.set(clave, actual);
    });
  });

  const masPedidos = [...productos.values()]
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  lista.innerHTML = masPedidos.length
    ? masPedidos.map((producto, indice) => `
      <div class="platillo-row">
        <div class="platillo-rank">${String(indice + 1).padStart(2, "0")}</div>
        <div class="platillo-imagen">
          ${producto.img ? `<img src="${producto.img}" alt="${producto.nombre}">` : '<i class="fi fi-rs-bread"></i>'}
        </div>
        <div class="platillo-info">
          <div>
            <div class="platillo-name">${producto.nombre}</div>
            <div class="platillo-meta">${producto.cantidad} unidades vendidas</div>
          </div>
        </div>
        <div class="platillo-count">${producto.cantidad} pedidos</div>
      </div>`).join("")
    : `<div class="platillo-row"><div class="platillo-info"><div class="platillo-name">Aún no hay productos pedidos</div></div></div>`;
}

function filaPedido(pedido, incluirNumero = true) {
  const numero = `#LM-${String(pedido.id_pedido).padStart(4, "0")}`;
  const estado = ["pendiente", "recibido", "cancelado"].includes(normalizarEstadoPedido(pedido.estado))
    ? normalizarEstadoPedido(pedido.estado)
    : "pendiente";
  const sede = nombreSedePedido(pedido);
  const controles = `<div class="acciones-estado">
    <button type="button" data-pedido-id="${pedido.id_pedido}" data-estado="pendiente">Pendiente</button>
    <button type="button" data-pedido-id="${pedido.id_pedido}" data-estado="recibido">Recibido</button>
    <button type="button" data-pedido-id="${pedido.id_pedido}" data-estado="cancelado">Cancelado</button>
  </div>`;
  const etiquetaEstado = etiquetaEstadoPedido(estado);
  return incluirNumero
    ? `<tr><td>${numero}</td><td>${pedido.cliente}</td><td>${sede}</td><td>${formatoFecha(pedido.fecha)}</td><td>${formatoHora(pedido.fecha)}</td><td>${formatoTotal(pedido.total)}</td><td><span class="estado ${estado}">${etiquetaEstado}</span></td><td>${controles}</td></tr>`
    : `<tr><td>${pedido.cliente}</td><td>${sede}</td><td>${formatoFecha(pedido.fecha)}</td><td>${formatoHora(pedido.fecha)}</td><td>${formatoTotal(pedido.total)}</td><td><span class="estado ${estado}">${etiquetaEstado}</span></td><td>${controles}</td></tr>`;
}

async function cargarPedidosDashboard() {
  let pedidos;
  try {
    const respuesta = await fetch(API_PEDIDOS);
    if (!respuesta.ok) throw new Error(`API respondió ${respuesta.status}`);
    pedidos = await respuesta.json();
  } catch (error) {
    const pedidoPendiente = localStorage.getItem("pedidoPendienteAmapolas");
    const pedidosGuardados = pedidoPendiente ? JSON.parse(pedidoPendiente) : [];
    pedidos = Array.isArray(pedidosGuardados)
      ? pedidosGuardados
      : pedidosGuardados
        ? [pedidosGuardados]
        : [];
    console.error("No se pudieron cargar los pedidos de la base:", error.message);
  }
  const pedidosFiltrados = filtrarPedidos(pedidos);
  const tablaPedidos = document.querySelector(".tabla-contenedor tbody");
  const tablaRecientes = document.querySelector(".tabla-wrap tbody");

  actualizarTarjetasResumen(pedidosFiltrados);

  if (tablaPedidos) {
    tablaPedidos.innerHTML = pedidosFiltrados.length
      ? pedidosFiltrados.map((pedido) => filaPedido(pedido)).join("")
      : `<tr><td colspan="8" style="text-align:center; padding: 18px; color: #7c7c7c;">No hay pedidos para este filtro.</td></tr>`;
  }

  if (tablaRecientes) {
    tablaRecientes.innerHTML = pedidosFiltrados.slice(0, 5).length
      ? pedidosFiltrados.slice(0, 5).map((pedido) => filaPedido(pedido, false)).join("")
      : `<tr><td colspan="7" style="text-align:center; padding: 18px; color: #7c7c7c;">Sin resultados.</td></tr>`;
  }

  renderProductosMasPedidos(pedidosFiltrados);

  const tarjetas = document.querySelectorAll(".tarjeta-estadistica");
  const tarjetaPedidos = [...tarjetas].find((tarjeta) =>
    tarjeta.querySelector(".titulo-estadistica")?.textContent
      .toLowerCase()
      .includes("pedidos hoy"),
  );
  const tarjetaVentas = [...tarjetas].find((tarjeta) =>
    tarjeta.querySelector(".titulo-estadistica")?.textContent
      .toLowerCase()
      .includes("ventas hoy"),
  );

  if (tarjetaPedidos) {
    const valor = tarjetaPedidos.querySelector("strong");
    if (valor) valor.textContent = pedidosFiltrados.length;
  }

  if (tarjetaVentas) {
    const valor = tarjetaVentas.querySelector("strong");
    if (valor) {
      const totalVentas = pedidosFiltrados.reduce((total, pedido) => total + Number(pedido.total || 0), 0);
      valor.textContent = formatoTotal(totalVentas);
    }
  }
}

const estadoFiltro = document.getElementById("estadoFiltro");
const sedeFiltro = document.getElementById("sedeFiltro");

if (estadoFiltro) {
  estadoFiltro.addEventListener("change", () => cargarPedidosDashboard().catch((error) => console.error(error.message)));
}

if (sedeFiltro) {
  sedeFiltro.addEventListener("change", () => cargarPedidosDashboard().catch((error) => console.error(error.message)));
}

document.addEventListener("click", async (evento) => {
  const cerrarModalTrigger = evento.target.closest("[data-cerrar-modal='true']");
  if (cerrarModalTrigger) {
    cerrarModalCancelacion();
    return;
  }

  const boton = evento.target.closest("[data-pedido-id][data-estado]");
  if (!boton) return;

  if (boton.dataset.estado === "cancelado") {
    abrirModalCancelacion(boton.dataset.pedidoId);
    return;
  }

  const estadoAnterior = boton.closest("tr")?.querySelector(".estado")?.textContent || "";
  boton.disabled = true;
  try {
    if (boton.dataset.pedidoId.startsWith("local-")) {
      const guardados = JSON.parse(localStorage.getItem("pedidoPendienteAmapolas") || "[]");
      const pedidosLocales = Array.isArray(guardados) ? guardados : [guardados];
      const pedidoLocal = pedidosLocales.find(
        (pedido) => pedido?.id_pedido === boton.dataset.pedidoId,
      );
      if (pedidoLocal) {
        pedidoLocal.estado = boton.dataset.estado;
        localStorage.setItem("pedidoPendienteAmapolas", JSON.stringify(pedidosLocales));
      }
      sincronizarEstadoPedidoCliente(boton.dataset.pedidoId, boton.dataset.estado);
      document.querySelectorAll(`[data-pedido-id="${boton.dataset.pedidoId}"]`).forEach((control) => {
        const etiqueta = control.closest("tr")?.querySelector(".estado");
        if (etiqueta) {
          etiqueta.className = `estado ${boton.dataset.estado}`;
          etiqueta.textContent = etiquetaEstadoPedido(boton.dataset.estado);
        }
      });
      await cargarPedidosDashboard();
      boton.disabled = false;
      return;
    }
    const respuesta = await fetch(`${API_PEDIDOS}/${boton.dataset.pedidoId}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: boton.dataset.estado }),
    });
    if (!respuesta.ok) throw new Error("No se pudo actualizar el estado");
    sincronizarEstadoPedidoCliente(boton.dataset.pedidoId, boton.dataset.estado);
    document.querySelectorAll(`[data-pedido-id="${boton.dataset.pedidoId}"]`).forEach((control) => {
      const etiqueta = control.closest("tr")?.querySelector(".estado");
      if (!etiqueta) return;
      etiqueta.className = `estado ${boton.dataset.estado}`;
      etiqueta.textContent = etiquetaEstadoPedido(boton.dataset.estado);
    });
    await cargarPedidosDashboard();
  } catch (error) {
    console.error(error.message);
    const etiqueta = boton.closest("tr")?.querySelector(".estado");
    if (etiqueta) etiqueta.textContent = estadoAnterior;
    boton.disabled = false;
  }
});

if (confirmarCancelacionBtn) {
  confirmarCancelacionBtn.addEventListener("click", async () => {
    if (!pedidoPendienteCancelacion) return;
    const boton = document.querySelector(
      `[data-pedido-id="${pedidoPendienteCancelacion}"][data-estado="cancelado"]`,
    );
    if (!boton) {
      cerrarModalCancelacion();
      return;
    }
    boton.disabled = true;
    try {
      if (pedidoPendienteCancelacion.startsWith("local-")) {
        const guardados = JSON.parse(localStorage.getItem("pedidoPendienteAmapolas") || "[]");
        const pedidosLocales = Array.isArray(guardados) ? guardados : [guardados];
        const pedidoLocal = pedidosLocales.find(
          (pedido) => pedido?.id_pedido === pedidoPendienteCancelacion,
        );
        if (pedidoLocal) {
          pedidoLocal.estado = "cancelado";
          localStorage.setItem("pedidoPendienteAmapolas", JSON.stringify(pedidosLocales));
        }
        sincronizarEstadoPedidoCliente(pedidoPendienteCancelacion, "cancelado");
      } else {
        const respuesta = await fetch(`${API_PEDIDOS}/${pedidoPendienteCancelacion}/estado`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: "cancelado" }),
        });
        if (!respuesta.ok) throw new Error("No se pudo cancelar el pedido");
        sincronizarEstadoPedidoCliente(pedidoPendienteCancelacion, "cancelado");
      }
      await cargarPedidosDashboard();
    } catch (error) {
      console.error(error.message);
    } finally {
      cerrarModalCancelacion();
      boton.disabled = false;
    }
  });
}

cargarPedidosDashboard().catch((error) => console.error(error.message));
