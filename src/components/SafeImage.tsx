import { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function SafeImage({ src, alt, className = '' }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0B1F3A] via-[#132B4F] to-[#1D4ED8] text-white p-6 ${className}`}
        role="img"
        aria-label={alt}
      >
        <BookOpen className="w-8 h-8 mb-2 opacity-80" />
        <span className="text-xs text-center font-medium opacity-90">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
