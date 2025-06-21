import React from 'react';
import { useArraySlice } from '../src/useArraySlice';

interface SampleItem {
  id: number;
  name: string;
  category: string;
  description: string;
  tags: string[];
}

const generateSampleData = (count: number): SampleItem[] => {
  const categories = ['Electronics', 'Books', 'Clothing', 'Home & Garden', 'Sports'];
  const adjectives = ['Amazing', 'Incredible', 'Fantastic', 'Awesome', 'Premium', 'Deluxe'];
  const nouns = ['Widget', 'Gadget', 'Device', 'Tool', 'Item', 'Product'];
  
  return Array.from({ length: count }, (_, i) => {
    const category = categories[i % categories.length];
    const adjective = adjectives[i % adjectives.length];
    const noun = nouns[i % nouns.length];
    
    return {
      id: i + 1,
      name: `${adjective} ${noun} ${i + 1}`,
      category,
      description: `This is a high-quality ${noun.toLowerCase()} in the ${category.toLowerCase()} category. Perfect for everyday use.`,
      tags: [
        category.toLowerCase(),
        adjective.toLowerCase(),
        noun.toLowerCase(),
        i % 2 === 0 ? 'popular' : 'new'
      ]
    };
  });
};

const searchFunction = (item: SampleItem, term: string): boolean => {
  const searchTerm = term.toLowerCase();
  return (
    item.name.toLowerCase().includes(searchTerm) ||
    item.category.toLowerCase().includes(searchTerm) ||
    item.description.toLowerCase().includes(searchTerm) ||
    item.tags.some(tag => tag.includes(searchTerm))
  );
};

/**
 * Demo component showcasing the useArraySlice hook functionality
 */
