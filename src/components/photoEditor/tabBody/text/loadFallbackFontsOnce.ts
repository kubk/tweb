let loaded = false;

// Loads non-proprietary fallback for some missing proprietary fonts
export async function loadFallbackFontsOnce() {
  if(loaded) return;
  loaded = true;

  function loadFont(fontName: string) {
    return new Promise((resolve, reject) => {
      const url = `https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}&display=swap`;
      const link = document.createElement('link');
      link.href = url;
      link.rel = 'stylesheet';
      link.onload = () => {
        // @ts-ignore
        resolve();
      };
      link.onerror = () => {
        console.error(`Failed to load font ${fontName}`);
        reject(new Error(`Failed to load font ${fontName}`));
      };
      document.head.appendChild(link);
    });
  }

  const fonts = [
    'Special Elite',
    'Nunito',
    'Architects Daughter',
    'Dancing Script'
  ];

  return Promise.all(fonts.map(loadFont));
}
