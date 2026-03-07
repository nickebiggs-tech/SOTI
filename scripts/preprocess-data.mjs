#!/usr/bin/env node
/**
 * Pre-processes raw CSV data into optimised JSON files:
 *
 * Tier 1 (immediate load, tiny):
 *   - eth-categories.json   — 16 category summaries
 *   - otc-categories.json   — 65 market summaries
 *
 * Tier 2 (immediate load, small):
 *   - eth-skus.json          — ~7.4K SKU-level aggregates (array format)
 *   - otc-skus.json          — ~36K pack-level records (array format)
 *
 * Tier 3 (lazy load, large):
 *   - eth-monthly.json       — 141K monthly rows (array format) for Dispense + Seasonality
 *
 * Array format: first element is header array, rest are data arrays.
 * This is ~50% smaller than object-per-row JSON.
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_IN = join(__dirname, '..', 'public', 'data')
const DATA_OUT = join(__dirname, '..', 'public', 'data')

// --------------- helpers ---------------

function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = parseCSVLine(lines[0])
  return lines.slice(1).map(line => {
    const vals = parseCSVLine(line)
    const obj = {}
    headers.forEach((h, i) => (obj[h] = vals[i] ?? ''))
    return obj
  })
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++ }
      else if (ch === '"') { inQuotes = false }
      else { current += ch }
    } else {
      if (ch === '"') { inQuotes = true }
      else if (ch === ',') { result.push(current); current = '' }
      else { current += ch }
    }
  }
  result.push(current)
  return result
}

function num(v) { return parseFloat(v) || 0 }
function rnd(v) { return Math.round(v * 100) / 100 }

function writeJSON(name, data) {
  const json = JSON.stringify(data)
  writeFileSync(join(DATA_OUT, name), json)
  const sizeMB = (Buffer.byteLength(json) / 1024 / 1024).toFixed(2)
  const rows = Array.isArray(data) ? data.length - 1 : '?'
  console.log(`  ${name}: ${rows} records (${sizeMB} MB)`)
}

// --------------- String interning for array format ---------------
// Map repeated strings to indices to dramatically reduce JSON size

function internStrings(records, stringFields) {
  const dictionaries = {}
  stringFields.forEach(f => { dictionaries[f] = { map: new Map(), list: [] } })

  records.forEach(r => {
    stringFields.forEach(f => {
      const val = r[f]
      const dict = dictionaries[f]
      if (!dict.map.has(val)) {
        dict.map.set(val, dict.list.length)
        dict.list.push(val)
      }
    })
  })

  return dictionaries
}

// --------------- ETH ---------------

console.log('Reading ETH CSV...')
const ethRaw = parseCSV(readFileSync(join(DATA_IN, 'SOTI_Eth_Month.csv'), 'utf8'))
console.log(`  Parsed ${ethRaw.length} rows`)

// Build SKU aggregates
const skuMap = {}
ethRaw.forEach(r => {
  const key = r['SKU']
  if (!skuMap[key]) {
    skuMap[key] = {
      sku: key,
      category: r['Category'],
      manufacturer: r['Manufacturer'],
      molecule: r['MOLECULE'],
      tv: 0, lv: 0, tu: 0, lu: 0,
    }
  }
  const s = skuMap[key]
  if (r['Period'] === 'APR24-MAR25') {
    s.tv += num(r['Sales'])
    s.tu += num(r['Units'])
  } else {
    s.lv += num(r['Sales'])
    s.lu += num(r['Units'])
  }
})

const ethSkuList = Object.values(skuMap)

// Intern strings for SKU data
const skuDicts = internStrings(ethSkuList, ['category', 'manufacturer', 'molecule'])

// SKU array format: { h: header, d: dictionaries, r: rows }
const ethSkus = {
  h: ['sku', 'cat', 'mfr', 'mol', 'tv', 'lv', 'tu', 'lu'],
  d: {
    cat: skuDicts.category.list,
    mfr: skuDicts.manufacturer.list,
    mol: skuDicts.molecule.list,
  },
  r: ethSkuList.map(s => [
    s.sku,
    skuDicts.category.map.get(s.category),
    skuDicts.manufacturer.map.get(s.manufacturer),
    skuDicts.molecule.map.get(s.molecule),
    rnd(s.tv), rnd(s.lv), rnd(s.tu), rnd(s.lu),
  ]),
}

// Build category summaries (standard format — tiny file)
const catMap = {}
ethSkuList.forEach(s => {
  if (!catMap[s.category]) catMap[s.category] = { c: s.category, tv: 0, lv: 0, tu: 0, lu: 0, mfrs: new Set(), skus: new Set() }
  const cat = catMap[s.category]
  cat.tv += s.tv; cat.lv += s.lv; cat.tu += s.tu; cat.lu += s.lu
  cat.mfrs.add(s.manufacturer); cat.skus.add(s.sku)
})
const ethCategories = Object.values(catMap)
  .map(c => ({
    category: c.c,
    tyValue: rnd(c.tv), lyValue: rnd(c.lv),
    tyUnits: rnd(c.tu), lyUnits: rnd(c.lu),
    valueGrowth: c.lv ? Math.round(((c.tv - c.lv) / c.lv) * 10000) / 100 : 0,
    unitGrowth: c.lu ? Math.round(((c.tu - c.lu) / c.lu) * 10000) / 100 : 0,
    manufacturerCount: c.mfrs.size,
    skuCount: c.skus.size,
  }))
  .sort((a, b) => b.tyValue - a.tyValue)

// Monthly data — interned array format
const monthlyDicts = internStrings(ethRaw.map(r => ({
  period: r['Period'],
  category: r['Category'],
  manufacturer: r['Manufacturer'],
  molecule: r['MOLECULE'],
  sku: r['SKU'],
})), ['period', 'category', 'manufacturer', 'molecule', 'sku'])

const ethMonthly = {
  h: ['period', 'date', 'monthId', 'cat', 'mfr', 'mol', 'sku', 'units', 'sales'],
  d: {
    period: monthlyDicts.period.list,
    cat: monthlyDicts.category.list,
    mfr: monthlyDicts.manufacturer.list,
    mol: monthlyDicts.molecule.list,
    sku: monthlyDicts.sku.list,
  },
  r: ethRaw.map(r => [
    monthlyDicts.period.map.get(r['Period']),
    r['Date'],
    parseInt(r['MonthID']) || 0,
    monthlyDicts.category.map.get(r['Category']),
    monthlyDicts.manufacturer.map.get(r['Manufacturer']),
    monthlyDicts.molecule.map.get(r['MOLECULE']),
    monthlyDicts.sku.map.get(r['SKU']),
    rnd(num(r['Units'])),
    rnd(num(r['Sales'])),
  ]),
}

console.log('Writing ETH JSON files...')
writeJSON('eth-categories.json', ethCategories)
writeJSON('eth-skus.json', ethSkus)
writeJSON('eth-monthly.json', ethMonthly)

// --------------- OTC ---------------

console.log('\nReading OTC CSV...')
const otcRaw = parseCSV(readFileSync(join(DATA_IN, 'SOTI_OTC_Monthly.csv'), 'utf8'))
console.log(`  Parsed ${otcRaw.length} rows`)

// Intern strings for OTC
const otcDicts = internStrings(otcRaw.map(r => ({
  market: r['MKT1_NAME'],
  manufacturer: r['MFR_Name'],
})), ['market', 'manufacturer'])

const otcSkus = {
  h: ['market', 'mfr', 'packName', 'lu', 'lv', 'tu', 'tv'],
  d: {
    market: otcDicts.market.list,
    mfr: otcDicts.manufacturer.list,
  },
  r: otcRaw.map(r => [
    otcDicts.market.map.get(r['MKT1_NAME']),
    otcDicts.manufacturer.map.get(r['MFR_Name']),
    r['PACK_NAME'],
    rnd(num(r['LY_TotalUnits'])),
    rnd(num(r['LY_Value'])),
    rnd(num(r['TY_TotalUnits'])),
    rnd(num(r['TY_Value'])),
  ]),
}

// OTC category summaries
const otcCatMap = {}
otcRaw.forEach(r => {
  const mk = r['MKT1_NAME']
  if (!otcCatMap[mk]) otcCatMap[mk] = { c: mk, tv: 0, lv: 0, tu: 0, lu: 0, mfrs: new Set(), skus: new Set() }
  const cat = otcCatMap[mk]
  cat.tv += num(r['TY_Value']); cat.lv += num(r['LY_Value'])
  cat.tu += num(r['TY_TotalUnits']); cat.lu += num(r['LY_TotalUnits'])
  cat.mfrs.add(r['MFR_Name']); cat.skus.add(r['PACK_NAME'])
})
const otcCategories = Object.values(otcCatMap)
  .map(c => ({
    category: c.c,
    tyValue: rnd(c.tv), lyValue: rnd(c.lv),
    tyUnits: rnd(c.tu), lyUnits: rnd(c.lu),
    valueGrowth: c.lv ? Math.round(((c.tv - c.lv) / c.lv) * 10000) / 100 : 0,
    unitGrowth: c.lu ? Math.round(((c.tu - c.lu) / c.lu) * 10000) / 100 : 0,
    manufacturerCount: c.mfrs.size,
    skuCount: c.skus.size,
  }))
  .sort((a, b) => b.tyValue - a.tyValue)

console.log('Writing OTC JSON files...')
writeJSON('otc-categories.json', otcCategories)
writeJSON('otc-skus.json', otcSkus)

console.log('\nDone! Summary:')
console.log('  Immediate load: eth-categories + eth-skus + otc-categories + otc-skus')
console.log('  Lazy load: eth-monthly (only for Dispense + Seasonality)')
