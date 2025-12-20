export default function SoundBarsBackground() {
  const bars = Array.from({ length: 60 });

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute inset-0 flex items-end justify-around gap-1 px-4 opacity-10">
        {bars.map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-gradient-to-t from-neon-green to-neon-red rounded-t-sm"
            style={{
              height: '100%',
              animation: `wave ${1 + Math.random() * 0.8}s ease-in-out infinite`,
              animationDelay: `${i * 0.05}s`,
              maxWidth: '8px',
            }}
          />
        ))}
      </div>
    </div>
  );
}
