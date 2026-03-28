import { useEffect, useState } from 'react';

const StarBackground = () => {
    const [stars, setStars] = useState<{ 
        id: number; 
        top: string; 
        left: string; 
        size: string; 
        duration: string; 
    }[]>([]);

  useEffect(() => {
    const starCount = 120;
    const newStars = [];

    for (let i = 0; i < starCount; i++) {
      newStars.push({
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: `${Math.random() * 2 + 1}px`,
        duration: `${Math.random() * 10 + 2}s`,
      });
    }
    setStars(newStars);
  }, []); // Empty array ensures this runs ONLY once on mount

  return (
    <div id="star-container">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            ['--duration' as any]: star.duration,
          } as any}
        />
      ))}
    </div>
  );
};

export default StarBackground;