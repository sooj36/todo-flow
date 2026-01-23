'use client';

import { useState, KeyboardEvent } from 'react';
import { Search } from 'lucide-react';

export interface SearchBarProps {
  onSearch: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Check both e.isComposing and e.nativeEvent.isComposing for browser compatibility
    const isComposing = e.isComposing || Boolean(e.nativeEvent && (e.nativeEvent as any).isComposing);
    if (e.key === 'Enter' && query.trim() && !isComposing) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="검색어를 입력하세요"
          aria-label="키워드 검색"
          className="w-full pl-12 pr-4 py-3.5 rounded-full border border-[#e6e2f3] bg-white/80 shadow-[0_12px_35px_rgba(20,17,36,0.06)] focus:outline-none focus:ring-2 focus:ring-[#cfd6ff] focus:border-transparent text-primary placeholder:text-secondary"
        />
      </div>
    </div>
  );
};
