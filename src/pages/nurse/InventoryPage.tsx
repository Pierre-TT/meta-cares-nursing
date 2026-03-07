import { useState } from 'react';
import { Package, Search, Plus, AlertTriangle, ArrowDown, ArrowUp, ChevronRight } from 'lucide-react';
import { GradientHeader, Tabs, Card, Badge, Button, AnimatedPage } from '@/design-system';

type Category = 'all' | 'pansements' | 'injections' | 'hygiene' | 'instruments' | 'medications';

interface InventoryItem {
  id: string;
  name: string;
  category: Category;
  stock: number;
  minStock: number;
  unit: string;
  lastRestock: string;
  expiryDate?: string;
}

const items: InventoryItem[] = [
  { id: '1', name: 'Compresses stériles 10x10', category: 'pansements', stock: 45, minStock: 20, unit: 'pcs', lastRestock: '28/02/2025' },
  { id: '2', name: 'Sparadrap Micropore', category: 'pansements', stock: 8, minStock: 10, unit: 'rouleaux', lastRestock: '15/02/2025' },
  { id: '3', name: 'Seringues 5ml', category: 'injections', stock: 30, minStock: 15, unit: 'pcs', lastRestock: '01/03/2025' },
  { id: '4', name: 'Aiguilles 21G', category: 'injections', stock: 5, minStock: 20, unit: 'pcs', lastRestock: '10/02/2025', expiryDate: '06/2026' },
  { id: '5', name: 'Gel hydroalcoolique 500ml', category: 'hygiene', stock: 12, minStock: 5, unit: 'flacons', lastRestock: '25/02/2025' },
  { id: '6', name: 'Gants nitrile M', category: 'hygiene', stock: 3, minStock: 10, unit: 'boîtes', lastRestock: '20/02/2025' },
  { id: '7', name: 'Thermomètre auriculaire', category: 'instruments', stock: 2, minStock: 1, unit: 'pcs', lastRestock: '01/01/2025' },
  { id: '8', name: 'Oxymètre de pouls', category: 'instruments', stock: 1, minStock: 1, unit: 'pcs', lastRestock: '15/01/2025' },
  { id: '9', name: 'Pansement Aquacel Ag+', category: 'pansements', stock: 15, minStock: 10, unit: 'pcs', lastRestock: '28/02/2025', expiryDate: '12/2025' },
  { id: '10', name: 'Cathéters IV 20G', category: 'injections', stock: 18, minStock: 10, unit: 'pcs', lastRestock: '05/03/2025' },
  { id: '11', name: 'Paracétamol 1g', category: 'medications', stock: 25, minStock: 10, unit: 'comprimés', lastRestock: '01/03/2025', expiryDate: '09/2026' },
  { id: '12', name: 'NaCl 0.9% 10ml', category: 'medications', stock: 40, minStock: 20, unit: 'ampoules', lastRestock: '01/03/2025' },
];

const categoryLabels: Record<Category, string> = {
  all: 'Tout', pansements: 'Pansements', injections: 'Injections',
  hygiene: 'Hygiène', instruments: 'Instruments', medications: 'Médicaments',
};

function getStockStatus(item: InventoryItem) {
  const ratio = item.stock / item.minStock;
  if (ratio <= 0.5) return { label: 'Critique', variant: 'red' as const, icon: <ArrowDown className="h-3 w-3" /> };
  if (ratio <= 1) return { label: 'Bas', variant: 'amber' as const, icon: <ArrowDown className="h-3 w-3" /> };
  return { label: 'OK', variant: 'green' as const, icon: <ArrowUp className="h-3 w-3" /> };
}

export function InventoryPage() {
  const [category, setCategory] = useState<Category>('all');
  const [search, setSearch] = useState('');

  const lowStockCount = items.filter(i => i.stock <= i.minStock).length;
  const totalItems = items.length;
  const criticalCount = items.filter(i => i.stock / i.minStock <= 0.5).length;

  const filtered = items.filter(i => {
    const matchCat = category === 'all' || i.category === category;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const tabs = Object.entries(categoryLabels).map(([key, label]) => ({ id: key, label }));

  return (
    <AnimatedPage>
      <GradientHeader
        title="Inventaire"
        subtitle="Stock matériel & fournitures"
        icon={<Package className="h-5 w-5 text-white" />}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{totalItems}</p>
            <p className="text-[10px] text-white/60">Articles</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-mc-amber-300">{lowStockCount}</p>
            <p className="text-[10px] text-white/60">Stock bas</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-mc-red-300">{criticalCount}</p>
            <p className="text-[10px] text-white/60">Critique</p>
          </div>
        </div>
      </GradientHeader>

      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un article..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-mc-blue-500/50"
          />
        </div>

        <Tabs
          tabs={tabs}
          activeTab={category}
          onChange={(t) => setCategory(t as Category)}
        />

        {/* Low stock alert */}
        {lowStockCount > 0 && category === 'all' && !search && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-mc-amber-500/10 border border-mc-amber-500/30">
            <AlertTriangle className="h-4 w-4 text-mc-amber-500 shrink-0" />
            <p className="text-xs font-medium text-mc-amber-600">
              {lowStockCount} article{lowStockCount > 1 ? 's' : ''} en stock bas — pensez à réapprovisionner
            </p>
          </div>
        )}

        {/* Items list */}
        <div className="space-y-2">
          {filtered.map(item => {
            const status = getStockStatus(item);
            return (
              <Card key={item.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <Badge variant={status.variant} className="shrink-0 gap-0.5">
                      {status.icon} {status.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-[var(--text-muted)]">
                      Stock: <span className="font-semibold">{item.stock}</span> {item.unit}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">Min: {item.minStock}</span>
                    {item.expiryDate && (
                      <span className="text-xs text-[var(--text-muted)]">Exp: {item.expiryDate}</span>
                    )}
                  </div>
                  {/* Stock bar */}
                  <div className="mt-1.5 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.stock / item.minStock <= 0.5 ? 'bg-mc-red-500' :
                        item.stock / item.minStock <= 1 ? 'bg-mc-amber-500' : 'bg-mc-green-500'
                      }`}
                      style={{ width: `${Math.min((item.stock / (item.minStock * 2)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
              </Card>
            );
          })}
        </div>

        {/* Reorder button */}
        <Button className="w-full gap-2">
          <Plus className="h-4 w-4" /> Demande de réapprovisionnement
        </Button>
      </div>
    </AnimatedPage>
  );
}
