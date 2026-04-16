import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Search, FileText, Send, Download, Upload, Sparkles } from 'lucide-react';
import { exportData, importData } from '../store/leadStore';
import { useRef } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/generate', icon: Users, label: 'Generate Leads' },
  { to: '/enrich', icon: Search, label: 'Enrich' },
  { to: '/content', icon: FileText, label: 'Content Factory' },
  { to: '/outreach', icon: Send, label: 'Outreach' },
  { to: '/prompts', icon: Sparkles, label: 'Prompts' },
];

export default function Layout({ onDataChange }) {
  const fileRef = useRef(null);

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await importData(file);
      onDataChange?.();
      alert('Data imported successfully!');
    } catch {
      alert('Failed to import data. Check file format.');
    }
    e.target.value = '';
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-[280px] bg-surface border-r border-border flex flex-col shrink-0">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold text-primary tracking-tight">Xtrusio</h1>
          <p className="text-xs text-text-muted mt-0.5 font-medium">Outreach Engine</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-light text-primary'
                    : 'text-text-muted hover:bg-surface-alt hover:text-text'
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border space-y-1">
          <button
            onClick={exportData}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:bg-surface-alt hover:text-text w-full transition-all duration-200"
          >
            <Download size={16} />
            Export Data
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:bg-surface-alt hover:text-text w-full transition-all duration-200"
          >
            <Upload size={16} />
            Import Data
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
