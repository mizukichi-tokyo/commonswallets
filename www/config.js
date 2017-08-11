window.unicoisaConfig = {

  // wallet UI configuration
  walletName: 'Commons Wallets',
  mainColor: '#001010',      // if blank default color will be used
  secondaryColor: '#001010', // if blank default color will be used
  logo: 'img/0811_LA_Coin.png',           // if blank default logo will be used
  allowAssetChange: true,
  noUserColors: false,
  needsBackup: false,

  // Assets configuration
  assets: [
    {
      assetId: 'Ua2jMFTSTwUz77JhKtHYsGuysTQJNtqfdeowmU',
      name: 'LivingAnywhere',
      symbol: 'LA',
      pluralSymbol: 'LA'
    }
  ],
  defaultAsset: 'Ua2jMFTSTwUz77JhKtHYsGuysTQJNtqfdeowmU',

  // Colu connectivity configuration
  // see https://github.com/troggy/colu-copay-addon
  colu: {
    mode: 'sdk',
    rpcConfig: {
      livenet: {
        baseUrl: ''
      },
      testnet: {
        baseUrl: ''
      }
    }
  },
  coluApiKey: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0aWQiOiI1OTNlNzNmODQwMDcwMDZmYjdhNDYwZTAiLCJleHAiOjE1MDUwNDExNDQwMTF9.wefexMtGHlA46vMslIiYmimrF78kK6rlQOaqJmZU6bw'
};
