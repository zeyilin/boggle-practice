/**
 * Packed DAWG (directed acyclic word graph) for dictionary lookup.
 *
 * Dictionaries are compiled offline (scripts/compile-dawg.ts) into a flat
 * Uint32Array and shipped as a binary asset. At runtime `loadTrie` wraps the
 * downloaded bytes with zero parsing; `buildTrie` is only used by the
 * compiler, the tests, and the worker's fallback path.
 *
 * Layout: one u32 per edge. Each node is a contiguous run of edges sorted by
 * letter, and a node is referenced by the index of its first edge.
 *   bits 0–4   letter (A=0 … Z=25)
 *   bit  5     end-of-word: the path through this edge spells a word
 *   bit  6     last edge of this node's run
 *   bits 7–31  index of the child node's first edge (0 = no children)
 * The array starts with a header (magic, version, word count, root index),
 * so index 0 is never a real node and doubles as "no children".
 * Serialized bytes are little-endian.
 */

export interface Trie {
  /** Header followed by the packed edges (see layout above). */
  edges: Uint32Array;
  /** Index of the root node's first edge (0 for an empty dictionary). */
  root: number;
  wordCount: number;
}

// "DAWG" as little-endian bytes. Reading the file on a big-endian host (or
// while it's still gzipped) yields a different value, so this catches both.
const MAGIC = 0x47574144;
const VERSION = 1;
// magic, version, wordCount, root
const HEADER_WORDS = 4;

const LETTER_MASK = 0x1f;
const END_BIT = 1 << 5;
const LAST_BIT = 1 << 6;
const CHILD_SHIFT = 7;
const MAX_EDGE_INDEX = 2 ** (32 - CHILD_SHIFT) - 1;

const A = 65; // "A".charCodeAt(0)

/**
 * Find the edge for `letter` (A=0 … Z=25) in the node whose edges start at
 * `node`. Returns the edge index, or -1 if there is no such edge (including
 * when `node` is 0, i.e. the previous edge had no children).
 */
export function findChild(trie: Trie, node: number, letter: number): number {
  if (node === 0) return -1;
  const edges = trie.edges;
  for (let i = node; i < edges.length; i++) {
    const edge = edges[i];
    const l = edge & LETTER_MASK;
    if (l === letter) return i;
    // Runs are sorted by letter, so we can stop early
    if (l > letter || edge & LAST_BIT) return -1;
  }
  return -1;
}

/**
 * Index of the first edge of the node an edge leads to (0 = no children).
 */
export function childOf(trie: Trie, edge: number): number {
  return trie.edges[edge] >>> CHILD_SHIFT;
}

/**
 * Whether the path through this edge spells a complete word.
 */
export function isEndEdge(trie: Trie, edge: number): boolean {
  return (trie.edges[edge] & END_BIT) !== 0;
}

/**
 * Follow `s` from the root. Returns the index of the last edge taken,
 * 0 for the empty string, or -1 if the path leaves the graph.
 */
function walk(trie: Trie, s: string): number {
  let node = trie.root;
  let edge = 0;
  for (let i = 0; i < s.length; i++) {
    edge = findChild(trie, node, s.charCodeAt(i) - A);
    if (edge < 0) return -1;
    node = childOf(trie, edge);
  }
  return edge;
}

/**
 * Check if the trie contains the exact word.
 */
export function isWord(trie: Trie, word: string): boolean {
  const edge = walk(trie, word);
  return edge > 0 && isEndEdge(trie, edge);
}

/**
 * Check if any word in the trie starts with the given prefix.
 */
export function isPrefix(trie: Trie, prefix: string): boolean {
  return walk(trie, prefix) >= 0;
}

// --- Building (offline / tests / fallback) ---

interface BuildNode {
  children: Map<number, BuildNode>;
  end: boolean;
}

interface BuildEdge {
  letter: number;
  end: boolean;
  /** Id of the minimized child node (0 = no children). */
  child: number;
}

/**
 * Build a packed DAWG from uppercase A–Z words. Input may be unsorted and
 * contain duplicates. Throws on words with any other characters.
 *
 * Builds a plain trie, merges nodes with identical outgoing edges bottom-up
 * (which yields the minimal DAWG), then lays the nodes out depth-first from
 * the root.
 */
