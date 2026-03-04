import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import type { RootState } from "../../../app/store";
import Sidebar from "../components/sidebar";
import UploadBox from "../components/upload_box";
import InvoicePreviewModal from "../../dashboard/components/invoice_preview";
import { extractInvoice, getTotalDocuments, getApprovedDocuments, getReviewedDocuments, getRejectedDocuments, submitInvoice, extractPurchaseOrder, submitPurchaseOrder, getRecentActivity } from "../../dashboard/services/dashboardService";
import type { ExtractedFile } from "../../../types/process";
import ProgressModal from "../components/progress_modal";
import PurchaseOrderPreviewModal from "../components/purchase_order_preview";
import type { ToastState } from "../../../types/toast";
import Toast from "../../../components/common/toast";

type DocStatus = "success" | "pending" | "failed";
type DocType = "Invoice" | "Purchase Order";

interface StatItem {
  label: string;
  value: number | string;
  sub: string;
  accentClass: string;
}

interface ActivityRow {
  id: number;
  file: string;
  type: DocType;
  total_amount: string;
  status: DocStatus;
  date: string;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function StatusBadge({ status }: { status: DocStatus }) {
  const config: Record<DocStatus, string> = {
    success: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${config[status]}`}>{status}</span>
  );
}

function StatCard({ label, value, sub, accentClass }: StatItem) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border-t-4 ${accentClass} p-5`}>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-800 mt-1">
        {typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function Dashboard() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [toast, setToast] = useState<ToastState>({
      visible: false,
      message: "",
      type: "info",
    });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState([
    { label: "Total Documents", value: 0 as number | string, sub: "All time", accentClass: "border-t-blue-600" },
    { label: "Approved", value: 0 as number | string, sub: "0% success rate", accentClass: "border-t-green-600" },
    { label: "Pending Review", value: 0 as number | string, sub: "Awaiting approval", accentClass: "border-t-amber-500" },
    { label: "Failed", value: 0 as number | string, sub: "Needs attention", accentClass: "border-t-red-500" },
  ]);
  const [extractedFiles, setExtractedFiles] = useState<ExtractedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ExtractedFile | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [recentActivity, setRecentActivity] = useState<ActivityRow[]>([]);

  const fetchRecentActivity = async () => {
    try {
      const data = await getRecentActivity();
      const formatted: ActivityRow[] = data.map((item: any, index: number) => {
        const isInvoice = "invoice_id" in item;
        return {
          id: index,
          file: isInvoice ? item.invoice_id : item.po_id,
          type: isInvoice ? "Invoice" : "Purchase Order",
          total_amount: `₹ ${Number(item.total_amount).toLocaleString("en-IN")}`,
          status: item.status === "approved" ? "success" : item.status === "pending" ? "pending" : "failed",
          date: isInvoice ? item.invoice_date : item.ordered_date,
        };
      });

      setRecentActivity(formatted);
    } catch (err) {
      console.error("Failed to fetch activity", err);
    }
  };

  const fetchStats = async () => {
    try {
      const [total, approved, reviewed, rejected] = await Promise.all([
        getTotalDocuments(),
        getApprovedDocuments(),
        getReviewedDocuments(),
        getRejectedDocuments(),
      ]);

      const totalVal = total;
      const approvedVal = approved;
      const successRate = totalVal > 0 ? Math.round((approvedVal / totalVal) * 100) : 0;

      setStats([
        { label: "Total Documents", value: totalVal, sub: "All time", accentClass: "border-t-blue-600" },
        { label: "Approved", value: approvedVal, sub: `${successRate}% success rate`, accentClass: "border-t-green-600" },
        { label: "Pending Review", value: reviewed, sub: "Awaiting approval", accentClass: "border-t-amber-500" },
        { label: "Failed", value: rejected, sub: "Needs attention", accentClass: "border-t-red-500" },
      ]);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
  }, []);

  const handleUpload = async (files: File[]) => {
    const newEntries: ExtractedFile[] = files.map((file) => ({
      id: `${Date.now()}-${file.name}`,
      fileName: file.name,
      file: file,
      type: user?.role=="admin" ? "po" :  "invoice",
      extractedData: undefined,
      status: "extracting",
    }));

    setExtractedFiles((prev) => [...prev, ...newEntries]);

    for (const entry of newEntries) {
      const file = files.find((f) => f.name === entry.fileName)!;

      try {
        const data =
          user?.role === "associate" ? await extractInvoice(file) : await extractPurchaseOrder(file);

        const updated: ExtractedFile = {
          ...entry,
          extractedData: data,
          status: "done",
        };

        setExtractedFiles((prev) => prev.map((e) => (e.id === entry.id ? updated : e)));
        setSelectedFile((cur) => cur?.id === entry.id ? updated : cur);

      } catch (error) {
        const errEntry: ExtractedFile = { ...entry, status: "error" };
        setExtractedFiles((prev) => prev.map((e) => (e.id === entry.id ? errEntry : e)));
        setSelectedFile((cur) => cur?.id === entry.id ? errEntry : cur);
        setToast({
          visible: true,
          message: String(error),
          type: "error",
        });
      }
    }
  };

  const handleClose = async () => {
      setExtractedFiles([]);
      setSaveModalOpen(false);
      await fetchStats();
      await fetchRecentActivity();
  }

  const handleSave = async () => {
    const filesToSave = extractedFiles.filter((f) => f.status === "done" && f.extractedData);
    if (filesToSave.length === 0) return;
    setSaveModalOpen(true); 
  };

  if (!user) return <Navigate to="/" />;

  const initials = user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase();

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={{ ...user, initials }} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-gray-900 text-xl transition-colors cursor-pointer">☰</button>
            <h1 className="text-lg font-semibold text-gray-800">Dashboard</h1>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
            {initials}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <p className="text-2xl font-bold text-gray-800">{getGreeting()}, {user.name.split(" ")[0]}</p>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
          </div>

          {/* Upload + Extracted Files */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-4">
              {user.role === "associate" && (
                <UploadBox type="Invoice" accentClass="border-t-blue-600" iconBg="bg-blue-50 text-blue-600" icon="🧾" accept=".pdf,.png,.jpg,.jpeg" onUpload={handleUpload} />
              )}
              {user.role === "admin" && (
                <UploadBox type="Purchase Order" accentClass="border-t-violet-600" iconBg="bg-violet-50 text-violet-600" icon="📋" accept=".pdf,.png,.jpg,.jpeg,.docx" onUpload={handleUpload} />
              )}
            </div>

           {/* Extracted Files List */}
            <div className="bg-white rounded-xl shadow-sm border-t-4 border-t-indigo-500 p-5 flex flex-col h-full">

              {/* Title */}
              <p className="text-sm font-semibold text-gray-700 mb-3 shrink-0">Extracted Files</p>

              {extractedFiles.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-gray-400">No files uploaded yet</div>
              ) : (
                <>
                  {/* Scrollable File List */}
                  <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
                    {extractedFiles.map((ef) => (
                      <div key={ef.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all group
                          ${selectedFile?.id === ef.id ? "border-indigo-400 bg-indigo-50" : "border-gray-100 hover:border-indigo-300 hover:bg-indigo-50/40" }`}>
                        {/* Click Area */}
                        <button onClick={() => setSelectedFile(ef)} className="flex items-center gap-3 flex-1 text-left">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm shrink-0">
                            {ef.fileName.match(/\.(png|jpe?g|webp)$/i) ? "🖼️" : "📄"}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">{ef.fileName}</p>
                            <p className="text-xs text-gray-400">
                              {ef.status === "extracting" && "⏳ Extracting…"}
                              {ef.status === "done" && "✅ Ready to view"}
                              {ef.status === "error" && "❌ Extraction failed"}
                            </p>
                          </div>
                        </button>

                        {/* Remove Button */}
                        <button onClick={() => { setExtractedFiles((prev) => prev.filter((f) => f.id !== ef.id)); if (selectedFile?.id === ef.id) { setSelectedFile(null); } }}
                          className="text-red-400 hover:text-red-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                      </div>
                    ))}
                  </div>

                  {/* Fixed Save Button */}
                  <div className="pt-4 mt-3 border-t border-gray-100 shrink-0">
                    <button onClick={handleSave} disabled={!extractedFiles.some(f => f.status === "done")}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-all">Save All Done Files</button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Recent Activity</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-100">
                    <th className="pb-2 font-medium">File</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.length === 0 && (<tr><td colSpan={5} className="text-center p-4 text-gray-400">No activity found</td></tr> )}
                  {recentActivity.map((row) => (
                    <tr key={row.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-3 font-medium text-gray-700">{row.file}</td>
                      <td className="py-3 text-gray-500">{row.type}</td>
                      <td className="py-3 text-gray-700 font-medium">{row.total_amount}</td>
                      <td className="py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="py-3 text-gray-400">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Preview Modal */}
      {user.role === "associate" &&  selectedFile && <InvoicePreviewModal file={selectedFile} onClose={() => setSelectedFile(null)}
        onUpdate={(updatedFile) => {
          setExtractedFiles((prev) => prev.map((f) => f.id === updatedFile.id ? updatedFile : f));
          setSelectedFile(updatedFile);
        }}
      />}
      {user.role === "admin" && selectedFile && <PurchaseOrderPreviewModal file={selectedFile} onClose={() => setSelectedFile(null)}
        onUpdate={(updatedFile) => {
          setExtractedFiles((prev) => prev.map((f) => f.id === updatedFile.id ? updatedFile : f));
          setSelectedFile(updatedFile);
        }}
      />}
      {saveModalOpen && (<ProgressModal files={extractedFiles.filter(f => f.status === "done" && f.extractedData)} submitFn={user.role==="associate"?submitInvoice:submitPurchaseOrder} onClose={() => handleClose()} />)}
      {toast.visible && (<Toast message={toast.message} type={toast.type} onClose={() => setToast({visible: false, message: "", type:"info"})} />)}
    </div>
  );
}

export default Dashboard;