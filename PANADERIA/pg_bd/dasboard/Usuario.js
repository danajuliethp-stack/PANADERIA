const API_USUARIOS = "http://127.0.0.1:3000/api/usuarios";
const rolesDisponibles = ["administrador", "empleado", "cliente", "proveedor"];
const estadosDisponibles = ["activo", "inactivo"];
const filtroTipo = document.getElementById("filtroTipo");
const cuerpoUsuarios = document.querySelector(".tabla-contenedor tbody");
const modalEditarUsuario = document.getElementById("modal-editar-usuario");
const formularioEditar = document.getElementById("form-editar-usuario");
const inputId = document.getElementById("usuario-id-editar");
const inputNombre = document.getElementById("usuario-nombre");
const inputCorreo = document.getElementById("usuario-correo");
const inputTelefono = document.getElementById("usuario-telefono");
const inputRol = document.getElementById("usuario-rol");
const inputEstado = document.getElementById("usuario-estado");
const botonAbrirRegistro = document.getElementById(
  "btn-abrir-registro-usuario",
);
const modalRegistroUsuario = document.getElementById("modal-registrar-usuario");
const formularioRegistro = document.getElementById("form-registrar-usuario");
const selectRolRegistro = document.getElementById("registro-rol");

if (formularioRegistro) {
  formularioRegistro.noValidate = true;
  formularioRegistro.setAttribute("novalidate", "novalidate");
  formularioRegistro.querySelectorAll("input, select").forEach((campo) => {
    campo.required = false;
    campo.removeAttribute("required");
  });
}

const inputRegistroNombre = document.getElementById("registro-nombre");
const inputRegistroCorreo = document.getElementById("registro-correo");
const inputRegistroContrasena = document.getElementById("registro-contrasena");
const inputRegistroConfirmar = document.getElementById("registro-confirmar");
const inputRegistroTelefono = document.getElementById("registro-telefono");
const inputRegistroTipoDocumento = document.getElementById(
  "registro-tipo-documento",
);
const inputRegistroTipoDocumentoEmpleado = document.getElementById(
  "registro-tipo-documento-empleado",
);
const inputRegistroDocumento = document.getElementById("registro-documento");
const inputRegistroDocEmpleado = document.getElementById(
  "registro-doc-empleado",
);
const inputRegistroCiudadEmpleado = document.getElementById(
  "registro-ciudad-empleado",
);
const inputRegistroDireccionEmpleado = document.getElementById(
  "registro-direccion-empleado",
);
const inputRegistroNitProveedor = document.getElementById(
  "registro-nit-proveedor",
);
const inputRegistroCiudadProveedor = document.getElementById(
  "registro-ciudad-proveedor",
);
const inputRegistroContactoProveedor = document.getElementById(
  "registro-contacto-proveedor",
);
const inputRegistroDireccionProveedor = document.getElementById(
  "registro-direccion-proveedor",
);

const capitalizar = (texto) =>
  texto ? texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase() : "";

const normalizarRolSeleccionado = (valor) => {
  const rolesValidos = ["cliente", "empleado", "proveedor", "administrador"];
  const rol = String(valor || "cliente")
    .trim()
    .toLowerCase();
  return rolesValidos.includes(rol) ? rol : "cliente";
};

function filaUsuario(usuario) {
  const rol = String(usuario.nombre_rol || usuario.rol || "").toLowerCase();
  const estado =
    String(usuario.estado || "activo").toLowerCase() === "inactivo"
      ? "inactivo"
      : "activo";
  return `<tr data-tipo="${rol}">
    <td>${usuario.nombre}</td>
    <td>${capitalizar(rol)}</td>
    <td>${usuario.correo}<br>${usuario.telefono || ""}</td>
    <td><span class="estado ${estado}">${capitalizar(estado)}</span></td>
    <td>
      <button type="button" class="btn-editar" data-usuario-id="${usuario.id_usuario}" data-usuario-nombre="${usuario.nombre}" data-usuario-correo="${usuario.correo}" data-usuario-telefono="${usuario.telefono || ""}" data-usuario-rol="${rol}" data-usuario-estado="${estado}">
        Editar
      </button>
    </td>
  </tr>`;
}

