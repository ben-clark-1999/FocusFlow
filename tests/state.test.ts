import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

describe('state save/load', () => {
  it('writes and reads JSON', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ambiently-'));
    const state = { hello: 'world', tracks: [{id:'rain',enabled:true,volume:0.5}] };
    const file = path.join(tmp, 'state.json');
    fs.writeFileSync(file, JSON.stringify(state), 'utf-8');
    const read = JSON.parse(fs.readFileSync(file, 'utf-8'));
    expect(read.hello).toBe('world');
    expect(read.tracks[0].id).toBe('rain');
  });
});
