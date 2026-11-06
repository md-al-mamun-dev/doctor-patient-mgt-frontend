import { Suspense } from 'react';
import { Sidebar, Header } from '@/components/layout/Shell';
import { Toast } from '@/components/layout/Toast';

export default function PortalLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal?: React.ReactNode;
}) {
  return (
    <>
      <div className="flex min-h-screen bg-canvas min-w-0 max-w-full overflow-x-hidden">
        <Suspense fallback={<aside className="hidden lg:flex w-[248px] flex-col border-r border-line bg-white shrink-0" />}>
          <Sidebar />
        </Suspense>
        <div className="flex flex-1 flex-col min-w-0 max-w-full overflow-x-hidden">
          <Suspense fallback={<header className="h-16 border-b border-line bg-white shrink-0" />}>
            <Header />
          </Suspense>
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-7xl w-full mx-auto min-w-0">
            {children}
          </main>
        </div>
      </div>
      {modal}
      <Toast />
    </>
  );
}

