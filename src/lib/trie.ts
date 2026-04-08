/**
 * Compact Trie for dictionary lookup.
 *
 * For v1 we build the Trie at load time from a word list.
 * The Trie supports two operations needed by the solver:
 *   - isWord(word): is this a complete valid word?
 *   - isPrefix(prefix): does any word start with this prefix?
 *
 * Internally, each node is a Map of character -> child node.
 * A node with `end = true` marks the end of a valid word.
 */

export interface TrieNode {
  children: Map<string, TrieNode>;
  end: boolean;
}

export interface Trie {
  root: TrieNode;
  wordCount: number;
}

function createNode(): TrieNode {
  return { children: new Map(), end: false };
}

/**
 * Build a Trie from an array of uppercase words.
 */
export function buildTrie(words: string[]): Trie {
  const root = createNode();
  let wordCount = 0;

  for (const word of words) {
    let node = root;
    for (const ch of word) {
      let child = node.children.get(ch);
      if (!child) {
        child = createNode();
        node.children.set(ch, child);
      }
      node = child;
    }
    if (!node.end) {
      node.end = true;
      wordCount++;
    }
  }

  return { root, wordCount };
}

/**
 * Check if the trie contains the exact word.
 */
export function isWord(trie: Trie, word: string): boolean {
  let node = trie.root;
  for (const ch of word) {
    const child = node.children.get(ch);
    if (!child) return false;
    node = child;
  }
  return node.end;
}

/**
 * Check if any word in the trie starts with the given prefix.
 */
export function isPrefix(trie: Trie, prefix: string): boolean {
  let node = trie.root;
  for (const ch of prefix) {
    const child = node.children.get(ch);
    if (!child) return false;
    node = child;
  }
  return true;
}
