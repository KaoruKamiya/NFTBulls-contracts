module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // Match any network id
      gas: 5000000,
    },
  },
  compilers: {
    solc: {
      version: '0.7.0',
      settings: {
        optimizer: {
          enabled: true, // Default: false
          runs: 1000000, // Default: 200
        },
      },
    },
  },
  mocha: {
    enableTimeouts: false,
  },
  plugins: ['solidity-coverage'],
}
