# Component Structure

## Overview
This document describes the organized component structure implemented for better maintainability and scalability.

## Component Organization

### Visual Structure
```
src/components/
│
├── 📁 ui/                          # Primitive UI components (shadcn/ui)
│   └── 21 files                    # Base UI components used throughout the app
│
├── 📁 layout/                      # Application layout components
│   ├── app-layout.tsx             # Main application layout wrapper
│   ├── header.tsx                 # Top navigation header
│   ├── sidebar.tsx                # Desktop sidebar navigation  
│   └── mobile-sidebar.tsx         # Mobile responsive sidebar
│
├── 📁 dashboard/                   # Dashboard feature components
│   ├── dashboard-overview.tsx     # Main dashboard view
│   ├── dashboard-charts.tsx       # Chart visualizations
│   ├── dashboard-alerts.tsx       # Alert notifications
│   ├── ad-account-info.tsx        # Account information display
│   ├── ad-account-stats.tsx       # Account statistics
│   ├── ad-account-status.tsx      # Account status indicator
│   ├── top-campaigns.tsx          # Top campaigns widget
│   └── quick-actions.tsx          # Quick action buttons
│
├── 📁 table/                       # Table components and utilities
│   ├── universal-data-table/      # Modular universal table
│   │   ├── index.tsx              # Main table component
│   │   ├── types.ts               # TypeScript definitions
│   │   ├── table-toolbar.tsx      # Search, filters, actions
│   │   ├── table-header.tsx       # Table header with controls
│   │   ├── table-body.tsx         # Table body with rows
│   │   └── table-empty-state.tsx  # Empty/loading/error states
│   ├── columns-selector.tsx       # Column visibility control
│   └── table-pagination.tsx       # Pagination component
│
├── 📁 facebook/                    # Facebook integration
│   ├── facebook-connect-dialog.tsx
│   └── facebook-date-range-picker.tsx
│
├── 📁 common/                      # Shared common components
│   ├── status-badge.tsx
│   ├── format-badge.tsx
│   ├── settings-dialog.tsx
│   ├── smart-navigation.tsx
│   └── theme-provider.tsx
│
└── 📁 ad-manager/                  # Ad manager specific
    └── ad-manager-dashboard.tsx
```

## Import Patterns

### Layout Components
```typescript
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { AppLayout } from '@/components/layout/app-layout';
```

### Dashboard Components
```typescript
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
```

### Table Components
```typescript
import { UniversalDataTable } from '@/components/table/universal-data-table';
import { TablePagination } from '@/components/table/table-pagination';
```

### Facebook Components
```typescript
import { FacebookConnectDialog } from '@/components/facebook/facebook-connect-dialog';
import { FacebookDateRangePicker } from '@/components/facebook/facebook-date-range-picker';
```

### Common Components
```typescript
import { StatusBadge } from '@/components/common/status-badge';
import { ThemeProvider } from '@/components/common/theme-provider';
```

## Component Relationships

```
App Layout (layout/)
    ├── Header
    │   ├── Ad Account Selector
    │   ├── Ad Account Status (dashboard/)
    │   ├── Ad Account Info (dashboard/)
    │   ├── Ad Account Stats (dashboard/)
    │   └── Settings Dialog (common/)
    │
    ├── Sidebar
    │   └── Theme Toggle
    │
    └── Main Content Area
        ├── Dashboard Overview (dashboard/)
        │   ├── Dashboard Charts
        │   └── Dashboard Alerts
        │
        └── Universal Data Table (table/)
            ├── Table Toolbar
            │   ├── Search
            │   ├── Date Range Picker (facebook/)
            │   └── Column Selector
            ├── Table Header
            ├── Table Body
            │   ├── Status Badge (common/)
            │   └── Format Badge (common/)
            ├── Table Empty State
            └── Table Pagination
```

## Design Principles

### 1. Feature-Based Organization
Components are grouped by feature or domain rather than by type:
- ✅ `dashboard/dashboard-overview.tsx`
- ❌ `pages/dashboard-overview.tsx`

### 2. Single Responsibility
Each component has one clear purpose:
- `table-toolbar.tsx` handles only toolbar actions
- `table-body.tsx` handles only row rendering
- `table-empty-state.tsx` handles only empty/error states

### 3. Modular Architecture
Components are self-contained and composable:
```typescript
<UniversalDataTable config={tableConfig} />
// Internally uses: Toolbar + Header + Body + Pagination
```

### 4. Clear Dependencies
Import paths clearly indicate component location and purpose:
```typescript
import { Header } from '@/components/layout/header';
// ↑ Clearly a layout component

import { StatusBadge } from '@/components/common/status-badge';
// ↑ Clearly a shared/common component
```

## Benefits

### Developer Experience
- **Easy Navigation**: Find components quickly by feature
- **Clear Context**: Folder structure provides context
- **Reduced Cognitive Load**: Related components are grouped together

### Maintainability
- **Isolated Changes**: Modify features without affecting others
- **Clear Boundaries**: Each folder has clear responsibilities
- **Easier Refactoring**: Changes are localized to feature folders

### Scalability
- **Easy to Extend**: Add new features in dedicated folders
- **No Naming Conflicts**: Organized structure prevents conflicts
- **Growth-Ready**: Architecture supports team and codebase growth

### Testing
- **Unit Testing**: Test individual components easily
- **Integration Testing**: Test feature folders as units
- **Clear Test Structure**: Mirror component structure in tests

## Migration Examples

### Before Refactoring
```typescript
// All components in flat structure
src/components/
  ├── header.tsx
  ├── sidebar.tsx
  ├── dashboard-overview.tsx
  ├── universal-data-table.tsx (549 lines!)
  ├── facebook-connect-dialog.tsx
  └── status-badge.tsx
```

### After Refactoring
```typescript
// Organized by feature/domain
src/components/
  ├── layout/
  │   ├── header.tsx
  │   └── sidebar.tsx
  ├── dashboard/
  │   └── dashboard-overview.tsx
  ├── table/
  │   └── universal-data-table/
  │       ├── index.tsx (230 lines)
  │       ├── table-toolbar.tsx (139 lines)
  │       ├── table-body.tsx (73 lines)
  │       └── ... (5 more focused files)
  ├── facebook/
  │   └── facebook-connect-dialog.tsx
  └── common/
      └── status-badge.tsx
```

## Future Enhancements

1. **Barrel Exports**: Add `index.ts` files for cleaner imports
   ```typescript
   // Instead of:
   import { Header } from '@/components/layout/header';
   
   // Could be:
   import { Header } from '@/components/layout';
   ```

2. **Component Documentation**: Add JSDoc comments
   ```typescript
   /**
    * Header component with ad account selector and user menu
    * @param onToggleSidebar - Callback to toggle sidebar
    * @param selectedAdAccount - Currently selected ad account ID
    */
   export function Header({ ... }) { ... }
   ```

3. **Storybook Integration**: Create stories for all components

4. **Unit Tests**: Add comprehensive test coverage

5. **Performance Optimization**: Implement React.memo strategically

## Conclusion

This organized structure provides a solid foundation for the application's growth while maintaining code quality and developer productivity.
