/*ELEMENTOS PRINCIPALES*/

const modalEmpleado = document.getElementById("modalEmpleado");

const botonAbrirModal = document.getElementById("botonAbrirModal");

const botonCerrar = document.getElementById("botonCerrar");

const botonCancelar = document.getElementById("botonCancelar");

const formulario = document.getElementById("formularioEmpleado");

/* CAMPOS*/

const nombreEmpleado = document.getElementById("nombreEmpleado");

const documentoEmpleado = document.getElementById("documentoEmpleado");

const telefonoEmpleado = document.getElementById("telefonoEmpleado");

const correoEmpleado = document.getElementById("correoEmpleado");

const ciudadEmpleado = document.getElementById("ciudadEmpleado");

const direccionEmpleado = document.getElementById("direccionEmpleado");

const cargoEmpleado = document.getElementById("cargoEmpleado");

const tipoContrato = document.getElementById("tipoContrato");

const fechaIngreso = document.getElementById("fechaIngreso");

const estadoEmpleado = document.getElementById("estadoEmpleado");

const salarioEmpleado = document.getElementById("salarioEmpleado");

/* ABRIR MODAL*/

botonAbrirModal.addEventListener("click", function () {
  modalEmpleado.style.display = "flex";

  document.body.style.overflow = "hidden";

  nombreEmpleado.focus();
});

/* CERRAR MODAL*/

function cerrarModal() {
  modalEmpleado.style.display = "none";

  document.body.style.overflow = "auto";

  formulario.reset();

  limpiarErrores();
}

/* BOTÓN X */

botonCerrar.addEventListener("click", cerrarModal);

/* BOTÓN CANCELAR */

botonCancelar.addEventListener("click", cerrarModal);

/* CERRAR CON ESC*/

document.addEventListener("keydown", function (evento) {
  if (evento.key === "Escape" && modalEmpleado.style.display === "flex") {
    cerrarModal();
  }
});

/* FUNCIONES PARA LOS ERRORES */

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

/* VALIDAR NOMBRE*/

function validarNombre() {
  const valor = nombreEmpleado.value.trim();

  const error = document.getElementById("errorNombre");

  if (valor === "") {
    mostrarError(nombreEmpleado, "El nombre es obligatorio.", error);

    return false;
  }

  if (valor.length < 3) {
    mostrarError(nombreEmpleado, "Debe tener mínimo 3 caracteres.", error);

    return false;
  }

  const patron = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$/;

  if (!patron.test(valor)) {
    mostrarError(
      nombreEmpleado,
      "El nombre solo puede contener letras.",
      error,
    );

    return false;
  }

  mostrarCorrecto(nombreEmpleado, error);

  return true;
}

/* VALIDAR DOCUMENTO*/

function validarDocumento() {
  const valor = documentoEmpleado.value.trim();

  const error = document.getElementById("errorDocumento");

  if (valor === "") {
    mostrarError(documentoEmpleado, "El documento es obligatorio.", error);

    return false;
  }

  if (!/^\d+$/.test(valor)) {
    mostrarError(
      documentoEmpleado,
      "El documento solo puede contener números.",
      error,
    );

    return false;
  }

  if (valor.length < 7 || valor.length > 10) {
    mostrarError(documentoEmpleado, "Debe tener entre 7 y 10 números.", error);

    return false;
  }

  mostrarCorrecto(documentoEmpleado, error);

  return true;
}

/* VALIDAR TELÉFONO*/

function validarTelefono() {
  const valor = telefonoEmpleado.value.trim();

  const error = document.getElementById("errorTelefono");

  if (valor === "") {
    mostrarError(telefonoEmpleado, "El teléfono es obligatorio.", error);

    return false;
  }

  if (!/^3\d{9}$/.test(valor)) {
    mostrarError(
      telefonoEmpleado,
      "Ingresa un celular colombiano válido de 10 números.",
      error,
    );

    return false;
  }

  mostrarCorrecto(telefonoEmpleado, error);

  return true;
}

/* VALIDAR CORREO*/

function validarCorreo() {
  const valor = correoEmpleado.value.trim();

  const error = document.getElementById("errorCorreo");

  if (valor === "") {
    mostrarError(correoEmpleado, "El correo es obligatorio.", error);

    return false;
  }

  const patron = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!patron.test(valor)) {
    mostrarError(
      correoEmpleado,
      "Ingresa un correo electrónico válido.",
      error,
    );

    return false;
  }

  mostrarCorrecto(correoEmpleado, error);

  return true;
}

/* VALIDAR CIUDAD */

function validarCiudad() {
  const valor = ciudadEmpleado.value.trim();

  const error = document.getElementById("errorCiudad");

  if (valor === "") {
    mostrarError(ciudadEmpleado, "La ciudad es obligatoria.", error);

    return false;
  }

  if (valor.length < 3) {
    mostrarError(
      ciudadEmpleado,
      "La ciudad debe tener mínimo 3 caracteres.",
      error,
    );

    return false;
  }

  const patron = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s-]+$/;

  if (!patron.test(valor)) {
    mostrarError(
      ciudadEmpleado,
      "La ciudad solo puede contener letras.",
      error,
    );

    return false;
  }

  mostrarCorrecto(ciudadEmpleado, error);

  return true;
}

