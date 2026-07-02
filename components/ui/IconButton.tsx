import type { ButtonHTMLAttributes } from 'react'

export default function IconButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`flex items-center justify-center rounded-full bg-gray-100 border border-gray-300 shadow-md text-gray-500 hover:text-black transition-all active:shadow-inner active:scale-[0.99] active:bg-gray-200 ${className}`}
      {...props}
    />
  )
}
