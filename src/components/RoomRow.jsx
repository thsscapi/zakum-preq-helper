// src/components/RoomRow.jsx

const GRID_COLS = "110px 140px 140px 120px 140px 1fr 80px";
const ICON_SIZE = 36;

// Put this file in /public
const CHEST_SKIP_ICON = "/chest_skip.png";

function Badge({ label, variant = "neutral", title }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 10px",
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 800,
    border: "1px solid var(--border)",
    background: "rgba(255,255,255,0.06)",
    color: "var(--text)",
    lineHeight: 1.2,
    whiteSpace: "nowrap",
  };

  const v =
    variant === "danger"
      ? {
          background: "rgba(255, 80, 80, 0.18)",
          border: "1px solid rgba(255, 80, 80, 0.55)",
        }
      : variant === "success"
      ? {
          background: "rgba(80, 255, 140, 0.14)",
          border: "1px solid rgba(80, 255, 140, 0.50)",
        }
      : variant === "warn"
      ? {
          background: "rgba(255, 200, 80, 0.16)",
          border: "1px solid rgba(255, 200, 80, 0.55)",
        }
      : {};

  return (
    <span style={{ ...base, ...v }} title={title}>
      {label}
    </span>
  );
}

function docIconSrc(roomId, doc) {
  // doc: { type: "rock"|"chest"|"rock_or_chest", icon?: string }
  if (doc?.icon) return doc.icon;

  // Special rule: the *document chest* in 16-5 should stand out so you remember to skip it
  if (roomId === "16-5" && doc?.type === "chest") return CHEST_SKIP_ICON;

  if (doc?.type === "rock") return "/rock.png";
  if (doc?.type === "chest") return "/chest.png";
  return null; // rock_or_chest handled separately
}

function keyIconSrc(room) {
  // room.key: { type: "rock"|"chest" }
  if (!room?.key) return null;
  return room.key.type === "rock" ? "/rock.png" : "/chest.png";
}

export default function RoomRow({
  room,
  event,
  onUpdate,
  isNext,
  isOptional,
  isSkipped,
  onToggleSkip,
}) {
  const docsState = event?.docs ?? room.docs.map(() => false);
  const keyState = event?.key ?? false;

  const docCount = room.docs.length;
  const leftCount = Math.ceil(docCount / 2);
  const leftDocs = room.docs.slice(0, leftCount);
  const rightDocs = room.docs.slice(leftCount);

  function toggleDoc(index) {
    onUpdate(room.id, (prev) => {
      const docs = prev?.docs ? [...prev.docs] : room.docs.map(() => false);
      docs[index] = !docs[index];
      return { type: "room", roomId: room.id, docs, key: prev?.key ?? false };
    });
  }

  function toggleKey() {
    onUpdate(room.id, (prev) => ({
      type: "room",
      roomId: room.id,
      docs: prev?.docs ?? room.docs.map(() => false),
      key: !prev?.key,
    }));
  }

  const canSkip = !room.key && room.docs.length > 0 && !room.onPath;
  const rowBg = isNext ? "rgba(255, 200, 80, 0.18)" : "transparent";
  const isMain = room.id === "MAIN";

  function renderDocSlot(doc, checked, onChange) {
    if (doc.type === "rock_or_chest") {
      // No dedicated icon: show rock/chest together
      return (
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <img src="/rock.png" width={ICON_SIZE} height="auto" alt="rock" />
            <img src="/chest.png" width={ICON_SIZE} height="auto" alt="chest" />
          </span>
          <input type="checkbox" checked={checked} onChange={onChange} />
        </label>
      );
    }

    const src = docIconSrc(room.id, doc);
    return (
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <img src={src} width={ICON_SIZE} height="auto" alt={doc.type} />
        <input type="checkbox" checked={checked} onChange={onChange} />
      </label>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: GRID_COLS,
        gap: 10,
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
        background: rowBg,
      }}
    >
      {/* 1) MAP — optical right alignment */}
      <div
        style={{
          fontWeight: 800,
          textAlign: "right",
          paddingRight: 22,
          color: "var(--text)",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>{room.id}</span>
      </div>

      {/* 2-3) DOCS */}
      {isMain ? (
        <>
          {/* Merge docs col 2+3 visually by spanning */}
          <div
            style={{
              gridColumn: "2 / span 2",
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              paddingTop: 2,
            }}
          >
            {/* show rock+chest once */}
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <img src="/rock.png" width={ICON_SIZE} height="auto" alt="rock" />
              <img src="/chest.png" width={ICON_SIZE} height="auto" alt="chest" />
            </span>

            {/* 3 checkboxes */}
            <span style={{ display: "inline-flex", gap: 10, alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <label key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <input type="checkbox" checked={docsState[i] || false} onChange={() => toggleDoc(i)} />
                  <span style={{ fontSize: 14, opacity: 0.85 }}>{i + 1}</span>
                </label>
              ))}
            </span>
          </div>
        </>
      ) : (
        <>
          <div>
            {leftDocs.map((doc, i) => {
              const idx = i;
              return renderDocSlot(doc, docsState[idx] || false, () => toggleDoc(idx));
            })}
          </div>

          <div>
            {rightDocs.map((doc, i) => {
              const idx = leftCount + i;
              return renderDocSlot(doc, docsState[idx] || false, () => toggleDoc(idx));
            })}
          </div>
        </>
      )}

      {/* 4) KEY */}
      <div>
        {room.key ? (
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src={keyIconSrc(room)} width={ICON_SIZE} height="auto" alt="key" />
            <input type="checkbox" checked={keyState} onChange={toggleKey} />
          </label>
        ) : (
          <span style={{ opacity: 0.4, color: "var(--muted)" }}>—</span>
        )}
      </div>

      {/* 5) STATUS (includes permanent badges from rooms.js) */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {Array.isArray(room.badges) &&
          room.badges.map((b, idx) => (
            <Badge
              key={idx}
              label={b.label}
              variant={b.variant || "neutral"}
              title={b.title}
            />
          ))}

        {isNext && <Badge label="Next" variant="warn" />}
        {room.onPath && <Badge label="On-path" />}
        {isOptional && !isSkipped && <Badge label="Optional" />}
        {isSkipped && <Badge label="Skipped" variant="danger" />}
      </div>

      {/* 6) PORTAL */}
      <div
        style={{
          fontSize: 18,
          opacity: 0.95,
          whiteSpace: "pre-line",
          color: "var(--text)",
        }}
      >
        {room.portal || <span style={{ opacity: 0.4, color: "var(--muted)" }}>—</span>}
      </div>

      {/* 7) SKIP */}
      <div style={{ opacity: canSkip ? 1 : 0.35 }}>
        {canSkip ? (
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>❌</span>
            <input type="checkbox" checked={isSkipped} onChange={() => onToggleSkip(room.id)} />
          </label>
        ) : (
          <span style={{ opacity: 0.4, color: "var(--muted)" }}>—</span>
        )}
      </div>
    </div>
  );
}
