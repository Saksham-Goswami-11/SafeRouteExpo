// src/pages/SearchPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; // URL padhne ke liye
import { searchSafety } from '../api/apiService';
import Input from '../components/Input';
import Button from '../components/Button';
import PostCard from '../components/PostCard';
import styles from './SearchPage.module.css';

const SearchPage = () => {
  const [searchParams] = useSearchParams(); // URL se query nikalne ke liye
  const urlQuery = searchParams.get('query'); // e.g., "Gurugram"
  
  const [query, setQuery] = useState(urlQuery || '');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Function jo actual API call karega
  const fetchSafetyReport = async (searchTerm) => {
    if (!searchTerm) return;
    setLoading(true);
    try {
      const response = await searchSafety(searchTerm);
      setResults(response.data);
    } catch (err) { 
      console.error(err); 
      setResults({ message: "Could not fetch report." });
    } finally { 
      setLoading(false); 
    }
  };

  // 1. Auto-Search: Jaise hi page load ho, agar URL mein query hai toh search karo
  useEffect(() => {
    if (urlQuery) {
      setQuery(urlQuery); // Input box fill karo
      fetchSafetyReport(urlQuery); // Direct API call karo
    }
  }, [urlQuery]);

  // 2. Manual Search: Jab user is page par aakar naya search kare
  const handleManualSearch = (e) => {
    e.preventDefault();
    fetchSafetyReport(query);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>AI Safety Search</h1>
        <p className={styles.subtitle}>Real-time analysis of community reports.</p>
        
        <form onSubmit={handleManualSearch} className={styles.searchForm}>
          <Input 
            placeholder="Enter location (e.g. Cyber Hub...)" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Analyzing...' : 'Generate Report'}
          </Button>
        </form>
      </header>

      {loading && <div className={styles.loader}>📡 Scanning Safety Data for "{query}"...</div>}

      {!loading && results && results.stats && (
        <div className={styles.reportCard}>
          <div className={styles.cardHeader}>
            <h2>Safety Report: <span style={{textTransform: 'capitalize'}}>{results.location}</span></h2>
            <span className={styles.statusBadge} data-level={results.stats.safetyLevel}>
              {results.stats.safetyLevel}
            </span>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <h3>{results.stats.averageRisk}%</h3>
              <p>AI Risk Score</p>
            </div>
            <div className={styles.statItem}>
              <h3>{results.stats.totalIncidents}</h3>
              <p>Total Reports</p>
            </div>
            <div className={styles.statItem}>
              <h3>{results.stats.flaggedHelpRequests}</h3>
              <p>Critical Flags</p>
            </div>
          </div>

          {/* AI Safety Tip (Placeholder for next step) */}
          <div className={styles.aiTipBox}>
            <strong>🤖 AI Tip:</strong> Based on recent data, this area is {results.stats.safetyLevel.toLowerCase()}. 
            {results.stats.safetyLevel === 'High Risk' ? ' Avoid traveling alone at night.' : ' Generally safe for commute.'}
          </div>

          <div className={styles.recentPosts}>
            <h3>Evidence from Community:</h3>
            {results.relevantPosts.length > 0 ? (
              results.relevantPosts.map(post => (
                <PostCard key={post._id} post={post} />
              ))
            ) : (
              <p>No recent reports found for this area.</p>
            )}
          </div>
        </div>
      )}

      {!loading && results && !results.stats && (
        <p className={styles.noData}>{results.message}</p>
      )}
    </div>
  );
};

export default SearchPage;