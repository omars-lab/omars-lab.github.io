module.exports = {
  presets: [
    [require.resolve('@babel/preset-typescript'), { isTSX: true, allExtensions: true }],
    require.resolve('@docusaurus/core/lib/babel/preset'),
  ],
};
