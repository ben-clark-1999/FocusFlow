import React from 'react';

/**
 * Decorative bottom waves + soft reflection.
 * Subtle, theme aware, low motion.
 */
export default function Waterline() {
  return (
    <div className="waterline" aria-hidden="true">
      {/* moving waves (two layers for parallax) */}
      <div className="wave wave--back" />
      <div className="wave wave--front" />
      {/* faint reflection strip */}
      <div className="reflection" />
    </div>
  );
}
