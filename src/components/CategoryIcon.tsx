import React from 'react';
import { 
  Car, 
  HeartPulse, 
  Home, 
  Wallet, 
  User, 
  Briefcase, 
  Clock, 
  Shield, 
  FileText, 
  Wrench, 
  Disc, 
  CreditCard, 
  Cake, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { CategoryType } from '../types';

interface CategoryIconProps {
  category: CategoryType | string;
  iconName?: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ category, iconName, className = 'w-5 h-5' }) => {
  if (iconName) {
    switch (iconName) {
      case 'Shield': return <Shield className={className} />;
      case 'FileText': return <FileText className={className} />;
      case 'Wrench': return <Wrench className={className} />;
      case 'Disc': return <Disc className={className} />;
      case 'CreditCard': return <CreditCard className={className} />;
      case 'Cake': return <Cake className={className} />;
      case 'HeartPulse': return <HeartPulse className={className} />;
      case 'Wallet': return <Wallet className={className} />;
    }
  }

  switch (category) {
    case 'car':
      return <Car className={className} />;
    case 'health':
      return <HeartPulse className={className} />;
    case 'home':
      return <Home className={className} />;
    case 'finance':
      return <Wallet className={className} />;
    case 'personal':
      return <User className={className} />;
    case 'work':
      return <Briefcase className={className} />;
    default:
      return <Calendar className={className} />;
  }
};

export const getCategoryLabel = (category: CategoryType): string => {
  switch (category) {
    case 'car': return 'Araç & Sigorta';
    case 'health': return 'Sağlık';
    case 'home': return 'Ev & Eşya';
    case 'finance': return 'Finans & Fatura';
    case 'personal': return 'Kişisel & Özel';
    case 'work': return 'İş & Kariyer';
    default: return 'Diğer';
  }
};

export const getCategoryColor = (category: CategoryType): string => {
  switch (category) {
    case 'car': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case 'health': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    case 'home': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'finance': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'personal': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    case 'work': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
  }
};
