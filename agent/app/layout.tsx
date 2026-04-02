import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SuperDreams | 超梦仪表盘',
  description: 'SuperDreams — AI Agent 认知记忆系统，通过做梦实现记忆整合与进化',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  )
}
