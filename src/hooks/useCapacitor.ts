import { useEffect, useState } from 'react';

export const useCapacitor = () => {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<'web' | 'ios' | 'android'>('web');

  useEffect(() => {
    const checkCapacitor = async () => {
      if (typeof window !== 'undefined') {
        // Check if running in Capacitor
        const isCapacitor = !!(window as any).Capacitor;
        setIsNative(isCapacitor);
        
        if (isCapacitor) {
          const { Capacitor } = await import('@capacitor/core');
          setPlatform(Capacitor.getPlatform() as 'ios' | 'android');
        }
      }
    };

    checkCapacitor();
  }, []);

  return { isNative, platform };
};