/* VALIDAR DIRECCIÓN*/

function validarDireccion() {
  const valor = direccionEmpleado.value.trim();

  const error = document.getElementById("errorDireccion");

  if (valor === "") {
    mostrarError(direccionEmpleado, "La dirección es obligatoria.", error);

    return false;
  }

  if (valor.length < 5) {
    mostrarError(direccionEmpleado, "Ingresa una dirección válida.", error);

    return false;
  }

  if (valor.length > 100) {
    mostrarError(
      direccionEmpleado,
      "No puede superar los 100 caracteres.",
      error,
    );

    return false;
  }

  mostrarCorrecto(direccionEmpleado, error);

  return true;
}

/* VALIDAR CARGO*/

function validarCargo() {
  const valor = cargoEmpleado.value;

  const error = document.getElementById("errorCargo");

  if (valor === "") {
    mostrarError(cargoEmpleado, "Selecciona un cargo.", error);

    return false;
  }

  mostrarCorrecto(cargoEmpleado, error);

  return true;
}

/* VALIDAR CONTRATO*/

function validarContrato() {
  const valor = tipoContrato.value;

  const error = document.getElementById("errorContrato");

  if (valor === "") {
    mostrarError(tipoContrato, "Selecciona el tipo de contrato.", error);

    return false;
  }

  mostrarCorrecto(tipoContrato, error);

  return true;
}

/*VALIDAR FECHA*/
function validarFecha() {
  const valor = fechaIngreso.value;

  const error = document.getElementById("errorFecha");

  if (valor === "") {
    mostrarError(fechaIngreso, "La fecha de ingreso es obligatoria.", error);

    return false;
  }

  const fechaSeleccionada = new Date(valor);

  const fechaActual = new Date();

  /*
       No permitimos fechas futuras.
    */

  if (fechaSeleccionada > fechaActual) {
    mostrarError(fechaIngreso, "La fecha no puede ser futura.", error);

    return false;
  }

  mostrarCorrecto(fechaIngreso, error);

  return true;
}

/* VALIDAR ESTADO*/

function validarEstado() {
  const valor = estadoEmpleado.value;

  const error = document.getElementById("errorEstado");

  if (valor === "") {
    mostrarError(estadoEmpleado, "Selecciona el estado del empleado.", error);

    return false;
  }

  mostrarCorrecto(estadoEmpleado, error);

  return true;
}

/* VALIDAR SALARIO*/

function validarSalario() {
  const valor = salarioEmpleado.value;

  const error = document.getElementById("errorSalario");

  if (valor === "") {
    mostrarError(salarioEmpleado, "El salario es obligatorio.", error);

    return false;
  }

  const salario = Number(valor);

  if (salario <= 0) {
    mostrarError(salarioEmpleado, "El salario debe ser mayor que 0.", error);

    return false;
  }

  if (salario > 999999999) {
    mostrarError(
      salarioEmpleado,
      "El salario ingresado es demasiado alto.",
      error,
    );

    return false;
  }

  mostrarCorrecto(salarioEmpleado, error);

  return true;
}

/* SOLO NÚMEROS EN DOCUMENTO*/

documentoEmpleado.addEventListener("input", function () {
  this.value = this.value.replace(/\D/g, "");

  validarDocumento();
});

/* SOLO NÚMEROS EN TELÉFONO */

telefonoEmpleado.addEventListener("input", function () {
  this.value = this.value.replace(/\D/g, "");

  validarTelefono();
});

/* VALIDACIÓN EN TIEMPO REAL*/

nombreEmpleado.addEventListener("input", validarNombre);

correoEmpleado.addEventListener("input", validarCorreo);

ciudadEmpleado.addEventListener("input", validarCiudad);

direccionEmpleado.addEventListener("input", validarDireccion);

cargoEmpleado.addEventListener("change", validarCargo);

tipoContrato.addEventListener("change", validarContrato);

fechaIngreso.addEventListener("change", validarFecha);

estadoEmpleado.addEventListener("change", validarEstado);

salarioEmpleado.addEventListener("input", validarSalario);

/* VALIDAR TODO EL FORMULARIO*/

function validarFormulario() {
  const nombreValido = validarNombre();

  const documentoValido = validarDocumento();

  const telefonoValido = validarTelefono();

  const correoValido = validarCorreo();

  const ciudadValida = validarCiudad();

  const direccionValida = validarDireccion();

  const cargoValido = validarCargo();

  const contratoValido = validarContrato();

  const fechaValida = validarFecha();

  const estadoValido = validarEstado();

  const salarioValido = validarSalario();

  return (
    nombreValido &&
    documentoValido &&
    telefonoValido &&
    correoValido &&
    ciudadValida &&
    direccionValida &&
    cargoValido &&
    contratoValido &&
    fechaValida &&
    estadoValido &&
    salarioValido
  );
}

/*GUARDAR */

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const formularioValido = validarFormulario();

  if (!formularioValido) {
    alert("Por favor, corrige los campos que tienen errores.");

    return;
  }

  /*
           AQUÍ DESPUÉS PUEDES CONECTAR
           EL FORMULARIO CON NODE.JS Y MYSQL.
        */

  alert("¡Empleado guardado correctamente!");

  cerrarModal();
});
