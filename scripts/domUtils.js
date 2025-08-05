// domUtils.js
// domUtils.js

// Ya tienes esta, que es la que se usa para los inputs
export function asignarFuncion({ idInput, idContenedor, fn }) {
  const input = document.getElementById(idInput);
  const contenedor = document.getElementById(idContenedor);

  if (input && contenedor) {
    input.addEventListener('change', (e) => {
      fn(e.target.files[0], contenedor);
    });
  } else {
    console.error(`Elemento con id ${idInput} o ${idContenedor} no encontrado`);
  }
}

// Esta es la función que te faltaría para los botones
export function asignarClick(id, fn) {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener('click', fn);
    } else {
        console.error(`Elemento con id ${id} no encontrado`);
    }
}