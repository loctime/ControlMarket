import { PAYMENT_LABELS } from '../../lib/shifts'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'

export default function Ticket({ sale, org }) {
  if (!sale) return null
  const payments = sale.payments?.length
    ? sale.payments
    : [{ method: sale.paymentMethod || 'efectivo', amount: sale.total }]

  return (
    <div className="ticket mx-auto w-full max-w-[80mm] bg-white p-3 font-mono text-[12px] leading-tight text-black">
      <div className="text-center">
        <p className="text-base font-bold uppercase">{org?.name || 'ControlMarket'}</p>
        {org?.address && <p>{org.address}</p>}
        {org?.phone && <p>Tel: {org.phone}</p>}
        {org?.taxId && <p>CUIT: {org.taxId}</p>}
      </div>

      <div className="my-2 border-t border-dashed border-black" />

      <div>
        <p>Ticket: {sale.id?.slice(0, 8)}</p>
        <p>Fecha: {formatDateTime(sale.createdAt) || '-'}</p>
        <p>Vendedor: {sale.vendedorName || '-'}</p>
      </div>

      <div className="my-2 border-t border-dashed border-black" />

      <div className="flex flex-col gap-1">
        {sale.items?.map((item, i) => (
          <div key={i}>
            <div className="flex justify-between">
              <span className="truncate pr-2">{item.productName}</span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
            <div className="text-[11px] text-black/80">
              {item.quantity} × {formatCurrency(item.unitPrice)}
            </div>
          </div>
        ))}
      </div>

      <div className="my-2 border-t border-dashed border-black" />

      <div className="flex justify-between text-sm font-bold">
        <span>TOTAL</span>
        <span>{formatCurrency(sale.total)}</span>
      </div>

      <div className="mt-1 flex flex-col gap-0.5">
        {payments.map((p, i) => (
          <div key={i} className="flex justify-between">
            <span>{PAYMENT_LABELS[p.method] || p.method}</span>
            <span>{formatCurrency(p.amount)}</span>
          </div>
        ))}
        {sale.cashReceived != null && (
          <>
            <div className="flex justify-between">
              <span>Recibe</span>
              <span>{formatCurrency(sale.cashReceived)}</span>
            </div>
            <div className="flex justify-between">
              <span>Vuelto</span>
              <span>{formatCurrency(sale.change ?? 0)}</span>
            </div>
          </>
        )}
      </div>

      <div className="my-2 border-t border-dashed border-black" />

      <p className="text-center text-[11px]">¡Gracias por su compra!</p>
      <p className="text-center text-[10px] text-black/70">Documento no válido como factura</p>
    </div>
  )
}
