
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

import { SidebarMenuButton } from "@/components/ui/sidebar"

export function ThemeToggle(props: { "data-state"?: "expanded" | "collapsed" }) {
  const { setTheme, theme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  const tooltipText = theme === "light" ? "Modo Oscuro" : "Modo Claro"
  const Icon = theme === 'light' ? Sun : Moon

  return (
    <SidebarMenuButton
      variant="ghost"
      onClick={toggleTheme}
      tooltip={tooltipText}
      icon={Icon}
      {...props}
    >
      Cambiar Tema
    </SidebarMenuButton>
  )
}
