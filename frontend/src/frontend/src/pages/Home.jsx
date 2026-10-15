import { useState } from "react";
import { useNavigate } from "react-router-dom";

const services = [
  { icon: "⚡", name: "Electrician", detail: "Electrical repairs and installations" },
  { icon: "🔧", name: "Plumber", detail: "Leaks, pipes and plumbing work" },
  { icon: "❄️", name: "AC technician", detail: "AC servicing and repair" },
  { icon: "💻", name: "Computer repair", detail: "Laptop and computer support" },
  { icon: "🧹", name: "Cleaner", detail: "Home and office cleaning" },
];

export default function Home() {
  const navigate = useNavigate();
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");

  function search(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (city.trim()) params.set("city", city.trim());
    if (area.trim()) params.set("area", area.trim());
    navigate(`/providers?${params.toString()}`);
  }

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <span className="hero-pill"><span className="live-dot" /> Your neighbourhood, made easier</span>
          <h1>Trusted local help.<br /><span>Right near you.</span></h1>
          <p className="hero-copy">
            Find and compare local service professionals for everyday repairs and home services.
            Start with your service and location.
          </p>

          <form className="hero-search" onSubmit={search}>
            <label>
              <span>Service</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Any service</option>
                {services.map((service) => <option key={service.name} value={service.name}>{service.name}</option>)}
              </select>
            </label>
            <label>
              <span>City</span>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Enter your city" />
            </label>
            <label>
              <span>Area</span>
              <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Optional area" />
            </label>
            <button className="button" type="submit">Find help <span aria-hidden="true">→</span></button>
          </form>
          <p className="hero-note">Browse provider profiles and compare your options before contacting them.</p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-circle circle-one" />
          <div className="art-circle circle-two" />
          <div className="art-card art-card-main">
            <div className="art-check">✓</div>
            <div><strong>Local professionals</strong><small>Discover services near you</small></div>
          </div>
          <div className="art-card art-card-small">
            <span className="art-star">★</span>
            <div><strong>Compare options</strong><small>Ratings · Price · Area</small></div>
          </div>
          <div className="art-house">⌂</div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div><p className="eyebrow">Find the right person</p><h2>Services for everyday needs</h2></div>
          <button className="text-button" onClick={() => navigate("/providers")}>Explore all providers →</button>
        </div>
        <div className="service-grid">
          {services.map((service) => (
            <button className="service-card" key={service.name} onClick={() => navigate(`/providers?${new URLSearchParams({ category: service.name })}`)}>
              <span className="service-icon">{service.icon}</span>
              <strong>{service.name}</strong>
              <span>{service.detail}</span>
              <span className="service-arrow">↗</span>
            </button>
          ))}
        </div>
      </section>

      <section className="trust-banner">
        <div className="trust-icon">✓</div>
        <div><h2>Make a more informed choice</h2><p>Check verification status, ratings, service areas and estimated prices on provider profiles.</p></div>
        <button className="button button-light" onClick={() => navigate("/providers")}>Browse providers</button>
      </section>
    </>
  );
}
