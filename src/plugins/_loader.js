'use strict';

// Plugin loader: scan src/plugins/*.js (kecuali _*.js), validasi, dan
// bangun map command -> plugin. Dipakai oleh dispatcher di handler/message.js.

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

// Registry hasil load terakhir. Dipakai plugin lain (mis. menu, fitur) supaya daftar
// command selalu sesuai plugin yang benar-benar termuat — tanpa daftar manual.
// `failed`: plugin yang GAGAL load (dipakai .fitur untuk tanda ✗).
let registry = { map: new Map(), list: [], failed: [] };

/** @returns {{map: Map<string, object>, list: object[], failed: object[]}} hasil loadPlugins terakhir */
export function getPluginRegistry() {
	return registry;
}

/**
 * @returns {Promise<{map: Map<string, object>, list: object[], failed: object[]}>}
 */
export async function loadPlugins(pluginsDir) {
	const map = new Map();
	const list = [];
	const failed = [];
	let files = [];
	try {
		files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js') && !f.startsWith('_'));
	} catch (e) {
		console.error('\x1b[31m[plugin] gagal baca direktori:\x1b[39m', e?.message || e);
		return { map, list };
	}
	for (const f of files.sort()) {
		try {
			const mod = await import(pathToFileURL(path.join(pluginsDir, f)).href);
			const p = mod.default;
			if (!p || typeof p.name !== 'string' || typeof p.run !== 'function') {
				console.warn(`\x1b[33m[plugin] skip ${f}: format tidak valid (butuh { name, run })\x1b[39m`);
				failed.push({ file: f, name: f.replace(/\.js$/, ''), reason: 'format tidak valid' });
				continue;
			}
			p.aliases = Array.isArray(p.aliases) ? p.aliases : [];
			p.category = p.category || 'other';
			p.desc = p.desc || '';
			p.file = f;
			list.push(p);
			for (const alias of [p.name, ...p.aliases]) {
				const key = String(alias).toLowerCase();
				if (map.has(key)) {
					console.warn(`\x1b[33m[plugin] duplikat command "${key}" di ${f} (sudah ada)\x1b[39m`);
					continue;
				}
				map.set(key, p);
			}
		} catch (e) {
			console.error(`\x1b[31m[plugin] gagal load ${f}:\x1b[39m`, e?.message || e);
			failed.push({ file: f, name: f.replace(/\.js$/, ''), reason: String(e?.message || e).slice(0, 120) });
		}
	}
	registry = { map, list, failed };
	return { map, list, failed };
}
