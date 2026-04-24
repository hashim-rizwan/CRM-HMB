'use client'

import { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, Eye, EyeOff, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { inventoryAPI } from '@/lib/api';

interface SlabEntry {
  id: number;
  quantity: number;
  unit: string | null;
  slabInfo: { length: number; width: number; numberOfSlabs: number } | null;
  notes: string | null;
}

interface ShadeData {
  shade: string;
  costPrice: number | null;
  salePrice: number | null;
  totalQuantity: number;
  shadeStatus: string;
  lastUpdated: string;
  entries: SlabEntry[];
}

interface MarbleType {
  id: number;
  marbleType: string;
  availableShades: string[];
  totalQuantity: number;
  overallStatus: string;
  lastUpdated: string;
  shades: ShadeData[];
}

interface InventoryDashboardProps {
  searchQuery?: string;
  userRole?: 'Admin' | 'Staff';
}

const STATUS_PILL: Record<string, string> = {
  'In Stock':     'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  'Low Stock':    'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'Out of Stock': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const STATUS_DOT: Record<string, string> = {
  'In Stock':     'bg-green-500',
  'Low Stock':    'bg-amber-400',
  'Out of Stock': 'bg-red-500',
};

const SHADE_STYLE: Record<string, string> = {
  AA:   'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  A:    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  B:    'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  'B-': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${STATUS_PILL[status] ?? 'bg-gray-100 text-gray-600'}`}>
      <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status] ?? 'bg-gray-400'}`} />
      {status}
    </span>
  );
}

