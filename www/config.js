window.unicoisaConfig = {

  // wallet UI configuration
  walletName: 'Commons Wallets',
  mainColor: '#001010',      // if blank default color will be used
  secondaryColor: '#001010', // if blank default color will be used
  logo: 'img/0811_LA_Coin.png', // if blank default logo will be used
  allowAssetChange: true,
  noUserColors: false,
  needsBackup: false,

  // Assets configuration
  assets: [
    {
      assetId: 'Ua2jMFTSTwUz77JhKtHYsGuysTQJNtqfdeowmU',
      name: 'LivingAnywhere',
      symbol: 'LA',
      pluralSymbol: 'LA',
      logo: "img/0811_LA_Coin.png"
    },
    {
      assetId: 'Ua29hPk3o2BassJHqSus993HujfPA1Ka1AGQ5q',
      name: 'CLIP',
      symbol: 'CLIP',
      pluralSymbol: 'CLIP',
      logo: "https://colu-files.s3.amazonaws.com/xh34CSaEWnuXv8zEjAMNhF5Z.png"
    },
    {
      assetId: 'Ua66k8gXJNfyPJuMYnAxRfirDSNL4cebYm3bg4',
      name: 'VIVA',
      symbol: 'VIVA',
      pluralSymbol: 'VIVA',
      logo: "https://colu-files.s3.amazonaws.com/9sln6JDe1b4d1L4APK9fhpgX.png"
    },
    {
      assetId: 'Ua24iYouASSAqktpyr7C6PUWSJLmnZ6bRGi7vB',
      name: 'GIFTED BANK COIN',
      symbol: 'GBC',
      pluralSymbol: 'GBC',
      logo: "https://colu-files.s3.amazonaws.com/EwAUjVAsh6vuGes14NsKvjdR.png"
    },
    {
      assetId: 'Ua2NNbzQ9CYc8nFeLBpURMqZpKny8se2xfttBd',
      name: 'ZEN2.0',
      symbol: 'ZEN',
      pluralSymbol: 'ZEN',
      logo: "https://colu-files.s3.amazonaws.com/j9W3onyx_8vqDzFU5bav3FJg.png"
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
