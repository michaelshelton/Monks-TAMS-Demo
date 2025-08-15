# BBC TAMS Component Library

This document provides comprehensive usage guidelines for the standardized BBC TAMS components that can be used across all pages in the application.

## Overview

The BBC TAMS Component Library provides a set of standardized, reusable components that follow the BBC TAMS v6.0 specification. These components ensure consistency across all pages while maintaining full BBC TAMS compliance.

## Components

### 1. BBCPagination

A standardized pagination component that handles BBC TAMS cursor-based pagination with Link headers.

#### Props

```tsx
interface BBCPaginationProps {
  // BBC TAMS pagination metadata
  paginationMeta: BBCPaginationMeta;
  
  // Callbacks for navigation
  onPageChange: (cursor: string) => void;
  onLimitChange: (limit: number) => void;
  
  // UI options
  showLimitSelector?: boolean;
  showBBCMetadata?: boolean;
  showNavigationButtons?: boolean;
  disabled?: boolean;
  className?: string;
  
  // Custom styling
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'filled' | 'outline' | 'light' | 'white' | 'subtle' | 'gradient';
}
```

#### Usage Example

```tsx
import BBCPagination from '../components/BBCPagination';

<BBCPagination
  paginationMeta={response.pagination}
  onPageChange={(cursor) => fetchData({ page: cursor })}
  onLimitChange={(limit) => fetchData({ limit })}
  showBBCMetadata={true}
  showLimitSelector={true}
  size="md"
  variant="outline"
/>
```

#### Features

- **Cursor-based Navigation**: Automatically handles BBC TAMS cursor pagination
- **Link Header Parsing**: Extracts navigation cursors from Link headers
- **BBC Metadata Display**: Shows pagination metadata (limit, count, timerange)
- **Responsive Design**: Adapts to different screen sizes
- **Customizable Styling**: Supports Mantine UI variants and sizes

### 2. BBCAdvancedFilter

A comprehensive filtering component that supports BBC TAMS filter patterns including tag-based filtering and temporal filtering.

#### Props

```tsx
interface BBCAdvancedFilterProps {
  // Current filter state
  filters: BBCFilterPatterns;
  
  // Callbacks
  onFiltersChange: (filters: BBCFilterPatterns) => void;
  onReset: () => void;
  onApply: () => void;
  
  // Available options
  availableFormats?: string[];
  availableCodecs?: string[];
  availableTags?: string[];
  
  // UI options
  showTimerange?: boolean;
  showFormatSpecific?: boolean;
  showTagFilters?: boolean;
  showPagination?: boolean;
  collapsed?: boolean;
  disabled?: boolean;
  className?: string;
  
  // Custom styling
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'filled' | 'outline' | 'light' | 'white' | 'subtle' | 'gradient';
}
```

#### Usage Example

```tsx
import BBCAdvancedFilter from '../components/BBCAdvancedFilter';

<BBCAdvancedFilter
  filters={currentFilters}
  onFiltersChange={setFilters}
  onReset={resetFilters}
  onApply={applyFilters}
  showTimerange={true}
  showFormatSpecific={true}
  showTagFilters={true}
  showPagination={true}
  size="md"
  variant="outline"
/>
```

#### Features

- **BBC TAMS Filter Patterns**: Supports all BBC TAMS v6.0 filter types
- **Tag-based Filtering**: `tag.{name} = value` and `tag_exists.{name} = true/false`
- **Temporal Filtering**: BBC TAMS timerange format support
- **Format-specific Filters**: Video, audio, and data format filters
- **Collapsible Interface**: Space-efficient design
- **Real-time Validation**: Immediate feedback on filter changes

### 3. TimerangePicker

A specialized component for BBC TAMS temporal filtering with support for the BBC TAMS timerange format.

#### Props

```tsx
interface TimerangePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  showPresets?: boolean;
  allowInfinite?: boolean;
  className?: string;
  
  // Custom styling
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'filled' | 'outline' | 'light' | 'white' | 'subtle' | 'gradient';
}
```

#### Usage Example

```tsx
import TimerangePicker from '../components/TimerangePicker';

<TimerangePicker
  value={timerange}
  onChange={setTimerange}
  label="Time Range"
  placeholder="0:0_1:30"
  showPresets={true}
  allowInfinite={true}
  size="md"
/>
```

#### Features

- **BBC TAMS Format**: Supports `[start]:[start_subsecond]_[end]:[end_subsecond]`
- **Quick Presets**: Common timerange presets (1s, 5s, 10s, 1min, 5min, etc.)
- **Infinite Support**: Option for open-ended timeranges
- **Visual Controls**: Intuitive seconds/subseconds input
- **Format Validation**: Ensures BBC TAMS compliance

### 4. BBCFieldEditor

A field-level editor component that provides GET, PUT, DELETE, and HEAD operations on entity fields.

#### Props

```tsx
interface BBCFieldEditorProps {
  // Entity information
  entityType: 'flows' | 'sources' | 'segments';
  entityId: string;
  initialFields?: Record<string, any>;
  
  // Callbacks
  onFieldUpdate?: (fieldKey: string, value: any) => void;
  onFieldDelete?: (fieldKey: string) => void;
  onFieldsChange?: (fields: Record<string, any>) => void;
  
  // UI options
  showMetadata?: boolean;
  showHistory?: boolean;
  collapsed?: boolean;
  disabled?: boolean;
  className?: string;
  
  // Custom styling
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'filled' | 'outline' | 'light' | 'white' | 'subtle' | 'gradient';
}
```

