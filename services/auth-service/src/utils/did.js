const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const generateDID = (countryCode = 'CMR') => {
  const suffix = Array.from({ length: 8 }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('');
  return `did:medichain:${countryCode}-${suffix}`;
};

module.exports = { generateDID };
