import React from 'react';
import { Search, AlertTriangle, ArrowUpDown, Clock, Plus, ListOrdered, Sparkles } from 'lucide-react';
import { CategoryType, FilterType, SortType } from '../types';
import { CategoryIcon, getCategoryLabel } from './CategoryIcon';

interface CategoryFilterProps {
  activeFilter: FilterType;
  onSelectFilter: (filter: FilterType) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortType: SortType;
  onSortChange: (sort: SortType) => void;
  urgentCount: number;
  totalCount: number;
  categoryCounts: Record<string, number>;
  onOpenNewCounter: () => void;
  onOpenReorderModal: () => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  activeFilter,
  onSelectFilter,
  searchQuery,
  onSearchChange,
  sortType,
  onSortChange,
  urgentCount,
  totalCount,
  categoryCounts,
  onOpenNewCounter,
  onOpenReorderModal,
}) => {
  const categories: { id: FilterType; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Tümü', icon: null },
    {
      id: 'urgent',
      label: '🚨 Acil Uyarılı',
      icon: null,
    },
    { id: 'countdown', label: 'Kalan Süre', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'elapsed', label: 'Geçen Süre', icon: <Clock className="w-3.5 h-3.5 rotate-180" /> },
    { id: 'car', label: 'Araç & Sigorta', icon: <CategoryIcon category="car" className="w-3.5 h-3.5" /> },
    { id: 'health', label: 'Sağlık', icon: <CategoryIcon category="health" className="w-3.5 h-3.5" /> },
    { id: 'finance', label: 'Finans', icon: <CategoryIcon category="finance" className="w-3.5 h-3.5" /> },
    { id: 'home', label: 'Ev', icon: <CategoryIcon category="home" className="w-3.5 h-3.5" /> },
    { id: 'personal', label: 'Kişisel', icon: <CategoryIcon category="personal" className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-3.5 mb-6">
      {/* Search & Action Toolbar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="search-counter-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Sigorta, bakım veya sayaç ara..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-full text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-xs transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Temizle
            </button>
          )}
        </div>

        {/* Sort Dropdown & Manual Reorder Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            <select
              id="sort-select"
              value={sortType}
              onChange={(e) => onSortChange(e.target.value as SortType)}
              className="appearance-none pl-8 sm:pl-9 pr-7 sm:pr-8 py-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-full text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-xs cursor-pointer max-w-[140px] sm:max-w-none truncate"
            >
              <option value="custom">⚡ Özel / El İle Sıralama</option>
              <option value="urgency">🚨 Aciliyete Göre</option>
              <option value="date_asc">📅 Tarihe Göre (En Yakın)</option>
              <option value="date_desc">📆 Tarihe Göre (En Uzak)</option>
              <option value="title_asc">🔤 Alfabetik (A → Z)</option>
              <option value="title_desc">🔤 Alfabetik (Z → A)</option>
              <option value="created_desc">✨ Eklenme: En Yeni</option>
              <option value="created_asc">⏳ Eklenme: En Eski</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Manual Reorder Button */}
          <button
            type="button"
            id="open-manual-reorder-btn"
            onClick={onOpenReorderModal}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2.5 rounded-full text-xs font-extrabold border transition-all shadow-xs active:scale-95 ${
              sortType === 'custom'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/25 ring-2 ring-indigo-500/30'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title="Sayaçları el ile sırala"
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">El ile Sırala</span>
          </button>
        </div>

        {/* Desktop Quick Add Button */}
        <button
          id="quick-add-btn"
          onClick={onOpenNewCounter}
          className="hidden sm:flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Sayaç</span>
        </button>
      </div>

      {/* Custom Reorder Active Notice Banner */}
      {sortType === 'custom' && (
        <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-[11px] font-medium text-indigo-900 dark:text-indigo-200 animate-in fade-in">
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">
              Özel sıralama aktif. Kartlardaki <strong>▲ / ▼</strong> butonlarıyla veya <strong>"El ile Sırala"</strong> ile sırayı belirleyebilirsiniz.
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenReorderModal}
            className="underline font-bold text-indigo-600 dark:text-indigo-400 shrink-0 hover:text-indigo-800"
          >
            Sıralamayı Aç
          </button>
        </div>
      )}

      {/* Horizontal Scrollable Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {categories.map((cat) => {
          const isActive = activeFilter === cat.id;
          let count = 0;
          if (cat.id === 'all') count = totalCount;
          else if (cat.id === 'urgent') count = urgentCount;
          else if (categoryCounts[cat.id] !== undefined) count = categoryCounts[cat.id];

          return (
            <button
              key={cat.id}
              id={`filter-pill-${cat.id}`}
              onClick={() => onSelectFilter(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap transition-all border shadow-xs ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/30'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
              {count > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : cat.id === 'urgent'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