async function cargarUsuarios() {
  const respuesta = await fetch(API_USUARIOS);
  if (!respuesta.ok) throw new Error("No se pudieron cargar los usuarios");
  const usuarios = await respuesta.json();
  cuerpoUsuarios.innerHTML = usuarios.map(filaUsuario).join("");
  aplicarFiltro();
}

function aplicarFiltro() {
  const tipoSeleccionado = filtroTipo.value;
  cuerpoUsuarios.querySelectorAll("tr[data-tipo]").forEach((fila) => {
    fila.hidden =
      tipoSeleccionado !== "" && fila.dataset.tipo !== tipoSeleccionado;
  });
}

function actualizarVistaRolRegistro(rol) {
  const rolNormalizado = normalizarRolSeleccionado(rol);
  selectRolRegistro.value = rolNormalizado;

  const seccionCliente = document.querySelector(
    '[data-role-section="cliente"]',
  );
  const seccionEmpleado = document.querySelector(
    '[data-role-section="empleado"]',
  );
  const seccionProveedor = document.querySelector(
    '[data-role-section="proveedor"]',
  );

  const muestraCliente =
    rolNormalizado === "cliente" || rolNormalizado === "administrador";
  const muestraEmpleado = rolNormalizado === "empleado";
  const muestraProveedor = rolNormalizado === "proveedor";

  if (seccionCliente) {
    seccionCliente.classList.toggle("hidden", !muestraCliente);
  }
  if (seccionEmpleado) {
    seccionEmpleado.classList.toggle("hidden", !muestraEmpleado);
  }
  if (seccionProveedor) {
    seccionProveedor.classList.toggle("hidden", !muestraProveedor);
  }

  const camposBase = document.querySelectorAll(
    ".registro-base, .registro-telefono",
  );
  camposBase.forEach((campo) => campo.classList.toggle("hidden", false));

  const credenciales = document.querySelectorAll(".registro-credentials");
  credenciales.forEach((campo) => {
    campo.classList.toggle("hidden", rolNormalizado === "proveedor");
  });

  const tipoDocumento = document.getElementById("registro-tipo-documento");
  const tipoDocumentoEmpleado = document.getElementById(
    "registro-tipo-documento-empleado",
  );
  const documento = document.getElementById("registro-documento");
  const documentoEmpleado = document.getElementById("registro-doc-empleado");

  if (tipoDocumento) {
    const mostrarTipoCliente =
      rolNormalizado === "cliente" || rolNormalizado === "administrador";
    tipoDocumento.disabled = !mostrarTipoCliente;
    tipoDocumento
      .closest(".campo-usuario")
      ?.classList.toggle("hidden", !mostrarTipoCliente);
  }

  if (tipoDocumentoEmpleado) {
    const mostrarTipoEmpleado = rolNormalizado === "empleado";
    tipoDocumentoEmpleado.disabled = !mostrarTipoEmpleado;
    tipoDocumentoEmpleado
      .closest(".campo-usuario")
      ?.classList.toggle("hidden", !mostrarTipoEmpleado);
  }

  if (documento) {
    const mostrarDocumentoCliente =
      rolNormalizado === "cliente" || rolNormalizado === "administrador";
    documento.disabled = !mostrarDocumentoCliente;
    documento
      .closest(".campo-usuario")
      ?.classList.toggle("hidden", !mostrarDocumentoCliente);
  }

  if (documentoEmpleado) {
    const mostrarDocumentoEmpleado = rolNormalizado === "empleado";
    documentoEmpleado.disabled = !mostrarDocumentoEmpleado;
    documentoEmpleado
      .closest(".campo-usuario")
      ?.classList.toggle("hidden", !mostrarDocumentoEmpleado);
  }
}

function abrirModalEdicion(usuarioId, nombre, correo, telefono, rol, estado) {
  inputId.value = usuarioId;
  inputNombre.value = nombre || "";
  inputCorreo.value = correo || "";
  inputTelefono.value = telefono || "";
  inputRol.value = rolesDisponibles.includes(rol) ? rol : "";
  inputEstado.value = estadosDisponibles.includes(estado) ? estado : "activo";
  modalEditarUsuario.classList.remove("hidden");
  modalEditarUsuario.setAttribute("aria-hidden", "false");
  inputNombre.focus();
}

