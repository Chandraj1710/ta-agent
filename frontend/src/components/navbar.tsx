'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, FileCheck, Users, Settings, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isUsingMockData } from '@/lib/api';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/alerts/stalled', label: 'Pipeline', icon: AlertTriangle },
  { href: '/alerts/scorecards', label: 'Scorecards', icon: FileCheck },
  { href: '/alerts/referrals', label: 'Referrals', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const [mockMode, setMockMode] = useState(false);

  useEffect(() => {
    setMockMode(isUsingMockData());
    const check = () => setMockMode(isUsingMockData());
    window.addEventListener('storage', check);
    window.addEventListener('ta-agent-mock-changed', check);
    return () => {
      window.removeEventListener('storage', check);
      window.removeEventListener('ta-agent-mock-changed', check);
    };
  }, [pathname]);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <AlertTriangle className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold tracking-tight text-foreground">
            TA Ops Agent
          </span>
          {mockMode && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Demo
            </span>
          )}
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'gap-2 transition-all duration-200',
                    isActive && 'bg-primary/10 text-primary hover:bg-primary/15'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>
    </motion.header>
  );
}
