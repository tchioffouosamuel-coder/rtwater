import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "../layout/AdminLayout";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { fetchAdminQuotes, updateAdminQuote } from "../../../services/quotes";
import { toast } from "sonner";
import {
  Search, Eye, RefreshCw, X, ChevronLeft, ChevronRight,
  FileQuestion, TrendingUp, Clock, CheckCircle, AlertCircle,
  User, Mail, Phone, MapPin, FileText, Tag,
} from "lucide-react";

type QuoteStatus = "new" | "in_progress" | "quoted" | "converted" | "rejected";

interface ApiQuote {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  location?: string;
  solution_type?: string;
  volume_m3?: number;
  description?: string;
  status: QuoteStatus;
  internal_notes?: string;
  assigned_to?: { id: number; name: string } | null;
  created_at: string;
}

const QUOTE_STATUS: Record<string, { label: string; classes: string }> = {
  new:         { label: "Nouvelle",     classes: "bg-amber-100 text-amber-800 border border-amber-200" },
  in_progress: { label: "En cours",     classes: "bg-blue-100 text-blue-800 border border-blue-200" },
  quoted:      { label: "Devisée",      classes: "bg-purple-100 text-purple-800 border border-purple-200" },
  converted:   { label: "Convertie",    classes: "bg-emerald-100 text-emerald-800 border border-emerald-200" },
  rejected:    { label: "Rejetée",      classes: "bg-red-100 text-red-700 border border-red-200" },
};

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "new", label: "Nouvelles" },
  { value: "in_progress", label: "En cours" },
  { value: "quoted", label: "Devisées" },
  { value: "converted", label: "Converties" },
  { value: "rejected", label: "Rejetées" },
];

