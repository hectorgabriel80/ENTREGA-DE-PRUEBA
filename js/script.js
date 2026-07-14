'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initHeroActions();
  initCart();
  initModelExplorer();
  initContactForm();
  initBackToTop();
});

function initNavToggle() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('navMenu');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function initHeroActions() {
  const feedback = document.getElementById('accionFeedback');
  const btnTestDrive = document.getElementById('btnTestDrive');
  const btnFicha = document.getElementById('btnFicha');
  if (!feedback) return;

  const mostrarFeedback = (mensaje) => {
    feedback.textContent = mensaje;
    window.clearTimeout(mostrarFeedback._t);
    mostrarFeedback._t = window.setTimeout(() => {
      feedback.textContent = '';
    }, 4000);
  };

  btnTestDrive?.addEventListener('click', () => {
    mostrarFeedback('✔ Solicitud de test drive registrada. Te contactamos a la brevedad.');
  });

  btnFicha?.addEventListener('click', () => {
    mostrarFeedback('✔ Descarga simulada: ficha-tecnica-mustang-gt.pdf');
  });
}

const CART_STORAGE_KEY = 'mustang-gt-carrito';

function initCart() {
  const grid = document.getElementById('productGrid');
  const toggle = document.getElementById('cartToggle');
  const panel = document.getElementById('cartPanel');
  const overlay = document.getElementById('cartOverlay');
  const closeBtn = document.getElementById('cartClose');
  const vaciarBtn = document.getElementById('btnVaciarCarrito');

  if (!grid || !toggle || !panel || !overlay) return;

  let carrito = cargarCarrito();
  renderizarCarrito(carrito);

  grid.querySelectorAll('.btn-add').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.product-card');
      const producto = {
        id: card.dataset.id,
        nombre: card.dataset.nombre,
        precio: Number(card.dataset.precio),
        icono: card.querySelector('.product-img')?.getAttribute('src') || '',
      };
      carrito = agregarAlCarrito(carrito, producto);
      guardarCarrito(carrito);
      renderizarCarrito(carrito);
      mostrarAgregado(btn);
    });
  });

  toggle.addEventListener('click', abrirCarrito);
  closeBtn?.addEventListener('click', cerrarCarrito);
  overlay.addEventListener('click', cerrarCarrito);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') cerrarCarrito();
  });

  vaciarBtn?.addEventListener('click', () => {
    carrito = [];
    guardarCarrito(carrito);
    renderizarCarrito(carrito);
  });

  function abrirCarrito() {
    panel.classList.add('is-open');
    overlay.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
  }

  function cerrarCarrito() {
    panel.classList.remove('is-open');
    overlay.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  function renderizarCarrito(items) {
    pintarListaCarrito(items, (accion, id) => {
      carrito = actualizarCantidad(carrito, id, accion);
      guardarCarrito(carrito);
      renderizarCarrito(carrito);
    });
    actualizarContadorYTotal(items);
  }
}

function cargarCarrito() {
  try {
    const guardado = window.localStorage.getItem(CART_STORAGE_KEY);
    return guardado ? JSON.parse(guardado) : [];
  } catch {
    return [];
  }
}

function guardarCarrito(carrito) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(carrito));
  } catch {}
}

function agregarAlCarrito(carrito, producto) {
  const existente = carrito.find((item) => item.id === producto.id);
  if (existente) {
    return carrito.map((item) =>
      item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
    );
  }
  return [...carrito, { ...producto, cantidad: 1 }];
}

function actualizarCantidad(carrito, id, accion) {
  if (accion === 'quitar') {
    return carrito.filter((item) => item.id !== id);
  }

  return carrito
    .map((item) => {
      if (item.id !== id) return item;
      const cantidad = accion === 'sumar' ? item.cantidad + 1 : item.cantidad - 1;
      return { ...item, cantidad };
    })
    .filter((item) => item.cantidad > 0);
}

function pintarListaCarrito(items, onAccion) {
  const lista = document.getElementById('cartItems');
  if (!lista) return;

  lista.innerHTML = '';

  if (items.length === 0) {
    const vacio = document.createElement('li');
    vacio.className = 'cart-empty';
    vacio.id = 'cartEmpty';
    vacio.textContent = 'Todavía no agregaste nada.';
    lista.appendChild(vacio);
    return;
  }

  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'cart-item';

    const subtotal = item.precio * item.cantidad;

    li.innerHTML = `
      <img class="cart-item-icon" src="${item.icono}" alt="" aria-hidden="true">
      <span class="cart-item-info">
        <p class="cart-item-name">${item.nombre}</p>
        <p class="cart-item-price">${formatearPrecio(subtotal)}</p>
      </span>
      <span class="cart-item-qty">
        <button type="button" data-accion="restar" aria-label="Quitar una unidad">−</button>
        <span>${item.cantidad}</span>
        <button type="button" data-accion="sumar" aria-label="Agregar una unidad">+</button>
      </span>
      <button type="button" class="cart-item-remove" data-accion="quitar" aria-label="Eliminar del carrito">✕</button>
    `;

    li.querySelectorAll('[data-accion]').forEach((btn) => {
      btn.addEventListener('click', () => onAccion(btn.dataset.accion, item.id));
    });

    fragment.appendChild(li);
  });

  lista.appendChild(fragment);
}

