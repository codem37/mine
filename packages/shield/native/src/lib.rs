use adblock::lists::{FilterFormat, ParseOptions};
use napi::bindgen_prelude::*;
use napi_derive::napi;
use std::sync::Mutex;

#[napi(object)]
pub struct NativeVerdict {
  pub blocked: bool,
  pub matched_filter: Option<String>,
}

#[napi]
pub struct ShieldEngine {
  engine: Mutex<adblock::Engine>,
}

fn parse_options() -> ParseOptions {
  ParseOptions {
    format: FilterFormat::Standard,
    ..Default::default()
  }
}

#[napi]
impl ShieldEngine {
  #[napi(constructor)]
  pub fn new() -> Result<Self> {
    Ok(Self {
      engine: Mutex::new(adblock::Engine::from_rules(
        Vec::<String>::new(),
        parse_options(),
      )),
    })
  }

  #[napi]
  pub fn replace_filters(&self, lists: Vec<String>) -> () {
    let mut rules: Vec<String> = Vec::new();
    for list in &lists {
      for line in list.lines() {
        if !line.trim().is_empty() {
          rules.push(line.to_string());
        }
      }
    }
    let rebuilt =
      adblock::Engine::from_rules(rules, parse_options());
    if let Ok(mut guard) = self.engine.lock() {
      *guard = rebuilt;
    }
  }

  #[napi]
  pub fn check(
    &self,
    url: String,
    source_url: String,
    resource_type: String,
  ) -> NativeVerdict {
    let request = match adblock::request::Request::new(
      &url,
      &source_url,
      &resource_type,
    ) {
      Ok(request) => request,
      Err(_) => {
        return NativeVerdict {
          blocked: false,
          matched_filter: None,
        }
      }
    };
    let guard = match self.engine.lock() {
      Ok(guard) => guard,
      Err(_) => {
        return NativeVerdict {
          blocked: false,
          matched_filter: None,
        }
      }
    };
    let result = guard.check_network_request(&request);
    NativeVerdict {
      blocked: result.matched,
      matched_filter: result.filter,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use adblock::Engine;
  use adblock::request::{Request, RequestType};

  fn engine_with_rules(rules: &[&str]) -> Engine {
    Engine::from_rules(rules.to_vec(), parse_options())
  }

  fn request_for(url: &str, source: &str, kind: &str) -> Request {
    Request::new(url, source, kind).unwrap()
  }

  #[test]
  fn blocks_matching_network_filter() {
    let engine = engine_with_rules(&["||ads.example.com^"]);
    assert!(
      engine
        .check_network_request(&request_for(
          "https://ads.example.com/pixel.js",
          "https://news.example.org/",
          "script"
        ))
        .matched
    );
  }

  #[test]
  fn allows_unrelated_requests() {
    let engine = engine_with_rules(&["||ads.example.com^"]);
    assert!(
      !engine
        .check_network_request(&request_for(
          "https://innocent.example.org/style.css",
          "https://news.example.org/",
          "stylesheet"
        ))
        .matched
    );
  }

  #[test]
  fn reports_which_filter_matched() {
    let engine = engine_with_rules(&["||ads.example.com^"]);
    let result =
      engine.check_network_request(&request_for(
        "https://ads.example.com/pixel.js",
        "https://news.example.org/",
        "script",
      ));
    assert_eq!(result.filter.as_deref(), Some("NetworkFilter"));
  }

  #[test]
  fn empty_engine_blocks_nothing() {
    let engine = engine_with_rules(&[]);
    assert!(
      !engine
        .check_network_request(&request_for(
          "https://anything.example.net/a.js",
          "https://example.org/",
          "script"
        ))
        .matched
    );
  }

  #[test]
  fn request_types_reach_the_engine() {
    let _ = RequestType::Document;
    let engine = engine_with_rules(&["||tracker.example^$image"]);
    assert!(
      engine
        .check_network_request(&request_for(
          "https://tracker.example/img.png",
          "https://site.example/",
          "image",
        ))
        .matched
    );
  }
}
