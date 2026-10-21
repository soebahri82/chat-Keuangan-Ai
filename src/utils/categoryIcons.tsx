import React from 'react';
import {
  Briefcase,
  Store,
  Sparkles,
  TrendingUp,
  ArrowDownLeft,
  Gift,
  Coins,
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  GraduationCap,
  HeartPulse,
  Home,
  CreditCard,
  Gamepad2,
  Shirt,
  ArrowUpRight,
  HandHeart,
  MoreHorizontal,
  DollarSign,
  Coffee,
  Plane,
  Fuel,
  Smartphone,
  LucideIcon,
} from 'lucide-react';

export const iconMap: Record<string, LucideIcon> = {
  Briefcase,
  Store,
  Sparkles,
  TrendingUp,
  ArrowDownLeft,
  Gift,
  Coins,
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  GraduationCap,
  HeartPulse,
  Home,
  CreditCard,
  Gamepad2,
  Shirt,
  ArrowUpRight,
  HandHeart,
  MoreHorizontal,
  DollarSign,
  Coffee,
  Plane,
  Fuel,
  Smartphone,
};

export function getCategoryIcon(iconName: string): LucideIcon {
  return iconMap[iconName] || MoreHorizontal;
}

export function getCategoryColorClasses(colorName: string): {
  bg: string;
  text: string;
  border: string;
  ring: string;
} {
  switch (colorName) {
    case 'emerald':
      return {
        bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800',
        ring: 'ring-emerald-500',
      };
    case 'teal':
      return {
        bg: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',
        text: 'text-teal-600 dark:text-teal-400',
        border: 'border-teal-200 dark:border-teal-800',
        ring: 'ring-teal-500',
      };
    case 'cyan':
      return {
        bg: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400',
        text: 'text-cyan-600 dark:text-cyan-400',
        border: 'border-cyan-200 dark:border-cyan-800',
        ring: 'ring-cyan-500',
      };
    case 'blue':
      return {
        bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
        ring: 'ring-blue-500',
      };
    case 'amber':
      return {
        bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800',
        ring: 'ring-amber-500',
      };
    case 'orange':
      return {
        bg: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
        text: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-800',
        ring: 'ring-orange-500',
      };
    case 'rose':
      return {
        bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-200 dark:border-rose-800',
        ring: 'ring-rose-500',
      };
    case 'red':
      return {
        bg: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
        ring: 'ring-red-500',
      };
    case 'yellow':
      return {
        bg: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400',
        text: 'text-yellow-600 dark:text-yellow-400',
        border: 'border-yellow-200 dark:border-yellow-800',
        ring: 'ring-yellow-500',
      };
    case 'violet':
    case 'purple':
      return {
        bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800',
        ring: 'ring-purple-500',
      };
    case 'fuchsia':
    case 'pink':
      return {
        bg: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400',
        text: 'text-pink-600 dark:text-pink-400',
        border: 'border-pink-200 dark:border-pink-800',
        ring: 'ring-pink-500',
      };
    default:
      return {
        bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-700',
        ring: 'ring-slate-400',
      };
  }
}
