import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Layout } from 'react-grid-layout';
import type { DashboardLayout, WidgetInstance } from '../types/widgets';
import {
  getDefaultDashboard,
  updateDashboard,
  migrateDashboard,
} from '../api/endpoints';
import {
  loadDashboardLayout,
  clearDashboardLayout,
  getDefaultLayout,
} from '../utils/dashboardStorage';

/**
 * Hook to manage dashboard layout state and persistence
 * Now uses API instead of localStorage
 */
export function useDashboardLayout() {
  const queryClient = useQueryClient();
  const [localLayout, setLocalLayout] = useState<DashboardLayout>(() => getDefaultLayout());
  const [migrationAttempted, setMigrationAttempted] = useState(false);

  // Fetch default dashboard from API
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'default'],
    queryFn: getDefaultDashboard,
    staleTime: 30000, // Consider data fresh for 30 seconds
    retry: 1,
  });

  // Mutation for updating dashboard
  const updateMutation = useMutation({
    mutationFn: async (layout: DashboardLayout) => {
      if (!dashboardData?.id) {
        throw new Error('No dashboard ID available');
      }
      return updateDashboard(dashboardData.id, {
        timeRange: layout.timeRange,
        autoRefresh: layout.autoRefresh,
        refreshInterval: layout.refreshInterval,
        widgets: layout.widgets,
        layouts: layout.layouts,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  // Convert API dashboard to DashboardLayout format
  useEffect(() => {
    if (dashboardData) {
      setLocalLayout({
        version: dashboardData.version,
        timeRange: dashboardData.timeRange,
        autoRefresh: dashboardData.autoRefresh,
        refreshInterval: dashboardData.refreshInterval,
        widgets: dashboardData.widgets,
        layouts: dashboardData.layouts,
      });
    }
  }, [dashboardData]);

  // One-time migration from localStorage to database
  useEffect(() => {
    const attemptMigration = async () => {
      if (migrationAttempted || isLoading || !dashboardData) {
        return;
      }

      // Check if localStorage has dashboard data
      const localStorageData = loadDashboardLayout();
      if (!localStorageData || localStorageData.widgets.length === 0) {
        setMigrationAttempted(true);
        return;
      }

      // Check if database dashboard is empty
      if (dashboardData.widgets.length === 0) {
        console.log('📦 Migrating dashboard from localStorage to database...');
        try {
          await migrateDashboard({ dashboard: localStorageData });
          console.log('✅ Dashboard migrated successfully');
          // Clear localStorage after successful migration
          clearDashboardLayout();
          // Refetch to get migrated data
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        } catch (error) {
          console.error('❌ Dashboard migration failed:', error);
        }
      }

      setMigrationAttempted(true);
    };

    attemptMigration();
  }, [dashboardData, isLoading, migrationAttempted, queryClient]);

  // Debounced save to API
  const saveToAPI = useCallback(
    (layout: DashboardLayout) => {
      if (!dashboardData?.id) {
        return;
      }
      updateMutation.mutate(layout);
    },
    [dashboardData?.id, updateMutation]
  );

  // Debounce save - only save after user stops making changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveToAPI(localLayout);
    }, 3000); // Save 3 seconds after last change (prevents rate limiting)

    return () => clearTimeout(timeoutId);
  }, [localLayout, saveToAPI]);

  /**
   * Add a new widget to the dashboard
   */
  const addWidget = useCallback((widget: WidgetInstance) => {
    setLocalLayout((prev) => {
      // Calculate position for new widget (simple stacking)
      const existingWidgets = prev.layouts.lg;
      const maxY = existingWidgets.length > 0
        ? Math.max(...existingWidgets.map((w) => w.y + w.h))
        : 0;

      // Default widget size based on type
      const defaultSizeByType: Record<string, { w: number; h: number }> = {
        'current-value': { w: 3, h: 2 },
        'status': { w: 3, h: 2 },
        'gauge': { w: 4, h: 4 },
        'time-series': { w: 6, h: 4 },
      };

      // Determine size: use template default size for composite widgets, or widget type size for legacy widgets
      const size = widget.widgetType
        ? (defaultSizeByType[widget.widgetType] || { w: 4, h: 4 })
        : { w: 8, h: 6 }; // Default size for composite widgets (templates may vary)

      return {
        ...prev,
        widgets: [...prev.widgets, widget],
        layouts: {
          ...prev.layouts,
          lg: [
            ...prev.layouts.lg,
            {
              i: widget.id,
              x: 0,
              y: maxY,
              ...size,
            },
          ],
        },
      };
    });
  }, []);

  /**
   * Update an existing widget
   */
  const updateWidget = useCallback((id: string, updates: Partial<WidgetInstance>) => {
    setLocalLayout((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    }));
  }, []);

  /**
   * Delete a widget
   */
  const deleteWidget = useCallback((id: string) => {
    setLocalLayout((prev) => ({
      ...prev,
      widgets: prev.widgets.filter((w) => w.id !== id),
      layouts: {
        ...prev.layouts,
        lg: prev.layouts.lg.filter((l) => l.i !== id),
      },
    }));
  }, []);

  /**
   * Update grid layout (from react-grid-layout)
   */
  const updateLayout = useCallback((newLayout: Layout[]) => {
    setLocalLayout((prev) => ({
      ...prev,
      layouts: {
        ...prev.layouts,
        lg: newLayout,
      },
    }));
  }, []);

  /**
   * Set global time range
   */
  const setTimeRange = useCallback((timeRange: string) => {
    setLocalLayout((prev) => ({ ...prev, timeRange }));
  }, []);

  /**
   * Set auto-refresh enabled
   */
  const setAutoRefresh = useCallback((autoRefresh: boolean) => {
    setLocalLayout((prev) => ({ ...prev, autoRefresh }));
  }, []);

  /**
   * Set refresh interval (seconds)
   */
  const setRefreshInterval = useCallback((refreshInterval: number) => {
    setLocalLayout((prev) => ({ ...prev, refreshInterval }));
  }, []);

  /**
   * Clear all widgets and reset to default
   */
  const resetDashboard = useCallback(() => {
    const defaultLayout = getDefaultLayout();
    setLocalLayout(defaultLayout);
  }, []);

  /**
   * Load a dashboard layout (for import)
   */
  const loadLayout = useCallback((newLayout: DashboardLayout) => {
    setLocalLayout(newLayout);
  }, []);

  return {
    // State
    widgets: localLayout.widgets,
    layouts: localLayout.layouts,
    timeRange: localLayout.timeRange,
    autoRefresh: localLayout.autoRefresh,
    refreshInterval: localLayout.refreshInterval,
    isLoading,
    error,
    isSaving: updateMutation.isPending,

    // Actions
    addWidget,
    updateWidget,
    deleteWidget,
    updateLayout,
    setTimeRange,
    setAutoRefresh,
    setRefreshInterval,
    resetDashboard,
    loadLayout,

    // Full layout for export
    layout: localLayout,
    dashboardId: dashboardData?.id,
  };
}