export const QuotesAdminPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();
  const [quotes, setQuotes] = useState<ApiQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{ current_page: number; last_page: number; total: number } | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<ApiQuote | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page: currentPage };
      if (statusFilter !== "all") params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await fetchAdminQuotes(params);
      setQuotes(res?.data ?? []);
      if (res?.pagination) setPagination(res.pagination);
    } catch {
      toast.error("Impossible de charger les demandes de devis");
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchTerm]);

  useEffect(() => { loadQuotes(); }, [loadQuotes]);

  useEffect(() => { setCurrentPage(1); }, [statusFilter, searchTerm]);

  const openModal = (quote: ApiQuote) => {
    setSelectedQuote(quote);
    setEditStatus(quote.status);
    setEditNotes(quote.internal_notes ?? "");
  };

  const handleSave = async () => {
    if (!selectedQuote) return;
    setSaving(true);
    try {
      await updateAdminQuote(selectedQuote.id, {
        status: editStatus,
        internal_notes: editNotes,
      });
      setQuotes(prev => prev.map(q =>
        q.id === selectedQuote.id
          ? { ...q, status: editStatus as QuoteStatus, internal_notes: editNotes }
          : q
      ));
      toast.success("Demande mise à jour");
      setSelectedQuote(null);
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  // Stats derived from current page data
  const statsNew = quotes.filter(q => q.status === "new").length;
  const statsInProgress = quotes.filter(q => q.status === "in_progress").length;
  const statsConverted = quotes.filter(q => q.status === "converted").length;
  const total = pagination?.total ?? quotes.length;

  if (!hasPermission("manage_orders") && !hasPermission("view_dashboard")) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600 font-semibold">Accès refusé</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Demandes de devis"
      breadcrumbs={[
        { label: "Dashboard", path: "/admin/dashboard" },
        { label: "Devis" },
      ]}
    >
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0077BE] to-[#00A8E8] rounded-2xl p-5 text-white shadow-lg shadow-[#0077BE]/20">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <FileQuestion size={20} />
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Total</span>
          </div>
          <p className="text-3xl font-bold">{total}</p>
          <p className="text-sm text-white/70 mt-1">Total demandes</p>
        </div>

        {/* Nouvelles */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertCircle size={20} />
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Nouvelles</span>
          </div>
          <p className="text-3xl font-bold">{statsNew}</p>
          <p className="text-sm text-white/70 mt-1">À traiter</p>
        </div>

        {/* En cours */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Clock size={20} />
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">En cours</span>
          </div>
          <p className="text-3xl font-bold">{statsInProgress}</p>
          <p className="text-sm text-white/70 mt-1">En traitement</p>
        </div>

        {/* Converties */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle size={20} />
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Converties</span>
          </div>
          <p className="text-3xl font-bold">{statsConverted}</p>
          <p className="text-sm text-white/70 mt-1">Devis convertis</p>
        </div>
      </div>

      {/* Status Tabs + Search */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6">
        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-100">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setCurrentPage(1); }}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                statusFilter === tab.value
                  ? "border-[#0077BE] text-[#0077BE]"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + Refresh */}
        <div className="flex gap-3 p-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher par nom, email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0077BE]/30 focus:border-[#0077BE] text-sm"
            />
          </div>
          <button
            onClick={loadQuotes}
            className="px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-sm font-medium flex items-center gap-2 text-slate-600 transition"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">#ID</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Client</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Service demandé</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Statut</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-2 border-[#0077BE] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Chargement...
                  </td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <FileQuestion size={36} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400 font-medium">Aucune demande de devis</p>
                    <p className="text-slate-300 text-sm mt-1">Essayez de modifier les filtres</p>
                  </td>
                </tr>
              ) : quotes.map(quote => {
                const statusCfg = QUOTE_STATUS[quote.status] ?? { label: quote.status, classes: "bg-slate-100 text-slate-600 border border-slate-200" };
                return (
                  <tr key={quote.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-bold text-[#0077BE]">
                      #{String(quote.id).padStart(4, "0")}
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      <div className="font-medium text-slate-900">{quote.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{quote.email}</div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">
                      {quote.solution_type ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">
                      {new Date(quote.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.classes}`}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => openModal(quote)}
                        className="p-1.5 text-slate-400 hover:text-[#0077BE] hover:bg-[#0077BE]/10 rounded-lg transition"
                        title="Voir / Modifier"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-sm text-slate-500">
            <span>Page <strong className="text-slate-700">{pagination.current_page}</strong> / {pagination.last_page} — {pagination.total} demandes</span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition text-xs font-medium"
              >
                <ChevronLeft size={14} /> Précédent
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(pagination.last_page, p + 1))}
                disabled={currentPage === pagination.last_page}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition text-xs font-medium"
              >
                Suivant <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail / Edit Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#0077BE] to-[#00A8E8] rounded-xl flex items-center justify-center">
                  <FileQuestion size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Demande #{String(selectedQuote.id).padStart(4, "0")}</h2>
                  <p className="text-xs text-slate-400">
                    {new Date(selectedQuote.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Client Info (read-only) */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Informations client</p>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={15} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Nom</p>
                    <p className="font-semibold text-slate-900">{selectedQuote.name}</p>
                    {selectedQuote.company && <p className="text-xs text-slate-400 mt-0.5">{selectedQuote.company}</p>}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail size={15} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Email</p>
                    <p className="font-medium text-slate-900">{selectedQuote.email}</p>
                  </div>
                </div>

                {selectedQuote.phone && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone size={15} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Téléphone</p>
                      <p className="font-medium text-slate-900">{selectedQuote.phone}</p>
                    </div>
                  </div>
                )}

                {selectedQuote.location && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin size={15} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Localisation</p>
                      <p className="font-medium text-slate-900">{selectedQuote.location}</p>
                    </div>
                  </div>
                )}

                {selectedQuote.solution_type && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Tag size={15} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Type de solution</p>
                      <p className="font-medium text-slate-900">{selectedQuote.solution_type}</p>
                    </div>
                  </div>
                )}

                {selectedQuote.description && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText size={15} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Description</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{selectedQuote.description}</p>
                    </div>
                  </div>
                )}

                {selectedQuote.assigned_to && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-500 mb-0.5">Assigné à</p>
                    <p className="font-medium text-blue-900">{selectedQuote.assigned_to.name}</p>
                  </div>
                )}
              </div>

              {/* Right: Admin Actions */}
              <div className="space-y-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Actions admin</p>

                {/* Status Select */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Statut</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0077BE]/30 focus:border-[#0077BE] text-sm bg-white"
                  >
                    {Object.entries(QUOTE_STATUS).map(([value, cfg]) => (
                      <option key={value} value={value}>{cfg.label}</option>
                    ))}
                  </select>
                </div>

                {/* Preview of selected status */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Statut sélectionné :</span>
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${QUOTE_STATUS[editStatus]?.classes ?? ""}`}>
                    {QUOTE_STATUS[editStatus]?.label ?? editStatus}
                  </span>
                </div>

                {/* Internal Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes internes</label>
                  <textarea
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    rows={5}
                    placeholder="Ajouter des notes internes (non visibles par le client)..."
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0077BE]/30 focus:border-[#0077BE] text-sm resize-none"
                  />
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full px-4 py-3 bg-gradient-to-r from-[#0077BE] to-[#00A8E8] text-white rounded-xl hover:opacity-90 transition font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#0077BE]/20 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Enregistrer
                    </>
                  )}
                </button>

                <button
                  onClick={() => setSelectedQuote(null)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition font-medium text-sm text-slate-600"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
