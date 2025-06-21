import * as React from 'react';

// React 18+ progressive support - conditionally use newer APIs
const useId = (React as any).useId || (() => Math.random().toString(36).substr(2, 9));
const useDeferredValue = (React as any).useDeferredValue || ((value: any) => value);

/** Configuration options for the useArraySlice hook */
export interface UseArraySliceOptions<T> {
  /** Number of items per page (default: 10) */
  pageSize?: number;
  /** Initial page number (0-based, default: 0) */
  initialPage?: number;
  /** Initial visibility state for all items (default: true) */
  initialVisible?: boolean;
  /** Function to filter items based on search criteria */
  searchFunction?: (item: T, searchTerm: string) => boolean;
  /** Initial search term */
  initialSearchTerm?: string;
}

/** Return type of useArraySlice hook */
export interface UseArraySliceResult<T> {
  /** Current slice of items to render */
  currentItems: T[];
  /** Total number of items after filtering */
  totalItems: number;
  /** Current page number (0-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether all items are currently visible */
  allVisible: boolean;
  /** Current search term */
  searchTerm: string;
  /** Pagination controls */
  pagination: {
    /** Go to specific page */
    goToPage: (page: number) => void;
    /** Go to next page */
    nextPage: () => void;
    /** Go to previous page */
    previousPage: () => void;
    /** Go to first page */
    firstPage: () => void;
    /** Go to last page */
    lastPage: () => void;
    /** Check if next page is available */
    hasNextPage: boolean;
    /** Check if previous page is available */
    hasPreviousPage: boolean;
  };
  /** Visibility controls */
  visibility: {
    /** Show all items */
    showAll: () => void;
    /** Hide all items */
    hideAll: () => void;
    /** Toggle visibility of all items */
    toggleAll: () => void;
  };
  /** Search controls */
  search: {
    /** Set search term */
    setSearchTerm: (term: string) => void;
    /** Clear search */
    clearSearch: () => void;
  };
  /** Configuration controls */
  controls: {
    /** Change page size */
    setPageSize: (size: number) => void;
    /** Current page size */
    pageSize: number;
  };
  /** React DevTools debug information (development builds only) */
  _debug?: {
    /** Unique hook instance ID */
    hookId: string;
    /** Original data array length */
    dataLength: number;
    /** Filtered data array length */
    filteredLength: number;
    /** Hook version */
    version: string;
  };
}

/**
 * Hook for slicing array collections with pagination, search, and visibility controls.
 * 
 * This hook provides comprehensive functionality for managing large lists of data:
 * - Pagination with configurable page size
 * - Global visibility toggle (show/hide all items)
 * - Search/filtering with custom search functions
 * - Performance optimized with stable callback identities
 * - TypeScript generic support for type safety
 * - React DevTools integration with debug information (development builds)
 * - React 18+ API progressive support for enhanced concurrent rendering
 * 
 * **React 18+ Features:**
 * - Uses `useId` for stable hook instance identification
 * - Uses `useDeferredValue` for non-blocking search operations
 * - Optimized `useCallback` patterns for better concurrent rendering
 * - Development-only debug information visible in React DevTools
 * 
 * @param data - Array of items to slice and manage
 * @param options - Configuration options for pagination, search, and visibility
 * @returns Object containing current slice, pagination controls, and utility functions
 * 
 * @example
 * ```typescript
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 * 
 * function UserList({ users }: { users: User[] }) {
 *   const {
 *     currentItems,
 *     currentPage,
 *     totalPages,
 *     pagination,
 *     search,
 *     visibility
 *   } = useArraySlice(users, {
 *     pageSize: 5,
 *     searchFunction: (user, term) => 
 *       user.name.toLowerCase().includes(term.toLowerCase()) ||
 *       user.email.toLowerCase().includes(term.toLowerCase())
 *   });
 * 
 *   return (
 *     <div>
 *       <input 
 *         type="text" 
 *         placeholder="Search users..."
 *         onChange={(e) => search.setSearchTerm(e.target.value)}
 *       />
 *       <button onClick={visibility.toggleAll}>
 *         Toggle Visibility
 *       </button>
 *       
 *       {currentItems.map(user => (
 *         <div key={user.id}>{user.name} - {user.email}</div>
 *       ))}
 *       
 *       <div>
 *         Page {currentPage + 1} of {totalPages}
 *         <button onClick={pagination.previousPage} disabled={!pagination.hasPreviousPage}>
 *           Previous
 *         </button>
 *         <button onClick={pagination.nextPage} disabled={!pagination.hasNextPage}>
 *           Next
 *         </button>
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Advanced usage with complex filtering and React 18+ features
 * function ProductCatalog({ products }: { products: Product[] }) {
 *   const productSlice = useArraySlice(products, {
 *     pageSize: 12,
 *     initialSearchTerm: '',
 *     searchFunction: (product, term) => {
 *       const searchLower = term.toLowerCase();
 *       return (
 *         product.name.toLowerCase().includes(searchLower) ||
 *         product.description.toLowerCase().includes(searchLower) ||
 *         product.category.toLowerCase().includes(searchLower) ||
 *         product.tags.some(tag => tag.toLowerCase().includes(searchLower))
 *       );
 *     }
 *   });
 * 
 *   // Debug information available in development builds
 *   if (process.env.NODE_ENV !== 'production') {
 *     console.log('useArraySlice debug:', productSlice._debug);
 *   }
 * 
 *   return (
 *     <div>
 *       <div className="filters">
 *         <input
 *           type="text"
 *           placeholder="Search products..."
 *           onChange={(e) => productSlice.search.setSearchTerm(e.target.value)}
 *         />
 *         <select onChange={(e) => productSlice.controls.setPageSize(Number(e.target.value))}>
 *           <option value={6}>6 per page</option>
 *           <option value={12}>12 per page</option>
 *           <option value={24}>24 per page</option>
 *         </select>
 *       </div>
 *       
 *       <div className="product-grid">
 *         {productSlice.currentItems.map(product => (
 *           <ProductCard key={product.id} product={product} />
 *         ))}
 *       </div>
 *       
 *       <Pagination {...productSlice.pagination} />
 *     </div>
 *   );
 * }
 * ```
 * 
 * @public
 */