#### Usage Example

```tsx
import BBCFieldEditor from '../components/BBCFieldEditor';

<BBCFieldEditor
  entityType="flows"
  entityId="flow-123"
  initialFields={{ label: "My Flow", description: "Flow description" }}
  onFieldUpdate={(key, value) => console.log(`${key}: ${value}`)}
  onFieldDelete={(key) => console.log(`Deleted: ${key}`)}
  onFieldsChange={(fields) => setFields(fields)}
  showMetadata={true}
  showHistory={true}
  size="md"
  variant="outline"
/>
```

#### Features

- **BBC TAMS Field Operations**: GET, PUT, DELETE, HEAD on individual fields
- **Operation History**: Tracks all field operations with timestamps
- **Real-time Updates**: Immediate feedback on field changes
- **Metadata Support**: Field metadata retrieval
- **Error Handling**: Comprehensive error display and recovery

## Integration Patterns

### 1. Basic Page Integration

```tsx
import React, { useState, useEffect } from 'react';
import BBCPagination from '../components/BBCPagination';
import BBCAdvancedFilter from '../components/BBCAdvancedFilter';
import { apiClient } from '../services/api';

function MyPage() {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({});
  
  const fetchData = async (options = {}) => {
    const response = await apiClient.bbcTamsGet('/endpoint', options);
    setData(response.data);
    setPagination(response.pagination);
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  return (
    <div>
      <BBCAdvancedFilter
        filters={filters}
        onFiltersChange={setFilters}
        onReset={() => setFilters({})}
        onApply={() => fetchData(filters)}
      />
      
      {/* Your data display */}
      
      <BBCPagination
        paginationMeta={pagination}
        onPageChange={(cursor) => fetchData({ ...filters, page: cursor })}
        onLimitChange={(limit) => fetchData({ ...filters, limit })}
      />
    </div>
  );
}
```

### 2. Advanced Integration with Field Editing

```tsx
import React, { useState } from 'react';
import BBCFieldEditor from '../components/BBCFieldEditor';

function EntityDetails({ entityType, entityId, entity }) {
  const [fields, setFields] = useState(entity.fields || {});
  
  const handleFieldUpdate = (key, value) => {
    // Update local state
    setFields(prev => ({ ...prev, [key]: value }));
    
    // Optionally sync with server
    // apiClient.updateFieldValue(entityType, entityId, key, value);
  };
  
  return (
    <div>
      <h2>{entity.label}</h2>
      
      <BBCFieldEditor
        entityType={entityType}
        entityId={entityId}
        initialFields={fields}
        onFieldUpdate={handleFieldUpdate}
        onFieldsChange={setFields}
        showMetadata={true}
        showHistory={true}
      />
    </div>
  );
}
```

### 3. Timerange Integration

```tsx
import React, { useState } from 'react';
import TimerangePicker from '../components/TimerangePicker';

function TemporalFilter({ onTimerangeChange }) {
  const [timerange, setTimerange] = useState('0:0_1:30');
  
  const handleTimerangeChange = (newTimerange) => {
    setTimerange(newTimerange);
    onTimerangeChange(newTimerange);
  };
  
  return (
    <TimerangePicker
      value={timerange}
      onChange={handleTimerangeChange}
      label="Filter by Time Range"
      showPresets={true}
      allowInfinite={false}
    />
  );
}
```

## Best Practices

### 1. Consistent Styling

- Use consistent `size` and `variant` props across all components
- Maintain consistent spacing and layout patterns
- Follow the established color scheme for success, error, and info states

### 2. Error Handling

- Always provide error boundaries for component failures
- Use the built-in error display capabilities
- Provide fallback states for loading and error conditions

### 3. Performance Optimization

- Use `useCallback` for expensive operations
- Implement proper loading states
- Debounce filter changes when appropriate

### 4. Accessibility

- Ensure proper ARIA labels are provided
- Support keyboard navigation
- Provide meaningful error messages

### 5. BBC TAMS Compliance

- Always use the provided BBC TAMS interfaces
- Follow the established filter patterns
- Use cursor-based pagination consistently
- Maintain proper entity relationships

## Migration Guide

### From Legacy Components

1. **Replace custom pagination** with `BBCPagination`
2. **Replace filter forms** with `BBCAdvancedFilter`
3. **Replace time inputs** with `TimerangePicker`
4. **Replace field editors** with `BBCFieldEditor`

### API Integration

1. **Use unified API client** from `../services/api`
2. **Implement BBC TAMS response handling**
3. **Use cursor-based pagination**
4. **Follow BBC TAMS filter patterns**

## Troubleshooting

### Common Issues

1. **Type Errors**: Ensure proper TypeScript interfaces are imported
2. **API Errors**: Check BBC TAMS API compliance
3. **Styling Issues**: Verify Mantine UI theme consistency
4. **Performance Issues**: Implement proper loading states

### Debug Mode

Enable debug mode by setting environment variable:
```bash
REACT_APP_DEBUG_BBC_COMPONENTS=true
```

## Future Enhancements

- **Real-time Updates**: WebSocket integration for live data
- **Advanced Filtering**: Machine learning-based filter suggestions
- **Performance Monitoring**: Built-in performance metrics
- **Accessibility**: Enhanced screen reader support
- **Internationalization**: Multi-language support

## Support

For component-specific issues, refer to the individual component files. For general BBC TAMS integration questions, consult the API documentation and BBC TAMS specification.
