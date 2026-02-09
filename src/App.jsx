import { useEffect, useRef, useState } from "react";
import { ROOMS } from "./data/rooms";
import RoomRow from "./components/RoomRow";

const EVENTS_KEY = "zakum-preq-events";
const SKIP_KEY = "zakum-preq-skipped-rooms";
const DOCS_NEEDED = 30;
const OPTIONAL_THRESHOLD = 8;
const SHOW_DEBUG = false;

const GRID_COLS = "110px 140px 140px 120px 140px 1fr 80px";

function App() {
  const [events, setEvents] = useState([]);
  const [skippedRooms, setSkippedRooms] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const roomRefs = useRef({});

  useEffect(() => {
    const savedEvents = localStorage.getItem(EVENTS_KEY);
    if (savedEvents) {
      try {
        setEvents(JSON.parse(savedEvents));
      } catch {
        setEvents([]);
        localStorage.removeItem(EVENTS_KEY);
      }
    }

    const savedSkipped = localStorage.getItem(SKIP_KEY);
    if (savedSkipped) {
      try {
        setSkippedRooms(JSON.parse(savedSkipped));
      } catch {
        setSkippedRooms([]);
        localStorage.removeItem(SKIP_KEY);
      }
    }

    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  }, [events, hasLoaded]);

  useEffect(() => {
    if (!hasLoaded) return;
    localStorage.setItem(SKIP_KEY, JSON.stringify(skippedRooms));
  }, [skippedRooms, hasLoaded]);

  function updateRoomEvent(roomId, updater) {
    setEvents((prev) => {
      const next = [...prev];
      const idx = next.findIndex((e) => e.type === "room" && e.roomId === roomId);

      const prevEvent = idx === -1 ? null : next[idx];
      const updated = updater(prevEvent);

      if (idx === -1) next.push(updated);
      else next[idx] = updated;

      return next;
    });
  }

  function addTeleport() {
    setEvents((prev) => [...prev, { type: "teleport" }]);
  }

  function undoLastTeleport() {
    setEvents((prev) => {
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i]?.type === "teleport") {
          return [...prev.slice(0, i), ...prev.slice(i + 1)];
        }
      }
      return prev;
    });
  }

  function removeTeleportAtIndex(eventIndex) {
    setEvents((prev) => prev.filter((_, i) => i !== eventIndex));
  }

  function resetAll() {
    setEvents([]);
    setSkippedRooms([]);
    localStorage.removeItem(EVENTS_KEY);
    localStorage.removeItem(SKIP_KEY);
  }

  function getRoomEvent(roomId) {
    return events.find((e) => e.type === "room" && e.roomId === roomId) || null;
  }

  function countDocsCollected() {
    let total = 0;
    for (const room of ROOMS) {
      const ev = getRoomEvent(room.id);
      const docs = ev?.docs ?? room.docs.map(() => false);
      for (const v of docs) if (v) total++;
    }
    return total;
  }

  function countKeysCollected() {
    let total = 0;
    for (const room of ROOMS) {
      if (!room.key) continue;
      const ev = getRoomEvent(room.id);
      if (ev?.key) total++;
    }
    return total;
  }

  function remainingDocsInRoom(room) {
    const ev = getRoomEvent(room.id);
    const docs = ev?.docs ?? room.docs.map(() => false);
    return docs.filter((v) => !v).length;
  }

  function totalRemainingDocsExcluding(roomToExclude) {
    let total = 0;
    for (const room of ROOMS) {
      if (room.id === roomToExclude.id) continue;
      if (!room.key && skippedRooms.includes(room.id)) continue;

      const ev = getRoomEvent(room.id);
      const docs = ev?.docs ?? room.docs.map(() => false);
      total += docs.filter((v) => !v).length;
    }
    return total;
  }

  function isRoomOptional(room, docsRemainingNeeded) {
    if (docsRemainingNeeded > OPTIONAL_THRESHOLD) return false;
    if (room.key) return false;
    if (room.onPath) return false;

    const remainingHere = remainingDocsInRoom(room);
    if (remainingHere === 0) return false;

    const remainingElsewhere = totalRemainingDocsExcluding(room);
    return remainingElsewhere >= docsRemainingNeeded;
  }

  function isRoomFullyDone(room) {
    const ev = getRoomEvent(room.id);
    const docs = ev?.docs ?? room.docs.map(() => false);
    const docsDone = docs.every(Boolean);
    const keyDone = room.key ? !!ev?.key : true;
    return docsDone && keyDone;
  }

  function shouldIgnoreRoom(room) {
    const hasWork = room.docs.length > 0 || !!room.key;
    if (!hasWork) return true;
    if (room.ignoreForNextTarget) return true;
    if (!room.key && skippedRooms.includes(room.id)) return true;
    return false;
  }

  const docsCollected = countDocsCollected();
  const keysCollected = countKeysCollected();
  const docsRemainingNeeded = Math.max(0, DOCS_NEEDED - docsCollected);

  const nextTargetRoom =
    ROOMS.find((room) => {
      if (shouldIgnoreRoom(room)) return false;
      return !isRoomFullyDone(room);
    }) || null;

  return (
    <div style={{ padding: 16, maxWidth: 1200, color: "var(--text)" }}>
      <h1 style={{ marginBottom: 8, textAlign: "center" }}>Sparrow's Zakum Prequest Helper</h1>

      <div style={{ marginBottom: 10, fontSize: 13, opacity: 0.9, color: "var(--muted)" }}>
        This is a checklist tool to obtain all 30 Paper Documents in Zakum Prequest Stage 1. Completing this optional challenge rewards all participants with 5 Return Scrolls to Dead Mine, which teleports players to Dead Mine I from anywhere in the Ossyria region (Orbis + El Nath). They are very useful for Bishops providing Mystic Door to Zakum's Altar.
      </div>

      {/* Legend + Maps + Reset in ONE ROW (wraps nicely on small screens) */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "stretch",
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        {/* Legend */}
        <div
          style={{
            flex: "1 1 100px",
            minWidth: 100,
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "8px 10px",
            fontSize: 14,
            background: "var(--panel)",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-start", flexDirection: "column" }}>
            <span>
              <img src="/rock.png" width="18" style={{ verticalAlign: "middle" }} /> Inside Rock
            </span>
            <span>
              <img src="/chest.png" width="18" style={{ verticalAlign: "middle" }} /> Inside Chest
            </span>
            <span>⏪ Warp to Entrance</span>
            <span>⏫ Re-Enter to Main</span>
            <span>✖️ Fake Portal</span>
            <span>↖️↗️↘️↙️ Which Portal</span>
            <span>❌ Skip Room</span>
          </div>
        </div>

        {/* Maps (side-by-side) */}
        <div
          style={{
            flex: "1 1 580px",
            minWidth: 320,
            border: "1px solid var(--border)",
            borderRadius: 8,
            background: "var(--panel)",
            padding: 10,
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <img
              src="/map_main.png"
              alt="Main mine map"
              style={{
                width: "100%",
                maxHeight: 200,
                objectFit: "contain",
                borderRadius: 6,
                background: "rgba(0,0,0,0.15)",
              }}
            />
            <img
              src="/map_16.png"
              alt="Room 16 hub map"
              style={{
                width: "100%",
                maxHeight: 200,
                objectFit: "contain",
                borderRadius: 6,
                background: "rgba(0,0,0,0.15)",
              }}
            />
          </div>
        </div>

        {/* Reset */}
        <div style={{ flex: "0 0 50px", display: "flex" }}>
          <button onClick={resetAll} title="Reset All" style={{ height: "100%", fontSize: "25px", padding: "0" }}>
            🔄
          </button>
        </div>
      </div>

      {/* List with sticky header + sticky footer */}
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 8,
          overflow: "hidden",
          background: "var(--panel)",
        }}
      >
        <div style={{ maxHeight: 560, overflowY: "auto" }}>
          {/* Sticky Header Row */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 5,
              background: "var(--panel-2)",
              display: "grid",
              gridTemplateColumns: GRID_COLS,
              gap: 10,
              padding: "6px 10px",
              borderBottom: "2px solid var(--border-strong)",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            <div style={{ textAlign: "right", paddingRight: 22 }}>Map</div>

            {/* MERGED Docs header spans columns 2 + 3 */}
            <div
              style={{
                gridColumn: "2 / span 2",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <img
                alt="doc"
                src="/document.png"
                style={{ height: 22, verticalAlign: "middle" }}
              />
            </div>

            {/* Key header placed at col 4 */}
            <div style={{ gridColumn: 4, display: "flex", justifyContent: "center" }}>
              <img
                alt="key"
                src="/key.png"
                style={{ height: 22, verticalAlign: "middle" }}
              />
            </div>

            <div style={{ gridColumn: 5 }}>Status</div>
            <div style={{ gridColumn: 6 }}>Portal</div>
            <div style={{ gridColumn: 7 }}>Skip</div>
          </div>

          {/* Rows */}
          <div style={{ padding: "0 10px" }}>
            {ROOMS.map((room) => {
              const event = getRoomEvent(room.id);
              const isNext = nextTargetRoom?.id === room.id;
              const optional = isRoomOptional(room, docsRemainingNeeded);
              const skipped = skippedRooms.includes(room.id);

              return (
                <div
                  key={room.id}
                  ref={(el) => {
                    if (el) roomRefs.current[room.id] = el;
                  }}
                >
                  <RoomRow
                    room={room}
                    event={event}
                    onUpdate={updateRoomEvent}
                    isNext={isNext}
                    isOptional={optional}
                    isSkipped={skipped}
                    onToggleSkip={(roomId) => {
                      setSkippedRooms((prev) =>
                        prev.includes(roomId)
                          ? prev.filter((x) => x !== roomId)
                          : [...prev, roomId]
                      );
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Sticky Footer Row */}
          <div
            style={{
              position: "sticky",
              bottom: 0,
              zIndex: 5,
              background: "var(--panel-2)",
              display: "grid",
              gridTemplateColumns: GRID_COLS,
              gap: 10,
              padding: "6px 10px",
              borderTop: "2px solid var(--border-strong)",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            <div style={{ textAlign: "right", paddingRight: 22, color: "var(--muted)" }}>
              Total
            </div>

            {/* MERGED Docs footer spans columns 2 + 3 with icons */}
            <div
              style={{
                gridColumn: "2 / span 2",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <img src="/document.png" alt="document" style={{ height: 18, width: "auto" }} />
              <span style={{ color: "var(--text)" }}>
                {docsCollected}/{DOCS_NEEDED}
              </span>
            </div>

            {/* Keys footer stays in col 4 */}
            <div style={{ gridColumn: 4, color: "var(--text)", display: "flex", gap: 8 }}>
              <img src="/chest.png" alt="chest" style={{ height: 18, width: "auto" }} />
              <span style={{ color: "var(--text)" }}>
                {keysCollected}/7
              </span>
            </div>

            <div style={{ gridColumn: 5 }} />
            <div style={{ gridColumn: 6 }} />
            <div style={{ gridColumn: 7 }} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 6, marginBottom: 10, fontSize: 13, opacity: 0.9, color: "var(--muted)" }}>
        Developer's Note to Self: If you notice a room is basically unavoidable, add <code>onPath: true</code>{" "}
        to that room in <code>rooms.js</code>.<br/> 
        Also, check if any rooms has maximum of only 1 or 2 Rocks, such as in 7-2.
      </div>

      {/* Teleport buttons lower down */}
      <div style={{ marginTop: 16, marginBottom: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={addTeleport}>Teleported to Main</button>
        <button onClick={undoLastTeleport}>Undo Last Teleport</button>
      </div>

      <h2 style={{ margin: "14px 0 8px" }}>Event Log</h2>

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 8,
          fontSize: 13,
          background: "var(--panel)",
        }}
      >
        {!events.some((e) => e.type === "teleport") ? (
          <div style={{ opacity: 0.8, color: "var(--muted)" }}>No teleports recorded.</div>
        ) : (
          <div style={{ maxHeight: 120, overflowY: "auto" }}>
            {events.map((e, idx) => {
              if (e.type !== "teleport") return null;
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "4px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div style={{ opacity: 0.95 }}>
                    Teleport <span style={{ color: "var(--muted)" }}>#{idx + 1}</span>
                  </div>
                  <button
                    onClick={() => removeTeleportAtIndex(idx)}
                    style={{ padding: "0.25em 0.6em" }}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {SHOW_DEBUG && (
        <pre style={{ marginTop: 24, fontSize: 11, opacity: 0.7 }}>
          {JSON.stringify(events, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default App;
