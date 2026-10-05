'use client';

import React from 'react';
import AppShell from '@/components/shell/AppShell';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
