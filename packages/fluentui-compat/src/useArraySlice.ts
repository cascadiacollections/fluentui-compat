import * as React from 'react';

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
 * // Advanced usage with complex filtering
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

  // State management
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [pageSize, setPageSize] = React.useState(initialPageSize);
  const [allVisible, setAllVisible] = React.useState(initialVisible);
  const [searchTerm, setSearchTerm] = React.useState(initialSearchTerm);

  // Filter data based on search term
  const filteredData = React.useMemo(() => {
    if (!searchTerm || !searchFunction) {
      return data;
    }
    return data.filter(item => searchFunction(item, searchTerm));
  }, [data, searchTerm, searchFunction]);

  // Calculate pagination values
  const totalItems = allVisible ? filteredData.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  // Ensure current page is valid when data changes
  React.useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [currentPage, totalPages]);

  // Calculate current slice
  const currentItems = React.useMemo(() => {
    if (!allVisible) {
      return [];
    }
    
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageSize, allVisible]);

  // Pagination controls - memoized for stable identity
  const pagination = React.useMemo(() => ({
    goToPage: (page: number) => {
      const clampedPage = Math.max(0, Math.min(page, totalPages - 1));
      setCurrentPage(clampedPage);
    },
    nextPage: () => {
      if (currentPage < totalPages - 1) {
        setCurrentPage(prev => prev + 1);
      }
    },
    previousPage: () => {
      if (currentPage > 0) {
        setCurrentPage(prev => prev - 1);
      }
    },
    firstPage: () => setCurrentPage(0),
    lastPage: () => setCurrentPage(Math.max(0, totalPages - 1)),
    hasNextPage: currentPage < totalPages - 1,
    hasPreviousPage: currentPage > 0,
  }), [currentPage, totalPages]);

  // Visibility controls - memoized for stable identity
  const visibility = React.useMemo(() => ({
    showAll: () => setAllVisible(true),
    hideAll: () => setAllVisible(false),
    toggleAll: () => setAllVisible(prev => !prev),
  }), []);

  // Search controls - memoized for stable identity
  const search = React.useMemo(() => ({
    setSearchTerm: (term: string) => {
      setSearchTerm(term);
      // Reset to first page when searching
      setCurrentPage(0);
    },
    clearSearch: () => {
      setSearchTerm('');
      setCurrentPage(0);
    },
  }), []);

  // Control functions - memoized for stable identity
  const controls = React.useMemo(() => ({
    setPageSize: (size: number) => {
      const newSize = Math.max(1, size);
      setPageSize(newSize);
      // Adjust current page to maintain position as much as possible
      const currentItemIndex = currentPage * pageSize;
      const newPage = Math.floor(currentItemIndex / newSize);
      setCurrentPage(Math.max(0, Math.min(newPage, Math.ceil(totalItems / newSize) - 1)));
    },
    pageSize,
  }), [pageSize, currentPage, totalItems]);

  return {
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
  };
}