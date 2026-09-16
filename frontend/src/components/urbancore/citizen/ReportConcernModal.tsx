import { useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, CheckCircle, X, Send } from "lucide-react";
import type { CitizenReport } from "@/types/urbancore";

export function ReportConcernModal({
  isOpen,
  onClose,
  onSubmitReport,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport: (report: CitizenReport) => void;
}) {
  const [location, setLocation] = useState("");
  const [concernType, setConcernType] = useState<CitizenReport["concernType"]>("Possible illegal construction");
  const [description, setDescription] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const refNum = `UC-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const newReport: CitizenReport = {
      id: `rep-${Date.now()}`,
      referenceNumber: refNum,
      location: location || "Gangapur Road near Riverbank",
      concernType,
      description: description || "Unsanctioned construction activity reported near protected buffer.",
      submittedAt: new Date().toISOString().split("T")[0]!,
      status: "Pending Review",
      contactName,
      contactEmail,
    };

    onSubmitReport(newReport);
    setSubmittedRef(refNum);
  };

  const handleDone = () => {
    setSubmittedRef(null);
    setLocation("");
    setDescription("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <motion.div
        className="glass-panel relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-foreground/5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        {submittedRef ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 text-accent">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h3 className="mt-4 font-display text-2xl font-semibold text-foreground">
              Concern Registered
            </h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Your civic report has been submitted to the UrbanCore Municipal Audit queue.
            </p>
            <div className="mt-4 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 font-mono text-sm font-bold text-primary">
              Reference #: {submittedRef}
            </div>
            <button
              type="button"
              onClick={handleDone}
              className="mt-6 rounded-xl bg-primary px-6 py-2.5 font-mono text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
                CITIZEN REPORT FORM
              </span>
              <h2 className="font-display text-xl font-semibold text-foreground mt-1">
                Report an Urban Concern
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Help monitor Nashik's development and protect natural water & green belts.
              </p>
            </div>

            {/* Location */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Location / Landmark *</label>
              <input
                required
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Panchavati near Ramkund riverbank..."
                className="rounded-xl border border-border/60 bg-background/80 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>

            {/* Concern Type */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Category *</label>
              <select
                value={concernType}
                onChange={(e) => setConcernType(e.target.value as any)}
                className="rounded-xl border border-border/60 bg-background/80 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary"
              >
                <option value="Possible illegal construction">Possible illegal construction</option>
                <option value="River / waterbody concern">River / waterbody concern</option>
                <option value="Green area concern">Green area concern</option>
                <option value="Environmental concern">Environmental concern</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Description *</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you observed (e.g. structural erection in flood buffer)..."
                className="rounded-xl border border-border/60 bg-background/80 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>

            {/* Contact details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Your Name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Optional"
                  className="rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Optional"
                  className="rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-mono text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Send className="h-3.5 w-3.5" /> Submit Concern
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
