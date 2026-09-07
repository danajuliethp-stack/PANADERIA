const usuarioGuardado = sessionStorage.getItem("usuarioSesion");
const datosUsuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
const API_USUARIOS_DASHBOARD = "http://127.0.0.1:3000/api/usuarios";
const usuario = document.querySelector(".usuario");
const notificacionWrap = document.querySelector(".notificacion-wrap");
const buscador = document.querySelector(".buscador input");
let menuNotificaciones = document.querySelector(".menu-notificaciones");
let badgeNotificacion = document.querySelector(".contador-notificacion");
let notificacionesAbiertas = false;
const CLAVE_NOTIFICACIONES_LEIDAS = "dashboardNotificacionesLeidas";
let notificacionesLeidas =
  localStorage.getItem(CLAVE_NOTIFICACIONES_LEIDAS) === "true";

function aplicarBusqueda(valor = "") {
  const termino = valor.trim().toLocaleLowerCase();
  const elementos = document.querySelectorAll(
    ".tarjeta-estadistica, .tarjeta-resumen, .platillo-menu, " +
      ".platillo-row, .tabla-contenedor tbody tr, .tabla-wrap tbody tr",
  );

  elementos.forEach((elemento) => {
    const coincide = !termino || elemento.textContent.toLocaleLowerCase().includes(termino);
    elemento.hidden = !coincide;
  });
}

if (buscador) {
  buscador.setAttribute("aria-label", "Buscar en el dashboard");
  buscador.addEventListener("input", () => aplicarBusqueda(buscador.value));
}

if (notificacionWrap) {
  notificacionWrap.setAttribute("role", "button");
  notificacionWrap.setAttribute("tabindex", "0");

  if (!badgeNotificacion) {
    badgeNotificacion = document.createElement("span");
    badgeNotificacion.className = "contador-notificacion";
    badgeNotificacion.hidden = true;
    badgeNotificacion.textContent = "0";
    notificacionWrap.appendChild(badgeNotificacion);
  }

  if (!menuNotificaciones) {
    menuNotificaciones = document.createElement("div");
    menuNotificaciones.className = "menu-notificaciones";
    menuNotificaciones.hidden = true;
    notificacionWrap.appendChild(menuNotificaciones);
  }
}

function actualizarBadgeNotificaciones(total) {
  if (!badgeNotificacion) return;
  const valor = Number(total) || 0;
  badgeNotificacion.textContent = String(valor);
  badgeNotificacion.hidden = notificacionesLeidas || valor <= 0;
  badgeNotificacion.style.display =
    valor > 0 && !notificacionesLeidas ? "inline-flex" : "none";
}

function renderMenuNotificaciones(usuarios = [], pedidos = []) {
  if (!menuNotificaciones) return;

  const clientes = usuarios.filter(
    (registro) =>
      String(registro.nombre_rol || registro.rol || "")
        .trim()
        .toLowerCase() === "cliente",
  );

  const pendientes = pedidos.filter(
    (pedido) =>
      String(pedido.estado || "")
        .trim()
        .toLowerCase() === "pendiente",
  );

  const notificaciones = [];
  clientes.slice(0, 5).forEach((cliente) => {
    notificaciones.push({
      tipo: "nuevo-usuario",
      etiqueta: "Usuario nuevo",
      texto: cliente.nombre || "Cliente registrado",
    });
  });
  pendientes.slice(0, 5).forEach((pedido) => {
    notificaciones.push({
      tipo: "nuevo-pedido",
      etiqueta: "Nuevo pedido",
      texto: pedido.cliente || "Pedido pendiente",
    });
  });

  if (!notificaciones.length) {
    menuNotificaciones.innerHTML =
      '<div class="notificacion-vacia">No hay notificaciones</div>';
    return;
  }

  menuNotificaciones.innerHTML = notificaciones
    .slice(0, 8)
    .map(
      (notificacion) => `
      <div class="notificacion-item ${notificacion.tipo}">
        <span class="dot"></span>
        <div>
          <span>${notificacion.etiqueta}</span>
          <strong>${notificacion.texto}</strong>
        </div>
      </div>
    `,
    )
    .join("");
}

