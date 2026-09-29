import { Mail, MapPin, Headphones, MessageSquare } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-xl mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1 flex flex-col gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Urban<span className="text-blue-500">Core</span>
              </h2>
              <p className="text-sm font-medium text-slate-400 mt-1">
                Smarter Cities. Better Planning.
              </p>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mt-2 max-w-xs">
              Empowering citizens, builders, and municipal authorities with intelligent
              satellite-based land monitoring and urban insights.
            </p>
          </div>

          {/* Platform Links */}
          <div className="col-span-1 flex flex-col gap-4">
            <h3 className="text-white font-semibold mb-2 relative inline-block">
              Platform
              <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-blue-500 rounded-full"></span>
            </h3>
            <ul className="flex flex-col gap-3 text-sm text-slate-300">
              <li>
                <a href="#" className="hover:text-cyan-400 transition-colors">
                  Citizen Dashboard
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-cyan-400 transition-colors">
                  Builder Dashboard
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-cyan-400 transition-colors">
                  Municipal Dashboard
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-cyan-400 transition-colors">
                  Land Monitoring
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-cyan-400 transition-colors">
                  Urban Insights
                </a>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="col-span-1 flex flex-col gap-4">
            <h3 className="text-white font-semibold mb-2 relative inline-block">
              Company
              <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-blue-500 rounded-full"></span>
            </h3>
            <ul className="flex flex-col gap-3 text-sm text-slate-300">
              <li>
                <a href="#" className="hover:text-cyan-400 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-cyan-400 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-cyan-400 transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-cyan-400 transition-colors">
                  Our Mission
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-cyan-400 transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-span-1 flex flex-col gap-4">
            <h3 className="text-white font-semibold mb-2 relative inline-block">
              Get in Touch
              <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-blue-500 rounded-full"></span>
            </h3>
            <ul className="flex flex-col gap-4 text-sm text-slate-300 mt-2">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <a
                  href="mailto:support@urbancore.in"
                  className="hover:text-cyan-400 transition-colors"
                >
                  support@urbancore.in
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <span>Nashik, Maharashtra, India</span>
              </li>
              <li className="flex items-start gap-3">
                <Headphones className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <a href="#" className="hover:text-cyan-400 transition-colors">
                  Help & Support
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <a href="#" className="hover:text-cyan-400 transition-colors">
                  Report an Issue
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5 bg-black/40 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <p>© 2026 UrbanCore. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-cyan-400 transition-colors">
              Privacy Policy
            </a>
            <span className="w-px h-3 bg-slate-600"></span>
            <a href="#" className="hover:text-cyan-400 transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
