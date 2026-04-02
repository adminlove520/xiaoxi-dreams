import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'xiaoxi-dreams | 小溪心灵面板',
  description: '小溪的认知记忆系统 — 周期性做梦，让 AI 更聪明地醒来',
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