export function buildTrie(words: string[]): Trie {
  // 1. Plain trie
  const root: BuildNode = { children: new Map(), end: false };
  let wordCount = 0;

  for (const word of words) {
    if (!/^[A-Z]+$/.test(word)) {
      throw new Error(
        `buildTrie: invalid word ${JSON.stringify(word)} (expected A–Z only)`,
      );
    }
    let node = root;
    for (let i = 0; i < word.length; i++) {
      const letter = word.charCodeAt(i) - A;
      let child = node.children.get(letter);
      if (!child) {
        child = { children: new Map(), end: false };
        node.children.set(letter, child);
      }
      node = child;
    }
    if (!node.end) {
      node.end = true;
      wordCount++;
    }
  }

  // 2. Minimize: two nodes are equivalent iff their sorted
  // (letter, end, child id) edge lists match. Children first, so child ids
  // are final by the time the parent's signature is computed.
  const nodes: BuildEdge[][] = [[]]; // id -> edges; id 0 = no children
  const ids = new Map<string, number>();

  function minimize(node: BuildNode): number {
    if (node.children.size === 0) return 0;
    const out: BuildEdge[] = [...node.children.keys()]
      .sort((a, b) => a - b)
      .map((letter) => {
        const child = node.children.get(letter)!;
        return { letter, end: child.end, child: minimize(child) };
      });
    const signature = out
      .map((e) => `${e.letter}${e.end ? "!" : ""}>${e.child}`)
      .join(",");
    let id = ids.get(signature);
    if (id === undefined) {
      id = nodes.length;
      nodes.push(out);
      ids.set(signature, id);
    }
    return id;
  }

  const rootId = minimize(root);

  // 3. Pack: assign each node its run of edge indices, depth-first from the
  // root (so a DFS walk mostly moves forward through memory).
  const offsets = new Array<number>(nodes.length).fill(0);
  let size = HEADER_WORDS;

  function place(id: number) {
    if (id === 0 || offsets[id] !== 0) return;
    offsets[id] = size;
    size += nodes[id].length;
    for (const e of nodes[id]) place(e.child);
  }

  place(rootId);
  if (size - 1 > MAX_EDGE_INDEX) {
    throw new Error(`buildTrie: ${size} edges exceed the packed format limit`);
  }

  const edges = new Uint32Array(size);
  const rootIndex = offsets[rootId];
  edges[0] = MAGIC;
  edges[1] = VERSION;
  edges[2] = wordCount;
  edges[3] = rootIndex;

  for (let id = 1; id < nodes.length; id++) {
    const run = nodes[id];
    for (let k = 0; k < run.length; k++) {
      const e = run[k];
      edges[offsets[id] + k] =
        (e.letter |
          (e.end ? END_BIT : 0) |
          (k === run.length - 1 ? LAST_BIT : 0) |
          (offsets[e.child] << CHILD_SHIFT)) >>>
        0;
    }
  }

  return { edges, root: rootIndex, wordCount };
}

/**
 * Serialize to little-endian bytes (header included), as loaded by `loadTrie`.
 */
export function serializeTrie(trie: Trie): Uint8Array {
  const { edges } = trie;
  const bytes = new Uint8Array(edges.length * 4);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < edges.length; i++) {
    view.setUint32(i * 4, edges[i], true);
  }
  return bytes;
}

/**
 * Wrap serialized bytes as a Trie without copying or parsing.
 * Throws if the buffer isn't a DAWG this code understands.
 */
export function loadTrie(buffer: ArrayBuffer): Trie {
  if (buffer.byteLength < HEADER_WORDS * 4 || buffer.byteLength % 4 !== 0) {
    throw new Error(
      `Invalid dictionary file: ${buffer.byteLength} bytes is not a packed DAWG`,
    );
  }
  const edges = new Uint32Array(buffer);
  if (edges[0] !== MAGIC) {
    throw new Error(
      "Invalid dictionary file: bad magic number (not a DAWG, still compressed, or big-endian host)",
    );
  }
  if (edges[1] !== VERSION) {
    throw new Error(
      `Unsupported dictionary format version ${edges[1]} (expected ${VERSION}); run npm run compile-dicts`,
    );
  }
  const root = edges[3];
  if (root !== 0 && (root < HEADER_WORDS || root >= edges.length)) {
    throw new Error(`Invalid dictionary file: root index ${root} out of range`);
  }
  return { edges, root, wordCount: edges[2] };
}
