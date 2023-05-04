const { defineConfig } = require('@vue/cli-service')
const MonacoEditorPlugin = require('monaco-editor-webpack-plugin')

module.exports = defineConfig({
  transpileDependencies: true
})

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: config => {
    config.plugins.push(
      new MonacoEditorPlugin({
        // https://github.com/Microsoft/monaco-editor-webpack-plugin#options
        // Include a subset of languages support
        // Some language extensions like typescript are so huge that may impact build performance
        // e.g. Build full languages support with webpack 4.0 takes over 80 seconds
        // Languages are loaded on demand at runtime
        languages: ['javascript', 'css', 'html', 'typescript']
      })
    )

    for (const rule of config.module.rules) {
      rule.resourceQuery = {
        not: [/assembly/]
      }
    }
    config.module.rules.unshift(
      {
        test: /\.ts/,
        resourceQuery: /assembly/,
        type: 'asset/source'
      }
    )
    config.module.rules.unshift(
      {
        test: /\.as/,
        resourceQuery: /assembly/,
        type: 'asset/source'
      }
    )
    config.module.rules.unshift(
      {
        test: /\.txt/,
        resourceQuery: /assembly/,
        type: 'asset/source'
      }
    )

    config.resolve.fallback = {
      path: require.resolve('assemblyscript/util/browser/path.js'),
      url: require.resolve("assemblyscript/util/browser/url.js"),
      fs: require.resolve("assemblyscript/util/browser/fs.js"),
      module: require.resolve("assemblyscript/util/browser/module.js"),
      util: require.resolve("util/"),
      buffer: require.resolve('buffer-browserify'),
      process: require.resolve('assemblyscript/util/browser/process.js'),
      stream: require.resolve('stream-browserify'),
    }

    if (!config.experiments) {
      config.experiments = {}
    }
    config.experiments.topLevelAwait = true
  }
})