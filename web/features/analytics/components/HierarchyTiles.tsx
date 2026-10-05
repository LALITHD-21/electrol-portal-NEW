'use client';

import React from 'react';
import { DashboardHierarchy } from '../types';
import {
  Map,
  Landmark,
  Building,
  Compass,
  Building2,
  Home,
  Vote,
} from 'lucide-react';

export interface HierarchyTilesProps {
  hierarchy?: DashboardHierarchy;
  isLoading?: boolean;
}

export function HierarchyTiles({ hierarchy, isLoading = false }: HierarchyTilesProps) {
  const h = hierarchy || {
    districts: 0,
    ac_names: 0,
    taluks: 0,
    hoblis: 0,
    grama_panchayaths: 0,
    villages: 0,
    booths: 0,
  };

  const tiles = [
    {
      label: 'Districts',
      value: h.districts,
      badge: '100% Mapped',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/80',
      icon: Map,
      borderColor: 'hover:border-blue-300',
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
      bgGlow: 'from-blue-50/60 to-transparent',
    },
    {
      label: 'Assemblies',
      value: h.ac_names,
      badge: 'AC_NAME Wise',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      icon: Landmark,
      borderColor: 'hover:border-indigo-300',
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      bgGlow: 'from-indigo-50/60 to-transparent',
    },
    {
      label: 'Taluks',
      value: h.taluks,
      badge: 'Administrative',
      badgeColor: 'bg-violet-50 text-violet-700 border-violet-200/80',
      icon: Building,
      borderColor: 'hover:border-violet-300',
      iconBg: 'bg-violet-50 text-violet-600 border-violet-200',
      bgGlow: 'from-violet-50/60 to-transparent',
    },
    {
      label: 'Hoblis',
      value: h.hoblis,
      badge: 'HOBLI Ready',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/80',
      icon: Compass,
      borderColor: 'hover:border-amber-300',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
      bgGlow: 'from-amber-50/60 to-transparent',
    },
    {
      label: 'Gram Panchayaths',
      value: h.grama_panchayaths,
      badge: 'GP Ready',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      icon: Building2,
      borderColor: 'hover:border-emerald-300',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      bgGlow: 'from-emerald-50/60 to-transparent',
    },
    {
      label: 'Villages / Wards',
      value: h.villages,
      badge: 'Area Coverage',
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
      icon: Home,
      borderColor: 'hover:border-cyan-300',
      iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-200',
      bgGlow: 'from-cyan-50/60 to-transparent',
    },
    {
      label: 'Polling Booths',
      value: h.booths || 151,
      badge: 'PS_1 to PS_151',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200/80',
      icon: Vote,
      borderColor: 'hover:border-rose-300',
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
      bgGlow: 'from-rose-50/60 to-transparent',
    },
  ];

  return (
    <div className="w-full space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span>Administrative Hierarchy Drill-Down</span>
        </h3>
        <span className="text-[11px] text-slate-400 font-semibold">100% Karnataka Electoral Mapping</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <div
              key={tile.label}
              className={`relative bg-white rounded-2xl border border-slate-200/80 ${tile.borderColor} p-3.5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden group flex flex-col justify-between`}
            >
              {/* Subtle top background gradient glow */}
              <div
                className={`absolute inset-0 bg-gradient-to-b ${tile.bgGlow} opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none`}
              />

              <div>
                <div className="relative flex items-center justify-between gap-1.5 mb-2">
                  <span className="text-xs font-bold text-slate-600 truncate">
                    {tile.label}
                  </span>
                  <div className={`p-1.5 rounded-xl border ${tile.iconBg} shadow-2xs shrink-0`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="relative">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-mono">
                    {isLoading || !hierarchy ? (
                      <span className="inline-block w-10 h-7 bg-slate-100 rounded animate-pulse" />
                    ) : (
                      (tile.value ?? 0).toLocaleString('en-IN')
                    )}
                  </span>
                </div>
              </div>

              <div className="relative mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tile.badgeColor}`}>
                  {tile.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
