const API_SERVIDOR =
  window.location.port === "3000"
    ? window.location.origin
    : "http://127.0.0.1:3000";
const API_PRODUCTOS = `${API_SERVIDOR}/api/productos`;
const API_ORIGEN = API_SERVIDOR;
const formularioProducto = document.getElementById("form-agregar-producto");
const menuGrid = document.getElementById("menuGrid");
const modalProducto = document.getElementById("modalProducto");
const tituloModalProducto = document.getElementById("tituloModalProducto");
const productoId = document.getElementById("productoId");
const selectorImagen = document.getElementById("imagenProducto");
const imagenVistaPrevia = document.getElementById("imagenVistaPrevia");
const filtroCategoria = document.getElementById("filtroCategoria");
const filtroEstado = document.getElementById("filtroEstado");
const modalSuspension = document.getElementById("modalConfirmarSuspension");
const modalGuardado = document.getElementById("modalConfirmarGuardado");
const confirmarSuspensionBtn = document.getElementById(
  "confirmarSuspensionBtn",
);
const confirmarGuardadoBtn = document.getElementById("confirmarGuardadoBtn");
const elementosCarga = document.querySelectorAll(
  ".upload-icon, .upload-text, .upload-formats",
);
let productosTotales = [];
let productoPendienteSuspension = null;

const categorias = {
  1: "Panadería",
  2: "Pastelería",
  3: "Bizcochería",
  4: "Bebidas",
};

const formatoPrecio = (precio) => `$${Number(precio).toLocaleString("es-CO")}`;

const urlImagen = (imagen) =>
  imagen ? new URL(imagen, API_ORIGEN).href : "../imagenes/Logo2.png";

const mostrarImagen = (src) => {
  if (src) {
    imagenVistaPrevia.src = src;
    imagenVistaPrevia.hidden = false;
    elementosCarga.forEach((elemento) => (elemento.hidden = true));
  } else {
    imagenVistaPrevia.hidden = true;
    imagenVistaPrevia.removeAttribute("src");
    elementosCarga.forEach((elemento) => (elemento.hidden = false));
  }
};

const abrirModalSuspension = (producto) => {
  productoPendienteSuspension = producto;
  if (modalSuspension) {
    modalSuspension.hidden = false;
  }
};

const cerrarModalSuspension = () => {
  productoPendienteSuspension = null;
  if (modalSuspension) {
    modalSuspension.hidden = true;
  }
};

const mostrarModalGuardado = () => {
  if (modalGuardado) {
    modalGuardado.hidden = false;
    modalGuardado.style.display = "grid";
  }
};

const cerrarModalGuardado = () => {
  if (modalGuardado) {
    modalGuardado.hidden = true;
    modalGuardado.style.display = "none";
  }
};

const cambiarEstado = async (producto, tarjeta) => {
  const estadoActual = String(producto.estado || "").toLowerCase();
  const nuevoEstado = ["inactivo", "suspendido"].includes(estadoActual)
    ? "activo"
    : "inactivo";
  try {
    let respuesta = await fetch(
      `${API_PRODUCTOS}/${producto.id_producto}/estado?estado=${nuevoEstado}`,
      { method: "POST" },
    );
    const contenido = await respuesta.text();
    let datos = {};
    let respuestaValida = true;
    if (contenido) {
      try {
        datos = JSON.parse(contenido);
      } catch {
        respuestaValida = false;
      }
    }
    if (!respuesta.ok || !respuestaValida) {
      const datosEdicion = new FormData();
      datosEdicion.append("nombre", producto.nombre);
      datosEdicion.append("descripcion", producto.descripcion || "");
      datosEdicion.append("precio", producto.precio);
      datosEdicion.append("id_categoria", producto.id_categoria);
      datosEdicion.append("estado", nuevoEstado);
      respuesta = await fetch(`${API_PRODUCTOS}/${producto.id_producto}`, {
        method: "PUT",
        body: datosEdicion,
      });
      const contenidoEdicion = await respuesta.text();
      try {
        datos = contenidoEdicion ? JSON.parse(contenidoEdicion) : {};
      } catch {
        throw new Error(
          "La API no está disponible. Reinicia el servidor con npm start.",
        );
      }
    }
    if (!respuesta.ok) {
      throw new Error(datos.mensaje || "No se pudo cambiar el estado");
    }
    producto.estado = nuevoEstado;
    const estadoProducto = tarjeta.querySelector(".estado-producto");
    const botonSuspender = tarjeta.querySelector(".boton-suspender");
    const estaInactivo = producto.estado === "inactivo";
    estadoProducto.textContent = estaInactivo ? "Inactivo" : "Activo";
    estadoProducto.classList.toggle("activo", !estaInactivo);
    estadoProducto.classList.toggle("inactivo", estaInactivo);
    botonSuspender.textContent = estaInactivo ? "Activar" : "Suspender";
    aplicarFiltros();
  } catch (error) {
    console.error("Error al cambiar el estado:", error);
    alert(error.message);
  }
};

