import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface FilterState {
  [key: string]: any;
}

export function useFilterPersistence(prefix: string = 'filter') {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterState>({});

  // Load filters from URL on mount
  useEffect(() => {
    const urlFilters: FilterState = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith(prefix)) {
        const filterKey = key.replace(`${prefix}_`, '');
        try {
          // Try to parse as JSON for complex values
          urlFilters[filterKey] = JSON.parse(value);
        } catch {
          // Fall back to string value
          urlFilters[filterKey] = value;
        }
      }
    });
    setFilters(urlFilters);
  }, [searchParams, prefix]);

  // Update URL when filters change
  const updateFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    
    const newSearchParams = new URLSearchParams(searchParams);
    
    // Remove old filter params
    searchParams.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        newSearchParams.delete(key);
      }
    });
    
    // Add new filter params
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        newSearchParams.set(`${prefix}_${key}`, serializedValue);
      }
    });
    
    setSearchParams(newSearchParams);
  };

  // Clear all filters
  const clearFilters = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    searchParams.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        newSearchParams.delete(key);
      }
    });
    setSearchParams(newSearchParams);
    setFilters({});
  };

  // Get a specific filter value
  const getFilter = (key: string) => filters[key];

  // Set a specific filter value
  const setFilter = (key: string, value: any) => {
    const newFilters = { ...filters };
    if (value === null || value === undefined || value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    updateFilters(newFilters);
  };

  return {
    filters,
    updateFilters,
    clearFilters,
    getFilter,
    setFilter,
    hasActiveFilters: Object.keys(filters).length > 0
  };
} 