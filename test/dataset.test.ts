import { describe, it, expect } from 'vitest';
import {
  chunkBytes,
  sha256,
  sha256Hex,
  datasetSlicesFromBytes,
  datasetIdFromLabel,
  bytes32ToHex,
  hexToBytes32,
  DatasetStore,
  datasetStoreToSliceProvider,
  SLICE_COUNT,
  SLICE_BYTES,
} from '../src/dataset';

describe('dataset shaping', () => {
  it('chunkBytes produces expected count and round-trip total length', () => {
    const content = new Uint8Array(1000).fill(7);
    const chunks = chunkBytes(content, SLICE_COUNT);
    expect(chunks).toHaveLength(SLICE_COUNT);
    const total = chunks.reduce((n: number, c) => n + c.length, 0);
    expect(total).toBe(1000);
  });

  it('chunkBytes pads empty content with count empty slices', () => {
    const chunks = chunkBytes(new Uint8Array(0), 4);
    expect(chunks).toHaveLength(4);
    expect(chunks.every((c) => c.length === 0)).toBe(true);
  });

  it('datasetSlicesFromBytes returns 16 slices of 32 bytes', () => {
    const content = new Uint8Array([...Array(512).keys()]);
    const slices = datasetSlicesFromBytes(content);
    expect(slices).toHaveLength(16);
    for (const s of slices) expect(s.length).toBe(32);
  });

  it('datasetSlicesFromBytes is deterministic', () => {
    const content = new Uint8Array([1, 2, 3, 4, 5]);
    expect(datasetSlicesFromBytes(content)).toEqual(datasetSlicesFromBytes(content));
  });

  it('datasetIdFromLabel is stable and 32 bytes', () => {
    const a = datasetIdFromLabel('my-dataset');
    const b = datasetIdFromLabel('my-dataset');
    expect(a).toEqual(b);
    expect(a.length).toBe(32);
    expect(datasetIdFromLabel('other')).not.toEqual(a);
  });

  it('hex round-trips', () => {
    const id = datasetIdFromLabel('x');
    expect(hexToBytes32(bytes32ToHex(id))).toEqual(id);
  });

  it('hexToBytes32 rejects malformed', () => {
    expect(() => hexToBytes32('nope')).toThrow();
    expect(() => hexToBytes32('abcd')).toThrow();
  });



  it('DatasetStore stores and retrieves by label-derived id', async () => {
    const store = new DatasetStore();
    const id = datasetIdFromLabel('d1');
    const slices = datasetSlicesFromBytes(new Uint8Array([1, 2, 3]));
    store.set(id, slices);
    expect(store.has(id)).toBe(true);
    expect(store.get(id)).toEqual(slices);
    expect(store.size()).toBe(1);
    const provider = datasetStoreToSliceProvider(store);
    expect(await provider(id)).toEqual(slices);
    store.delete(id);
    expect(store.has(id)).toBe(false);
  });
    it('sha256Hex of a single hash is 64 hex chars', () => {
    const hex = sha256Hex(new Uint8Array(Buffer.from('hello', 'utf8')));
    expect(hex).toHaveLength(64);
    expect(hex).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });
});
