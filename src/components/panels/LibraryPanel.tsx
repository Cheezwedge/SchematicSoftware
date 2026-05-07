import { useMemo, useState } from "react";
import { useLibraryStore } from "../../store/libraryStore";
import { useCanvasStore } from "../../store/canvasStore";
import { exportLibrary, importLibraryFile } from "../../lib/schlib";
import { dxfToSymbol, loadDxfSymbolFile } from "../../lib/dxfToSymbol";
import { dwgToSymbol, loadDwgFile } from "../../lib/dwgToSymbol";

type SortMode = "natural" | "name-asc" | "name-desc";

export function LibraryPanel() {
  const libraries = useLibraryStore((s) => s.libraries);
  const searchQuery = useLibraryStore((s) => s.searchQuery);
  const setSearchQuery = useLibraryStore((s) => s.setSearchQuery);
  const addSymbolToUserLibrary = useLibraryStore((s) => s.addSymbolToUserLibrary);
  const setPendingSymbol = useCanvasStore((s) => s.setPendingSymbol);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);

  const [dwgLoading, setDwgLoading] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("natural");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [filterLib, setFilterLib] = useState<"all" | "builtin" | "user">("all");

  const symbols = useMemo(() => {
    let all = libraries.flatMap((l) => {
      if (filterLib === "builtin" && !l.isBuiltIn) return [];
      if (filterLib === "user" && l.isBuiltIn) return [];
      return l.symbols;
    });
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      all = all.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (sortMode === "name-asc") all = [...all].sort((a, b) => a.name.localeCompare(b.name));
    else if (sortMode === "name-desc") all = [...all].sort((a, b) => b.name.localeCompare(a.name));
    return all;
  }, [libraries, searchQuery, sortMode, filterLib]);

  const byCategory = useMemo(() => {
    const map: Record<string, typeof symbols> = {};
    for (const s of symbols) {
      if (!map[s.category]) map[s.category] = [];
      map[s.category].push(s);
    }
    const cats = Object.keys(map);
    if (sortMode === "name-asc") cats.sort();
    else if (sortMode === "name-desc") cats.sort().reverse();
    return cats.map((cat) => ({ cat, syms: map[cat] }));
  }, [symbols, sortMode]);

  const allCats = byCategory.map((e) => e.cat);
  const allCollapsed = allCats.length > 0 && allCats.every((c) => collapsed.has(c));

  const toggleCat = (cat: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const collapseAll = () => setCollapsed(new Set(allCats));
  const expandAll = () => setCollapsed(new Set());

  const handleSelect = (defId: string) => {
    setPendingSymbol(defId);
    setActiveTool("symbol");
  };

  const userLib = libraries.find((l) => !l.isBuiltIn);

  const handleExport = () => { if (userLib) exportLibrary(userLib); };
  const handleImport = () => {
    importLibraryFile()
      .then((syms) => { syms.forEach((s) => addSymbolToUserLibrary(s)); })
      .catch((err: Error) => alert(err.message));
  };
  const handleImportDxfSymbol = () => {
    loadDxfSymbolFile()
      .then(({ content, name }) => { addSymbolToUserLibrary(dxfToSymbol(content, name)); })
      .catch((err: Error) => alert(err.message));
  };
  const handleImportDwgSymbol = () => {
    loadDwgFile()
      .then(({ buffer, name }) => {
        setDwgLoading(true);
        return dwgToSymbol(buffer, name).finally(() => setDwgLoading(false));
      })
      .then((sym) => addSymbolToUserLibrary(sym))
      .catch((err: Error) => { setDwgLoading(false); alert(err.message); });
  };

  return (
    <div className="library-panel">
      <div className="panel-header">
        <span>Symbols</span>
        <div className="panel-header-actions">
          <button className="icon-btn" title="Import DXF as symbol" onClick={handleImportDxfSymbol}>DXF</button>
          <button className="icon-btn" title="Import DWG as symbol" onClick={handleImportDwgSymbol} disabled={dwgLoading}>
            {dwgLoading ? "…" : "DWG"}
          </button>
          <button className="icon-btn" title="Import .schlib" onClick={handleImport}>↑</button>
          <button className="icon-btn" title="Export user symbols to .schlib" onClick={handleExport}
            disabled={!userLib || userLib.symbols.length === 0}>↓</button>
        </div>
      </div>

      <input
        className="library-search"
        placeholder="Search symbols…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="library-filter-bar">
        <select
          className="library-filter-select"
          value={filterLib}
          onChange={(e) => setFilterLib(e.target.value as "all" | "builtin" | "user")}
          title="Filter by source"
        >
          <option value="all">All libraries</option>
          <option value="builtin">Built-in only</option>
          <option value="user">Imported only</option>
        </select>
        <select
          className="library-filter-select"
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          title="Sort order"
        >
          <option value="natural">Default order</option>
          <option value="name-asc">Name A → Z</option>
          <option value="name-desc">Name Z → A</option>
        </select>
        <button
          className="icon-btn"
          title={allCollapsed ? "Expand all" : "Collapse all"}
          onClick={allCollapsed ? expandAll : collapseAll}
        >
          {allCollapsed ? "⊞" : "⊟"}
        </button>
      </div>

      <div className="library-scroll">
        {byCategory.map(({ cat, syms }) => (
          <div key={cat} className="library-category">
            <button className="library-category__header" onClick={() => toggleCat(cat)}>
              <span className="library-category__chevron">
                {collapsed.has(cat) ? "▶" : "▼"}
              </span>
              <span className="library-category__name">{cat}</span>
              <span className="library-category__count">{syms.length}</span>
            </button>
            {!collapsed.has(cat) && (
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
            )}
          </div>
        ))}
        {symbols.length === 0 && (
          <p className="library-empty">No symbols found.</p>
        )}
      </div>
    </div>
  );
}
