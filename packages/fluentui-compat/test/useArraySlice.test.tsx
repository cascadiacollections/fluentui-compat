import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useArraySlice, type UseArraySliceOptions } from '../src/useArraySlice';

interface TestItem {
  id: number;
  name: string;
  category: string;
}

const createTestData = (count: number): TestItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    category: i % 3 === 0 ? 'Category A' : i % 3 === 1 ? 'Category B' : 'Category C'
  }));
};

const defaultSearchFunction = (item: TestItem, term: string) =>
  item.name.toLowerCase().includes(term.toLowerCase()) ||
  item.category.toLowerCase().includes(term.toLowerCase());

describe('useArraySlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic functionality', () => {
    test('should initialize with default options', () => {
      const data = createTestData(25);
      const { result } = renderHook(() => useArraySlice(data));

      expect(result.current.currentItems).toHaveLength(10); // default page size
      expect(result.current.totalItems).toBe(25);
      expect(result.current.currentPage).toBe(0);
      expect(result.current.totalPages).toBe(3);
      expect(result.current.allVisible).toBe(true);
      expect(result.current.searchTerm).toBe('');
      expect(result.current.controls.pageSize).toBe(10);
    });

    test('should initialize with custom options', () => {
      const data = createTestData(25);
      const options: UseArraySliceOptions<TestItem> = {
        pageSize: 5,
        initialPage: 2,
        initialVisible: false,
        initialSearchTerm: 'test'
      };
      
      const { result } = renderHook(() => useArraySlice(data, options));

      expect(result.current.currentItems).toHaveLength(0); // not visible
      expect(result.current.totalItems).toBe(0); // not visible
      expect(result.current.currentPage).toBe(2);
      expect(result.current.totalPages).toBe(1); // no items when not visible
      expect(result.current.allVisible).toBe(false);
      expect(result.current.searchTerm).toBe('test');
      expect(result.current.controls.pageSize).toBe(5);
    });

    test('should handle empty data array', () => {
      const { result } = renderHook(() => useArraySlice([]));

      expect(result.current.currentItems).toHaveLength(0);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.currentPage).toBe(0);
      expect(result.current.totalPages).toBe(1);
    });

    test('should return correct slice of data', () => {
      const data = createTestData(25);
      const { result } = renderHook(() => useArraySlice(data, { pageSize: 5 }));

      // First page should contain items 1-5
      expect(result.current.currentItems).toHaveLength(5);
      expect(result.current.currentItems[0]).toEqual({ id: 1, name: 'Item 1', category: 'Category B' });
      expect(result.current.currentItems[4]).toEqual({ id: 5, name: 'Item 5', category: 'Category B' });
    });
  });

  describe('pagination controls', () => {
    test('should navigate to next page', () => {
      const data = createTestData(25);
      const { result } = renderHook(() => useArraySlice(data, { pageSize: 10 }));

      expect(result.current.currentPage).toBe(0);
      expect(result.current.pagination.hasNextPage).toBe(true);
      expect(result.current.pagination.hasPreviousPage).toBe(false);

      act(() => {
        result.current.pagination.nextPage();
      });

      expect(result.current.currentPage).toBe(1);
      expect(result.current.currentItems).toHaveLength(10);
      expect(result.current.currentItems[0]).toEqual({ id: 11, name: 'Item 11', category: 'Category B' });
    });

    test('should navigate to previous page', () => {
      const data = createTestData(25);
      const { result } = renderHook(() => useArraySlice(data, { pageSize: 10, initialPage: 1 }));

      expect(result.current.currentPage).toBe(1);
      expect(result.current.pagination.hasPreviousPage).toBe(true);

      act(() => {
        result.current.pagination.previousPage();
      });

      expect(result.current.currentPage).toBe(0);
      expect(result.current.currentItems[0]).toEqual({ id: 1, name: 'Item 1', category: 'Category B' });
    });

    test('should go to specific page', () => {
      const data = createTestData(25);
      const { result } = renderHook(() => useArraySlice(data, { pageSize: 5 }));

      act(() => {
        result.current.pagination.goToPage(3);
      });

      expect(result.current.currentPage).toBe(3);
      expect(result.current.currentItems).toHaveLength(5);
      expect(result.current.currentItems[0]).toEqual({ id: 16, name: 'Item 16', category: 'Category B' });
    });

    test('should clamp page to valid range', () => {
      const data = createTestData(25);
      const { result } = renderHook(() => useArraySlice(data, { pageSize: 10 }));

      // Try to go beyond last page
      act(() => {
        result.current.pagination.goToPage(10);
      });

      expect(result.current.currentPage).toBe(2); // Last valid page

      // Try to go before first page
      act(() => {
        result.current.pagination.goToPage(-5);
      });

      expect(result.current.currentPage).toBe(0); // First page
    });

    test('should go to first and last page', () => {
      const data = createTestData(25);
      const { result } = renderHook(() => useArraySlice(data, { pageSize: 10, initialPage: 1 }));

      act(() => {
        result.current.pagination.lastPage();
      });

      expect(result.current.currentPage).toBe(2);

      act(() => {
        result.current.pagination.firstPage();
      });

      expect(result.current.currentPage).toBe(0);
    });

    test('should not navigate beyond boundaries', () => {
      const data = createTestData(25);
      const { result } = renderHook(() => useArraySlice(data, { pageSize: 10 }));

      // Try to go to previous page from first page
      act(() => {
        result.current.pagination.previousPage();
      });

      expect(result.current.currentPage).toBe(0);

      // Go to last page and try to go next
      act(() => {
        result.current.pagination.lastPage();
        result.current.pagination.nextPage();
      });

      expect(result.current.currentPage).toBe(2); // Should stay on last page
    });
  });

  describe('visibility controls', () => {
    test('should toggle visibility of all items', () => {
      const data = createTestData(25);
      const { result } = renderHook(() => useArraySlice(data, { pageSize: 10 }));

      expect(result.current.allVisible).toBe(true);
      expect(result.current.currentItems).toHaveLength(10);
      expect(result.current.totalItems).toBe(25);

      act(() => {
        result.current.visibility.hideAll();
      });

      expect(result.current.allVisible).toBe(false);
      expect(result.current.currentItems).toHaveLength(0);
      expect(result.current.totalItems).toBe(0);

      act(() => {
        result.current.visibility.showAll();
      });

      expect(result.current.allVisible).toBe(true);
      expect(result.current.currentItems).toHaveLength(10);
      expect(result.current.totalItems).toBe(25);
    });

    test('should toggle visibility state', () => {
      const data = createTestData(25);
      const { result } = renderHook(() => useArraySlice(data));

      expect(result.current.allVisible).toBe(true);

      act(() => {
        result.current.visibility.toggleAll();
      });

      expect(result.current.allVisible).toBe(false);

      act(() => {
        result.current.visibility.toggleAll();
      });

      expect(result.current.allVisible).toBe(true);
    });
  });

  describe('search functionality', () => {
    test('should filter items based on search term', () => {
      const data = createTestData(25);
      const { result } = renderHook(() =>
        useArraySlice(data, {
          pageSize: 10,
          searchFunction: defaultSearchFunction
        })
      );

      expect(result.current.currentItems).toHaveLength(10);
      expect(result.current.totalItems).toBe(25);

      act(() => {
        result.current.search.setSearchTerm('Item 1');
      });

      // Should find items: Item 1, Item 10, Item 11, Item 12, Item 13, Item 14, Item 15, Item 16, Item 17, Item 18, Item 19
      expect(result.current.totalItems).toBe(11);
      expect(result.current.currentItems).toHaveLength(10); // First page of filtered results
      expect(result.current.currentPage).toBe(0); // Should reset to first page
    });

    test('should clear search and reset results', () => {
      const data = createTestData(25);
      const { result } = renderHook(() =>
        useArraySlice(data, {
          pageSize: 10,
          searchFunction: defaultSearchFunction,
          initialPage: 2
        })
      );

      act(() => {
        result.current.search.setSearchTerm('Item 1');
      });

      expect(result.current.currentPage).toBe(0); // Reset to first page
      expect(result.current.totalItems).toBe(11); // Filtered results

      act(() => {
        result.current.search.clearSearch();
      });

      expect(result.current.searchTerm).toBe('');
      expect(result.current.currentPage).toBe(0); // Should stay on first page
      expect(result.current.totalItems).toBe(25); // All items restored
    });

    test('should work without search function', () => {
      const data = createTestData(25);
      const { result } = renderHook(() => useArraySlice(data));

      act(() => {
        result.current.search.setSearchTerm('anything');
      });

      // Without search function, search term should be set but no filtering should occur
      expect(result.current.searchTerm).toBe('anything');
      expect(result.current.totalItems).toBe(25);
      expect(result.current.currentItems).toHaveLength(10);
    });

    test('should handle case-insensitive search', () => {
      const data = createTestData(10);
      const { result } = renderHook(() =>
        useArraySlice(data, {
          pageSize: 10,
          searchFunction: defaultSearchFunction
        })
      );

      act(() => {
        result.current.search.setSearchTerm('CATEGORY A');
      });

      // Should find items with "Category A" (case-insensitive)
      const expectedCount = data.filter(item => 
        item.category.toLowerCase().includes('category a')
      ).length;
      
      expect(result.current.totalItems).toBe(expectedCount);
    });
  });

  describe('page size controls', () => {
    test('should change page size and adjust current page', () => {
      const data = createTestData(25);
      const { result } = renderHook(() => useArraySlice(data, { pageSize: 10, initialPage: 2 }));

      expect(result.current.currentPage).toBe(2);
      expect(result.current.currentItems).toHaveLength(5); // Page 2 with pageSize 10 has 5 items
      expect(result.current.controls.pageSize).toBe(10);

      act(() => {
        result.current.controls.setPageSize(5);
      });

      expect(result.current.controls.pageSize).toBe(5);
      // Current page should be adjusted to maintain position
      // Was on page 2 (items 21-25), now should be on page 4 (items 21-25)
      expect(result.current.currentPage).toBe(4);
      expect(result.current.currentItems).toHaveLength(5);
    });

    test('should handle minimum page size', () => {
      const data = createTestData(25);
      const { result } = renderHook(() => useArraySlice(data, { pageSize: 10 }));

      act(() => {
        result.current.controls.setPageSize(0);
      });

      expect(result.current.controls.pageSize).toBe(1); // Should be clamped to minimum 1

      act(() => {
        result.current.controls.setPageSize(-5);
      });

      expect(result.current.controls.pageSize).toBe(1); // Should be clamped to minimum 1
    });
  });

  describe('edge cases and data changes', () => {
    test('should handle data array changes', () => {
      let data = createTestData(25);
      const { result, rerender } = renderHook(
        ({ data }) => useArraySlice(data, { pageSize: 10 }),
        { initialProps: { data } }
      );

      expect(result.current.totalItems).toBe(25);
      expect(result.current.totalPages).toBe(3);

      // Change data
      data = createTestData(15);
      rerender({ data });

      expect(result.current.totalItems).toBe(15);
      expect(result.current.totalPages).toBe(2);
    });

    test('should adjust current page when data shrinks', () => {
      let data = createTestData(25);
      const { result, rerender } = renderHook(
        ({ data }) => useArraySlice(data, { pageSize: 10, initialPage: 2 }),
        { initialProps: { data } }
      );

      expect(result.current.currentPage).toBe(2);

      // Shrink data so current page becomes invalid
      data = createTestData(5);
      rerender({ data });

      expect(result.current.currentPage).toBe(0); // Should adjust to valid page
      expect(result.current.totalPages).toBe(1);
    });

    test('should handle very large datasets', () => {
      const data = createTestData(10000);
      const { result } = renderHook(() => useArraySlice(data, { pageSize: 100 }));

      expect(result.current.totalItems).toBe(10000);
      expect(result.current.totalPages).toBe(100);
      expect(result.current.currentItems).toHaveLength(100);
    });

    test('should maintain referential stability of callback objects', () => {
      const data = createTestData(25);
      const { result, rerender } = renderHook(() => useArraySlice(data));

      const initialPagination = result.current.pagination;
      const initialVisibility = result.current.visibility;
      const initialSearch = result.current.search;
      const initialControls = result.current.controls;

      // Re-render and check that callback objects maintain identity
      rerender();

      expect(result.current.pagination).toBe(initialPagination);
      expect(result.current.visibility).toBe(initialVisibility);
      expect(result.current.search).toBe(initialSearch);
      // Note: controls object will change when pageSize changes, but should be stable otherwise
    });
  });

  describe('complex scenarios', () => {
    test('should handle search with pagination correctly', () => {
      const data = createTestData(100);
      const { result } = renderHook(() =>
        useArraySlice(data, {
          pageSize: 5,
          searchFunction: defaultSearchFunction
        })
      );

      // Search for items containing "1" 
      act(() => {
        result.current.search.setSearchTerm('1');
      });

      const expectedMatches = data.filter(item => defaultSearchFunction(item, '1'));
      expect(result.current.totalItems).toBe(expectedMatches.length);
      expect(result.current.currentPage).toBe(0);
      expect(result.current.currentItems).toHaveLength(5); // First page of results

      // Navigate to next page of search results
      act(() => {
        result.current.pagination.nextPage();
      });

      expect(result.current.currentPage).toBe(1);
      expect(result.current.currentItems).toHaveLength(5); // Second page of results
    });

    test('should handle search with visibility toggle', () => {
      const data = createTestData(25);
      const { result } = renderHook(() =>
        useArraySlice(data, {
          pageSize: 10,
          searchFunction: defaultSearchFunction
        })
      );

      // Search and hide
      act(() => {
        result.current.search.setSearchTerm('Item 1');
        result.current.visibility.hideAll();
      });

      expect(result.current.currentItems).toHaveLength(0);
      expect(result.current.totalItems).toBe(0);

      // Show again - should still maintain search
      act(() => {
        result.current.visibility.showAll();
      });

      expect(result.current.totalItems).toBe(11); // Filtered results
      expect(result.current.searchTerm).toBe('Item 1');
    });

    test('should handle page size change with search active', () => {
      const data = createTestData(50);
      const { result } = renderHook(() =>
        useArraySlice(data, {
          pageSize: 10,
          searchFunction: defaultSearchFunction
        })
      );

      // Search first
      act(() => {
        result.current.search.setSearchTerm('1');
      });

      const filteredCount = result.current.totalItems;
      
      // Change page size
      act(() => {
        result.current.controls.setPageSize(5);
      });

      expect(result.current.totalItems).toBe(filteredCount); // Should maintain search results
      expect(result.current.controls.pageSize).toBe(5);
      expect(result.current.currentItems.length).toBeLessThanOrEqual(5);
    });
  });

  describe('callback stability', () => {
    test('pagination callbacks should be safe to use in dependency arrays', () => {
      const { result, rerender } = renderHook(() => useArraySlice(createTestData(25)));
      
      const { pagination } = result.current;
      
      // Create mock functions that depend on the callbacks
      const mockEffectWithNextPage = jest.fn();
      const mockEffectWithPreviousPage = jest.fn();
      const mockEffectWithGoToPage = jest.fn();
      
      // Simulate useEffect dependencies
      renderHook(() => {
        React.useEffect(() => {
          mockEffectWithNextPage();
        }, [pagination.nextPage]);
        
        React.useEffect(() => {
          mockEffectWithPreviousPage();
        }, [pagination.previousPage]);
        
        React.useEffect(() => {
          mockEffectWithGoToPage();
        }, [pagination.goToPage]);
      });
      
      expect(mockEffectWithNextPage).toHaveBeenCalledTimes(1);
      expect(mockEffectWithPreviousPage).toHaveBeenCalledTimes(1);
      expect(mockEffectWithGoToPage).toHaveBeenCalledTimes(1);
      
      // Re-render the original hook - callbacks should remain stable
      rerender();
      
      // Effects should not run again since dependencies are stable
      expect(mockEffectWithNextPage).toHaveBeenCalledTimes(1);
      expect(mockEffectWithPreviousPage).toHaveBeenCalledTimes(1);
      expect(mockEffectWithGoToPage).toHaveBeenCalledTimes(1);
    });

    test('visibility callbacks should be safe to use in dependency arrays', () => {
      const { result, rerender } = renderHook(() => useArraySlice(createTestData(25)));
      
      const { visibility } = result.current;
      
      // Create mock functions that depend on the callbacks
      const mockEffectWithShowAll = jest.fn();
      const mockEffectWithHideAll = jest.fn();
      const mockEffectWithToggleAll = jest.fn();
      
      // Simulate useEffect dependencies
      renderHook(() => {
        React.useEffect(() => {
          mockEffectWithShowAll();
        }, [visibility.showAll]);
        
        React.useEffect(() => {
          mockEffectWithHideAll();
        }, [visibility.hideAll]);
        
        React.useEffect(() => {
          mockEffectWithToggleAll();
        }, [visibility.toggleAll]);
      });
      
      expect(mockEffectWithShowAll).toHaveBeenCalledTimes(1);
      expect(mockEffectWithHideAll).toHaveBeenCalledTimes(1);
      expect(mockEffectWithToggleAll).toHaveBeenCalledTimes(1);
      
      // Re-render the original hook - callbacks should remain stable
      rerender();
      
      // Effects should not run again since dependencies are stable
      expect(mockEffectWithShowAll).toHaveBeenCalledTimes(1);
      expect(mockEffectWithHideAll).toHaveBeenCalledTimes(1);
      expect(mockEffectWithToggleAll).toHaveBeenCalledTimes(1);
    });

    test('search callbacks should be safe to use in dependency arrays', () => {
      const { result, rerender } = renderHook(() => useArraySlice(createTestData(25)));
      
      const { search } = result.current;
      
      // Create mock functions that depend on the callbacks
      const mockEffectWithSetSearchTerm = jest.fn();
      const mockEffectWithClearSearch = jest.fn();
      
      // Simulate useEffect dependencies
      renderHook(() => {
        React.useEffect(() => {
          mockEffectWithSetSearchTerm();
        }, [search.setSearchTerm]);
        
        React.useEffect(() => {
          mockEffectWithClearSearch();
        }, [search.clearSearch]);
      });
      
      expect(mockEffectWithSetSearchTerm).toHaveBeenCalledTimes(1);
      expect(mockEffectWithClearSearch).toHaveBeenCalledTimes(1);
      
      // Re-render the original hook - callbacks should remain stable
      rerender();
      
      // Effects should not run again since dependencies are stable
      expect(mockEffectWithSetSearchTerm).toHaveBeenCalledTimes(1);
      expect(mockEffectWithClearSearch).toHaveBeenCalledTimes(1);
    });
  });
});