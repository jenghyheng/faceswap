'use client';

import { useState, useEffect } from 'react';

interface MobileDetectReturn {
  isMobile: boolean;
  isTablet: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  isTouch: boolean;
}

const useMobileDetect = (): MobileDetectReturn => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isPortrait, setIsPortrait] = useState(true);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|windows phone/i;
      const tabletRegex = /ipad|android(?!.*mobile)/i;
      
      setIsMobile(mobileRegex.test(userAgent));
      setIsTablet(tabletRegex.test(userAgent));
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
      
      const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
      setIsPortrait(orientation === 'portrait');
      setIsLandscape(orientation === 'landscape');
    };

    checkDevice();

    const handleResize = () => {
      const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
      setIsPortrait(orientation === 'portrait');
      setIsLandscape(orientation === 'landscape');
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return { isMobile, isTablet, isPortrait, isLandscape, isTouch };
};

export default useMobileDetect; 