const aplicarFiltros = () => {
  const categoriaSeleccionada = filtroCategoria?.value || "";
  const estadoSeleccionado = filtroEstado?.value || "";

  const productosFiltrados = productosTotales.filter((producto) => {
    const coincideCategoria =
      !categoriaSeleccionada ||
      String(producto.id_categoria) === String(categoriaSeleccionada);
    const estadoProducto = String(producto.estado || "activo").toLowerCase();
    const coincideEstado =
      !estadoSeleccionado ||
      estadoProducto === String(estadoSeleccionado).toLowerCase();

    return coincideCategoria && coincideEstado;
  });

  renderizarProductos(productosFiltrados);
};

const renderizarProductos = (productos) => {
  menuGrid.innerHTML = "";
  if (!productos.length) {
    menuGrid.innerHTML = `
      <div class="mensaje-vacio" style="grid-column: 1 / -1; padding: 28px; text-align: center; color: #6b7280; background: #f9f5f1; border: 1px dashed #d7c7b4; border-radius: 14px;">
        No hay productos con estos filtros.
      </div>`;
    return;
  }

  productos.forEach((producto) => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "platillo-menu";
    tarjeta.innerHTML = `
      <div class="platillo-imagen-wrap">
        <img src="${urlImagen(producto.imagen)}" alt="${producto.nombre}">
        <span class="categoria-badge">${categorias[producto.id_categoria] || "Sin categoría"}</span>
        <span class="estado-producto ${producto.estado === "inactivo" ? "inactivo" : "activo"}">
          ${producto.estado === "inactivo" ? "Inactivo" : "Activo"}
        </span>
      </div>
      <div class="platillo-contenido">
        <div class="platillo-titulo-row">
          <h3>${producto.nombre}</h3>
          <span class="precio">${formatoPrecio(producto.precio)}</span>
        </div>
        <p>${producto.descripcion || "Sin descripción"}</p>
        <div class="platillo-pie">
        </div>
        <div class="acciones-producto-menu">
          <button type="button" class="boton-secundario boton-suspender" data-producto-id="${producto.id_producto}">
            ${producto.estado === "inactivo" ? "Activar" : "Suspender"}
          </button>
          <button type="button" class="boton-secundario boton-editar">Editar</button>
        </div>
      </div>`;
    tarjeta.querySelector(".boton-suspender").addEventListener("click", () => {
      if (producto.estado === "inactivo") {
        cambiarEstado(producto, tarjeta);
        return;
      }
      abrirModalSuspension(producto);
    });
    tarjeta.querySelector(".boton-editar").addEventListener("click", () => {
      abrirModalEdicion(producto);
    });
    menuGrid.appendChild(tarjeta);
  });
};

const cargarProductos = async () => {
  const respuesta = await fetch(API_PRODUCTOS);
  if (!respuesta.ok) throw new Error("No se pudieron cargar los productos");
  productosTotales = await respuesta.json();
  aplicarFiltros();
};

