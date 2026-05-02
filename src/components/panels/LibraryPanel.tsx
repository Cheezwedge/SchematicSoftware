import { useMemo } from "react";
import { useLibraryStore } from "../../store/libraryStore";
import { useCanvasStore } from "../../store/canvasStore";

export function LibraryPanel() {
  const libraries = useLibraryStore((s) => s.libraries);
  const searchQuery = useLibraryStore((s) => s.searchQuery);

  const symbols = useMemo(() => {
    const all = libraries.flatMap((l) => l.symbols);
    if (!searchQuery.trim()) return all;
    const q = searchQuery.toLowerCase();
    return all.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [libraries, searchQuery]);
  const setSearchQuery = useLibraryStore((s) => s.setSearchQuery);
  const setPendingSymbol = useCanvasStore((s) => s.setPendingSymbol);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);

  const handleSelect = (defId: string) => {
    setPendingSymbol(defId);
    setActiveTool("symbol");
  };

  const byCategory = symbols.reduce<Record<string, typeof symbols>>((acc, sym) => {
    if (!acc[sym.category]) acc[sym.category] = [];
    acc[sym.category].push(sym);
    return acc;
  }, {});

  return (
    <div className="library-panel">
      <div className="panel-header">
        <span>Symbols</span>
      </div>
      <input
        className="library-search"
        placeholder="Search symbols…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <div className="library-scroll">
        {Object.entries(byCategory).map(([cat, syms]) => (
          <div key={cat} className="library-category">
            <div className="library-category__name">{cat}</div>
            <div className="library-category__symbols">
              {syms.map((sym) => (
                <button
                  key={sym.id}
                  className="symbol-thumb"
                  title={sym.name}
                  onClick={() => handleSelect(sym.id)}
                  dangerouslySetInnerHTML={{ __html: sym.svgContent }}
                />
              ))}
            </div>
          </div>
        ))}
        {symbols.length === 0 && (
          <p className="library-empty">No symbols found.</p>
        )}
      </div>
    </div>
  );
}
