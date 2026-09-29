/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft,
  Clock,
  CheckCircle2,
  Eye,
  Camera,
  Video,
  Mic,
  Hand,
  Shirt,
  Smartphone,
  Radio,
  Package,
  ArrowRight,
  Sparkles,
  X
} from 'lucide-react';
import { playClick } from '../utils';

export const GeneratingState = ({ index }: { index: number }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#030712]/92 backdrop-blur-2xl z-20 transition-all duration-500">
    <div className="absolute w-72 h-72 bg-gradient-to-tr from-blue-600/20 via-sky-400/15 to-transparent rounded-full blur-3xl animate-pulse pointer-events-none" />
    <div className="relative z-10 flex flex-col items-center gap-5">
      {/* Apple Glass concentric spinner */}
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-sky-400 animate-[spin_1.2s_cubic-bezier(0.4,0,0.2,1)_infinite] shadow-[0_0_20px_rgba(56,189,248,0.5)]" />
        <div className="absolute inset-2 rounded-full border-b-2 border-blue-600 animate-[spin_2s_linear_infinite]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-sky-300 rounded-full shadow-[0_0_10px_#38bdf8] animate-ping" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          <p className="text-[11px] font-bold tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-300 to-sky-400 uppercase animate-pulse">
            MOTION AI RENDER
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <div className="w-4 h-px bg-gradient-to-r from-transparent to-sky-400/40" />
          <p className="text-[10px] font-semibold tracking-wider text-slate-400 font-mono">
            Scene {String(index + 1).padStart(2, '0')}
          </p>
          <div className="w-4 h-px bg-gradient-to-l from-transparent to-sky-400/40" />
        </div>
      </div>
    </div>
  </div>
);

const GridBackground = React.memo(() => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Deep Obsidian Canvas */}
      <div className="absolute inset-0 bg-[#030712]" />

      {/* Atmospheric Apple Ambient Blue Radiance */}
      <div className="absolute top-[-15%] left-[20%] w-[650px] h-[650px] bg-gradient-to-br from-blue-600/18 via-sky-500/10 to-transparent blur-[140px] rounded-full" />
      <div className="absolute top-[40%] right-[-10%] w-[550px] h-[550px] bg-gradient-to-bl from-indigo-700/15 via-blue-500/10 to-transparent blur-[150px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-gradient-to-tr from-sky-600/12 via-blue-800/10 to-transparent blur-[160px] rounded-full" />

      {/* Refined Micro Dots Grid */}
      <div 
        className="absolute inset-0 opacity-[0.18]" 
        style={{ 
          backgroundImage: `radial-gradient(rgba(148, 163, 184, 0.4) 1px, transparent 1px)`,
          backgroundSize: '32px 32px' 
        }} 
      />

      {/* Ambient Gloss Horizon Sheen */}
      <div 
        className="absolute inset-0 opacity-[0.06]" 
        style={{ 
          backgroundImage: `linear-gradient(to right, rgba(56, 189, 248, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.3) 1px, transparent 1px)`,
          backgroundSize: '160px 160px' 
        }} 
      />

      {/* Vignette mask for depth */}
      <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_0%,rgba(3,7,18,0.7)_100%]" />
    </div>
  );
});

