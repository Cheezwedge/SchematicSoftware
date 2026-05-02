import { useMemo } from "react";
import { useLibraryStore } from "../../store/libraryStore";
import { useCanvasStore } from "../../store/canvasStore";
import { exportLibrary, importLibraryFile } from "../../lib/schlib";

export function LibraryPanel() {
  const libraries = useLibraryStore((s) => s.libraries);
  const searchQuery = useLibraryStore((s) => s.searchQuery);
  const setSearchQuery = useLibraryStore((s) => s.setSearchQuery);
  const addSymbolToUserLibrary = useLibraryStore((s) => s.addSymbolToUserLibrary);
  const setPendingSymbol = useCanvasStore((s) => s.setPendingSymbol);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);

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

  const handleSelect = (defId: string) => {
    setPendingSymbol(defId);
    setActiveTool("symbol");
  };

  const userLib = libraries.find((l) => !l.isBuiltIn);

  const handleExport = () => {
    if (!userLib) return;
    exportLibrary(userLib);
  };

  const handleImport = () => {
    importLibraryFile()
      .then((syms) => {
        syms.forEach((s) => addSymbolToUserLibrary(s));
      })
      .catch((err: Error) => alert(err.message));
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
        <div className="panel-header-actions">
          <button
            className="icon-btn"
            title="Import symbols from .schlib file"
            onClick={handleImport}
          >
            ↑
          </button>
          <button
            className="icon-btn"
            title="Export user symbols to .schlib file"
            onClick={handleExport}
            disabled={!userLib || userLib.symbols.length === 0}
          >
            ↓
          </button>
        </div>
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
