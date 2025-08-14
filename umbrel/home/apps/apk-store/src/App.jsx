import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const response = await fetch('/api/apks');
      if (!response.ok) throw new Error('Erro ao carregar apps');
      const data = await response.json();
      setApps(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (app) => {
    const link = document.createElement('a');
    link.href = app.downloadUrl;
    link.download = app.filename;
    link.click();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando apps...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>❌ Erro</h2>
        <p>{error}</p>
        <button onClick={fetchApps} className="retry-btn">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="background-blur"></div>
      
      <header className="header">
        <div className="header-content">
          <h1>📱 APK Store</h1>
          <p>Downloads seguros para sua comunidade</p>
        </div>
      </header>

      <main className="main">
        {apps.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h2>Nenhum app disponível</h2>
            <p>Adicione arquivos APK na pasta /mnt/data/arquivos/local/Apk/</p>
          </div>
        ) : (
          <div className="apps-grid">
            {apps.map((app) => (
              <div 
                key={app.id} 
                className="app-card"
                onClick={() => handleDownload(app)}
              >
                <div className="app-icon">
                  {app.icon}
                </div>
                <div className="app-info">
                  <h3 className="app-name">{app.name}</h3>
                  <p className="app-size">{app.size}</p>
                </div>
                <div className="download-indicator">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path 
                      d="M12 15L7 10H17L12 15Z" 
                      fill="currentColor"
                    />
                    <path 
                      d="M12 4V14M5 20H19" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Umbrel Community Store • APK Store</p>
      </footer>
    </div>
  );
}

export default App;