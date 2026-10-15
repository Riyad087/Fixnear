import { Link } from "react-router-dom";

export default function ComparisonTable({ providers }) {
  if (!providers.length) {
    return <div className="empty-state">Select providers to compare them here.</div>;
  }

  const rows = [
    ["Category", (p) => p.service_category || "—"],
    ["Verification", (p) => p.is_verified ? "✓ Verified" : "Not verified"],
    ["Rating", (p) => `${Number(p.rating || 0).toFixed(1)} / 5`],
    ["Total reviews", (p) => p.total_reviews ?? 0],
    ["Estimated price", (p) => p.price_range || "Not provided"],
    ["Availability", (p) => p.is_available ? "Available" : "Unavailable"],
    ["Service area", (p) => [p.area, p.city].filter(Boolean).join(", ") || "Not provided"],
    ["Service radius", (p) => p.service_radius ? `${p.service_radius} km` : "Not provided"],
  ];

  return (
    <div className="comparison-wrap">
      <table className="comparison-table">
        <thead>
          <tr>
            <th>Feature</th>
            {providers.map((provider) => (
              <th key={provider.id}>
                <Link to={`/providers/${provider.id}`}>
                  {provider.business_name || `Provider ${provider.id}`}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, getValue]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              {providers.map((provider) => (
                <td key={provider.id}>{getValue(provider)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
