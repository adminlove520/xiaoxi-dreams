import { HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass'
  hover?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          clsx(
            'rounded-xl p-5 transition-all duration-200',
            // Variants - use explicit classes
            variant === 'default' && 'bg-zinc-900 border border-zinc-800',
            variant === 'elevated' && 'bg-zinc-900 border border-zinc-800 shadow-xl',
            variant === 'glass' && 'bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl',
            // Hover effect
            hover && 'hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5 cursor-pointer',
            className
          )
        )}
        {...props}
      />
    )
  }
)

Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(clsx('flex items-center justify-between mb-4'), className)}
        {...props}
      />
    )
  }
)
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={twMerge(clsx('text-lg font-semibold text-zinc-100'), className)}
        {...props}
      />
    )
  }
)
CardTitle.displayName = 'CardTitle'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(clsx('text-zinc-400'), className)}
        {...props}
      />
    )
  }
)
CardContent.displayName = 'CardContent'

export { Card, CardHeader, CardTitle, CardContent }