function actualizarContadorYTotal(items) {
  const contador = document.getElementById('cartCount');
  const totalEl = document.getElementById('cartTotal');
  if (!contador || !totalEl) return;

  const cantidadTotal = items.reduce((acc, item) => acc + item.cantidad, 0);
  const precioTotal = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  contador.textContent = String(cantidadTotal);
  totalEl.textContent = formatearPrecio(precioTotal);
}

function formatearPrecio(valor) {
  return valor.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

function mostrarAgregado(boton) {
  const textoOriginal = boton.textContent;
  boton.textContent = '✔ Agregado';
  boton.disabled = true;
  window.setTimeout(() => {
    boton.textContent = textoOriginal;
    boton.disabled = false;
  }, 1200);
}

const NHTSA_BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';

function initModelExplorer() {
  const yearSelect = document.getElementById('modelYear');
  const form = document.getElementById('modelForm');
  const resultsBox = document.getElementById('modelResults');
  const submitBtn = document.getElementById('btnBuscarModelos');
  if (!yearSelect || !form || !resultsBox) return;

  poblarSelectDeAnios(yearSelect);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const anio = yearSelect.value;
    if (!anio) return;

    await buscarModelosPorAnio(anio, resultsBox, submitBtn);
  });
}

function poblarSelectDeAnios(selectEl) {
  const anioActual = new Date().getFullYear();
  const primerAnio = 1990;
  const fragment = document.createDocumentFragment();

  for (let anio = anioActual; anio >= primerAnio; anio--) {
    const option = document.createElement('option');
    option.value = String(anio);
    option.textContent = String(anio);
    fragment.appendChild(option);
  }

  selectEl.appendChild(fragment);
}

async function buscarModelosPorAnio(anio, contenedor, submitBtn) {
  mostrarEstadoCarga(contenedor);
  if (submitBtn) submitBtn.disabled = true;

  const url = `${NHTSA_BASE_URL}/GetModelsForMakeYear/make/ford/modelyear/${anio}?format=json`;

  try {
    const respuesta = await fetch(url);

    if (!respuesta.ok) {
      throw new Error(`La API respondió con estado ${respuesta.status}`);
    }

    const datos = await respuesta.json();
    renderizarModelos(datos.Results, anio, contenedor);
  } catch (error) {
    mostrarError(contenedor, error);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

function mostrarEstadoCarga(contenedor) {
  contenedor.innerHTML = '';
  const loading = document.createElement('p');
  loading.className = 'model-loading';
  loading.innerHTML = '<span class="spinner" aria-hidden="true"></span> Consultando la API de la NHTSA…';
  contenedor.appendChild(loading);
}

function renderizarModelos(resultados, anio, contenedor) {
  contenedor.innerHTML = '';

  if (!resultados || resultados.length === 0) {
    const vacio = document.createElement('p');
    vacio.className = 'model-empty';
    vacio.textContent = `No se encontraron modelos Ford registrados para ${anio}.`;
    contenedor.appendChild(vacio);
    return;
  }

  const nombresUnicos = [...new Set(resultados.map((item) => item.Model_Name))].sort();

  const fragment = document.createDocumentFragment();
  nombresUnicos.forEach((nombre) => {
    const card = document.createElement('article');
    card.className = 'model-card';
    card.textContent = nombre;
    fragment.appendChild(card);
  });

  contenedor.appendChild(fragment);
}

function mostrarError(contenedor, error) {
  contenedor.innerHTML = '';
  const mensaje = document.createElement('p');
  mensaje.className = 'model-error';
  mensaje.textContent = `⚠ No se pudo consultar la API en este momento (${error.message}). Probá de nuevo en unos segundos.`;
  contenedor.appendChild(mensaje);
}

function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const campos = {
    nombre: { input: document.getElementById('nombre'), error: document.getElementById('errorNombre') },
    email: { input: document.getElementById('email'), error: document.getElementById('errorEmail') },
    mensaje: { input: document.getElementById('mensaje'), error: document.getElementById('errorMensaje') },
  };
  const estado = document.getElementById('formStatus');

  Object.values(campos).forEach(({ input }) => {
    input.addEventListener('blur', () => validarCampo(input, campos));
    input.addEventListener('input', () => {
      if (input.classList.contains('is-invalid')) validarCampo(input, campos);
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const esValido = Object.values(campos)
      .map(({ input }) => validarCampo(input, campos))
      .every(Boolean);

    if (!esValido) {
      estado.textContent = '';
      campos.nombre.input.closest('form').querySelector('.is-invalid')?.focus();
      return;
    }

    estado.style.color = 'var(--color-green)';
    estado.textContent = `✔ Gracias, ${campos.nombre.input.value.split(' ')[0]}. Recibimos tu consulta y te vamos a responder por correo.`;
    form.reset();
  });
}

function validarCampo(input, campos) {
  const entrada = Object.values(campos).find((campo) => campo.input === input);
  if (!entrada) return true;

  let mensaje = '';

  if (input.validity.valueMissing) {
    mensaje = 'Este campo es obligatorio.';
  } else if (input.id === 'email' && input.validity.typeMismatch) {
    mensaje = 'Ingresá un correo electrónico válido.';
  } else if (input.validity.tooShort) {
    mensaje = `Necesita al menos ${input.minLength} caracteres.`;
  }

  entrada.error.textContent = mensaje;
  input.classList.toggle('is-invalid', Boolean(mensaje));

  return mensaje === '';
}

function initBackToTop() {
  const btn = document.getElementById('btnTop');
  if (!btn) return;

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}