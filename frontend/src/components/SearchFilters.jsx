const CATEGORIES = [
  "Electrician",
  "Plumber",
  "AC technician",
  "Computer repair",
  "Cleaner",
];

export default function SearchFilters({ filters, onChange, onSearch, onReset }) {
  function updateField(event) {
    onChange({ ...filters, [event.target.name]: event.target.value });
  }

  function submit(event) {
    event.preventDefault();
    onSearch();
  }

  return (
    <form className="filter-panel" onSubmit={submit}>
      <div className="filter-heading">
        <div>
          <p className="eyebrow">Narrow your search</p>
          <h2>What do you need help with?</h2>
        </div>
        <button className="text-button" type="button" onClick={onReset}>Clear filters</button>
      </div>

      <div className="filter-grid">
        <label>
          Service category
          <select name="category" value={filters.category} onChange={updateField}>
            <option value="">All categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
        <label>
          City
          <input name="city" value={filters.city} onChange={updateField} placeholder="e.g. Dhaka" />
        </label>
        <label>
          Area
          <input name="area" value={filters.area} onChange={updateField} placeholder="e.g. Dhanmondi" />
        </label>
        <label>
          Sort by
          <select name="sort" value={filters.sort} onChange={updateField}>
            <option value="">Recommended</option>
            <option value="rating">Highest rating</option>
            <option value="price">Lowest price (when comparable)</option>
            <option value="distance">Nearest (requires coordinates)</option>
          </select>
        </label>
      </div>

      <button className="button" type="submit">Search providers</button>
    </form>
  );
}
