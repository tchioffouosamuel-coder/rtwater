import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { Sidebar } from '../components/Sidebar';
import { ChevronRight, Bell, Settings, ShoppingBag, X, ExternalLink } from 'lucide-react';
import { fetchAdminOrders } from '../../../services/orders';
import { toast } from 'sonner';

const POLL_INTERVAL_MS = 30_000;
const LAST_SEEN_KEY    = 'rtwater_last_seen_order_id';

/** Plays a two-note chime using Web Audio API — no external file needed */
function playNotificationChime() {
  try {
    const ctx  = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

    const notes = [880, 1100]; // A5 → C#6  — pleasant ascending chime
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18);
      osc.connect(gain);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.5);
    });
  } catch { /* browser may block AudioContext before user gesture */ }
}

interface NotifOrder {
  id: number;
  user?: { name?: string } | null;
  total: number;
  status: string;
  created_at: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; path?: string }>;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, breadcrumbs }) => {
  const { isAuthenticated } = useAdminAuth();

  const [pendingOrders, setPendingOrders] = useState<NotifOrder[]>([]);
  const [newCount, setNewCount]           = useState(0);
  const [showPanel, setShowPanel]         = useState(false);
  const [lastSeenId, setLastSeenId]       = useState<number>(() =>
    parseInt(localStorage.getItem(LAST_SEEN_KEY) || '0', 10)
  );

  const isFirstPoll = useRef(true);
  const prevCount   = useRef(0);
  const panelRef    = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res    = await fetchAdminOrders({ status: 'pending', per_page: 15, page: 1 });
      const orders: NotifOrder[] = res?.data ?? [];

      const unseen = orders.filter(o => o.id > lastSeenId).length;

      // Notify only after first poll when new orders appear during the session
      if (!isFirstPoll.current && unseen > prevCount.current) {
        const diff = unseen - prevCount.current;
        playNotificationChime();
        toast(
          `${diff} nouvelle${diff > 1 ? 's' : ''} commande${diff > 1 ? 's' : ''} en attente !`,
          { icon: '🛍️', duration: 6000 }
        );
      }

      isFirstPoll.current = false;
      prevCount.current   = unseen;

      setPendingOrders(orders);
      setNewCount(unseen);
    } catch { /* silent on network error */ }
  }, [isAuthenticated, lastSeenId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    const id = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isAuthenticated, fetchNotifications]);

  // Close panel on click outside
  useEffect(() => {
    if (!showPanel) return;
    const handle = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [showPanel]);

  const handleOpenPanel = () => {
    setShowPanel(v => !v);
  };

  const handleMarkSeen = () => {
    if (pendingOrders.length === 0) return;
    const maxId = Math.max(...pendingOrders.map(o => o.id));
    localStorage.setItem(LAST_SEEN_KEY, String(maxId));
    setLastSeenId(maxId);
    setNewCount(0);
    prevCount.current = 0;
  };

  const statusLabel: Record<string, string> = {
    pending:   'En attente',
    paid:      'Payée',
    shipped:   'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée',
  };

  if (!isAuthenticated) return <>{children}</>;

  return (
    <div className="flex h-screen bg-ink-100 text-ink-900">
      <Sidebar />

      <div className="flex-1 overflow-auto lg:ml-64 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-ink-200 sticky top-0 z-20 shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex-1">
              {title && <h1 className="text-2xl font-bold text-ink-900 mb-1">{title}</h1>}
              {breadcrumbs && breadcrumbs.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                      {crumb.path
                        ? <a href={crumb.path} className="text-ink-600 hover:text-ink-900 transition">{crumb.label}</a>
                        : <span className="text-ink-500">{crumb.label}</span>
                      }
                      {index < breadcrumbs.length - 1 && (
                        <ChevronRight size={16} className="text-ink-400" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <div className="relative" ref={panelRef}>
                <button
                  onClick={handleOpenPanel}
                  className="relative p-2 text-ink-600 hover:bg-ink-100 rounded-lg transition"
                  title="Notifications"
                >
                  <Bell size={20} />
                  {newCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                      {newCount > 99 ? '99+' : newCount}
                    </span>
                  )}
                </button>

                {/* Notification Panel */}
                {showPanel && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-ink-200 z-50 overflow-hidden">
                    {/* Panel header */}
                    <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between bg-ink-50">
                      <div className="flex items-center gap-2">
                        <ShoppingBag size={16} className="text-brand-600" />
                        <span className="text-sm font-semibold text-ink-900">Commandes en attente</span>
                        {newCount > 0 && (
                          <span className="bg-red-100 text-red-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                            {newCount} nouveau{newCount > 1 ? 'x' : ''}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setShowPanel(false)}
                        className="p-1 hover:bg-ink-200 rounded-lg transition"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Order list */}
                    <div className="max-h-72 overflow-y-auto">
                      {pendingOrders.length === 0 ? (
                        <div className="py-10 text-center">
                          <ShoppingBag size={32} className="mx-auto text-ink-300 mb-2" />
                          <p className="text-sm text-ink-400">Aucune commande en attente</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-ink-100">
                          {pendingOrders.map(order => {
                            const isNew = order.id > lastSeenId;
                            return (
                              <div
                                key={order.id}
                                className={`px-4 py-3 hover:bg-ink-50 transition ${isNew ? 'bg-brand-50/60' : ''}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      {isNew && (
                                        <span className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0" />
                                      )}
                                      <p className="text-sm font-semibold text-ink-900 truncate">
                                        Commande #{order.id}
                                      </p>
                                    </div>
                                    <p className="text-xs text-ink-500 truncate mt-0.5">
                                      {order.user?.name ?? 'Client invité'}
                                    </p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-bold text-ink-900">
                                      {Number(order.total).toLocaleString('fr-FR')} XAF
                                    </p>
                                    <p className="text-xs text-ink-400 mt-0.5">{order.created_at}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Panel footer */}
                    <div className="px-4 py-3 border-t border-ink-100 bg-ink-50 flex items-center justify-between gap-2">
                      {newCount > 0 ? (
                        <button
                          onClick={handleMarkSeen}
                          className="text-xs text-brand-600 hover:underline font-medium"
                        >
                          Tout marquer comme vu
                        </button>
                      ) : (
                        <span className="text-xs text-ink-400">Toutes vues</span>
                      )}
                      <a
                        href="/admin/orders"
                        className="flex items-center gap-1 text-xs font-semibold text-ink-700 hover:text-brand-600 transition"
                        onClick={() => setShowPanel(false)}
                      >
                        Voir toutes <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <button className="p-2 text-ink-600 hover:bg-ink-100 rounded-lg transition">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
