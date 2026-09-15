import { useEffect, useState } from 'react';

export const useCapacitor = () => {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<'web' | 'ios' | 'android'>('web');

  useEffect(() => {
    const checkCapacitor = async () => {
      if (typeof window !== 'undefined') {
        const { Capacitor } = await import('@capacitor/core');
        const isCapacitor = Capacitor.isNativePlatform();
        setIsNative(isCapacitor);
        setPlatform(Capacitor.getPlatform() as 'web' | 'ios' | 'android');
      }
    };

    checkCapacitor();
  }, []);

  return { isNative, platform };
};
