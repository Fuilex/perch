import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { useApp } from '@/store/app';
import { isTauri } from '@/lib/ipc';
import { useT } from '@/lib/i18n';
import { Mark } from './Brand';

/**
 * Drop a folder on the window to start watching it.
 *
 * Tauri delivers the drop through the webview rather than as a DOM event — the
 * DOM one carries no real path — so this listens to `onDragDropEvent` and hands
 * each path to the same command the picker uses. The backend rejects anything
 * that isn't a directory, so a dropped file gets a plain error rather than a
 * broken watch entry.
 */
export function DropZone() {
  const t = useT();
  const [over, setOver] = useState(false);
  const addFolderByPath = useApp((s) => s.addFolderByPath);
  const locked = useApp((s) => Boolean(s.account?.exists && !s.account.unlocked));

  useEffect(() => {
    if (!isTauri || locked) return;

    let unlisten: (() => void) | undefined;
    let cancelled = false;

    void getCurrentWebview()
      .onDragDropEvent((event) => {
        if (event.payload.type === 'over') {
          setOver(true);
        } else if (event.payload.type === 'drop') {
          setOver(false);
          for (const path of event.payload.paths) {
            void addFolderByPath(path);
          }
        } else {
          setOver(false);
        }
      })
      .then((off) => {
        if (cancelled) off();
        else unlisten = off;
      });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [addFolderByPath, locked]);

  return (
    <AnimatePresence>
      {over && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 300,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-3)',
            pointerEvents: 'none',
            backgroundColor: 'var(--glass-fill-active)',
            backdropFilter: 'blur(10px)',
            boxShadow: 'inset 0 0 0 2px var(--accent)',
            borderRadius: 'inherit',
          }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ color: 'var(--text-secondary)' }}
          >
            <Mark size={36} />
          </motion.div>
          <span className="text-body" style={{ fontWeight: 500 }}>
            {t('drop.hint')}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
