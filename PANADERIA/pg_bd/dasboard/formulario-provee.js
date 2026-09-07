/* =====================================================
   ELEMENTOS DEL MODAL
===================================================== */

const modalProveedor = document.getElementById("modalProveedor");

const botonAbrirModal = document.getElementById("botonAbrirModal");

const botonCerrar = document.getElementById("botonCerrar");

const botonCancelar = document.getElementById("botonCancelar");

const formulario = document.getElementById("formularioProveedor");

const botonGuardar = document.getElementById("botonGuardar");

/* =====================================================
   ELEMENTOS DE LOS CAMPOS
===================================================== */

const nombreProveedor = document.getElementById("nombreProveedor");

const nitProveedor = document.getElementById("nitProveedor");

const telefonoProveedor = document.getElementById("telefonoProveedor");

const correoProveedor = document.getElementById("correoProveedor");

const ciudadProveedor = document.getElementById("ciudadProveedor");

const direccionProveedor = document.getElementById("direccionProveedor");

const contactoProveedor = document.getElementById("contactoProveedor");

const estadoProveedor = document.getElementById("estadoProveedor");

const tipoProveedor = document.getElementById("tipoProveedor");

/* =====================================================
   ABRIR MODAL
===================================================== */

botonAbrirModal.addEventListener("click", function () {
  modalProveedor.style.display = "flex";

  nombreProveedor.focus();

  document.body.style.overflow = "hidden";
});

/* =====================================================
   CERRAR MODAL
===================================================== */

function cerrarModal() {
  modalProveedor.style.display = "none";

  document.body.style.overflow = "auto";

  formulario.reset();

  limpiarErrores();
}

/* BOTÓN X */

botonCerrar.addEventListener("click", cerrarModal);

/* BOTÓN CANCELAR */

botonCancelar.addEventListener("click", cerrarModal);

/* =====================================================
   CERRAR CON ESC
===================================================== */

document.addEventListener("keydown", function (evento) {
  if (evento.key === "Escape" && modalProveedor.style.display === "flex") {
    cerrarModal();
  }
});

/* =====================================================
   FUNCIONES PARA MOSTRAR ERRORES
===================================================== */

function mostrarError(campo, mensaje, elementoError) {
  campo.parentElement.classList.add("campo-error");

  campo.parentElement.classList.remove("campo-correcto");

  elementoError.textContent = mensaje;
}

function mostrarCorrecto(campo, elementoError) {
  campo.parentElement.classList.remove("campo-error");

  campo.parentElement.classList.add("campo-correcto");

  elementoError.textContent = "";
}

function limpiarErrores() {
  const grupos = document.querySelectorAll(".grupo-campo");

  grupos.forEach(function (grupo) {
    grupo.classList.remove("campo-error");

    grupo.classList.remove("campo-correcto");
  });

  const mensajes = document.querySelectorAll(".mensaje-error");

  mensajes.forEach(function (mensaje) {
    mensaje.textContent = "";
  });
}

/* =====================================================
   VALIDAR NOMBRE
===================================================== */

function validarNombre() {
  const valor = nombreProveedor.value.trim();

  const error = document.getElementById("errorNombre");

  if (valor === "") {
    mostrarError(
      nombreProveedor,
      "El nombre del proveedor es obligatorio.",
      error,
    );

    return false;
  }

  if (valor.length < 3) {
    mostrarError(nombreProveedor, "Debe tener mínimo 3 caracteres.", error);

    return false;
  }

  if (valor.length > 80) {
    mostrarError(nombreProveedor, "No puede superar los 80 caracteres.", error);

    return false;
  }

  const patron = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s.&'-]+$/;

  if (!patron.test(valor)) {
    mostrarError(
      nombreProveedor,
      "Solo se permiten letras y algunos signos básicos.",
      error,
    );

    return false;
  }

  mostrarCorrecto(nombreProveedor, error);

  return true;
}

