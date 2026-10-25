# AI & Algorithmic Fraud Detection (Roadmap)

## Planned Heuristic & AI Integration
AegisBank uses deterministic rules for transactional safety (IDOR checks, double-entry balance validation). 

### Planned Machine Learning Pipeline
- **Anomaly Detection**: An isolation forest model to score velocity anomalies (e.g. 5 large transfers within 60 seconds from a new IP).
- **Categorization NLP**: Categorizing merchant transfer descriptions into expense buckets (Groceries, Utilities, Travel).
