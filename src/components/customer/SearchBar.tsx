import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css';

interface SearchBarProps {
  initialQuery?: string;
  placeholder?: string;
  onInstantSearch?: (query: string) => void;
}

export function SearchBar({ initialQuery = '', placeholder = 'Search products...', onInstantSearch }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Just search globally
      navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/shop');
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onInstantSearch) onInstantSearch('');
  };

  return (
    <div className="search-bar">
      <form onSubmit={handleSearch} role="search" className="search-bar__form">
        <span className="material-symbols-outlined search-bar__leading-icon">search</span>
        <input
          type="search"
          className="search-bar__input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            if (onInstantSearch) {
              onInstantSearch(val);
            }
          }}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
        {query && (
          <button
            type="button"
            className="search-bar__clear-btn"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
        <button
          type="submit"
          className="search-bar__submit-btn"
          aria-label="Submit search"
        >
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </form>
    </div>
  );
}
