export default function ColombiaLogo() {
  return (
    <div className="bg-white p-3 rounded-2xl shadow-lg mb-6">
      <svg width="80" height="80" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="flag" x1="0" x2="0" y1="0" y2="1">
            <stop offset="50%" stopColor="#FFCD00" />
            <stop offset="50%" stopColor="#003893" />
            <stop offset="75%" stopColor="#003893" />
            <stop offset="75%" stopColor="#CE1126" />
          </linearGradient>
          <mask id="cShape">
            <path fill="white" d="M95,50 A45,45 0 1,1 95.001,50 Z" />
            <path fill="black" d="M80,50 A30,30 0 1,1 80.001,50 Z" />
            <rect x="50" y="40" width="50" height="20" fill="black" />
            <polygon points="45,50 65,35 65,65" fill="white" />
          </mask>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill="url(#flag)" mask="url(#cShape)" />
      </svg>
    </div>
  );
}
