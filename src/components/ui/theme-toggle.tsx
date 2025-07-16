"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <div className="w-full">
      <div className="group-data-[collapsible=icon]:hidden">
        <SidebarMenu>
          <SidebarMenuItem className="group/menu-item relative">
            <SidebarMenuButton
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="pl-2">Cambiar Tema</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>

      <div className="hidden group-data-[collapsible=icon]:block">
         <SidebarMenu>
          <SidebarMenuItem className="group/menu-item relative">
            <SidebarMenuButton
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              tooltip={theme === "light" ? "Modo Oscuro" : "Modo Claro"}
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </div>
  )
}
