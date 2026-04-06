import { useState, useEffect } from 'react';

let cachedBranding = null;

export default function useOrgBranding() {
  const [branding, setBranding] = useState(cachedBranding || {
    logo: null,
    productName: 'CloudSentrix',
    primaryColor: '#7c3aed',
    colors: null,
  });

  useEffect(() => {
    if (cachedBranding) return;
    const token = localStorage.getItem('cm_token');
    if (!token) return;
    fetch('/api/org/branding', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const b = {
          logo: data.logo,
          productName: data.product_name || 'CloudSentrix',
          primaryColor: data.primary_color || '#7c3aed',
          colors: data.colors,
        };
        cachedBranding = b;
        setBranding(b);
      })
      .catch(() => {});
  }, []);

  return branding;
}
