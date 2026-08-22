use adblock::lists::{FilterFormat, ParseOptions};
use adblock::request::Request;
use std::collections::HashMap;
use std::time::Instant;

fn load_rules(path: &str) -> Vec<String> {
    let text = std::fs::read_to_string(path)
        .unwrap_or_else(|e| panic!("cannot read {path}: {e}"));
    text.lines()
        .map(|l| l.trim().to_string())
        .filter(|l| !l.is_empty())
        .collect()
}

fn extract_blockable_hosts(rules: &[String], want: usize) -> Vec<String> {
    let mut hosts = Vec::new();
    for rule in rules {
        if let Some(rest) = rule.strip_prefix("||") {
            let end = rest
                .find(|c| c == '^' || c == '/' || c == '$' || c == '*')
                .unwrap_or(rest.len());
            let host = &rest[..end];
            if !host.is_empty() && host.contains('.') && !host.contains('~') {
                hosts.push(host.to_string());
            }
        }
    }
    hosts.sort();
    hosts.dedup();
    if hosts.len() <= want {
        return hosts;
    }
    let step = hosts.len() / want;
    (0..want).map(|i| hosts[i * step].clone()).collect()
}

fn percentile(sorted_ns: &[u64], p: f64) -> u64 {
    let idx = ((sorted_ns.len() as f64 - 1.0) * p).round() as usize;
    sorted_ns[idx]
}

fn main() {
    let lists_dir = std::env::var("MINE_SHIELD_BENCH_LISTS")
        .unwrap_or_else(|_| "../../../.shield-cache".to_string());

    println!("=== mine shield lookup benchmark ===");
    let mut all_rules: Vec<String> = Vec::new();
    for name in ["easylist.txt", "ublock-filters.txt"] {
        let p = format!("{lists_dir}/{name}");
        let rules = load_rules(&p);
        println!(
            "loaded {:<22} {:>6} lines",
            name,
            rules.len()
        );
        all_rules.extend(rules);
    }
    let total_lines = all_rules.len();

    let t0 = Instant::now();
    let engine = adblock::Engine::from_rules(
        all_rules.clone(),
        ParseOptions {
            format: FilterFormat::Standard,
            ..Default::default()
        },
    );
    println!(
        "engine built from {total_lines} rules in {:.2?}",
        t0.elapsed()
    );

    let block_hosts = extract_blockable_hosts(&all_rules, 5000);
    if block_hosts.len() < 100 {
        eprintln!("not enough || rules found for a meaningful corpus");
        std::process::exit(1);
    }

    let mut corpus: Vec<(String, String)> = Vec::new();
    for (i, host) in block_hosts.iter().enumerate() {
        corpus.push((
            format!("https://{host}/ads/frame/{}/pixel.js?cb={}", i, i),
            "https://news-site.example/article".to_string(),
        ));
    }
    for i in 0..block_hosts.len() {
        corpus.push((
            format!(
                "https://www.page-{}.ordinary-{}.example/content/story?id={}",
                i,
                i % 9,
                i
            ),
            "https://news-site.example/article".to_string(),
        ));
    }

    for (url, source) in corpus.iter().take(2000) {
        let _ = Request::new(url, source, "script");
    }

    let mut samples_ns: Vec<u64> = Vec::with_capacity(corpus.len());
    let mut blocked = 0u64;
    let start = Instant::now();
    for (url, source) in &corpus {
        let t = Instant::now();
        let request =
            Request::new(url, source, "script").expect("corpus urls must parse");
        let result = engine.check_network_request(&request);
        let elapsed = t.elapsed().as_nanos() as u64;
        samples_ns.push(elapsed);
        if result.matched {
            blocked += 1;
        }
    }
    let total_elapsed = start.elapsed();

    samples_ns.sort_unstable();
    let n = samples_ns.len();
    let sum: u64 = samples_ns.iter().sum();

    let mut histogram: HashMap<u64, usize> = HashMap::new();
    println!("\ncorpus: {} requests ({blocked} blocked)", corpus.len());
    println!(
        "total wall: {:.2?} | throughput: {:.0} req/s",
        total_elapsed,
        corpus.len() as f64 / total_elapsed.as_secs_f64()
    );
    println!("{:-<44}", "");
    println!(
        "| {:<8} | {:>12} |",
        "percentile", "ns per lookup"
    );
    println!("{:-<44}", "");
    for (label, p) in [
        ("p50", 0.50),
        ("p90", 0.90),
        ("p99", 0.99),
        ("p99.9", 0.999),
        ("max", 1.0),
    ] {
        println!("| {label:<8} | {:>12} |", percentile(&samples_ns, p));
    }
    println!("{:-<44}", "");
    println!("mean: {:>12} ns", sum / n as u64);
    let budget_ns: u64 = 1_000_000;
    let over_budget = samples_ns.iter().filter(|s| **s > budget_ns).count();
    println!(
        "budget check: {over_budget}/{n} lookups exceeded 1ms"
    );
}
