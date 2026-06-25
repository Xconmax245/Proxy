"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function AosInit() {
  const pathname = usePathname();

  useEffect(() => {
    AOS.init({
      duration: 600,
      once: false,
      easing: 'ease-out-cubic',
      offset: 40,
    });
  }, []);

  // Re-refresh AOS whenever the route changes so animations fire on every page
  useEffect(() => {
    AOS.refresh();
  }, [pathname]);

  return null;
}
