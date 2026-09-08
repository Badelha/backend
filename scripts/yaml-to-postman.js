'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('js-yaml');

// ── CLI args ──────────────────────────────────────────────────────────────────
const [,, inputFolder, outputFile] = process.argv;
if (!inputFolder || !outputFile) {
  console.error('Usage: node yaml-to-postman.js <inputFolder> <outputFile>');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convert a URL string like '{{baseUrl}}/api/products/{{productId}}'
 * into a Postman v2.1 url object.
 */
function convertUrl(rawUrl, pathVariables) {
  // Split off protocol+host from path
  // e.g. '{{baseUrl}}/api/products/{{productId}}'
  //   → host segment: '{{baseUrl}}'
  //   → path segments: ['api','products','{{productId}}']

  // Remove leading/trailing whitespace
  const trimmed = (rawUrl || '').trim();

  // Split on first '/' that follows the host token
  // Host = everything up to (but not including) the first '/' after the scheme-or-variable
  let hostPart = '';
  let pathPart = '';

  // If URL starts with a variable like {{baseUrl}} treat everything before first '/' as host
  const slashIdx = trimmed.indexOf('/');
  if (slashIdx === -1) {
    hostPart = trimmed;
    pathPart = '';
  } else {
    hostPart = trimmed.substring(0, slashIdx);
    pathPart = trimmed.substring(slashIdx + 1); // strip leading slash
  }

  const pathSegments = pathPart ? pathPart.split('/').filter(s => s !== '') : [];

  const urlObj = {
    raw: trimmed,
    host: [hostPart],
    path: pathSegments,
  };

  // Add variable array when pathVariables present
  if (pathVariables && pathVariables.length > 0) {
    urlObj.variable = pathVariables.map(pv => ({
      key: pv.key,
      value: pv.value !== undefined ? String(pv.value) : '',
      description: pv.description || '',
    }));
  }

  return urlObj;
}

/**
 * Convert auth object from YAML to Postman auth.
 */
function convertAuth(auth) {
  if (!auth) return undefined;
  if (auth.type === 'bearer') {
    const creds = auth.credentials || [];
    const tokenCred = creds.find(c => c.key === 'token');
    const tokenValue = tokenCred ? tokenCred.value : '{{accessToken}}';
    return {
      type: 'bearer',
      bearer: [{ key: 'token', value: tokenValue, type: 'string' }],
    };
  }
  return undefined;
}

/**
 * Convert body from YAML to Postman body.
 */
function convertBody(body) {
  if (!body) return undefined;

  if (body.type === 'json') {
    return {
      mode: 'raw',
      raw: body.content || '',
      options: { raw: { language: 'json' } },
    };
  }

  if (body.type === 'formdata') {
    const formdata = (body.content || []).map(field => {
      if (field.type === 'file') {
        return {
          key: field.key,
          type: 'file',
          src: field.src !== undefined ? field.src : '',
          description: field.description || '',
        };
      }
      // text (default)
      return {
        key: field.key,
        type: 'text',
        value: field.value !== undefined ? String(field.value) : '',
        description: field.description || '',
      };
    });
    return { mode: 'formdata', formdata };
  }

  if (body.type === 'urlencoded') {
    const urlencoded = (body.content || []).map(field => ({
      key: field.key,
      value: field.value !== undefined ? String(field.value) : '',
      description: field.description || '',
    }));
    return { mode: 'urlencoded', urlencoded };
  }

  if (body.type === 'text' || body.type === 'xml' || body.type === 'html') {
    return {
      mode: 'raw',
      raw: body.content || '',
      options: { raw: { language: body.type } },
    };
  }

  return undefined;
}

/**
 * Convert scripts array to Postman events array.
 */
function convertScripts(scripts) {
  if (!scripts || scripts.length === 0) return [];
  return scripts.map(script => {
    const listen = script.type === 'afterResponse' ? 'test' : 'prerequest';
    const execLines = (script.code || '').split('\n');
    return {
      listen,
      script: {
        exec: execLines,
        type: 'text/javascript',
      },
    };
  });
}

/**
 * Convert a single YAML request doc to a Postman item.
 */
function convertRequest(doc, fileName) {
  // Derive name: use doc.name if present, else stem of filename
  const stem = path.basename(fileName, '.request.yaml');
  const name = doc.name || stem;

  // Headers
  const header = (doc.headers || []).map(h => ({
    key: h.key,
    value: h.value !== undefined ? String(h.value) : '',
    description: h.description || '',
    ...(h.disabled ? { disabled: true } : {}),
  }));

  // Query params → url.query
  const query = (doc.queryParams || []).map(q => ({
    key: q.key,
    value: q.value !== undefined ? String(q.value) : '',
    description: q.description || '',
    ...(q.disabled ? { disabled: true } : {}),
  }));

  // Build URL object
  const urlObj = convertUrl(doc.url || '', doc.pathVariables);
  if (query.length > 0) {
    urlObj.query = query;
  }

  // Auth
  const auth = convertAuth(doc.auth);

  // Body
  const body = convertBody(doc.body);

  // Request object
  const request = {
    method: (doc.method || 'GET').toUpperCase(),
    header,
    url: urlObj,
  };

  if (doc.description) request.description = doc.description;
  if (auth) request.auth = auth;
  if (body) request.body = body;

  // Events
  const event = convertScripts(doc.scripts);

  const item = { name, request };
  if (event.length > 0) item.event = event;

  return item;
}

// ── Main ──────────────────────────────────────────────────────────────────────

// Read all *.request.yaml files
const files = fs.readdirSync(inputFolder)
  .filter(f => f.endsWith('.request.yaml'));

if (files.length === 0) {
  console.error('No .request.yaml files found in', inputFolder);
  process.exit(1);
}

// Parse and filter
const parsed = [];
for (const file of files) {
  const fullPath = path.join(inputFolder, file);
  const content = fs.readFileSync(fullPath, 'utf8');
  let doc;
  try {
    doc = yaml.load(content);
  } catch (e) {
    console.warn(`Skipping ${file}: YAML parse error — ${e.message}`);
    continue;
  }
  if (!doc || doc.$kind !== 'http-request') {
    console.warn(`Skipping ${file}: not an http-request ($kind=${doc && doc.$kind})`);
    continue;
  }
  parsed.push({ doc, file });
}

// Sort by order field ascending (undefined → Infinity)
parsed.sort((a, b) => {
  const oa = a.doc.order !== undefined ? Number(a.doc.order) : Infinity;
  const ob = b.doc.order !== undefined ? Number(b.doc.order) : Infinity;
  return oa - ob;
});

// Convert
const items = parsed.map(({ doc, file }) => convertRequest(doc, file));

// Collection name = last segment of input folder path
const collectionName = path.basename(path.resolve(inputFolder));

// Build collection
const collection = {
  info: {
    name: collectionName,
    _postman_id: crypto.randomUUID(),
    description: `Badelha Backend – ${collectionName}`,
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: items,
  variable: [],
};

// Ensure output directory exists
const outDir = path.dirname(path.resolve(outputFile));
fs.mkdirSync(outDir, { recursive: true });

// Write
fs.writeFileSync(outputFile, JSON.stringify(collection, null, 2), 'utf8');
console.log(`✅ Written ${items.length} items → ${outputFile}`);