/* =====================================================
   VALIDAR NIT
===================================================== */

function validarNit() {
  const valor = nitProveedor.value.trim();

  const error = document.getElementById("errorNit");

  if (valor === "") {
    mostrarError(nitProveedor, "El NIT es obligatorio.", error);

    return false;
  }

  /*
       Formato permitido:

       900123456-7
       900123456
    */

  const patron = /^\d{8,10}(-\d{1})?$/;

  if (!patron.test(valor)) {
    mostrarError(
      nitProveedor,
      "Ingresa un NIT válido. Ejemplo: 900123456-7.",
      error,
    );

    return false;
  }

  mostrarCorrecto(nitProveedor, error);

  return true;
}

/* =====================================================
   VALIDAR TELÉFONO
===================================================== */

function validarTelefono() {
  const valor = telefonoProveedor.value.trim();

  const error = document.getElementById("errorTelefono");

  if (valor === "") {
    mostrarError(telefonoProveedor, "El teléfono es obligatorio.", error);

    return false;
  }

  /*
       Teléfono colombiano:

       3001234567
       3101234567
       etc.
    */

  const patron = /^3\d{9}$/;

  if (!patron.test(valor)) {
    mostrarError(
      telefonoProveedor,
      "Ingresa un celular colombiano válido de 10 números.",
      error,
    );

    return false;
  }

  mostrarCorrecto(telefonoProveedor, error);

  return true;
}

/* =====================================================
   VALIDAR CORREO
===================================================== */

function validarCorreo() {
  const valor = correoProveedor.value.trim();

  const error = document.getElementById("errorCorreo");

  if (valor === "") {
    mostrarError(
      correoProveedor,
      "El correo electrónico es obligatorio.",
      error,
    );

    return false;
  }

  const patron = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!patron.test(valor)) {
    mostrarError(
      correoProveedor,
      "Ingresa un correo electrónico válido.",
      error,
    );

    return false;
  }

  if (valor.length > 100) {
    mostrarError(
      correoProveedor,
      "El correo no puede superar los 100 caracteres.",
      error,
    );

    return false;
  }

  mostrarCorrecto(correoProveedor, error);

  return true;
}

/* =====================================================
   VALIDAR CIUDAD
===================================================== */

function validarCiudad() {
  const valor = ciudadProveedor.value.trim();

  const error = document.getElementById("errorCiudad");

  if (valor === "") {
    mostrarError(ciudadProveedor, "La ciudad es obligatoria.", error);

    return false;
  }

  if (valor.length < 3) {
    mostrarError(
      ciudadProveedor,
      "La ciudad debe tener mínimo 3 caracteres.",
      error,
    );

    return false;
  }

  const patron = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s-]+$/;

  if (!patron.test(valor)) {
    mostrarError(
      ciudadProveedor,
      "La ciudad solo puede contener letras.",
      error,
    );

    return false;
  }

  mostrarCorrecto(ciudadProveedor, error);

  return true;
}

/* =====================================================
   VALIDAR DIRECCIÓN
===================================================== */

function validarDireccion() {
  const valor = direccionProveedor.value.trim();

  const error = document.getElementById("errorDireccion");

  if (valor === "") {
    mostrarError(direccionProveedor, "La dirección es obligatoria.", error);

    return false;
  }

  if (valor.length < 5) {
    mostrarError(direccionProveedor, "Ingresa una dirección válida.", error);

    return false;
  }

  if (valor.length > 100) {
    mostrarError(
      direccionProveedor,
      "La dirección no puede superar los 100 caracteres.",
      error,
    );

    return false;
  }

  mostrarCorrecto(direccionProveedor, error);

  return true;
}

/* =====================================================
   VALIDAR PERSONA DE CONTACTO
===================================================== */

