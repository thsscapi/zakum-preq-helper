// src/data/rooms.js
// Generated from your documentkey.xlsx + your portal icon edits

export const ROOMS = [
  {
    id: "MAIN",
    docs: [{ type: "rock_or_chest" }, { type: "rock_or_chest" }, { type: "rock_or_chest" }],
    key: null,
    portal: null,
    ignoreForNextTarget: true,
  },
  { 
    id: "9-1", 
    docs: [{ type: "rock" }], 
    key: null, 
    portal: null,
    onPath: true, 
  },
  {
    id: "9-2",
    docs: [{ type: "rock" }, { type: "rock" }],
    key: { type: "chest" },
    portal: "⏪",
  },
  {
    id: "11-1",
    docs: [{ type: "rock" }],
    key: { type: "chest" },
    portal: "✖️",
  },
  { 
    id: "12-1", 
    docs: [{ type: "rock" }], 
    key: null, 
    portal: "⏪" 
  },
  { 
    id: "1-1", 
    docs: [{ type: "rock" }], 
    key: null, 
    portal: null 
  },
  {
    id: "1-2",
    docs: [{ type: "rock" }],
    key: null,
    portal: "↗️ 7-1 ⏫\n↘️ Main",
    onPath: true,
  },
  {
    id: "7-1",
    docs: [{ type: "rock" }],
    key: null,
    portal: null,
    onPath: true, 
  },
  {
    id: "7-2",
    docs: [{ type: "rock" }, { type: "rock" }],
    key: null,
    portal: "16-0 ⏫",
  },
  { 
    id: "16-2", 
    docs: [], 
    key: { type: "chest" }, 
    portal: null,
    badges: [{ label: "Delay if TPed", variant: "warn" }],
  },
  { 
    id: "16-3", 
    docs: [], 
    key: { type: "chest" }, 
    portal: null,
    badges: [{ label: "Delay if TPed", variant: "warn" }],
  },
  {
    id: "8-1",
    docs: [{ type: "rock" }, { type: "rock" }],
    key: null,
    portal: null,
    onPath: true,
  },
  {
    id: "8-2",
    docs: [],
    key: null,
    portal: "↗️ ✖️\n↖️ 13-1",
  },
  {
    id: "13-1",
    docs: [{ type: "rock" }, { type: "rock" }],
    key: null,
    portal: "14-1 ⏫",
  },
  {
    id: "14-1",
    docs: [{ type: "rock" }],
    key: { type: "chest" },
    portal: "✖️",
  },
  {
    id: "15-1",
    docs: [{ type: "rock" }],
    key: null,
    portal: "⏪",
  },
  { 
    id: "2-1", 
    docs: [{ type: "rock" }], 
    key: null, 
    portal: "⏪" 
  },
  { 
    id: "3-1", 
    docs: [{ type: "rock" }], 
    key: null, 
    portal: null,
    onPath: true,
  },
  {
    id: "3-2",
    docs: [{ type: "rock" }, { type: "rock" }],
    key: null,
    portal: "↗️ 3-1 ⏫\n↘️ ✖️",
  },
  { 
    id: "4-1", 
    docs: [], 
    key: null, 
    portal: null,
    onPath: true, 
  },
  {
    id: "4-2",
    docs: [{ type: "rock" }],
    key: { type: "rock" },
    portal: "↗️ 5-1\n↘️ 5-1",
  },
  { 
    id: "5-1", 
    docs: [{ type: "rock" }], 
    key: null, 
    portal: "✖️" 
  },
  { 
    id: "6-1", 
    docs: [{ type: "rock" }], 
    key: null, 
    portal: "✖️" 
  },
  { 
    id: "10-1", 
    docs: [{ type: "rock" }], 
    key: null, 
    portal: null,
    onPath: true,
  },
  {
    id: "10-2",
    docs: [{ type: "rock" }, { type: "rock" }],
    key: null,
    portal: "16-0 ⏫",
  },
  { 
    id: "16-1", 
    docs: [], 
    key: null, 
    portal: null 
  },
  { 
    id: "16-4", 
    docs: [{ type: "rock" }], 
    key: null, 
    portal: null,
    badges: [{ label: "Jump Trick", variant: "success" }],
  },
  { 
    id: "16-5", 
    docs: [{ type: "chest", icon: "/chest_ignore.png" }], 
    key: { type: "rock" }, 
    portal: null,
    badges: [{ label: "Skip Chest", variant: "danger" }],
  },
  { 

    id: "16-6", 
    docs: [{ type: "rock" }], 
    key: null, 
    portal: null,
    badges: [{ label: "Jump Trick", variant: "success" }],
  },
];
