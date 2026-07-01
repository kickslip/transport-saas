'use client'

import { useEffect } from 'react'

function hexToHsl(hex: string): string {
  let r = 0, g = 0, b = 0
  if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16)
    g = parseInt(hex.slice(3, 5), 16)
    b = parseInt(hex.slice(5, 7), 16)
  }
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export default function TenantThemeInjector({
  primaryColor,
  tenantName,
}: {
  primaryColor: string
  tenantName: string
}) {
  useEffect(() => {
    const hsl = hexToHsl(primaryColor)
    document.documentElement.style.setProperty('--color-primary', hsl)
    document.title = `${tenantName} | WanToe`
  }, [primaryColor, tenantName])

  return null
}
