import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { SystemHealth } from '../types/automation.types';

interface SystemHealthIndicatorProps {
  systemHealth: SystemHealth;
}

export const SystemHealthIndicator: React.FC<SystemHealthIndicatorProps> = ({ systemHealth }) => {
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full bg-${systemHealth.color}-400 animate-pulse`} />
          {systemHealth.n8nConnected ? 
            <Wifi className="w-4 h-4 text-green-400" /> : 
            <WifiOff className="w-4 h-4 text-red-400" />
          }
          <span className="text-white font-medium">
            Système: {systemHealth.label}
          </span>
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <span>DB: {systemHealth.databaseConnected ? '✓' : '✗'}</span>
            <span>n8n: {systemHealth.n8nConnected ? '✓' : '✗'}</span>
          </div>
        </div>
        {systemHealth.lastActivity && (
          <span className="text-gray-400 text-sm">
            Dernière activité: {systemHealth.lastActivity.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
};