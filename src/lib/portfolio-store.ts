'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Position {
  id: string;
  marketId: string;
  marketQuestion: string;
  side: 'YES' | 'NO';
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  timestamp: number;
}

export interface ExternalHedge {
  id: string;
  asset: 'ETH' | 'BTC' | 'SOL';
  side: 'LONG' | 'SHORT';
  size: number;
  entryPrice: number;
  currentPrice: number;
  leverage: number;
}

interface PortfolioState {
  positions: Position[];
  externalHedges: ExternalHedge[];
  
  addPosition: (position: Omit<Position, 'id' | 'timestamp'>) => void;
  updatePosition: (id: string, updates: Partial<Position>) => void;
  removePosition: (id: string) => void;
  clearPositions: () => void;
  
  addExternalHedge: (hedge: Omit<ExternalHedge, 'id'>) => void;
  updateExternalHedge: (id: string, updates: Partial<ExternalHedge>) => void;
  removeExternalHedge: (id: string) => void;
  
  getPositionPnL: (position: Position) => { pnl: number; pnlPercent: number };
  getTotalPnL: () => { totalPnl: number; totalValue: number; totalCost: number };
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      positions: [],
      externalHedges: [],
      
      addPosition: (position) => set((state) => ({
        positions: [...state.positions, {
          ...position,
          id: `pos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now()
        }]
      })),
      
      updatePosition: (id, updates) => set((state) => ({
        positions: state.positions.map(p => 
          p.id === id ? { ...p, ...updates } : p
        )
      })),
      
      removePosition: (id) => set((state) => ({
        positions: state.positions.filter(p => p.id !== id)
      })),
      
      clearPositions: () => set({ positions: [] }),
      
      addExternalHedge: (hedge) => set((state) => ({
        externalHedges: [...state.externalHedges, {
          ...hedge,
          id: `hedge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }]
      })),
      
      updateExternalHedge: (id, updates) => set((state) => ({
        externalHedges: state.externalHedges.map(h => 
          h.id === id ? { ...h, ...updates } : h
        )
      })),
      
      removeExternalHedge: (id) => set((state) => ({
        externalHedges: state.externalHedges.filter(h => h.id !== id)
      })),
      
      getPositionPnL: (position) => {
        const currentValue = position.quantity * position.currentPrice;
        const cost = position.quantity * position.avgPrice;
        const pnl = position.side === 'YES' 
          ? currentValue - cost 
          : cost - currentValue;
        const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;
        return { pnl, pnlPercent };
      },
      
      getTotalPnL: () => {
        const { positions, getPositionPnL } = get();
        let totalPnl = 0;
        let totalValue = 0;
        let totalCost = 0;
        
        positions.forEach(p => {
          const { pnl } = getPositionPnL(p);
          totalPnl += pnl;
          totalValue += p.quantity * p.currentPrice;
          totalCost += p.quantity * p.avgPrice;
        });
        
        return { totalPnl, totalValue, totalCost };
      }
    }),
    {
      name: 'polymath-portfolio'
    }
  )
);