export function useArraySlice<T>(
  data: T[],
  options: UseArraySliceOptions<T> = {}
): UseArraySliceResult<T> {
  const {
    pageSize: initialPageSize = 10,
    initialPage = 0,
    initialVisible = true,
    searchFunction,
    initialSearchTerm = ''
  } = options;

  // React DevTools integration - displayName for debugging
  if (process.env.NODE_ENV !== 'production') {
    (useArraySlice as any).displayName = 'useArraySlice';
  }

  // Generate stable hook ID for React DevTools (React 18+ progressive support)
  const hookId = useId();

  // State management
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [pageSize, setPageSize] = React.useState(initialPageSize);
  const [allVisible, setAllVisible] = React.useState(initialVisible);
  const [searchTerm, setSearchTerm] = React.useState(initialSearchTerm);

  // React 18+ progressive enhancement: defer search term for better concurrent rendering
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // Filter data based on search term (using deferred value for React 18+ concurrent rendering)
  const filteredData = React.useMemo(() => {
    if (!deferredSearchTerm || !searchFunction) {
      return data;
    }
    return data.filter(item => searchFunction(item, deferredSearchTerm));
  }, [data, deferredSearchTerm, searchFunction]);

  // Calculate pagination values
  const totalItems = allVisible ? filteredData.length : 0;
  const totalPages = allVisible ? Math.max(1, Math.ceil(totalItems / pageSize)) : 1;
  
  // Ensure current page is valid when data changes (but only when visible)
  React.useEffect(() => {
    if (allVisible && currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [currentPage, totalPages, allVisible]);

  // Calculate current slice
  const currentItems = React.useMemo(() => {
    if (!allVisible) {
      return [];
    }
    
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageSize, allVisible]);

  // Pagination controls - optimized with React 18+ patterns for concurrent rendering
  const goToPage = React.useCallback((page: number) => {
    const clampedPage = Math.max(0, Math.min(page, totalPages - 1));
    setCurrentPage(clampedPage);
  }, [totalPages]);

  const nextPage = React.useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const previousPage = React.useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const firstPage = React.useCallback(() => setCurrentPage(0), []);
  const lastPage = React.useCallback(() => setCurrentPage(Math.max(0, totalPages - 1)), [totalPages]);

  const pagination = React.useMemo(() => ({
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    hasNextPage: currentPage < totalPages - 1,
    hasPreviousPage: currentPage > 0,
  }), [goToPage, nextPage, previousPage, firstPage, lastPage, currentPage, totalPages]);

  // Visibility controls - optimized with React 18+ useCallback patterns
  const showAll = React.useCallback(() => setAllVisible(true), []);
  const hideAll = React.useCallback(() => setAllVisible(false), []);
  const toggleAll = React.useCallback(() => setAllVisible(prev => !prev), []);

  const visibility = React.useMemo(() => ({
    showAll,
    hideAll,
    toggleAll,
  }), [showAll, hideAll, toggleAll]);

  // Search controls - optimized with React 18+ useCallback patterns  
  const setSearchTermWithReset = React.useCallback((term: string) => {
    setSearchTerm(term);
    // Reset to first page when searching
    setCurrentPage(0);
  }, []);

  const clearSearch = React.useCallback(() => {
    setSearchTerm('');
    setCurrentPage(0);
  }, []);

  const search = React.useMemo(() => ({
    setSearchTerm: setSearchTermWithReset,
    clearSearch,
  }), [setSearchTermWithReset, clearSearch]);

  // Control functions - optimized with React 18+ useCallback patterns
  const setPageSizeWithAdjustment = React.useCallback((size: number) => {
    const newSize = Math.max(1, size);
    setPageSize(newSize);
    // Adjust current page to maintain position as much as possible
    const currentItemIndex = currentPage * pageSize;
    const newPage = Math.floor(currentItemIndex / newSize);
    setCurrentPage(Math.max(0, Math.min(newPage, Math.ceil(totalItems / newSize) - 1)));
  }, [currentPage, pageSize, totalItems]);

  const controls = React.useMemo(() => ({
    setPageSize: setPageSizeWithAdjustment,
    pageSize,
  }), [setPageSizeWithAdjustment, pageSize]);

  const result = React.useMemo(() => ({
    currentItems,
    totalItems,
    currentPage,
    totalPages,
    allVisible,
    searchTerm,
    pagination,
    visibility,
    search,
    controls,
    // React DevTools debug information (development only)
    ...(process.env.NODE_ENV !== 'production' && {
      _debug: {
        hookId,
        dataLength: data.length,
        filteredLength: filteredData.length,
        version: '1.0.0'
      }
    })
  }), [
    currentItems,
    totalItems,
    currentPage,
    totalPages,
    allVisible,
    searchTerm,
    pagination,
    visibility,
    search,
    controls,
    hookId,
    data.length,
    filteredData.length
  ]);

  return result;
}