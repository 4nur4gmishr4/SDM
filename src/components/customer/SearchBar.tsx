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

  return (
    <div className="search-bar">
      <form onSubmit={handleSearch} role="search" style={{ width: '100%' }}>
        <md-outlined-text-field
          type="search"
          placeholder={placeholder}
          value={query}
          onInput={(e: any) => {
            const val = e.target.value;
            setQuery(val);
            if (onInstantSearch) {
              onInstantSearch(val);
            }
          }}
          style={{ width: '100%' }}
        >
          <md-icon slot="leading-icon">search</md-icon>
          <md-icon-button slot="trailing-icon" type="submit" aria-label="Search">
            <md-icon>arrow_forward</md-icon>
          </md-icon-button>
        </md-outlined-text-field>
      </form>
    </div>
  );
}
