export default function Card({ children, className = '', ...props }) {
  return (
    <div className={`rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 ${className}`} {...props}>
      {children}
    </div>
  )
}
