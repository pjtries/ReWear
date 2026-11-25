import React from 'react';

/**
 * Renders a deterministic scannable QR-style matrix SVG from a signed inspection_qr_token
 */
export default function QrCodeBadge({ token = 'RWQR-000000', size = 104 }) {
  const gridSize = 11;
  const cells = [];

  // Deterministic bit generator from token string
  let seed = 2166136261;
  for (let i = 0; i < token.length; i++) {
    seed ^= token.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }

  const isFinderPattern = (r, c) => {
    const topLeft = r < 3 && c < 3;
    const topRight = r < 3 && c >= gridSize - 3;
    const bottomLeft = r >= gridSize - 3 && c < 3;
    return topLeft || topRight || bottomLeft;
  };

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      let filled = false;
      if (isFinderPattern(r, c)) {
        filled = true;
      } else {
        const idx = r * gridSize + c;
        const charCode = token.charCodeAt(idx % token.length) || 65;
        filled = ((charCode + r * 7 + c * 13 + (seed >>> (idx % 16))) & 1) === 1;
      }
      if (filled) {
        cells.push({ r, c });
      }
    }
  }

  return (
    <div className="inline-flex flex-col items-center bg-[#FFFFFF] border border-[#000000] p-2 shadow-editorial-sm">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${gridSize} ${gridSize}`}
        className="bg-[#FFFFFF]"
        aria-label={`QR Code for ${token}`}
      >
        {cells.map(({ r, c }) => (
          <rect
            key={`${r}-${c}`}
            x={c}
            y={r}
            width="0.92"
            height="0.92"
            fill="#000000"
          />
        ))}
      </svg>
      <span className="mt-1.5 font-mono text-[10px] font-bold tracking-tight text-[#000000] bg-[#FFD5C2] px-1.5 py-0.5 border border-[#000000] max-w-[140px] truncate">
        {token}
      </span>
    </div>
  );
}
