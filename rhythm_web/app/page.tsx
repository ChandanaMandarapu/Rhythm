'use client';

import dynamic from 'next/dynamic';

const AlpenglowScene = dynamic(() => import('@/components/AlpenglowScene'), { ssr: false });

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <AlpenglowScene />
    </main>
  );
}
