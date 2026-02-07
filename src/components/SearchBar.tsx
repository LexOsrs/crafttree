import { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";

export interface SearchBarHandle {
  focus: () => void;
}

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  itemNames: string[];
}

const SearchBar = forwardRef<SearchBarHandle, SearchBarProps>(function SearchBar({
  query,
  onQueryChange,
  itemNames,
}, ref) {
  const [focused, setFocused] = useState(false);
  const [selected, setSelected] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
      inputRef.current?.select();
    },
  }));

  const suggestions = useMemo(() => {
    if (!query.trim() || selected) return [];
    const q = query.toLowerCase();
    return itemNames
      .filter((name) => name.toLowerCase().includes(q))
      .sort((a, b) => {
        const aStartsWith = a.toLowerCase().startsWith(q);
        const bStartsWith = b.toLowerCase().startsWith(q);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.localeCompare(b);
      })
      .slice(0, 8);
  }, [query, selected, itemNames]);

  const showSuggestions = focused && suggestions.length > 0;

  function selectItem(name: string) {
    setSelected(true);
    onQueryChange(name);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setFocused(false);
      inputRef.current?.blur();
      return;
    }
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && suggestions.length > 0) {
      e.preventDefault();
      selectItem(suggestions[Math.max(activeIndex, 0)]);
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const el = listRef.current.children[activeIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  // Auto-highlight first suggestion
  useEffect(() => {
    setActiveIndex(suggestions.length > 0 ? 0 : -1);
  }, [suggestions]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 py-2 bg-gray-900/90 backdrop-blur border-b border-gray-700">
      <div ref={wrapperRef} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            setSelected(false);
          }}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search items... ( / )"
          className="w-64 px-3 py-1.5 pr-8 text-sm bg-gray-800 border border-gray-600 rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-500"
        />
        {query && (
          <button
            onClick={() => {
              onQueryChange("");
              setSelected(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm leading-none"
          >
            x
          </button>
        )}
        {showSuggestions && (
          <div
            ref={listRef}
            className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg max-h-64 overflow-y-auto"
          >
            {suggestions.map((name, i) => (
              <button
                key={name}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectItem(name);
                }}
                className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 ${
                  i === activeIndex
                    ? "bg-gray-700 text-white"
                    : "text-gray-300 hover:bg-gray-700/50"
                }`}
              >
                <img
                  src={`/images/${name.toLowerCase().replace(/[' ]/g, "-").replace(/--+/g, "-")}.png`}
                  alt=""
                  className="w-5 h-5 object-contain"
                />
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default SearchBar;
