'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AlertPageLayoutProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  children: React.ReactNode;
}

export function AlertPageLayout({
  title,
  description,
  icon: Icon,
  iconColor,
  children,
}: AlertPageLayoutProps) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-slate-50/80 to-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-6 -ml-2 gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconColor}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>
              <p className="mt-1 text-muted-foreground">{description}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
