// export default function RotatingGlobe() {
//   return (
//     <div className="globe-container">
//       <svg viewBox="0 0 200 200" className="globe-svg">
//         <circle
//           cx="100"
//           cy="100"
//           r="90"
//           className="globe-line"
//         />

//         <ellipse cx="100" cy="100" rx="60" ry="90" className="globe-line" />
//         <ellipse cx="100" cy="100" rx="30" ry="90" className="globe-line" />

//         <ellipse cx="100" cy="100" rx="90" ry="60" className="globe-line" />
//         <ellipse cx="100" cy="100" rx="90" ry="30" className="globe-line" />
//       </svg>
//     </div>
//   );
// }

export default function RotatingGlobe() {
  return (
    <div className="globe-container">
      <svg viewBox="0 0 200 200" className="globe-svg">
        {/* Outer circle */}
        <circle cx="100" cy="100" r="90" className="globe-line" />

        {/* Moving longitude group */}
        <g className="longitude-group">
          <ellipse cx="100" cy="100" rx="60" ry="90" className="globe-line" />
          <ellipse cx="100" cy="100" rx="30" ry="90" className="globe-line" />
        </g>

        <g className="longitude-group reverse">
          <ellipse cx="100" cy="100" rx="75" ry="90" className="globe-line faint" />
        </g>

        {/* Latitude (static) */}
        <ellipse cx="100" cy="100" rx="90" ry="60" className="globe-line" />
        <ellipse cx="100" cy="100" rx="90" ry="30" className="globe-line" />
      </svg>
    </div>
  );
}