import { useEffect, useState } from "react";
import { browser } from "wxt/browser";
import {
  Bell,
  Check,
  CheckCheck,
  ClipboardList,
  ArrowRightLeft,
  MessageSquare,
  CheckCircle2,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api-client";
import { buildDeepLink } from "@/lib/deep-link";
import { SERVER_URL } from "@/lib/config";
import type { ServerNotification } from "@/types/api";

const EMOJI_RE =
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{2B55}\u{FE00}-\u{FEFF}]/gu;

function stripEmoji(text: string): string {
  return text.replace(EMOJI_RE, "").trim();
}

function getNotificationIcon(type: string) {
  const iconProps = { size: 16 };
  switch (type) {
    case "assignment":
      return <ClipboardList {...iconProps} />;
    case "status_change":
      return <ArrowRightLeft {...iconProps} />;
    case "comment":
      return <MessageSquare {...iconProps} />;
    case "task_closed":
      return <CheckCircle2 {...iconProps} />;
    case "due_reminder":
      return <Clock {...iconProps} />;
    default:
      return <Bell {...iconProps} />;
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "justo ahora";
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInHours < 24) return `${diffInHours}h`;
  if (diffInDays === 1) return "ayer";
  if (diffInDays < 7) return `${diffInDays}d`;
  return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
}

export function NotificationsView() {
  const [items, setItems] = useState<ServerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setItems(await getNotifications());
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "No se pudieron cargar los avisos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function open(n: ServerNotification) {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      void markNotificationRead(n.id).catch(() => {});
    }
    const url = buildDeepLink(SERVER_URL, n.actionUrl);
    if (url) await browser.tabs.create({ url });
  }

  async function markOne(e: React.MouseEvent, n: ServerNotification) {
    e.stopPropagation();
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    void markNotificationRead(n.id).catch(() => {});
  }

  async function markAll() {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    await markAllNotificationsRead().catch(() => {});
  }

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div>
      <div className="btn-row" style={{ marginBottom: 12 }}>
        <button className="btn outline" onClick={load}>
          <RefreshCw size={13} /> Actualizar
        </button>
        {unreadCount > 0 && (
          <button className="btn outline" onClick={markAll}>
            <CheckCheck size={13} /> Marcar todo leído
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="center">Cargando…</div>
      ) : items.length === 0 ? (
        <div className="notif-empty">
          <div className="notif-empty-icon">
            <Bell size={22} />
          </div>
          <div className="notif-empty-title">No hay avisos</div>
          <div className="notif-empty-desc">
            Cuando recibas avisos, aparecerán aquí
          </div>
        </div>
      ) : (
        items.map((n) => (
          <div
            key={n.id}
            className={`notif notif-type-${n.type} ${n.read ? "" : "unread"}`}
            onClick={() => open(n)}
          >
            <div className={`notif-icon notif-icon-${n.type}`}>
              {getNotificationIcon(n.type)}
            </div>
            <div className="notif-body">
              <div className="notif-title-row">
                <div className="notif-title">
                  {stripEmoji(n.title)}
                  {!n.read && <span className="notif-dot" />}
                </div>
                <span className="notif-time">{formatTimeAgo(n.createdAt)}</span>
              </div>
              <div className="notif-msg">{stripEmoji(n.message)}</div>
              {n.actionUrl && <span className="notif-badge">Ver tarea</span>}
            </div>
            {!n.read && (
              <button
                className="notif-mark-btn"
                onClick={(e) => markOne(e, n)}
                title="Marcar como leído"
              >
                <Check size={14} />
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