export const LayoutWrapper = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-blue-600/30 selection:text-sky-300 overflow-x-hidden ${className}`}>
    <GridBackground />
    <div className="relative z-10 w-full h-full flex flex-col min-h-screen">
      {children}
    </div>
  </div>
);

export const CooldownBadge = ({ cooldown }: { cooldown: number }) => (
  <div className="backdrop-blur-xl bg-slate-900/70 border border-sky-400/20 px-3.5 md:px-4 py-1.5 md:py-2 rounded-full flex items-center gap-2 text-[10px] md:text-xs font-semibold text-sky-300 tracking-wider shadow-[0_4px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] animate-pulse">
    <Clock className="w-3.5 h-3.5 text-sky-400" />
    <span>Cooldown {cooldown}s</span>
  </div>
);

export const Navbar = ({ 
  onBack, 
  onViewResult, 
  cooldown = 0 
}: { 
  onBack?: () => void, 
  onViewResult?: (() => void) | null, 
  onReset?: () => void, 
  cooldown?: number 
}) => (
  <div className="relative z-50 px-4 md:px-12 py-5 flex items-center justify-between pointer-events-auto">
    <div className="flex items-center gap-3">
      {onBack && (
        <button 
          onClick={() => { playClick(); onBack(); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all group backdrop-blur-md"
        >
          <ChevronLeft className="w-4 h-4 text-sky-400 group-hover:-translate-x-0.5 transition-transform" /> 
          <span>Kembali</span>
        </button>
      )}
      
      {/* Brand Wordmark Tag */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-md">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
        <span className="text-[10px] font-bold tracking-widest text-sky-300 uppercase">MOTION AI</span>
      </div>
    </div>

    <div className="flex items-center gap-3">
      {cooldown > 0 && <CooldownBadge cooldown={cooldown} />}
      {onViewResult && (
        <button 
          type="button"
          onClick={() => { playClick(); onViewResult(); }} 
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600/30 to-sky-600/30 border border-sky-400/40 text-sky-300 hover:text-white text-xs font-semibold backdrop-blur-xl transition-all hover:border-sky-300 hover:shadow-[0_0_25px_rgba(56,189,248,0.35)] active:scale-95"
          title="Lihat Hasil Render"
        >
          <Eye className="w-4 h-4 text-sky-400" />
          <span className="hidden sm:inline">Lihat Hasil</span>
        </button>
      )}
    </div>
  </div>
);

export const SectionTitle = ({ title, subtitle }: { title: string, subtitle?: string }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
    <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4 leading-[1.15]">
      {title}
    </h2>
    {subtitle && (
      <p className="text-slate-400 text-sm md:text-lg font-normal leading-relaxed max-w-2xl">
        {subtitle}
      </p>
    )}
  </div>
);

export const UploadZone = ({ 
  image, 
  onClick, 
  onClear, 
  label, 
  icon: Icon 
}: { 
  image: string | null, 
  onClick: () => void, 
  onClear?: () => void, 
  label: string, 
  icon: any 
}) => (
  <div className="space-y-3 group">
    <div className="flex justify-between items-center px-1">
      <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{label}</span>
      <div className="flex items-center gap-2">
        {image && (
          <span className="text-[10px] text-sky-400 font-semibold uppercase tracking-wider flex items-center gap-1 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-400/20">
            <CheckCircle2 className="w-3 h-3 text-sky-400"/> Siap
          </span>
        )}
        {image && onClear && (
          <button 
            onClick={(e) => { e.stopPropagation(); playClick(); onClear(); }}
            className="w-5 h-5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-90"
            title="Hapus gambar"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
    <div 
      onClick={() => { playClick(); onClick(); }} 
      className={`relative w-full aspect-square rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-500 border backdrop-blur-2xl ${
        image 
          ? 'border-white/15 bg-slate-900/60 shadow-[0_15px_40px_rgba(0,5,20,0.5),inset_0_1px_0_rgba(255,255,255,0.2)] hover:border-sky-400/40' 
          : 'border-white/10 bg-slate-900/40 hover:border-sky-400/40 hover:bg-slate-900/60 shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_40px_rgba(14,165,233,0.15)]'
      } flex flex-col items-center justify-center group/card`}
    >
      {/* Apple specular top highlight */}
      <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

      {image ? (
        <>
          <img 
            src={image} 
            alt={label}
            className="w-full h-full object-cover opacity-95 group-hover/card:opacity-100 transition-all duration-700 scale-100 group-hover/card:scale-105" 
            referrerPolicy="no-referrer" 
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 bg-slate-950/60 backdrop-blur-sm">
            <span className="px-4 py-2 rounded-full border border-white/20 bg-white/10 text-xs font-semibold text-white backdrop-blur-md tracking-wider shadow-lg">
              Ganti Foto
            </span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 group-hover/card:scale-105 transition-transform duration-500 p-6 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border border-white/10 flex items-center justify-center bg-gradient-to-b from-white/[0.08] to-white/[0.02] text-slate-400 transition-all duration-500 group-hover/card:text-sky-400 group-hover/card:border-sky-400/30 group-hover/card:shadow-[0_0_30px_rgba(56,189,248,0.25)]">
            <Icon className="w-8 h-8 md:w-9 md:h-9" />
          </div>
          <div className="space-y-1">
            <p className="text-xs md:text-sm font-semibold text-slate-200 tracking-wide transition-colors group-hover/card:text-white">
              Pilih Gambar
            </p>
            <p className="text-[10px] text-slate-500 tracking-wider">
              Format JPG / PNG
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
);

export const ButtonCTA = ({ onClick, children, disabled }: { onClick: () => void, children: React.ReactNode, disabled?: boolean }) => (
  <motion.button 
    whileHover={!disabled ? { scale: 1.01, y: -2 } : {}}
    whileTap={!disabled ? { scale: 0.98, y: 0 } : {}}
    onClick={() => { playClick(); onClick(); }} 
    disabled={disabled} 
    className={`w-full py-4 md:py-5 rounded-2xl font-bold text-xs md:text-sm tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden ${
      disabled 
        ? 'bg-slate-800/60 text-slate-500 border border-white/5 cursor-not-allowed opacity-50' 
        : 'bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white border-t border-white/35 shadow-[0_12px_32px_-4px_rgba(37,99,235,0.6),inset_0_1px_1px_rgba(255,255,255,0.45)] hover:from-blue-400 hover:to-blue-600 hover:shadow-[0_16px_40px_-4px_rgba(37,99,235,0.75)]'
    }`}
  >
    {/* Inner specular reflection shine */}
    {!disabled && (
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
    )}
    <span>{children}</span> 
    <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
  </motion.button>
);

export const DraggableBackButton = ({ onClick }: { onClick: () => void }) => (
  <motion.button
    drag
    dragMomentum={false}
    whileDrag={{ scale: 1.08, cursor: 'grabbing' }}
    whileHover={{ scale: 1.05 }}
    onClick={() => { playClick(); onClick(); }}
    className="fixed bottom-8 right-8 z-[100] w-13 h-13 md:w-14 md:h-14 rounded-full bg-gradient-to-b from-blue-500 to-blue-700 text-white flex items-center justify-center shadow-[0_12px_30px_rgba(37,99,235,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)] cursor-grab active:cursor-grabbing border border-white/20 group transition-all"
    title="Kembali"
  >
    <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
  </motion.button>
);
