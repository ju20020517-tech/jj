const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const mainPath = path.join(__dirname, '..', 'js', 'fm', 'main.js');
const main = fs.readFileSync(mainPath, 'utf8');

test('save data is validated before writing', () => {
  assert.match(main, /function parseSave\(raw\)/);
  assert.match(main, /Array\.isArray\(data\.villagers\)/);
  assert.match(main, /!data\.player \|\| typeof data\.player !== 'object'/);
  assert.match(main, /if \(!parseSave\(serialized\)\) throw new Error/);
});

test('previous valid save is copied to a backup before replacing primary', () => {
  const backup = main.indexOf("localStorage.setItem(SAVE_BACKUP_KEY, previous)");
  const writePrimary = main.indexOf('localStorage.setItem(D.SAVE_KEY, serialized)');
  assert.notEqual(backup, -1, 'backup write must exist');
  assert.notEqual(writePrimary, -1, 'primary write must exist');
  assert.ok(backup < writePrimary, 'backup must be written before the primary save');
  assert.match(main, /parseSave\(previous\)/);
});

test('load path attempts backup recovery when the primary save is unusable', () => {
  assert.match(main, /primary = parseSave\(localStorage\.getItem\(D\.SAVE_KEY\)\)/);
  assert.match(main, /backup = parseSave\(localStorage\.getItem\(SAVE_BACKUP_KEY\)\)/);
  assert.match(main, /primary save load failed; trying backup/);
  assert.match(main, /Sim\.load\(backup\)/);
  assert.match(main, /save recovery copy failed/);
});

test('reset clears both primary and backup saves', () => {
  assert.match(main, /localStorage\.removeItem\(D\.SAVE_KEY\); localStorage\.removeItem\(SAVE_BACKUP_KEY\)/);
});
