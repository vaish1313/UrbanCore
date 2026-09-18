import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, MapPin, Calendar, FileText, CheckCircle2, ShieldAlert } from "lucide-react";

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
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Mock submission process
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 3000);
    }, 1500);
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
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {isSuccess ? (
              <div className="flex h-[400px] flex-col items-center justify-center p-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 15 }}
                >
                  <CheckCircle2 className="mb-4 h-20 w-20 text-emerald-500" />
                </motion.div>
                <h3 className="font-display text-2xl font-bold text-white mb-2">Report Filed Successfully</h3>
                <p className="text-slate-400 max-w-sm">
                  Your evidence package has been securely submitted to the Municipal Authority system. Reference #URB-{Math.floor(Math.random() * 90000) + 10000}.
                </p>
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
                        <span className="text-[10px] text-slate-500 uppercase font-mono">Before (2021)</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="h-20 w-full rounded-lg bg-[url('/src/assets/city-nashik.jpg')] bg-cover bg-center border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]" />
                        <span className="text-[10px] text-red-400 uppercase font-mono">After ({yearAppeared})</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-2">
                      <div className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                        <MapPin className="h-4 w-4 text-cyan-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-white font-medium">{locationName}</div>
                          <div className="text-xs text-slate-400 font-mono mt-1">{coordinates}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                        <Calendar className="h-4 w-4 text-orange-400" />
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
                  <h3 className="font-display text-2xl font-semibold text-white mb-6">File Official Complaint</h3>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-sm text-slate-300 font-medium">Your Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm text-slate-300 font-medium">Complaint Description</label>
                      <textarea
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="E.g., Unauthorized commercial structure built on residential plot."
                        rows={3}
                        className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="mt-4 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-start gap-3">
                      <FileText className="h-5 w-5 text-cyan-400 shrink-0" />
                      <p className="text-xs text-cyan-200/80 leading-relaxed">
                        By submitting, this data package is converted to a sworn digital PDF and securely routed to the Municipal Authority Dashboard.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white text-black font-semibold py-4 hover:bg-slate-200 transition-colors disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                          Processing...
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