function cerrarModalEdicion() {
  modalEditarUsuario.classList.add("hidden");
  modalEditarUsuario.setAttribute("aria-hidden", "true");
  formularioEditar.reset();
}

function abrirModalRegistro() {
  formularioRegistro.reset();
  selectRolRegistro.value = "";
  actualizarVistaRolRegistro("");
  modalRegistroUsuario.classList.remove("hidden");
  modalRegistroUsuario.setAttribute("aria-hidden", "false");
  inputRegistroNombre.focus();
}

function cerrarModalRegistro() {
  modalRegistroUsuario.classList.add("hidden");
  modalRegistroUsuario.setAttribute("aria-hidden", "true");
  formularioRegistro.reset();
}

filtroTipo.addEventListener("change", aplicarFiltro);

selectRolRegistro.addEventListener("change", (evento) => {
  const rolSeleccionado = normalizarRolSeleccionado(evento.target.value);
  selectRolRegistro.value = rolSeleccionado;
  actualizarVistaRolRegistro(rolSeleccionado);
});

botonAbrirRegistro.addEventListener("click", abrirModalRegistro);

cuerpoUsuarios.addEventListener("click", (evento) => {
  const botonEditar = evento.target.closest(".btn-editar");
  if (!botonEditar) return;

  abrirModalEdicion(
    botonEditar.dataset.usuarioId,
    botonEditar.dataset.usuarioNombre,
    botonEditar.dataset.usuarioCorreo,
    botonEditar.dataset.usuarioTelefono,
    botonEditar.dataset.usuarioRol,
    botonEditar.dataset.usuarioEstado,
  );
});

modalEditarUsuario.addEventListener("click", (evento) => {
  if (
    evento.target.dataset.cerrarModal !== undefined ||
    evento.target === modalEditarUsuario
  ) {
    cerrarModalEdicion();
  }
});

modalRegistroUsuario.addEventListener("click", (evento) => {
  if (
    evento.target.dataset.cerrarModalRegistro !== undefined ||
    evento.target === modalRegistroUsuario
  ) {
    cerrarModalRegistro();
  }
});

document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape") {
    if (!modalEditarUsuario.classList.contains("hidden")) {
      cerrarModalEdicion();
    }
    if (!modalRegistroUsuario.classList.contains("hidden")) {
      cerrarModalRegistro();
    }
  }
});

