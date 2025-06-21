import * as React from 'react';

// React 18+ progressive support - conditionally use newer APIs
const useId = (React as any).useId || (() => Math.random().toString(36).substr(2, 9));
const useDeferredValue = (React as any).useDeferredValue || ((value: any) => value);

/**
 * Generates a collision-resistant hash from a string using a simple but effective algorithm.
 * This is used as a fallback when no user-provided ID function is available.
 */
function generateHashId(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Creates a collision-resistant ID for an item when no user-provided ID function is available.
 * Combines the original index with a content hash to minimize collisions while maintaining stability.
 */
function createFallbackId<T>(item: T, originalIndex: number): string {
  // Create a stable string representation of the item
  const itemStr = typeof item === 'object' && item !== null 
    ? JSON.stringify(item) 
    : String(item);
  
  // Generate a hash from the item content
  const contentHash = generateHashId(itemStr);
  
  // Combine original index with content hash for collision resistance
  return `${originalIndex}_${contentHash}`;
}

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
  /** Function to extract or generate unique IDs for items. If not provided, collision-resistant IDs will be generated automatically. */
  getItemId?: (item: T, index: number) => string | number;
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
  /** Get stable ID for an item in the current slice - useful for React keys */
  getItemId: (item: T, sliceIndex: number) => string | number;
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
 * - **ID Management**: User-provided ID functions with collision-resistant fallbacks
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
 * **ID Management:**
 * - Supports user-provided `getItemId` function for custom ID extraction/generation
 * - Provides collision-resistant fallback IDs when no ID function is specified
 * - Maintains stable IDs across filtering and pagination for React key consistency
 * - IDs are based on original array positions combined with content hashing for collision resistance
 * 
 * @param data - Array of items to slice and manage
 * @param options - Configuration options for pagination, search, and visibility
 * @returns Object containing current slice, pagination controls, and utility functions
 * 
 * @example
 * ```typescript
 * // Basic usage with automatic collision-resistant ID generation
 * function UserList({ users }: { users: User[] }) {
 *   const {
 *     currentItems,
 *     getItemId,
 *     pagination,
 *     search
 *   } = useArraySlice(users, {
 *     pageSize: 5,
 *     searchFunction: (user, term) => 
 *       user.name.toLowerCase().includes(term.toLowerCase())
 *   });
 * 
 *   return (
 *     <div>
 *       <input 
 *         type="text" 
 *         placeholder="Search users..."
 *         onChange={(e) => search.setSearchTerm(e.target.value)}
 *       />
 *       
 *       {currentItems.map((user, index) => (
 *         <div key={getItemId(user, index)}>
 *           {user.name} - {user.email}
 *         </div>
 *       ))}
 *       
 *       <div>
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
 * // Advanced usage with custom ID function
 * function ProductCatalog({ products }: { products: Product[] }) {
 *   const productSlice = useArraySlice(products, {
 *     pageSize: 12,
 *     // Custom ID function using product's unique identifier
 *     getItemId: (product) => `product-${product.sku}`,
 *     searchFunction: (product, term) => {
 *       const searchLower = term.toLowerCase();
 *       return (
 *         product.name.toLowerCase().includes(searchLower) ||
 *         product.description.toLowerCase().includes(searchLower) ||
 *         product.sku.toLowerCase().includes(searchLower)
 *       );
 *     }
 *   });
 * 
 *   return (
 *     <div>
 *       <div className="product-grid">
 *         {productSlice.currentItems.map((product, index) => (
 *           <ProductCard 
 *             key={productSlice.getItemId(product, index)} 
 *             product={product} 
 *           />
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
    initialSearchTerm = '',
    getItemId
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

  // Create a stable mapping of items to their original indices for ID generation
  const itemToOriginalIndex = React.useMemo(() => {
    const map = new Map<T, number>();
    data.forEach((item, index) => {
      map.set(item, index);
    });
    return map;
  }, [data]);

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

  // ID management function - provides stable IDs for items
  const getItemIdForResult = React.useCallback((item: T, sliceIndex: number) => {
    if (getItemId) {
      // Use user-provided ID function with the original index
      const originalIndex = itemToOriginalIndex.get(item) ?? sliceIndex;
      return getItemId(item, originalIndex);
    } else {
      // Use collision-resistant fallback ID
      const originalIndex = itemToOriginalIndex.get(item) ?? sliceIndex;
      return createFallbackId(item, originalIndex);
    }
  }, [getItemId, itemToOriginalIndex]);

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
    getItemId: getItemIdForResult,
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
    getItemIdForResult,
    hookId,
    data.length,
    filteredData.length
  ]);

  return result;
}