const abrirModalEdicion = (producto) => {
  productoId.value = producto.id_producto;
  document.getElementById("nombre").value = producto.nombre;
  document.getElementById("descripcion").value = producto.descripcion || "";
  document.getElementById("precio").value = producto.precio;
  document.getElementById("categoria").value = producto.id_categoria;
  document.getElementById("estado").value =
    producto.estado === "inactivo" ? "inactivo" : "activo";
  tituloModalProducto.textContent = "Editar producto";
  mostrarImagen(urlImagen(producto.imagen));
  modalProducto.style.display = "flex";
};

if (filtroCategoria) {
  filtroCategoria.addEventListener("change", aplicarFiltros);
}

if (filtroEstado) {
  filtroEstado.addEventListener("change", aplicarFiltros);
}

document.addEventListener("click", (evento) => {
  const cerrarModalTrigger = evento.target.closest(
    "[data-cerrar-modal='true']",
  );
  if (cerrarModalTrigger) {
    cerrarModalSuspension();
    return;
  }

  const cerrarModalGuardadoTrigger = evento.target.closest(
    "[data-cerrar-modal-guardado='true']",
  );
  if (cerrarModalGuardadoTrigger) {
    cerrarModalGuardado();
    return;
  }

  if (evento.target === modalSuspension) {
    cerrarModalSuspension();
  }
});

if (confirmarSuspensionBtn) {
  confirmarSuspensionBtn.addEventListener("click", async () => {
    if (!productoPendienteSuspension) return;
    const producto = productoPendienteSuspension;
    const tarjeta = menuGrid
      .querySelector(
        `.boton-suspender[data-producto-id="${producto.id_producto}"]`,
      )
      ?.closest(".platillo-menu");

    if (!tarjeta) {
      cerrarModalSuspension();
      return;
    }

    await cambiarEstado(producto, tarjeta);
    cerrarModalSuspension();
  });
}

if (confirmarGuardadoBtn) {
  confirmarGuardadoBtn.addEventListener("click", () => {
    cerrarModalGuardado();
  });
}

window.abrirModal = () => {
  formularioProducto.reset();
  productoId.value = "";
  tituloModalProducto.textContent = "Agregar nuevo producto";
  mostrarImagen("");
  modalProducto.style.display = "flex";
};

window.cerrarModal = () => {
  modalProducto.style.display = "none";
};

selectorImagen.addEventListener("change", () => {
  const imagenSeleccionada = selectorImagen.files[0];
  mostrarImagen(
    imagenSeleccionada ? URL.createObjectURL(imagenSeleccionada) : "",
  );
});

formularioProducto.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const id = productoId.value;
  const producto = new FormData();
  producto.append("nombre", document.getElementById("nombre").value.trim());
  producto.append(
    "descripcion",
    document.getElementById("descripcion").value.trim(),
  );
  producto.append("precio", document.getElementById("precio").value);
  producto.append("id_categoria", document.getElementById("categoria").value);
  producto.append("estado", document.getElementById("estado").value);
  if (selectorImagen.files[0])
    producto.append("imagen", selectorImagen.files[0]);

  try {
    const respuesta = await fetch(
      id ? `${API_PRODUCTOS}/${id}` : API_PRODUCTOS,
      {
        method: id ? "PUT" : "POST",
        body: producto,
      },
    );

    const contenido = await respuesta.text();
    let datos = {};
    if (contenido) {
      try {
        datos = JSON.parse(contenido);
      } catch {
        throw new Error(
          "La API no está disponible. Reinicia el servidor con npm start.",
        );
      }
    }
    if (!respuesta.ok)
      throw new Error(datos.mensaje || "No se pudo guardar el producto");

    cerrarModal();
    mostrarModalGuardado();
    await cargarProductos();
  } catch (error) {
    console.error("Error al guardar el producto:", error);
    alert(error.message);
  }
});

cargarProductos().catch((error) => {
  console.error("Error al cargar el menú:", error);
  alert(error.message);
});