formularioEditar.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const usuarioId = inputId.value;
  const nombre = inputNombre.value.trim();
  const correo = inputCorreo.value.trim();
  const telefono = inputTelefono.value.trim();
  const rol = inputRol.value;
  const estado = inputEstado.value;

  if (!usuarioId || !nombre || !correo) {
    alert("Completa nombre y correo del usuario.");
    return;
  }

  const botonGuardar = formularioEditar.querySelector(".btn-guardar-usuario");
  botonGuardar.disabled = true;

  try {
    const payloadPerfil = {};
    if (nombre) payloadPerfil.nombre = nombre;
    if (correo) payloadPerfil.correo = correo.toLowerCase();
    if (telefono || telefono === "") payloadPerfil.telefono = telefono;

    if (Object.keys(payloadPerfil).length > 0) {
      const respuestaPerfil = await fetch(
        `${API_USUARIOS}/${usuarioId}/perfil`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadPerfil),
        },
      );
      if (!respuestaPerfil.ok) {
        const errorData = await respuestaPerfil.json().catch(() => ({}));
        throw new Error(
          errorData.mensaje || "No se pudo actualizar los datos del usuario",
        );
      }
    }

    const respuestaRol = await fetch(`${API_USUARIOS}/${usuarioId}/rol`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rol }),
    });
    if (!respuestaRol.ok) {
      const errorData = await respuestaRol.json().catch(() => ({}));
      throw new Error(
        errorData.mensaje || "No se pudo cambiar el rol del usuario",
      );
    }

    const respuestaEstado = await fetch(`${API_USUARIOS}/${usuarioId}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    if (!respuestaEstado.ok) {
      const errorData = await respuestaEstado.json().catch(() => ({}));
      throw new Error(
        errorData.mensaje || "No se pudo cambiar el estado del usuario",
      );
    }

    await cargarUsuarios();
    cerrarModalEdicion();
  } catch (error) {
    alert(error.message);
  } finally {
    botonGuardar.disabled = false;
  }
});

formularioRegistro.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const nombre = inputRegistroNombre.value.trim();
  const correo = inputRegistroCorreo.value.trim();
  const contrasena = inputRegistroContrasena.value;
  const confirmar = inputRegistroConfirmar.value;
  const telefono = inputRegistroTelefono.value.trim();
  const rol = normalizarRolSeleccionado(selectRolRegistro.value);

  if (!rol) {
    alert("Por favor selecciona un rol para el usuario.");
    return;
  }

  if (!nombre || !telefono) {
    alert("Completa los campos obligatorios del usuario.");
    return;
  }

  if (rol !== "proveedor") {
    if (!correo || !contrasena || !confirmar) {
      alert("Completa correo y contraseña del usuario.");
      return;
    }

    if (contrasena.length < 6) {
      alert("La contraseña debe tener mínimo 6 caracteres.");
      return;
    }

    if (contrasena !== confirmar) {
      alert("Las contraseñas no coinciden.");
      return;
    }
  }

  let documento = "";
  let tipoDocumento = "cc";

  if (rol === "cliente" || rol === "administrador") {
    documento = inputRegistroDocumento.value.trim();
    tipoDocumento = inputRegistroTipoDocumento.value || "cc";
    if (!documento) {
      const mensaje =
        rol === "administrador"
          ? "Debes ingresar el documento del administrador."
          : "Debes ingresar el documento del cliente.";
      alert(mensaje);
      return;
    }
  }

  if (rol === "empleado") {
    documento = inputRegistroDocEmpleado.value.trim();
    tipoDocumento =
      inputRegistroTipoDocumentoEmpleado?.value ||
      inputRegistroTipoDocumento?.value ||
      "cc";
    if (!documento) {
      alert("Debes ingresar el documento del empleado.");
      return;
    }
  }

  if (rol === "proveedor") {
    documento = inputRegistroNitProveedor.value.trim();
    if (!documento) {
      alert("Debes ingresar el NIT del proveedor.");
      return;
    }
    tipoDocumento = "nit";
  }

  const botonGuardar = formularioRegistro.querySelector(".btn-guardar-usuario");
  botonGuardar.disabled = true;

  try {
    const payload = {
      nombre,
      tipoDocumento,
      documento,
      telefono,
      rol,
    };

    if (rol === "proveedor") {
      const documentoProveedor = (
        inputRegistroNitProveedor?.value || ""
      ).trim();
      payload.documento = documentoProveedor || documento;
      payload.tipoDocumento = "nit";
      payload.correo = "proveedor123@gmail.com";
      payload.contrasena = "proveedor123";
    } else {
      payload.correo = correo.toLowerCase();
      payload.contrasena = contrasena;
    }

    const respuesta = await fetch(`${API_USUARIOS}/registro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const resultado = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new Error(resultado.mensaje || "No se pudo registrar el usuario");
    }

    await cargarUsuarios();
    cerrarModalRegistro();
    window.dispatchEvent(
      new CustomEvent("usuario-registrado", {
        detail: {
          mensaje: resultado.mensaje || "Usuario registrado correctamente",
        },
      }),
    );
    const modalExito = document.createElement("div");
    modalExito.className = "modal-confirmacion";
    modalExito.innerHTML = `
      <div class="modal-confirmacion__backdrop" data-cerrar-modal="true"></div>
      <div class="modal-confirmacion__card" role="dialog" aria-modal="true" aria-labelledby="tituloRegistroExitoso">
        <h3 id="tituloRegistroExitoso">Registro exitoso</h3>
        <p>${resultado.mensaje || "Usuario registrado correctamente"}</p>
        <div class="modal-confirmacion__acciones">
          <button type="button" class="btn-rol">Aceptar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalExito);
    modalExito.querySelector("button").addEventListener("click", () => {
      modalExito.remove();
    });
    modalExito.addEventListener("click", (evento) => {
      if (
        evento.target.dataset.cerrarModal !== undefined ||
        evento.target === modalExito
      ) {
        modalExito.remove();
      }
    });
  } catch (error) {
    alert(error.message);
  } finally {
    botonGuardar.disabled = false;
  }
});

cargarUsuarios().catch((error) => console.error(error.message));