function validarContacto() {
  const valor = contactoProveedor.value.trim();

  const error = document.getElementById("errorContacto");

  if (valor === "") {
    mostrarError(
      contactoProveedor,
      "La persona de contacto es obligatoria.",
      error,
    );

    return false;
  }

  if (valor.length < 3) {
    mostrarError(contactoProveedor, "Debe tener mínimo 3 caracteres.", error);

    return false;
  }

  const patron = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$/;

  if (!patron.test(valor)) {
    mostrarError(contactoProveedor, "Solo se permiten letras.", error);

    return false;
  }

  mostrarCorrecto(contactoProveedor, error);

  return true;
}

/* =====================================================
   VALIDAR ESTADO
===================================================== */

function validarEstado() {
  const valor = estadoProveedor.value;

  const error = document.getElementById("errorEstado");

  if (valor === "") {
    mostrarError(estadoProveedor, "Selecciona el estado del proveedor.", error);

    return false;
  }

  mostrarCorrecto(estadoProveedor, error);

  return true;
}

/* =====================================================
   VALIDAR TIPO
===================================================== */

function validarTipo() {
  const valor = tipoProveedor.value;

  const error = document.getElementById("errorTipo");

  if (valor === "") {
    mostrarError(tipoProveedor, "Selecciona el tipo de proveedor.", error);

    return false;
  }

  mostrarCorrecto(tipoProveedor, error);

  return true;
}

/* =====================================================
   VALIDACIÓN EN TIEMPO REAL
===================================================== */

nombreProveedor.addEventListener("input", validarNombre);

nitProveedor.addEventListener("input", validarNit);

telefonoProveedor.addEventListener("input", validarTelefono);

correoProveedor.addEventListener("input", validarCorreo);

ciudadProveedor.addEventListener("input", validarCiudad);

direccionProveedor.addEventListener("input", validarDireccion);

contactoProveedor.addEventListener("input", validarContacto);

estadoProveedor.addEventListener("change", validarEstado);

tipoProveedor.addEventListener("change", validarTipo);

/* =====================================================
   EVITAR CARACTERES INCORRECTOS
===================================================== */

/*
   TELÉFONO:
   Solo permite números.
*/

telefonoProveedor.addEventListener("input", function () {
  this.value = this.value.replace(/\D/g, "");
});

/*
   NIT:
   Permite números y guion.
*/

nitProveedor.addEventListener("input", function () {
  this.value = this.value.replace(/[^\d-]/g, "");
});

/*
   NOMBRE:
   Evita números.
*/

nombreProveedor.addEventListener("input", function () {
  this.value = this.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s.&'-]/g, "");
});

/*
   CIUDAD:
   Evita números.
*/

ciudadProveedor.addEventListener("input", function () {
  this.value = this.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s-]/g, "");
});

/*
   CONTACTO:
   Evita números.
*/

contactoProveedor.addEventListener("input", function () {
  this.value = this.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]/g, "");
});

/* =====================================================
   VALIDAR TODO EL FORMULARIO
===================================================== */

function validarFormulario() {
  const nombreValido = validarNombre();

  const nitValido = validarNit();

  const telefonoValido = validarTelefono();

  const correoValido = validarCorreo();

  const ciudadValida = validarCiudad();

  const direccionValida = validarDireccion();

  const contactoValido = validarContacto();

  const estadoValido = validarEstado();

  const tipoValido = validarTipo();

  return (
    nombreValido &&
    nitValido &&
    telefonoValido &&
    correoValido &&
    ciudadValida &&
    direccionValida &&
    contactoValido &&
    estadoValido &&
    tipoValido
  );
}

/* =====================================================
   GUARDAR PROVEEDOR
===================================================== */

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const formularioValido = validarFormulario();

  if (!formularioValido) {
    alert("Por favor, corrige los campos que tienen errores.");

    return;
  }

  /*
       AQUÍ POSTERIORMENTE PUEDES CONECTAR
       EL FORMULARIO CON TU BASE DE DATOS.
    */

  alert("¡Proveedor guardado correctamente!");

  cerrarModal();
});
