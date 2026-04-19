/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

export default function App() {
  const [items, setItems] = useState("1,2,3,4,5,6,7,8,9,10");
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [history, setHistory] = useState<{winner: string, timestamp: string}[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const velocityRef = useRef(0);
  
  // Load history on mount
  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem('spinHistory') || '[]'));
  }, [winner]); // Update when winner changes

  const parsedItems = items.split(',').map(i => i.trim()).filter(i => i !== "");

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const sliceAngle = (2 * Math.PI) / parsedItems.length;

    parsedItems.forEach((item, index) => {
      const angle = index * sliceAngle + rotation;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + sliceAngle);
      ctx.closePath();
      
      // Distinct, bright colors
      ctx.fillStyle = `hsl(${(index * 360) / parsedItems.length}, 70%, 60%)`;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.fillText(item, radius - 10, 10);
      ctx.restore();
    });
  }, [parsedItems, rotation]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  const spin = () => {
    if (isSpinning || parsedItems.length === 0) return;
    setIsSpinning(true);
    setWinner(null);
    velocityRef.current = Math.random() * 0.5 + 0.5; // Initial velocity

    const animate = () => {
      velocityRef.current *= 0.985; // Deceleration
      setRotation(prev => prev + velocityRef.current);
      
      if (velocityRef.current > 0.001) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        const finalRotation = (rotation % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const sliceAngle = (2 * Math.PI) / parsedItems.length;
        const winnerIndex = Math.floor(((2 * Math.PI - finalRotation) % (2 * Math.PI)) / sliceAngle);
        const newWinner = parsedItems[winnerIndex];
        setWinner(newWinner);
        
        // Save to localStorage
        const history = JSON.parse(localStorage.getItem('spinHistory') || '[]');
        localStorage.setItem('spinHistory', JSON.stringify([...history, { winner: newWinner, timestamp: new Date().toISOString() }]));
        
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    };
    animate();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 font-sans">
      <h1 className="text-4xl font-bold mb-6 text-gray-800">抽籤大轉盤</h1>
      
      <div className="mb-4 w-full max-w-md">
        <input 
          type="text"
          value={items}
          onChange={(e) => setItems(e.target.value)}
          placeholder="輸入名單，以逗號分隔"
          className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          disabled={isSpinning}
        />
      </div>

      <button 
        onClick={spin}
        disabled={isSpinning || parsedItems.length === 0}
        className="mb-8 px-8 py-3 bg-blue-600 text-white rounded-full font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
      >
        {isSpinning ? '轉動中...' : '開始抽籤'}
      </button>

      <div className="relative">
        <div className="absolute top-0 left-1/2 -ml-3 w-6 h-6 bg-red-600 [clip-path:polygon(50%_100%,0_0,100%_0)] z-10" />
        <canvas ref={canvasRef} width={400} height={400} className="rounded-full shadow-xl" />
      </div>

      {winner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center transform scale-150 animate-bounce">
            <h2 className="text-2xl font-bold mb-4 text-gray-700">恭喜！</h2>
            <p className="text-6xl font-extrabold text-blue-600">{winner}</p>
            <button onClick={() => setWinner(null)} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg">關閉</button>
          </div>
        </div>
      )}

      {/* Spin History */}
      <div className="w-full max-w-md mt-8 bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800">抽籤紀錄</h2>
        {history.length === 0 ? (
          <p className="text-gray-500">暫無記錄</p>
        ) : (
          <ul className="space-y-2">
            {[...history].reverse().map((h, i) => (
              <li key={i} className="flex justify-between border-b pb-2 text-sm">
                <span className="font-semibold text-blue-600">{h.winner}</span>
                <span className="text-gray-500">{new Date(h.timestamp).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
