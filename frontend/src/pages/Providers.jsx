import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProviderCard from "../components/ProviderCard";
import SearchFilters from "../components/SearchFilters";
import { apiRequest } from "../services/api";

const emptyFilters = { category: "", city: "", area: "", sort: "" };

export default function Providers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    city: searchParams.get("city") || "",
    area: searchParams.get("area") || "",
    sort: searchParams.get("sort") || "",
  });
  const [providers, setProviders] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const searchProviders = useCallback(async (activeFilters = filters) => {
    setLoading(true);
    setError("");
    setSearched(true);

    const params = new URLSearchParams();
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value.trim()) params.set(key, value.trim());
    });

    try {
      const data = await apiRequest(`/providers${params.toString() ? `?${params}` : ""}`);
      const list = Array.isArray(data) ? data : data.providers || data.data || [];
      setProviders(list);
      setSearchParams(params, { replace: true });
    } catch (err) {
      setProviders([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, setSearchParams]);

  useEffect(() => {
    searchProviders(filters);
  // Run once on page entry; filters are initialized from the URL.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetFilters() {
    const cleanFilters = { ...emptyFilters };
    setFilters(cleanFilters);
    setSelected([]);
    searchProviders(cleanFilters);
  }

  function toggleCompare(provider) {
    setSelected((current) => {
      const exists = current.some((item) => item.id === provider.id);
      if (exists) return current.filter((item) => item.id !== provider.id);
      if (current.length >= 4) {
        setError("You can compare a maximum of four providers.");
        return current;
      }
      setError("");
      return [...current, provider];
    });
  }

  function goToCompare() {
    if (selected.length < 2) {
      setError("Select at least two providers to compare.");
      return;
    }
    const ids = selected.map((provider) => provider.id).join(",");
    window.location.href = `/compare?ids=${encodeURIComponent(ids)}`;
  }

  return (
    <section className="content-section">
      <div className="page-heading">
        <p className="eyebrow">Discover local professionals</p>
        <h1>Find a service provider</h1>
        <p className="muted">Search verified profiles and compare details before making a choice.</p>
      </div>

      <SearchFilters filters={filters} onChange={setFilters} onSearch={() => searchProviders(filters)} onReset={resetFilters} />

      {error && <div className="alert alert-error result-alert" role="alert">{error}</div>}

      <div className="results-heading">
        <h2>{loading ? "Searching..." : "Available providers"}</h2>
        {!loading && <span className="muted">{providers.length} result{providers.length === 1 ? "" : "s"}</span>}
      </div>

      {loading ? (
        <div className="loading-state"><span className="spinner" /> Loading providers from FixNear...</div>
      ) : providers.length ? (
        <>
          <div className="provider-grid">
            {providers.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} selected={selected.some((item) => item.id === provider.id)} onToggleCompare={toggleCompare} />
            ))}
          </div>
          {selected.length > 0 && (
            <div className="compare-bar">
              <span>{selected.length} provider{selected.length === 1 ? "" : "s"} selected</span>
              <span className="muted">Select 2–4 providers</span>
              <button className="button" onClick={goToCompare}>Compare selected</button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">⌕</div>
          <h3>{error ? "Providers could not be loaded" : "No providers found"}</h3>
          <p>{error ? "Check your backend server and API response, then try again." : "Try another category, city or area. Only verified providers appear in public search."}</p>
          <button className="button button-outline" onClick={() => searchProviders(filters)}>Try again</button>
        </div>
      )}
    </section>
  );
}
