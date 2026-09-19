import { motion, AnimatePresence } from "motion/react";
import { X, User, Mail, Phone, MapPin, ShieldCheck, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  // Update form data when user context becomes available
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setIsEditing(false);
    // Here we would typically save to the backend
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Content */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="w-full max-w-md pointer-events-auto"
            >
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0f1d]/80 p-6 shadow-2xl backdrop-blur-xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-semibold text-white">My Profile</h2>
                      <p className="text-xs text-slate-400">Manage your account details</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-400">
                      <User className="h-3.5 w-3.5" /> Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-70"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-400">
                      <Mail className="h-3.5 w-3.5" /> Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-70"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-400">
                      <Phone className="h-3.5 w-3.5" /> Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-70"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-400">
                      <MapPin className="h-3.5 w-3.5" /> Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-70"
                    />
                  </div>
                </div>

                {/* Footer / Actions */}
                <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-5">
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <ShieldCheck className="h-4 w-4" />
                    Verified Citizen
                  </div>
                  <div className="flex gap-3">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="rounded-xl px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSave}
                          className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-105"
                        >
                          <Check className="h-4 w-4" /> Save
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="rounded-xl bg-white/10 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