function ShadeBadge({ shade }: { shade: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded text-sm font-bold tracking-wide ${SHADE_STYLE[shade] ?? 'bg-gray-100 text-gray-600'}`}>
      {shade}
    </span>
  );
}

export function InventoryDashboard({ searchQuery = '', userRole = 'Staff' }: InventoryDashboardProps) {
  const [marbleTypes, setMarbleTypes] = useState<MarbleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hideOutOfStock, setHideOutOfStock] = useState(false);
  const [expandedMarbles, setExpandedMarbles] = useState<Set<number>>(new Set());
  const [expandedShades, setExpandedShades] = useState<Set<string>>(new Set());

  useEffect(() => { fetchInventory(); }, [searchQuery]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await inventoryAPI.getGrouped(searchQuery);
      setMarbleTypes(res.marbleTypes || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory');
      setMarbleTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMarble = (id: number, name: string) => {
    const next = new Set(expandedMarbles);
    if (next.has(id)) {
      next.delete(id);
      const nextShades = new Set(expandedShades);
      marbleTypes.find(m => m.id === id)?.shades.forEach(s => nextShades.delete(`${name}__${s.shade}`));
      setExpandedShades(nextShades);
    } else {
      next.add(id);
    }
    setExpandedMarbles(next);
  };

  const toggleShade = (marbleName: string, shade: string) => {
    const key = `${marbleName}__${shade}`;
    const next = new Set(expandedShades);
    next.has(key) ? next.delete(key) : next.add(key);
    setExpandedShades(next);
  };

  let filtered = marbleTypes;
  if (hideOutOfStock) {
    filtered = marbleTypes.map(mt => {
      const shades = mt.shades.filter(s => s.shadeStatus !== 'Out of Stock');
      const qty = shades.reduce((s, sh) => s + sh.totalQuantity, 0);
      const hasLow = shades.some(s => s.shadeStatus === 'Low Stock');
      return { ...mt, shades, totalQuantity: qty, overallStatus: qty === 0 ? 'Out of Stock' : hasLow ? 'Low Stock' : 'In Stock', availableShades: shades.map(s => s.shade) };
    }).filter(mt => mt.shades.length > 0);
  }

  const totalQty   = filtered.reduce((s, mt) => s + mt.totalQuantity, 0);
  const lowCount   = filtered.filter(mt => mt.overallStatus === 'Low Stock').length;
  const totalValue = filtered.reduce((s, mt) => s + mt.shades.reduce((ss, sh) =>
    ss + sh.entries.reduce((es, e) => es + e.quantity * (sh.costPrice || 0), 0), 0), 0);
  const isAdmin = userRole === 'Admin';

  const summaryCards = [
    { label: 'Marble Types',    value: filtered.length,                   sub: `${filtered.reduce((s, mt) => s + mt.shades.length, 0)} shades total`, icon: Package,       color: 'bg-blue-600' },
    { label: 'Total Stock',     value: `${totalQty.toLocaleString()} sq ft`, sub: 'Across all shades',                                                    icon: TrendingUp,    color: 'bg-green-600' },
    ...(isAdmin ? [{ label: 'Inventory Value', value: `PKR ${totalValue.toLocaleString()}`, sub: 'At cost price', icon: Layers, color: 'bg-violet-600' }] : []),
    { label: 'Low Stock',       value: lowCount,                           sub: 'Needs attention',                                                          icon: AlertTriangle, color: 'bg-amber-500' },
  ];

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-64 text-gray-400">Loading inventory…</div>
  );

  if (error) return (
    <div className="p-8">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">{error}</div>
    </div>
  );

  return (
    <div className="p-6 pt-4 space-y-5">

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
              <div className={`${c.color} p-3 rounded-lg shrink-0`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500 dark:text-gray-400">{c.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight truncate">{c.value}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">{c.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Inventory Table ── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">

        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white text-base">Current Inventory</h2>
          <button
            onClick={() => setHideOutOfStock(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              hideOutOfStock
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {hideOutOfStock
              ? <><EyeOff className="w-4 h-4" /> Show Out of Stock</>
              : <><Eye className="w-4 h-4" /> Hide Out of Stock</>}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-base border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="px-5 py-4 text-left w-10" />
                <th className="px-5 py-4 text-left">Marble Type</th>
                <th className="px-5 py-4 text-left">Shades</th>
                <th className="px-5 py-4 text-right">Total Qty</th>
                {isAdmin && <th className="px-5 py-4 text-right">Cost / sq ft</th>}
                {isAdmin && <th className="px-5 py-4 text-right">Sale / sq ft</th>}
                <th className="px-5 py-4 text-left">Status</th>
                <th className="px-5 py-4 text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 6} className="px-4 py-16 text-center text-gray-400 dark:text-gray-500">
                    {searchQuery ? `No results for "${searchQuery}"` : 'No inventory items found'}
                  </td>
                </tr>
              ) : filtered.map((mt) => {
                const isOpen = expandedMarbles.has(mt.id);
                return (
                  <>
                    {/* ── Level 1: Marble Type ── */}
                    <tr
                      key={`mt-${mt.id}`}
                      onClick={() => toggleMarble(mt.id, mt.marbleType)}
                      className="cursor-pointer border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-5 py-4 text-gray-400">
                        {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-6 rounded-full shrink-0 ${STATUS_DOT[mt.overallStatus] ?? 'bg-gray-300'}`} />
                          <span className="font-semibold text-gray-900 dark:text-white text-base">{mt.marbleType}</span>
                          <span className="text-sm text-gray-400">#{mt.id}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {mt.availableShades.map(s => <ShadeBadge key={s} shade={s} />)}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-gray-800 dark:text-gray-100 tabular-nums">
                        {mt.totalQuantity.toLocaleString()} sq ft
                      </td>
                      {isAdmin && <td className="px-5 py-4 text-right text-gray-400">—</td>}
                      {isAdmin && <td className="px-5 py-4 text-right text-gray-400">—</td>}
                      <td className="px-5 py-4"><StatusPill status={mt.overallStatus} /></td>
                      <td className="px-5 py-4 text-right text-sm text-gray-400 tabular-nums">
                        {new Date(mt.lastUpdated).toLocaleDateString()}
                      </td>
                    </tr>

                    {/* ── Level 2: Shades ── */}
                    {isOpen && mt.shades.map((sh) => {
                      const shadeKey = `${mt.marbleType}__${sh.shade}`;
                      const isShadeOpen = expandedShades.has(shadeKey);
                      return (
                        <>
                          <tr
                            key={`shade-${shadeKey}`}
                            onClick={() => toggleShade(mt.marbleType, sh.shade)}
                            className="cursor-pointer bg-gray-50/80 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors border-t border-gray-100 dark:border-gray-700/50"
                          >
                            <td className="px-5 py-3.5 text-gray-400">
                              <div className="pl-5">
                                {isShadeOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 pl-12">
                              <div className="flex items-center gap-2.5">
                                <ShadeBadge shade={sh.shade} />
                                <span className="text-sm text-gray-400">
                                  {sh.entries.length} {sh.entries.length === 1 ? 'batch' : 'batches'}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5" />
                            <td className="px-5 py-3.5 text-right font-medium text-gray-700 dark:text-gray-300 tabular-nums">
                              {sh.totalQuantity.toLocaleString()} sq ft
                            </td>
                            {isAdmin && (
                              <td className="px-5 py-3.5 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                                {sh.costPrice != null ? `PKR ${sh.costPrice.toLocaleString()}` : '—'}
                              </td>
                            )}
                            {isAdmin && (
                              <td className="px-5 py-3.5 text-right font-medium text-green-600 dark:text-green-400 tabular-nums">
                                {sh.salePrice != null ? `PKR ${sh.salePrice.toLocaleString()}` : '—'}
                              </td>
                            )}
                            <td className="px-5 py-3.5"><StatusPill status={sh.shadeStatus} /></td>
                            <td className="px-5 py-3.5 text-right text-sm text-gray-400 tabular-nums">
                              {new Date(sh.lastUpdated).toLocaleDateString()}
                            </td>
                          </tr>

                          {/* ── Level 3: Slab Batches ── */}
                          {isShadeOpen && sh.entries.map((entry, idx) => (
                            <tr
                              key={`entry-${entry.id}`}
                              className="bg-gray-100/60 dark:bg-gray-700/20 border-t border-gray-100 dark:border-gray-700/30"
                            >
                              <td className="px-5 py-3" />
                              <td className="px-5 py-3 pl-20">
                                <span className="inline-flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                  <span className="text-gray-400">Batch {idx + 1}</span>
                                  {entry.slabInfo ? (
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                      {entry.slabInfo.length} × {entry.slabInfo.width} ft
                                    </span>
                                  ) : (
                                    <span className="italic text-gray-400">No dimensions</span>
                                  )}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-sm text-gray-400">
                                {entry.slabInfo?.numberOfSlabs
                                  ? `${entry.slabInfo.numberOfSlabs} slab${entry.slabInfo.numberOfSlabs !== 1 ? 's' : ''}`
                                  : ''}
                              </td>
                              <td className="px-5 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 tabular-nums">
                                {entry.quantity.toLocaleString()} sq ft
                              </td>
                              {isAdmin && <td className="px-5 py-3" />}
                              {isAdmin && <td className="px-5 py-3" />}
                              <td className="px-5 py-3" />
                              <td className="px-5 py-3" />
                            </tr>
                          ))}
                        </>
                      );
                    })}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
