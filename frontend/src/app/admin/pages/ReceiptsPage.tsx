import React, { useState, useMemo } from "react";
import { AdminLayout } from "../layout/AdminLayout";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { useReceipt } from "../../../context/ReceiptContext";
import { usePOS } from "../../../context/POSContext";
import {
  Printer,
  Download,
  Eye,
  Search,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export const ReceiptsPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();
  const { receipts, printReceipt } = useReceipt();
  const { getTodayTransactions } = usePOS();
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterPeriod, setFilterPeriod] = useState<"day" | "week" | "month">(
    "day",
  );
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success" as "success" | "error",
  });

  if (!hasPermission("manage_receipts")) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600 font-semibold">Accès refusé</p>
        </div>
      </AdminLayout>
    );
  }

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  const todayTransactions = getTodayTransactions();
  const dayTotal = todayTransactions.reduce((sum, t) => sum + t.total, 0);

  // Filter transactions based on search
  const filteredTransactions = useMemo(() => {
    return todayTransactions.filter(
      (t) =>
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.payments.some((p) =>
          p.type.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    );
  }, [todayTransactions, searchTerm]);

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const generateReceiptHTML = (transaction: any) => {
    const itemsHTML = transaction.items
      .map(
        (item: any) =>
          `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">XAF${(item.quantity * item.unitPrice).toFixed(2)}</td>
          </tr>`,
      )
      .join("");

    const paymentsHTML = transaction.payments
      .map(
        (p: any) =>
          `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="text-transform: capitalize;">${p.type}</span>
            <span>XAF${p.amount.toFixed(2)}</span>
          </div>`,
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reçu ${transaction.id}</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e293b; margin: 0;">RTWater</h1>
          <p style="color: #64748b; margin: 5px 0;">Équipement de traitement d'eau</p>
        </div>

        <div style="border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 30px; border-radius: 8px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <p style="color: #64748b; margin: 0 0 5px 0; font-size: 12px;">ID TRANSACTION</p>
              <p style="color: #1e293b; margin: 0; font-weight: bold; font-size: 14px;">${transaction.id}</p>
            </div>
            <div>
              <p style="color: #64748b; margin: 0 0 5px 0; font-size: 12px;">DATE & HEURE</p>
              <p style="color: #1e293b; margin: 0; font-weight: bold; font-size: 14px;">${formatDate(transaction.timestamp)}</p>
            </div>
          </div>
        </div>

        <h3 style="color: #1e293b; margin-bottom: 10px;">Articles</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="padding: 8px; text-align: left; border-bottom: 1px solid #cbd5e1;">Article</th>
              <th style="padding: 8px; text-align: center; border-bottom: 1px solid #cbd5e1;">Qté</th>
              <th style="padding: 8px; text-align: right; border-bottom: 1px solid #cbd5e1;">Prix</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div style="background-color: #f0f4f8; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #475569;">Sous-total</span>
            <span style="color: #1e293b; font-weight: bold;">XAF${transaction.subtotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #475569;">TVA 20%</span>
            <span style="color: #1e293b; font-weight: bold;">XAF${transaction.tax.toFixed(2)}</span>
          </div>
          <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; display: flex; justify-content: space-between;">
            <span style="color: #1e293b; font-weight: bold; font-size: 16px;">Total</span>
            <span style="color: #059669; font-weight: bold; font-size: 16px;">XAF${transaction.total.toFixed(2)}</span>
          </div>
        </div>

        <h3 style="color: #1e293b; margin-bottom: 10px;">Paiement</h3>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          ${paymentsHTML}
          ${
            transaction.change > 0
              ? `<div style="border-top: 1px solid #cbd5e1; padding-top: 8px; display: flex; justify-content: space-between;">
            <span style="color: #059669; font-weight: bold;">Monnaie rendue</span>
            <span style="color: #059669; font-weight: bold;">XAF${transaction.change.toFixed(2)}</span>
          </div>`
              : ""
          }
        </div>

        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>Merci de votre achat!</p>
          <p>RTWater - ${new Date().getFullYear()}</p>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = (transactionId: string) => {
    try {
      const transaction = todayTransactions.find((t) => t.id === transactionId);
      if (!transaction) {
        showToast("Transaction non trouvée", "error");
        return;
      }

      const printWindow = window.open("", "", "height=600,width=800");
      if (printWindow) {
        printWindow.document.write(generateReceiptHTML(transaction));
        printWindow.document.close();
        printWindow.print();
        showToast("Reçu imprimé avec succès", "success");
      }
    } catch (error) {
      showToast("Erreur lors de l'impression", "error");
    }
  };

  const handleDownloadPDF = (transactionId: string) => {
    try {
      const transaction = todayTransactions.find((t) => t.id === transactionId);
      if (!transaction) {
        showToast("Transaction non trouvée", "error");
        return;
      }

      const html = generateReceiptHTML(transaction);
      const element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/html;charset=utf-8," + encodeURIComponent(html),
      );
      element.setAttribute("download", `receipt_${transaction.id}.html`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      showToast("Reçu téléchargé avec succès", "success");
    } catch (error) {
      showToast("Erreur lors du téléchargement", "error");
    }
  };

  return (
    <AdminLayout
      title="Reçus & Transactions"
      breadcrumbs={[
        { label: "Dashboard", path: "/admin/dashboard" },
        { label: "Reçus" },
      ]}
    >
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in ${
            toast.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Day Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Transactions du jour</p>
          <p className="text-3xl font-bold text-gray-900">
            {todayTransactions.length}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Total filtrés: {filteredTransactions.length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Montant du jour</p>
          <p className="text-3xl font-bold text-green-600">
            {dayTotal.toFixed(2)} XAF
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Panier moyen</p>
          <p className="text-3xl font-bold text-blue-600">
            {todayTransactions.length > 0
              ? (dayTotal / todayTransactions.length).toFixed(2)
              : "0.00"}{" "}
            XAF
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher par ID ou type de paiement..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="day">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2">
          <FileText size={20} className="text-blue-600" />
          <h3 className="text-lg font-semibold">Historique des transactions</h3>
          <span className="text-sm text-gray-500 ml-auto">
            {filteredTransactions.length} résultats
          </span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <AlertCircle className="mx-auto mb-2 text-gray-400" size={32} />
            <p>Aucune transaction trouvée</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Heure
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                      Articles
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Paiement
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <span className="inline-flex items-center gap-2">
                          <CheckCircle size={16} className="text-green-600" />
                          {transaction.id}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(transaction.timestamp)}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">
                        {transaction.items.reduce(
                          (sum, item) => sum + item.quantity,
                          0,
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        {transaction.total.toFixed(2)} XAF
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex flex-wrap gap-1">
                          {transaction.payments.map((p, idx) => (
                            <span
                              key={idx}
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                            >
                              {p.type}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedReceipt(transaction.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Voir les détails"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handlePrint(transaction.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Imprimer"
                          >
                            <Printer size={18} />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(transaction.id)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                            title="Télécharger"
                          >
                            <Download size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Page {currentPage} sur {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Précédent
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 border rounded-lg transition ${
                          currentPage === page
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            {todayTransactions
              .filter((t) => t.id === selectedReceipt)
              .map((transaction) => (
                <div key={transaction.id}>
                  {/* Modal Header */}
                  <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText size={24} className="text-blue-600" />
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          Reçu #{transaction.id}
                        </h2>
                        <p className="text-sm text-gray-600">
                          {formatDate(transaction.timestamp)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedReceipt(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-6">
                    {/* Transaction Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          ID Transaction
                        </p>
                        <p className="font-semibold text-gray-900">
                          {transaction.id}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Date & Heure
                        </p>
                        <p className="font-semibold text-gray-900">
                          {formatDate(transaction.timestamp)}
                        </p>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FileText size={18} className="text-blue-600" />
                        Articles commandés
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-4 py-2 text-left font-semibold text-gray-900">
                                Article
                              </th>
                              <th className="px-4 py-2 text-center font-semibold text-gray-900">
                                Qté
                              </th>
                              <th className="px-4 py-2 text-right font-semibold text-gray-900">
                                Prix unitaire
                              </th>
                              <th className="px-4 py-2 text-right font-semibold text-gray-900">
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {transaction.items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-gray-900 font-medium">
                                  {item.name}
                                </td>
                                <td className="px-4 py-2 text-center text-gray-600">
                                  {item.quantity}
                                </td>
                                <td className="px-4 py-2 text-right text-gray-600">
                                  {item.unitPrice.toFixed(2)} XAF
                                </td>
                                <td className="px-4 py-2 text-right text-gray-900 font-semibold">
                                  XAF
                                  {(item.quantity * item.unitPrice).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="p-4 bg-blue-50 rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sous-total</span>
                        <span className="font-semibold text-gray-900">
                          {transaction.subtotal.toFixed(2)} XAF
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">TVA 20%</span>
                        <span className="font-semibold text-gray-900">
                          {transaction.tax.toFixed(2)} XAF
                        </span>
                      </div>
                      <div className="border-t pt-2 flex justify-between">
                        <span className="font-bold text-gray-900">
                          Total TTC
                        </span>
                        <span className="font-bold text-green-600 text-base">
                          {transaction.total.toFixed(2)} XAF
                        </span>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Détails du paiement
                      </h3>
                      <div className="space-y-2 p-4 bg-gray-50 rounded-lg text-sm">
                        {transaction.payments.map((p, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center"
                          >
                            <span className="capitalize font-medium text-gray-900">
                              {p.type}
                            </span>
                            <span className="font-semibold text-gray-900">
                              {p.amount.toFixed(2)} XAF
                            </span>
                          </div>
                        ))}
                        {transaction.change > 0 && (
                          <div className="border-t pt-2 flex justify-between items-center">
                            <span className="font-medium text-green-600">
                              Monnaie rendue
                            </span>
                            <span className="font-bold text-green-600">
                              {transaction.change.toFixed(2)} XAF
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex gap-3">
                    <button
                      onClick={() => setSelectedReceipt(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium text-gray-700"
                    >
                      Fermer
                    </button>
                    <button
                      onClick={() => {
                        handlePrint(transaction.id);
                        setSelectedReceipt(null);
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
                    >
                      <Printer size={18} />
                      Imprimer
                    </button>
                    <button
                      onClick={() => {
                        handleDownloadPDF(transaction.id);
                        setSelectedReceipt(null);
                      }}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium flex items-center justify-center gap-2"
                    >
                      <Download size={18} />
                      Télécharger
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