export function UseArraySliceDemo() {
  const sampleData = React.useMemo(() => generateSampleData(87), []);
  
  const {
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
    getItemId
  } = useArraySlice(sampleData, {
    pageSize: 8,
    initialPage: 0,
    searchFunction
  });

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>useArraySlice Hook Demo</h1>
      <p>
        This demo showcases a React hook for managing array slicing with pagination, search, visibility controls, 
        and <strong>ID management</strong>. The hook automatically generates collision-resistant IDs for React keys, 
        or you can provide a custom ID function for your data items.
      </p>
      
      {/* Controls Section */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        flexWrap: 'wrap'
      }}>
        {/* Search Controls */}
        <div style={{ flex: '1', minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Search Items:
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => search.setSearchTerm(e.target.value)}
            placeholder="Search by name, category, description, or tags..."
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          {searchTerm && (
            <button
              onClick={search.clearSearch}
              style={{ 
                marginTop: '5px', 
                padding: '4px 8px', 
                backgroundColor: '#007acc', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Clear Search
            </button>
          )}
        </div>

        {/* Page Size Control */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Items per page:
          </label>
          <select
            value={controls.pageSize}
            onChange={(e) => controls.setPageSize(Number(e.target.value))}
            style={{ 
              padding: '8px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value={4}>4 per page</option>
            <option value={8}>8 per page</option>
            <option value={12}>12 per page</option>
            <option value={20}>20 per page</option>
          </select>
        </div>

        {/* Visibility Controls */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Visibility:
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={visibility.toggleAll}
              style={{ 
                padding: '8px 12px', 
                backgroundColor: allVisible ? '#dc3545' : '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {allVisible ? 'Hide All' : 'Show All'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '10px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <strong>Status:</strong> {allVisible ? 'Showing' : 'Hidden'} | 
        <strong> Total Items:</strong> {totalItems} | 
        <strong> Current Page:</strong> {totalPages > 0 ? currentPage + 1 : 0} of {totalPages} |
        <strong> Items on Page:</strong> {currentItems.length}
        {searchTerm && <span> | <strong>Search:</strong> "{searchTerm}"</span>}
      </div>

      {/* Pagination Controls */}
      {allVisible && totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '10px', 
          marginBottom: '20px' 
        }}>
          <button
            onClick={pagination.firstPage}
            disabled={!pagination.hasPreviousPage}
            style={{ 
              padding: '8px 12px', 
              backgroundColor: pagination.hasPreviousPage ? '#007acc' : '#ccc', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: pagination.hasPreviousPage ? 'pointer' : 'not-allowed'
            }}
          >
            First
          </button>
          <button
            onClick={pagination.previousPage}
            disabled={!pagination.hasPreviousPage}
            style={{ 
              padding: '8px 12px', 
              backgroundColor: pagination.hasPreviousPage ? '#007acc' : '#ccc', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: pagination.hasPreviousPage ? 'pointer' : 'not-allowed'
            }}
          >
            Previous
          </button>
          
          <span style={{ margin: '0 10px', fontSize: '14px' }}>
            Page {currentPage + 1} of {totalPages}
          </span>
          
          <button
            onClick={pagination.nextPage}
            disabled={!pagination.hasNextPage}
            style={{ 
              padding: '8px 12px', 
              backgroundColor: pagination.hasNextPage ? '#007acc' : '#ccc', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed'
            }}
          >
            Next
          </button>
          <button
            onClick={pagination.lastPage}
            disabled={!pagination.hasNextPage}
            style={{ 
              padding: '8px 12px', 
              backgroundColor: pagination.hasNextPage ? '#007acc' : '#ccc', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed'
            }}
          >
            Last
          </button>
        </div>
      )}

      {/* Items Grid */}
      {allVisible ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '15px',
          marginBottom: '20px'
        }}>
          {currentItems.map((item, index) => (
            <div
              key={getItemId(item, index)}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '16px' }}>
                {item.name}
              </h3>
              <p style={{ 
                margin: '0 0 10px 0', 
                color: '#666', 
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {item.category}
              </p>
              <p style={{ 
                margin: '0 0 10px 0', 
                color: '#777', 
                fontSize: '13px',
                lineHeight: '1.4'
              }}>
                {item.description}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {item.tags.map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      backgroundColor: '#e9ecef',
                      color: '#495057',
                      padding: '2px 6px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#666',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <h3>All items are hidden</h3>
          <p>Click "Show All" to display the items</p>
        </div>
      )}

      {/* Bottom Pagination */}
      {allVisible && totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '10px',
          marginTop: '20px'
        }}>
          <button
            onClick={pagination.firstPage}
            disabled={!pagination.hasPreviousPage}
            style={{ 
              padding: '8px 12px', 
              backgroundColor: pagination.hasPreviousPage ? '#007acc' : '#ccc', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: pagination.hasPreviousPage ? 'pointer' : 'not-allowed'
            }}
          >
            First
          </button>
          <button
            onClick={pagination.previousPage}
            disabled={!pagination.hasPreviousPage}
            style={{ 
              padding: '8px 12px', 
              backgroundColor: pagination.hasPreviousPage ? '#007acc' : '#ccc', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: pagination.hasPreviousPage ? 'pointer' : 'not-allowed'
            }}
          >
            Previous
          </button>
          
          <span style={{ margin: '0 10px', fontSize: '14px' }}>
            Page {currentPage + 1} of {totalPages}
          </span>
          
          <button
            onClick={pagination.nextPage}
            disabled={!pagination.hasNextPage}
            style={{ 
              padding: '8px 12px', 
              backgroundColor: pagination.hasNextPage ? '#007acc' : '#ccc', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed'
            }}
          >
            Next
          </button>
          <button
            onClick={pagination.lastPage}
            disabled={!pagination.hasNextPage}
            style={{ 
              padding: '8px 12px', 
              backgroundColor: pagination.hasNextPage ? '#007acc' : '#ccc', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed'
            }}
          >
            Last
          </button>
        </div>
      )}

      {/* Hook Usage Example */}
      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px' 
      }}>
        <h3>Code Example</h3>
        <pre style={{ 
          backgroundColor: '#fff', 
          padding: '15px', 
          borderRadius: '4px', 
          overflow: 'auto',
          fontSize: '12px',
          lineHeight: '1.4'
        }}>
{`const {
  currentItems,
  totalItems,
  currentPage,
  totalPages,
  pagination,
  visibility,
  search,
  controls
} = useArraySlice(data, {
  pageSize: 8,
  searchFunction: (item, term) => 
    item.name.toLowerCase().includes(term.toLowerCase())
});`}
        </pre>
      </div>
    </div>
  );
}