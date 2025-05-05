"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { FileText, Search, Settings, Home, User, HelpCircle, BarChart2, MapPin } from "lucide-react"
import { useState, useEffect } from "react"

export function MainNav() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Add scroll effect for the navigation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
    },
    {
      name: "GeoGrid Search",
      href: "/new-search",
      icon: Search,
    }
  ]

  return (
    <>
    <nav
      className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-2",
        scrolled
            ? "bg-primary shadow-md"
            : "bg-gradient-to-r from-primary to-secondary"
      )}
    >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
              <div className="h-10 w-auto mr-8 relative overflow-hidden">
                <img 
                  src="/geogrid-logo.png" 
                  alt="GeoGrid Logo" 
                  className={cn(
                    "h-full w-auto object-contain transition-all duration-300",
                    scrolled ? "brightness-100" : "brightness-[1.15] drop-shadow-md"
                  )} 
                />
            </div>
          </Link>

            <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/")

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                      "flex items-center h-10 px-4 text-sm font-medium transition-all rounded-full",
                  isActive
                        ? "bg-white/20 text-white shadow-sm backdrop-blur-sm"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.name}
              </Link>
            )
          })}
            </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            
            <div className="hidden md:block">
              <button
                className="lv-button"
              >
                Sign In
              </button>
            </div>
            
            <button
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 md:hidden transition-all hover:shadow-md hover:-translate-y-0.5"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <User className="w-5 h-5" />
            </button>
            
            <button
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <Settings className="w-5 h-5" />
          </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="absolute top-16 right-0 w-64 bg-white shadow-lg rounded-bl-xl animate-slide-in-right" 
            onClick={e => e.stopPropagation()}
          >
            <div className="py-3 px-4 border-b border-slate-100">
              <p className="text-sm font-medium text-slate-400">Navigation</p>
            </div>
            <div className="py-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/")
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center py-3 px-4 text-sm transition-all",
                      isActive
                        ? "bg-blue-50 text-primary font-medium"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
            <div className="p-4 border-t border-slate-100">
              <button className="lv-button w-full">
                Sign In
          </button>
        </div>
      </div>
        </div>
      )}

      {/* Space for fixed header */}
      <div className="h-16"></div>
    </>
  )
}
