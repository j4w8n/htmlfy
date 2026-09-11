import { writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'
import { closify, entify, minify, prettify, trimify } from '../src/exports/index.js'
import { isHtml } from '../src/utils.js'

const KB = 1024
const MB = 1024 * KB

const makeRealisticHtml = (minimum_bytes) => {
  const section = `<section class="card" data-kind="example">
  <h2>Performance sample</h2>
  <p>A short paragraph with <a href="/details">a useful link</a> and realistic text content.</p>
  <input type="text" name="query" placeholder="Search here">
</section>`
  const sections = section.repeat(Math.ceil(minimum_bytes / section.length))
  return `<main>${sections}</main>`
}

const makeIgnoredHtml = (count) => {
  const block = '<pre>  const value = "a  b";\n    console.log(value);\n</pre>'
  return `<main>${block.repeat(count)}</main>`
}

const makeDeepHtml = (depth) => `${'<div>'.repeat(depth)}content${'</div>'.repeat(depth)}`

const cases = [
  { name: 'prettify/realistic/10KB', input: () => makeRealisticHtml(10 * KB), iterations: 30, run: prettify },
  { name: 'prettify/realistic/100KB', input: () => makeRealisticHtml(100 * KB), iterations: 20, run: prettify },
  { name: 'prettify/realistic/1MB', input: () => makeRealisticHtml(MB), iterations: 7, run: prettify },
  { name: 'minify/realistic/100KB', input: () => makeRealisticHtml(100 * KB), iterations: 50, run: minify },
  { name: 'closify/realistic/100KB', input: () => makeRealisticHtml(100 * KB), iterations: 50, run: closify },
  { name: 'trimify/realistic/100KB', input: () => makeRealisticHtml(100 * KB), iterations: 50, run: html => trimify(html, ['p']) },
  { name: 'entify/textarea/100KB', input: () => `<textarea>${' '.repeat(100 * KB)}</textarea>`, iterations: 20, run: entify },
  { name: 'minify/textarea/100KB', input: () => `<textarea>${' '.repeat(100 * KB)}</textarea>`, iterations: 20, run: minify },
  { name: 'minify/text-run/4KB', input: () => `<div>${'x'.repeat(4 * KB)}</div>`, iterations: 50, run: minify },
  { name: 'minify/text-run/8KB', input: () => `<div>${'x'.repeat(8 * KB)}</div>`, iterations: 50, run: minify },
  { name: 'minify/text-run/16KB', input: () => `<div>${'x'.repeat(16 * KB)}</div>`, iterations: 50, run: minify },
  { name: 'minify/text-run/32KB', input: () => `<div>${'x'.repeat(32 * KB)}</div>`, iterations: 50, run: minify },
  { name: 'isHtml/malformed/12', input: () => `<div ${'a '.repeat(12)}`, iterations: 100, run: isHtml },
  { name: 'isHtml/malformed/16', input: () => `<div ${'a '.repeat(16)}`, iterations: 100, run: isHtml },
  { name: 'isHtml/malformed/20', input: () => `<div ${'a '.repeat(20)}`, iterations: 100, run: isHtml },
  { name: 'prettify/content-wrap/100KB', input: () => makeRealisticHtml(100 * KB), iterations: 20, run: html => prettify(html, { content_wrap: 60 }) },
  { name: 'prettify/tag-wrap/100KB', input: () => makeRealisticHtml(100 * KB), iterations: 10, run: html => prettify(html, { tag_wrap: 40 }) },
  { name: 'prettify/deep/100', input: () => makeDeepHtml(100), iterations: 30, run: prettify },
  { name: 'prettify/deep/300', input: () => makeDeepHtml(300), iterations: 15, run: prettify },
  { name: 'prettify/ignored/100', input: () => makeIgnoredHtml(100), iterations: 30, run: html => prettify(html, { ignore: ['pre'] }) },
  { name: 'prettify/ignored/500', input: () => makeIgnoredHtml(500), iterations: 20, run: html => prettify(html, { ignore: ['pre'] }) },
  { name: 'prettify/ignored/1000', input: () => makeIgnoredHtml(1000), iterations: 10, run: html => prettify(html, { ignore: ['pre'] }) },
]

const percentile = (values, amount) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.max(0, Math.ceil(sorted.length * amount) - 1)]
}

const round = (value) => Math.round(value * 1000) / 1000

const runCase = (benchmark) => {
  const input = benchmark.input()
  global.gc?.()
  const heap_before = process.memoryUsage().heapUsed

  const cold_start = performance.now()
  let output = benchmark.run(input)
  const cold_ms = performance.now() - cold_start

  const samples = []
  for (let index = 0; index < benchmark.iterations; index++) {
    const start = performance.now()
    output = benchmark.run(input)
    samples.push(performance.now() - start)
  }

  global.gc?.()
  const input_bytes = Buffer.byteLength(input)
  const median_ms = percentile(samples, 0.5)

  return {
    name: benchmark.name,
    input_bytes,
    output_bytes: Buffer.byteLength(String(output)),
    iterations: benchmark.iterations,
    cold_ms: round(cold_ms),
    median_ms: round(median_ms),
    p95_ms: round(percentile(samples, 0.95)),
    throughput_mbps: round(input_bytes / 1024 / 1024 / (median_ms / 1000)),
    retained_heap_bytes: process.memoryUsage().heapUsed - heap_before,
  }
}

const selected_case = process.env.HTMLFY_BENCHMARK_CASE

if (selected_case) {
  const benchmark = cases.find(candidate => candidate.name === selected_case)
  if (!benchmark) throw new Error(`Unknown benchmark: ${selected_case}`)
  process.stdout.write(JSON.stringify(runCase(benchmark)))
} else {
  const output_index = process.argv.indexOf('--output')
  const output_path = output_index === -1 ? undefined : process.argv[output_index + 1]
  const filter_index = process.argv.indexOf('--filter')
  const filter = filter_index === -1 ? undefined : process.argv[filter_index + 1]
  const selected = filter ? cases.filter(benchmark => benchmark.name.includes(filter)) : cases

  if (selected.length === 0) throw new Error(`No benchmarks matched: ${filter}`)

  const results = selected.map((benchmark) => {
    const child = spawnSync(process.execPath, ['--expose-gc', fileURLToPath(import.meta.url)], {
      encoding: 'utf8',
      env: { ...process.env, HTMLFY_BENCHMARK_CASE: benchmark.name },
      timeout: 30_000,
    })

    if (child.error) throw child.error
    if (child.status !== 0) throw new Error(child.stderr || `Benchmark failed: ${benchmark.name}`)
    return JSON.parse(child.stdout)
  })

  console.table(results.map(result => ({
    benchmark: result.name,
    bytes: result.input_bytes,
    cold_ms: result.cold_ms,
    median_ms: result.median_ms,
    p95_ms: result.p95_ms,
    MB_per_s: result.throughput_mbps,
    retained_KB: round(result.retained_heap_bytes / KB),
  })))

  if (output_path) {
    writeFileSync(output_path, `${JSON.stringify({
      generated_at: new Date().toISOString(),
      runtime: typeof Bun === 'undefined' ? `node-${process.version}` : `bun-${Bun.version}`,
      platform: `${process.platform}-${process.arch}`,
      results,
    }, null, 2)}\n`)
    console.log(`Saved benchmark results to ${output_path}`)
  }
}
