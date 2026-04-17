import React from 'react';
import { Link } from 'react-router-dom';

const FeatureCard = ({ icon, title, description, badge }) => (
  <div className="glass p-10 rounded-[2.5rem] border border-white/5 hover:border-primary/20 transition-all duration-500 group">
    <div className="flex justify-between items-start mb-6">
      <div className="text-4xl">{icon}</div>
      {badge && (
        <span className="text-[10px] font-bold tracking-widest uppercase bg-primary/10 text-primary px-3 py-1 rounded-full">
          {badge}
        </span>
      )}
    </div>
    <h3 className="font-display text-3xl mb-4 font-semibold text-on-surface group-hover:text-primary transition-colors">
      {title}
    </h3>
    <p className="text-tertiary text-lg leading-relaxed">{description}</p>
  </div>
);

const Home = () => {
  return (
    <div className="flex flex-col gap-20 items-center text-center mt-12 md:mt-24 max-w-6xl mx-auto px-4 pb-20">
      
      {/* Hero Section */}
      <div className="max-w-4xl space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container border border-outline-variant/10 text-xs font-bold tracking-[0.2em] text-secondary uppercase animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          The Future of Smart Parking
        </div>

        <h1 className="font-display font-black text-6xl md:text-8xl text-on-surface leading-tight tracking-tight">
          The <span className="text-primary" style={{ textShadow: '0 0 40px rgba(183,196,255,0.3)' }}>Predictive</span> <br /> 
          Monolith.
        </h1>
        
        <p className="text-xl md:text-2xl text-tertiary max-w-3xl mx-auto font-medium leading-relaxed">
          Experience a high-end, effortless parking system. Find and reserve open slots in real-time, illuminated by intelligence.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 pt-6">
          <Link to="/parking" className="px-10 py-5 text-xl rounded-full bg-primary text-on-primary font-display font-bold hover:scale-105 hover:shadow-[0_0_40px_rgba(183,196,255,0.4)] transition-all duration-300">
            Find Available Slots
          </Link>
          <Link to="/register" className="px-10 py-5 text-xl rounded-full glass border border-white/10 text-on-surface font-display font-bold hover:border-primary/30 transition-all duration-300">
            Get Started
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        <FeatureCard 
          icon="🛰️"
          title="Live Pulse"
          badge="Real-time"
          description="See exactly which slots are open via our pulse interface. Updates every second across all locations."
        />
        <FeatureCard 
          icon="⚡"
          title="Instant Reserve"
          badge="Seamless"
          description="Secure your spot in seconds. One-tap booking with integrated payments and vehicle management."
        />
      </div>

      {/* Stats Section */}
      <div className="w-full flex flex-wrap justify-center gap-12 py-12 border-y border-white/5">
        <div className="space-y-1">
          <div className="text-4xl font-display font-black text-on-surface">99.9%</div>
          <div className="text-xs font-bold tracking-widest text-tertiary uppercase">Uptime Reliability</div>
        </div>
        <div className="space-y-1">
          <div className="text-4xl font-display font-black text-on-surface">1.2s</div>
          <div className="text-xs font-bold tracking-widest text-tertiary uppercase">Sync Latency</div>
        </div>
        <div className="space-y-1">
          <div className="text-4xl font-display font-black text-on-surface">24/7</div>
          <div className="text-xs font-bold tracking-widest text-tertiary uppercase">Active Monitoring</div>
        </div>
      </div>
    </div>
  );
};

export default Home;
