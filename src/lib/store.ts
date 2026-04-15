'use client';

import { create } from 'zustand';
import type { Event, Market, AnalysisResult } from './types';

interface TerminalState {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  selectedEvent: Event | null;
  setSelectedEvent: (event: Event | null) => void;
  
  selectedMarket: Market | null;
  setSelectedMarket: (market: Market | null) => void;
  
  chartSelection: { start: string; end: string } | null;
  setChartSelection: (selection: { start: string; end: string } | null) => void;
  
  activeAnalysis: AnalysisResult | null;
  setActiveAnalysis: (analysis: AnalysisResult | null) => void;
  
  analysisLoading: boolean;
  setAnalysisLoading: (loading: boolean) => void;
  
  shockPct: number;
  setShockPct: (pct: number) => void;
  
  positionSize: number;
  setPositionSize: (size: number) => void;
  
  activePanel: 'analysis' | 'scenario' | 'montecarlo' | 'hedge';
  setActivePanel: (panel: 'analysis' | 'scenario' | 'montecarlo' | 'hedge') => void;
  
  keyboardShortcutsEnabled: boolean;
  toggleKeyboardShortcuts: () => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  selectedEvent: null,
  setSelectedEvent: (event) => set({ selectedEvent: event }),
  
  selectedMarket: null,
  setSelectedMarket: (market) => set({ selectedMarket: market }),
  
  chartSelection: null,
  setChartSelection: (selection) => set({ chartSelection: selection }),
  
  activeAnalysis: null,
  setActiveAnalysis: (analysis) => set({ activeAnalysis: analysis }),
  
  analysisLoading: false,
  setAnalysisLoading: (loading) => set({ analysisLoading: loading }),
  
  shockPct: 10,
  setShockPct: (pct) => set({ shockPct: pct }),
  
  positionSize: 100,
  setPositionSize: (size) => set({ positionSize: size }),
  
  activePanel: 'analysis',
  setActivePanel: (panel) => set({ activePanel: panel }),
  
  keyboardShortcutsEnabled: true,
  toggleKeyboardShortcuts: () => set((state) => ({ 
    keyboardShortcutsEnabled: !state.keyboardShortcutsEnabled 
  })),
}));
