import * as XLSX from 'xlsx'

const UNITS = ['pieza', 'kg', 'litro', 'paquete', 'caja']

const COLUMN_ALIASES = {
  nombre: 'name',
  producto: 'name',
  precio: 'price',
  precio_venta: 'price',
  'precio de venta': 'price',
  costo: 'costPrice',
  precio_costo: 'costPrice',
  'precio de costo': 'costPrice',
  stock: 'stock',
  existencia: 'stock',
  cantidad: 'stock',
  categoria: 'category',
  'categoría': 'category',
  codigo: 'barcode',
  codigo_barras: 'barcode',
  'codigo de barras': 'barcode',
  'código de barras': 'barcode',
  unidad: 'unit',
  activo: 'active',
  habilitado: 'active',
}

export function normalize(str) {
  if (str == null) return ''
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function toNumber(value) {
  if (value === '' || value == null) return NaN
  if (typeof value === 'number') return value
  const cleaned = String(value).replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : NaN
}

function toBool(value) {
  if (value == null || value === '') return true
  if (typeof value === 'boolean') return value
  const n = normalize(value)
  if (['si', 'sí', 'true', '1', 'activo', 'yes', 'y'].includes(n)) return true
  if (['no', 'false', '0', 'inactivo', 'n'].includes(n)) return false
  return true
}

function mapRow(rawRow) {
  const out = {}
  for (const [key, value] of Object.entries(rawRow)) {
    const mapped = COLUMN_ALIASES[normalize(key)]
    if (mapped) out[mapped] = value
  }
  return out
}

function levenshtein(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const prev = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    let curr = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      const next = Math.min(curr + 1, prev[j] + 1, prev[j - 1] + cost)
      prev[j - 1] = curr
      curr = next
    }
    prev[b.length] = curr
  }
  return prev[b.length]
}

export function findCategoryMatch(name, existingCategories) {
  const target = normalize(name)
  if (!target) return { type: 'none' }
  for (const cat of existingCategories) {
    if (normalize(cat.name) === target) return { type: 'exact', category: cat }
  }
  let best = null
  let bestScore = Infinity
  for (const cat of existingCategories) {
    const candidate = normalize(cat.name)
    const dist = levenshtein(target, candidate)
    const threshold = Math.max(1, Math.floor(Math.min(target.length, candidate.length) * 0.3))
    const contains = target.includes(candidate) || candidate.includes(target)
    if (dist <= threshold || contains) {
      if (dist < bestScore) {
        best = cat
        bestScore = dist
      }
    }
  }
  if (best) return { type: 'similar', category: best, distance: bestScore }
  return { type: 'new' }
}

export async function parseProductFile(file) {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheetName = wb.SheetNames.find((n) => normalize(n).includes('producto')) ?? wb.SheetNames[0]
  const sheet = wb.Sheets[sheetName]
  return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true })
}

export function processRows(rawRows, existingCategories, existingProducts) {
  const byBarcode = new Map()
  const byName = new Map()
  for (const p of existingProducts ?? []) {
    if (p.barcode) byBarcode.set(p.barcode, p)
    if (p.name) {
      const key = normalize(p.name)
      if (key && !byName.has(key)) byName.set(key, p)
    }
  }

  return rawRows.map((raw, idx) => {
    const mapped = mapRow(raw)
    const errors = []
    const warnings = []
    const autofilled = []

    const name = String(mapped.name ?? '').trim()
    if (!name) errors.push('Falta el nombre')

    const price = toNumber(mapped.price)
    if (!Number.isFinite(price) || price < 0) errors.push('Precio invalido o faltante')

    const stock = toNumber(mapped.stock)
    if (!Number.isFinite(stock) || stock < 0) errors.push('Stock invalido o faltante')

    let costPrice = toNumber(mapped.costPrice)
    if (!Number.isFinite(costPrice) || costPrice < 0) {
      costPrice = 0
      if (mapped.costPrice === '' || mapped.costPrice == null) autofilled.push('costo=0')
    }

    let unit = normalize(mapped.unit)
    if (!UNITS.includes(unit)) {
      if (unit) warnings.push(`unidad "${mapped.unit}" no reconocida, se usa "pieza"`)
      else autofilled.push('unidad=pieza')
      unit = 'pieza'
    }

    const active = toBool(mapped.active)
    if (mapped.active === '' || mapped.active == null) autofilled.push('activo=si')

    const barcodeRaw = mapped.barcode == null ? '' : String(mapped.barcode).trim()
    const barcode = barcodeRaw
    if (!barcode) autofilled.push('codigo vacio')

    const categoryName = String(mapped.category ?? '').trim()
    const categoryMatch = categoryName
      ? findCategoryMatch(categoryName, existingCategories)
      : { type: 'none' }

    let duplicate = null
    if (barcode && byBarcode.has(barcode)) {
      duplicate = { type: 'barcode', product: byBarcode.get(barcode) }
      warnings.push(`codigo repite producto "${duplicate.product.name}"`)
    } else if (name) {
      const key = normalize(name)
      if (byName.has(key)) {
        duplicate = { type: 'name', product: byName.get(key) }
        warnings.push(`nombre coincide con producto existente`)
      }
    }

    return {
      rowIndex: idx + 2,
      raw,
      normalized: {
        name,
        price: Number.isFinite(price) ? price : 0,
        costPrice,
        stock: Number.isFinite(stock) ? stock : 0,
        unit,
        barcode,
        active,
        categoryInput: categoryName,
      },
      categoryMatch,
      duplicate,
      errors,
      warnings,
      autofilled,
      skip: errors.length > 0,
    }
  })
}

export function collectUnresolvedCategories(processedRows) {
  const map = new Map()
  for (const row of processedRows) {
    if (row.errors.length) continue
    const m = row.categoryMatch
    if (m.type === 'similar' || m.type === 'new') {
      const key = normalize(row.normalized.categoryInput)
      if (!map.has(key)) {
        map.set(key, {
          key,
          input: row.normalized.categoryInput,
          suggestion: m.type === 'similar' ? m.category : null,
          decision: m.type === 'similar' ? 'use-existing' : 'create',
          rows: [],
        })
      }
      map.get(key).rows.push(row.rowIndex)
    }
  }
  return Array.from(map.values())
}
