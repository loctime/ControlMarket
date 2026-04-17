import * as XLSX from 'xlsx'

export const PRODUCT_COLUMNS = [
  'nombre',
  'precio',
  'costo',
  'stock',
  'categoria',
  'codigo_barras',
  'unidad',
  'activo',
]

const EXAMPLES = [
  {
    nombre: 'Coca Cola 500ml',
    precio: 850,
    costo: 600,
    stock: 24,
    categoria: 'Bebidas',
    codigo_barras: '7790895000123',
    unidad: 'pieza',
    activo: 'si',
  },
  {
    nombre: 'Arroz 1kg',
    precio: 1200,
    costo: 800,
    stock: 15,
    categoria: 'Almacen',
    codigo_barras: '',
    unidad: 'kg',
    activo: 'si',
  },
]

const INSTRUCTIONS = [
  ['Columna', 'Obligatoria', 'Descripcion', 'Si se deja vacia'],
  ['nombre', 'SI', 'Nombre del producto tal como aparecera en la app', 'La fila se descarta'],
  ['precio', 'SI', 'Precio de venta en la moneda local (numero)', 'La fila se descarta'],
  ['stock', 'SI', 'Cantidad disponible (numero entero o decimal)', 'La fila se descarta'],
  ['costo', 'NO', 'Precio de costo para calculo de ganancia', 'Se completa con 0'],
  ['categoria', 'NO', 'Categoria del producto (texto)', 'Queda sin categoria'],
  ['codigo_barras', 'NO', 'Codigo escaneable. Evita duplicados', 'Queda vacio'],
  ['unidad', 'NO', 'pieza / kg / litro / paquete / caja', 'Se completa con "pieza"'],
  ['activo', 'NO', 'si / no - si el producto esta disponible para la venta', 'Se completa con "si"'],
  [],
  ['Notas:'],
  ['- No renombres las columnas ni cambies su orden.'],
  ['- Si una categoria nueva se parece a una existente, la app te pregunta antes de crearla.'],
  ['- Los codigos de barras duplicados con productos existentes se detectan al importar.'],
]

export function downloadProductTemplate() {
  const wb = XLSX.utils.book_new()

  const productsSheet = XLSX.utils.json_to_sheet(EXAMPLES, { header: PRODUCT_COLUMNS })
  productsSheet['!cols'] = PRODUCT_COLUMNS.map((c) => ({ wch: Math.max(14, c.length + 2) }))
  XLSX.utils.book_append_sheet(wb, productsSheet, 'Productos')

  const instructionsSheet = XLSX.utils.aoa_to_sheet(INSTRUCTIONS)
  instructionsSheet['!cols'] = [{ wch: 16 }, { wch: 12 }, { wch: 50 }, { wch: 28 }]
  XLSX.utils.book_append_sheet(wb, instructionsSheet, 'Instrucciones')

  XLSX.writeFile(wb, 'plantilla-productos.xlsx', { bookType: 'xlsx' })
}
