const webpack = require("webpack");

module.exports = function override(config) {
    const fallback = config.resolve.fallback || {};
    Object.assign(fallback, {
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        assert: require.resolve("assert"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        vm: require.resolve("vm-browserify"),
        os: require.resolve("os-browserify"),
        url: require.resolve("url"),
        zlib: require.resolve("browserify-zlib"),
    });
    config.resolve.fallback = fallback;
    config.plugins = (config.plugins || []).concat([
        new webpack.ProvidePlugin({
            process: "process/browser",
            Buffer: ["buffer", "Buffer"],
        }),
    ]);
    config.ignoreWarnings = [
        /Failed to parse source map/,
        /the request of a dependency is an expression/,
    ];
    config.module.rules.push({
        test: /\.(js|mjs|jsx)$/,
        enforce: "pre",
        loader: require.resolve("source-map-loader"),
        resolve: {
            fullySpecified: false,
        },
    });
    config.module.rules.push({
        test: /.wasm$/,
        type: "webassembly/sync",
    });

    config.experiments = {
        asyncWebAssembly: true,
        syncWebAssembly: true,
    };
    return config;
};
