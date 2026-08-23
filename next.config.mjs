const transformersBrowserEntry = new URL(
  "./node_modules/@huggingface/transformers/dist/transformers.web.js",
  import.meta.url,
).pathname;

class PreservePreMinifiedOrtModulesPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap(
      "PreservePreMinifiedOrtModulesPlugin",
      (compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: "PreservePreMinifiedOrtModulesPlugin",
            stage:
              compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE -
              1,
          },
          () => {
            for (const asset of compilation.getAssets()) {
              if (!/(?:^|\/)ort[^/]*\.min(?:\.[^/]*)?\.mjs$/.test(asset.name)) {
                continue;
              }

              compilation.updateAsset(asset.name, asset.source, {
                ...asset.info,
                minimized: true,
              });
            }
          },
        );
      },
    );
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@huggingface/transformers$": transformersBrowserEntry,
      "onnxruntime-node$": false,
      "sharp$": false,
    };
    config.plugins.push(new PreservePreMinifiedOrtModulesPlugin());
    return config;
  },
};

export default nextConfig;
