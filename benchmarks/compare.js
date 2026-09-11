import { writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const valuesFor = (flag) => args.flatMap((argument, index) => argument === flag ? [args[index + 1]] : [])
const valueFor = (flag) => valuesFor(flag).at(-1)

const sources = valuesFor('--source').map((source) => {
  const separator = source.indexOf('=')
  if (separator === -1) throw new Error(`Expected --source label=path, received: ${source}`)
  return { label: source.slice(0, separator), path: source.slice(separator + 1) }
})

const default_cases = [
  'prettify/realistic/1MB',
  'minify/realistic/100KB',
  'minify/text-run/16KB',
  'isHtml/malformed/20',
  'prettify/ignored/1000',
  'minify/textarea/100KB',
]
const selected_cases = valuesFor('--case')
const cases = selected_cases.length > 0 ? selected_cases : default_cases
const rounds = Number(valueFor('--rounds') || 3)
const output_path = valueFor('--output')
const benchmark_path = fileURLToPath(new URL('./run.js', import.meta.url))

if (sources.length < 2) throw new Error('Pass at least two --source label=path arguments.')
if (!Number.isSafeInteger(rounds) || rounds < 1) throw new Error('--rounds must be a positive integer.')

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

const measurements = []

for (let round = 1; round <= rounds; round++) {
  const round_sources = round % 2 === 1 ? sources : [...sources].reverse()
  for (const source of round_sources) {
    for (const benchmark of cases) {
      const child = spawnSync(process.execPath, ['--expose-gc', benchmark_path], {
        encoding: 'utf8',
        env: {
          ...process.env,
          HTMLFY_BENCHMARK_CASE: benchmark,
          HTMLFY_SOURCE_ROOT: source.path,
        },
        timeout: 120_000,
      })

      if (child.error) throw child.error
      if (child.status !== 0)
        throw new Error(child.stderr || `${source.label} failed: ${benchmark}`)

      measurements.push({ source: source.label, round, ...JSON.parse(child.stdout) })
    }
  }
}

const results = sources.flatMap(source => cases.map((benchmark) => {
  const matches = measurements.filter(result => result.source === source.label && result.name === benchmark)
  const medians = matches.map(result => result.median_ms)
  const hashes = new Set(matches.map(result => result.output_hash))

  return {
    source: source.label,
    benchmark,
    rounds,
    median_ms: median(medians),
    min_ms: Math.min(...medians),
    max_ms: Math.max(...medians),
    retained_heap_bytes: median(matches.map(result => result.retained_heap_bytes)),
    output_hash: hashes.size === 1 ? matches[0].output_hash : 'INCONSISTENT',
  }
}))

for (const benchmark of cases) {
  const hashes = new Set(results.filter(result => result.benchmark === benchmark).map(result => result.output_hash))
  if (hashes.size !== 1)
    console.warn(`Output mismatch for ${benchmark}`)
}

console.table(results.map(result => ({
  source: result.source,
  benchmark: result.benchmark,
  median_ms: result.median_ms,
  range_ms: `${result.min_ms}-${result.max_ms}`,
  retained_KB: Math.round(result.retained_heap_bytes / 1024),
  hash: result.output_hash,
})))

if (output_path) {
  writeFileSync(output_path, `${JSON.stringify({
    generated_at: new Date().toISOString(),
    runtime: `bun-${Bun.version}`,
    rounds,
    sources,
    cases,
    results,
    measurements,
  }, null, 2)}\n`)
  console.log(`Saved comparison results to ${output_path}`)
}
