import jsYaml from 'js-yaml';

let jsonCache = {};
let yamlCache = {};

export async function loadYaml(url) {
  if (!(url in yamlCache)) {
    const response = await fetch(url);
    const text = await response.text();
    yamlCache[url] = jsYaml.load(text);
  }

  return yamlCache[url];
}

export async function loadJson(url) {
  if (!(url in jsonCache)) {
    const response = await fetch(url);
    jsonCache[url] = await response.json();
  }

  return jsonCache[url];
}