if (notificacionWrap && menuNotificaciones) {
  const abrirNotificaciones = () => {
    notificacionesAbiertas = !notificacionesAbiertas;
    menuNotificaciones.hidden = !notificacionesAbiertas;
    if (notificacionesAbiertas) {
      notificacionesLeidas = true;
      localStorage.setItem(CLAVE_NOTIFICACIONES_LEIDAS, "true");
      if (badgeNotificacion) {
        badgeNotificacion.hidden = true;
        badgeNotificacion.style.display = "none";
      }
    }
  };

  notificacionWrap.addEventListener("click", (evento) => {
    evento.stopPropagation();
    abrirNotificaciones();
  });

  notificacionWrap.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      abrirNotificaciones();
    }
  });

  document.addEventListener("click", (evento) => {
    if (!notificacionWrap.contains(evento.target)) {
      notificacionesAbiertas = false;
      menuNotificaciones.hidden = true;
      if (badgeNotificacion) {
        badgeNotificacion.hidden = true;
        badgeNotificacion.style.display = "none";
      }
    }
  });
}

if (usuario) {
  const nombreUsuario = datosUsuario?.nombre?.trim() || "Administrador";
  const avatar = usuario.querySelector(".avatar");
  const nombre = usuario.querySelector(".datos-usuario strong");
  const flecha = usuario.querySelector(".datos-usuario span");

  if (avatar) {
    avatar.textContent = nombreUsuario.charAt(0).toUpperCase();
  }

  async function actualizarClientesNuevos() {
    const tarjetas = document.querySelectorAll(".tarjeta-estadistica");
    const tarjetaClientes = [...tarjetas].find((tarjeta) =>
      tarjeta
        .querySelector(".titulo-estadistica")
        ?.textContent.toLowerCase()
        .includes("clientes nuevos"),
    );
    const contador = tarjetaClientes?.querySelector("strong");

    try {
      const respuesta = await fetch(API_USUARIOS_DASHBOARD);
      if (!respuesta.ok) throw new Error(`API respondió ${respuesta.status}`);
      const usuarios = await respuesta.json();
      const clientes = usuarios.filter(
        (registro) =>
          String(registro.nombre_rol || registro.rol || "")
            .trim()
            .toLowerCase() === "cliente",
      );

      if (contador) contador.textContent = clientes.length;

      const respuestaPedidos = await fetch("http://127.0.0.1:3000/api/pedidos");
      let pedidos = [];
      if (respuestaPedidos.ok) {
        pedidos = await respuestaPedidos.json();
      }
      const pedidosPendientes = Array.isArray(pedidos)
        ? pedidos.filter(
            (pedido) =>
              String(pedido.estado || "").toLowerCase() === "pendiente",
          )
        : [];

      renderMenuNotificaciones(usuarios, pedidosPendientes);
      const totalNotificaciones = clientes.length + pedidosPendientes.length;
      actualizarBadgeNotificaciones(totalNotificaciones);
    } catch (error) {
      console.error(
        "No se pudieron cargar los clientes nuevos:",
        error.message,
      );
      renderMenuNotificaciones([], []);
      actualizarBadgeNotificaciones(0);
    }
  }

  actualizarClientesNuevos();
  window.addEventListener("storage", (evento) => {
    if (evento.key === "dashboard-notificacion") {
      notificacionesLeidas = false;
      localStorage.removeItem(CLAVE_NOTIFICACIONES_LEIDAS);
      actualizarClientesNuevos();
    }
  });

  window.addEventListener("message", (evento) => {
    if (
      evento.data?.type === "dashboard-notificacion" ||
      evento.data?.tipo === "dashboard-notificacion"
    ) {
      notificacionesLeidas = false;
      localStorage.removeItem(CLAVE_NOTIFICACIONES_LEIDAS);
      actualizarClientesNuevos();
    }
  });

  window.addEventListener("dashboard-notificacion", () => {
    notificacionesLeidas = false;
    localStorage.removeItem(CLAVE_NOTIFICACIONES_LEIDAS);
    actualizarClientesNuevos();
  });

  if (nombre) {
    nombre.textContent = nombreUsuario;
  }

  const menu = document.createElement("div");
  menu.className = "menu-usuario";
  menu.hidden = true;
  menu.innerHTML =
    '<button type="button" class="boton-cerrar-sesion">Cerrar sesión</button>';
  usuario.appendChild(menu);

  usuario.addEventListener("click", (evento) => {
    if (evento.target.closest(".boton-cerrar-sesion")) {
      sessionStorage.removeItem("usuarioSesion");
      window.location.href = "../login.html";
      return;
    }

    menu.hidden = !menu.hidden;
    if (flecha) {
      flecha.setAttribute("aria-expanded", String(!menu.hidden));
    }
  });

  document.addEventListener("click", (evento) => {
    if (!usuario.contains(evento.target)) {
      menu.hidden = true;
      if (flecha) {
        flecha.setAttribute("aria-expanded", "false");
      }
    }
  });
}
