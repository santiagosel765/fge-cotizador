'use client';

import { usePathname } from 'next/navigation';
import { ChatFab } from '@/components/chat/ChatFab';

export function ChatWrapper(): JSX.Element {
  const pathname = usePathname();
  const projectId = pathname.startsWith('/projects/') ? pathname.split('/')[2] : undefined;

  return <ChatFab projectId={projectId} />;
}
