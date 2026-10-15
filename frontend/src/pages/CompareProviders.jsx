import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ComparisonTable from "../components/ComparisonTable";
import { apiRequest } from "../services/api";

export default function CompareProviders() {
  const [searchParams] = useSearchParams();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const ids = (searchParams.get("ids") || "").split(",").filter(Boolean);

  useEffect(() => {
    async function loadComparison() {
      setError("");
      setProviders([]);
      if (ids.length < 2 || ids.length > 4 || ids.some((id) => !/^\d+$/.test(id))) {
        setError("Choose between two and four valid provider IDs from the provider search page.");
        return;
      }

      setLoading(true);
      try {
        const data = await apiRequest(`/providers/compare?ids=${encodeURIComponent(ids.join(","))}`);
        const list = Array.isArray(data) ? data : data.providers || data.data || [];
        setProviders(list);
        if (list.length < 2) setError("At least two verified providers are needed for comparison.");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadComparison();
  // ids are derived from the current URL.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  return (
    <section className="content-section">
      <div className="page-heading">
        <p className="eyebrow">Side-by-side overview</p>
        <h1>Compare providers</h1>
        <p className="muted">Compare service details, ratings, price ranges and availability.</p>
      </div>

      {loading && <div className="loading-state"><span className="spinner" /> Loading comparison...</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {!loading && providers.length >= 2 && <ComparisonTable providers={providers} />}

      <div className="page-bottom-action">
        <Link className="button button-outline" to="/providers">← Choose providers</Link>
      </div>
    </section>
  );
}
