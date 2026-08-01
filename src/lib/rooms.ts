// Anonymous-chat room signaling backed by Supabase (replaces Firebase RTDB).
// PeerJS still carries the actual chat messages peer-to-peer; this module only
// handles matchmaking and room metadata.
import { getSupabase } from './supabase';

// 1 hour = 3600000ms
const SESSION_TIMEOUT = 60 * 60 * 1000;

const TABLE = 'chat_rooms';

export interface Room {
  id: string;
  createdAt: number;
  hostPeerId: string;
  guestPeerId?: string;
  expiresAt: number;
}

interface RoomRow {
  id: string;
  created_at: number;
  host_peer_id: string;
  guest_peer_id: string | null;
  expires_at: number;
}

function toRoom(row: RoomRow): Room {
  return {
    id: row.id,
    createdAt: row.created_at,
    hostPeerId: row.host_peer_id,
    guestPeerId: row.guest_peer_id ?? undefined,
    expiresAt: row.expires_at,
  };
}

// Create room
export async function createRoom(peerId: string): Promise<string> {
  const now = Date.now();
  const roomId = crypto.randomUUID().replace(/-/g, '').slice(0, 20);

  const { error } = await getSupabase().from(TABLE).insert({
    id: roomId,
    created_at: now,
    host_peer_id: peerId,
    expires_at: now + SESSION_TIMEOUT,
  });
  if (error) throw new Error(`Failed to create room: ${error.message}`);

  return roomId;
}

// Join room as guest
export async function joinRoom(roomId: string, peerId: string): Promise<Room | null> {
  const room = await getRoom(roomId);
  if (!room) return null;

  // Expired room
  if (Date.now() > room.expiresAt) {
    await deleteRoom(roomId);
    return null;
  }

  const { error } = await getSupabase()
    .from(TABLE)
    .update({ guest_peer_id: peerId })
    .eq('id', roomId);
  if (error) throw new Error(`Failed to join room: ${error.message}`);

  return room;
}

// Get room info
export async function getRoom(roomId: string): Promise<Room | null> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select('*')
    .eq('id', roomId)
    .maybeSingle<RoomRow>();

  if (error || !data) return null;
  return toRoom(data);
}

// Subscribe to room updates (insert/update/delete on this room row)
export function subscribeToRoom(roomId: string, callback: (room: Room | null) => void): () => void {
  const supabase = getSupabase();
  const channel = supabase
    .channel(`room-${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLE, filter: `id=eq.${roomId}` },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          callback(null);
        } else {
          callback(toRoom(payload.new as RoomRow));
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Find a waiting room (random matching)
export async function findWaitingRoom(): Promise<Room | null> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select('*')
    .is('guest_peer_id', null)
    .gt('expires_at', Date.now())
    .limit(20);

  if (error || !data || data.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * data.length);
  return toRoom(data[randomIndex] as RoomRow);
}

// Delete room
export async function deleteRoom(roomId: string): Promise<void> {
  await getSupabase().from(TABLE).delete().eq('id', roomId);
}

// Clean up expired rooms (also enforced server-side by a scheduled job)
export async function cleanupExpiredRooms(): Promise<void> {
  await getSupabase().from(TABLE).delete().lt('expires_at', Date.now());
}
