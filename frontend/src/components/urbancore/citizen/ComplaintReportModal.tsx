import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, MapPin, Calendar, FileText, CheckCircle2, ShieldAlert, AlertCircle, Download } from "lucide-react";
import { useSubmitComplaint } from "@/hooks/use-municipal";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export function ComplaintReportModal({
  isOpen,
  onClose,
  locationName = "Panchavati Sector",
  coordinates = "Lat: 20.0123, Lng: 73.7891",
  yearAppeared = "2023",
}: {
  isOpen: boolean;
  onClose: () => void;
  locationName?: string;
  coordinates?: string;
  yearAppeared?: string;
}) {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("Illegal Construction");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<{
    referenceNumber: string;
    id: string;
  } | null>(null);

  const submitComplaintMutation = useSubmitComplaint();

  // Helper to parse lat/lng from coordinates prop string
  const parseCoordinates = (): { lat: number; lng: number } => {
    try {
      const match = coordinates.match(/Lat:\s*([0-9.-]+)[,\s]+Lng:\s*([0-9.-]+)/i);
      if (match && match[1] && match[2]) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      }
    } catch {
      // fallback
    }
    return { lat: 20.0059, lng: 73.7912 };
  };

  const handleClose = () => {
    if (submitComplaintMutation.isPending) return;
    setErrorMessage(null);
    setSubmissionResult(null);
    setName("");
    setDescription("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedDesc = description.trim();

    if (!trimmedName) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!trimmedDesc || trimmedDesc.length < 10) {
      setErrorMessage("Please provide a meaningful complaint description (at least 10 characters).");
      return;
    }

    const { lat, lng } = parseCoordinates();

    try {
      const res = await submitComplaintMutation.mutateAsync({
        citizen_name: trimmedName,
        title: title || "Citizen Report",
        description: trimmedDesc,
        location_name: locationName,
        latitude: lat,
        longitude: lng,
        evidence_reference: `SatAnalysis-${yearAppeared}`,
      });

      if (res && res.reference_number) {
        setSubmissionResult({
          referenceNumber: res.reference_number,
          id: res.id,
        });
        setName("");
        setDescription("");
      } else {
        throw new Error("Server did not return a valid reference number.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit complaint. Please try again.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0a0f1d] shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500" />

            <button
              onClick={handleClose}
              disabled={submitComplaintMutation.isPending}
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

            {submissionResult ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center p-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 15 }}
                >
                  <CheckCircle2 className="mb-4 h-20 w-20 text-emerald-500" />
                </motion.div>
                <h3 className="font-display text-2xl font-bold text-white mb-2">
                  Report Filed Successfully
                </h3>
                <p className="text-slate-400 max-w-md text-sm mb-4 leading-relaxed">
                  Your evidence package has been securely submitted and stored in the Municipal Authority system.
                </p>
                <div className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-2.5 font-mono text-sm font-bold text-cyan-300 mb-6">
                  Reference: {submissionResult.referenceNumber}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <a
                    href={`${API_BASE_URL}/complaints/${submissionResult.referenceNumber}/receipt`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 px-5 py-2.5 text-xs font-semibold text-cyan-200 transition-colors"
                  >
                    <Download className="h-4 w-4" /> Download Official Receipt (PDF)
                  </a>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 px-5 py-2.5 text-xs font-semibold text-white transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row h-full">
                {/* Evidence Panel (Left) */}
                <div className="w-full md:w-5/12 bg-black/30 p-6 sm:p-8 border-r border-white/5 flex flex-col gap-6">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-white flex items-center gap-2 mb-1">
                      <ShieldAlert className="h-5 w-5 text-orange-400" /> Evidence File
                    </h3>
                    <p className="text-xs text-slate-400">Pre-compiled by UrbanCore</p>
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* Thumbnails */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <div className="h-20 w-full rounded-lg bg-[url('/src/assets/region-maharashtra.jpg')] bg-cover bg-center border border-white/10" />
                        <span className="text-[10px] text-slate-500 uppercase font-mono">
                          Before (2021)
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="h-20 w-full rounded-lg bg-[url('/src/assets/city-nashik.jpg')] bg-cover bg-center border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]" />
                        <span className="text-[10px] text-red-400 uppercase font-mono">
                          After ({yearAppeared})
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-2">
                      <div className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                        <MapPin className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm text-white font-medium truncate">{locationName}</div>
                          <div className="text-xs text-slate-400 font-mono mt-1">{coordinates}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                        <Calendar className="h-4 w-4 text-orange-400 shrink-0" />
                        <div>
                          <div className="text-xs text-slate-400">Construction Appeared</div>
                          <div className="text-sm text-white font-medium">~{yearAppeared}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Panel (Right) */}
                <div className="w-full md:w-7/12 p-6 sm:p-8">
                  <h3 className="font-display text-2xl font-semibold text-white mb-6">
                    File Official Complaint
                  </h3>

                  {errorMessage && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm text-slate-300 font-medium">Your Full Name</label>
                      <input
                        type="text"
                        required
                        disabled={submitComplaintMutation.isPending}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Purva Mankar"
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none transition-colors disabled:opacity-50"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm text-slate-300 font-medium">Concern Category</label>
                      <select
                        value={title}
                        disabled={submitComplaintMutation.isPending}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors disabled:opacity-50"
                      >
                        <option value="Illegal Construction" className="bg-[#0a0f1d] text-white">Illegal Construction</option>
                        <option value="Encroachment" className="bg-[#0a0f1d] text-white">Encroachment</option>
                        <option value="Building Safety" className="bg-[#0a0f1d] text-white">Building Safety</option>
                        <option value="Zoning Violation" className="bg-[#0a0f1d] text-white">Zoning Violation</option>
                        <option value="Road Obstruction" className="bg-[#0a0f1d] text-white">Road Obstruction</option>
                        <option value="Demolition Request" className="bg-[#0a0f1d] text-white">Demolition Request</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm text-slate-300 font-medium">
                        Complaint Description
                      </label>
                      <textarea
                        required
                        disabled={submitComplaintMutation.isPending}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the unauthorized construction, location specifics, or encroachment details..."
                        rows={3}
                        className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none transition-colors disabled:opacity-50"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-start gap-2.5">
                      <FileText className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-cyan-200/80 leading-relaxed">
                        By submitting, this evidence record is assigned a unique reference ID and securely dispatched to the Municipal Authority complaint review queue.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={submitComplaintMutation.isPending}
                      className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-white text-black font-semibold py-3 hover:bg-slate-200 transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed text-sm"
                    >
                      {submitComplaintMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                          Submitting complaint...
                        </div>
                      ) : (
                        <>
                          Submit to Authorities <Send className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

