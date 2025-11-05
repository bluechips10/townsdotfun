/**
 * ERC20 Token Contract ABI
 * This will be replaced with compiled contract ABI after compilation
 */
export const ERC20_ABI = [
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_symbol",
                "type": "string"
            },
            {
                "internalType": "uint8",
                "name": "_decimals",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "_totalSupply",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "_creator",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "creatorFee",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "burnFee",
                "type": "uint256"
            }
        ],
        "name": "TaxCollected",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "TAX_RATE",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "accumulatedFees",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "creator",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const

/**
 * TODO: This will contain the compiled bytecode once we write and compile the Solidity contract
 * For now, this is a placeholder structure
 */
export const TOKEN_CONTRACT_BYTECODE = '0x608060405234801561000f575f5ffd5b50604051610d0b380380610d0b83398101604081905261002e91610160565b5f6100398682610289565b5060016100468582610289565b506002805460ff191660ff85161790556003829055600480546001600160a01b0319166001600160a01b038316179055335f818152600660209081526040808320869055518581527fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a35050505050610343565b634e487b7160e01b5f52604160045260245ffd5b5f82601f8301126100e6575f5ffd5b81516001600160401b038111156100ff576100ff6100c3565b604051601f8201601f19908116603f011681016001600160401b038111828210171561012d5761012d6100c3565b604052818152838201602001851015610144575f5ffd5b8160208501602083015e5f918101602001919091529392505050565b5f5f5f5f5f60a08688031215610174575f5ffd5b85516001600160401b03811115610189575f5ffd5b610195888289016100d7565b602088015190965090506001600160401b038111156101b2575f5ffd5b6101be888289016100d7565b945050604086015160ff811681146101d4575f5ffd5b6060870151608088015191945092506001600160a01b03811681146101f7575f5ffd5b809150509295509295909350565b600181811c9082168061021957607f821691505b60208210810361023757634e487b7160e01b5f52602260045260245ffd5b50919050565b601f82111561028457805f5260205f20601f840160051c810160208510156102625750805b601f840160051c820191505b81811015610281575f815560010161026e565b50505b505050565b81516001600160401b038111156102a2576102a26100c3565b6102b6816102b08454610205565b8461023d565b6020601f8211600181146102e8575f83156102d15750848201515b5f19600385901b1c1916600184901b178455610281565b5f84815260208120601f198516915b8281101561031757878501518255602094850194600190920191016102f7565b508482101561033457868401515f19600387901b60f8161c191681555b50505050600190811b01905550565b6109bb806103505f395ff3fe608060405234801561000f575f5ffd5b50600436106100b1575f3560e01c8063587f5ed71161006e578063587f5ed71461016657806370a082311461016f57806383f170be1461018e57806395d89b4114610196578063a9059cbb1461019e578063dd62ed3e146101b1575f5ffd5b806302d05d3f146100b557806306fdde03146100e5578063095ea7b3146100fa57806318160ddd1461011d57806323b872dd14610134578063313ce56714610147575b5f5ffd5b6004546100c8906001600160a01b031681565b6040516001600160a01b0390911681526020015b60405180910390f35b6100ed6101db565b6040516100dc91906107c1565b61010d610108366004610811565b610266565b60405190151581526020016100dc565b61012660035481565b6040519081526020016100dc565b61010d610142366004610839565b6102d2565b6002546101549060ff1681565b60405160ff90911681526020016100dc565b61012660055481565b61012661017d366004610873565b60066020525f908152604090205481565b610126606481565b6100ed61038f565b61010d6101ac366004610811565b61039c565b6101266101bf36600461088c565b600760209081525f928352604080842090915290825290205481565b5f80546101e7906108bd565b80601f0160208091040260200160405190810160405280929190818152602001828054610213906108bd565b801561025e5780601f106102355761010080835404028352916020019161025e565b820191905f5260205f20905b81548152906001019060200180831161024157829003601f168201915b505050505081565b335f8181526007602090815260408083206001600160a01b038716808552925280832085905551919290917f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925906102c09086815260200190565b60405180910390a35060015b92915050565b6001600160a01b0383165f9081526007602090815260408083203384529091528120548211156103425760405162461bcd60e51b8152602060048201526016602482015275496e73756666696369656e7420616c6c6f77616e636560501b60448201526064015b60405180910390fd5b6001600160a01b0384165f90815260076020908152604080832033845290915281208054849290610374908490610909565b9091555061038590508484846103a4565b90505b9392505050565b600180546101e7906108bd565b5f6103883384845b5f6001600160a01b0384166103fb5760405162461bcd60e51b815260206004820152601a60248201527f5472616e736665722066726f6d207a65726f20616464726573730000000000006044820152606401610339565b6001600160a01b0383166104515760405162461bcd60e51b815260206004820152601860248201527f5472616e7366657220746f207a65726f206164647265737300000000000000006044820152606401610339565b6001600160a01b0384165f908152600660205260409020548211156104af5760405162461bcd60e51b8152602060048201526014602482015273496e73756666696369656e742062616c616e636560601b6044820152606401610339565b6001600160a01b03841661052d576001600160a01b0383165f90815260066020526040812080548492906104e490849061091c565b92505081905550826001600160a01b0316846001600160a01b03165f5160206109665f395f51905f528460405161051d91815260200190565b60405180910390a3506001610388565b5f61271061053c60648561092f565b6105469190610946565b90505f6105538285610909565b90508115610720575f610567600284610946565b90505f6105748285610909565b6001600160a01b0389165f908152600660205260408120805492935088929091906105a0908490610909565b90915550506001600160a01b0387165f90815260066020526040812080548592906105cc90849061091c565b90915550506004546001600160a01b03165f90815260066020526040812080548492906105fa90849061091c565b9091555050305f908152600660205260408120805483929061061d90849061091c565b925050819055508060055f828254610635919061091c565b92505081905550866001600160a01b0316886001600160a01b03165f5160206109665f395f51905f528560405161066e91815260200190565b60405180910390a36004546040518381526001600160a01b03918216918a16905f5160206109665f395f51905f529060200160405180910390a360405181815230906001600160a01b038a16905f5160206109665f395f51905f529060200160405180910390a360408051838152602081018390526001600160a01b038a16917f1137290ec9b1f9c41fb72a212c58301a6eda3b23bc43c0e528f6d21216d593b8910160405180910390a250506107b5565b6001600160a01b0386165f9081526006602052604081208054869290610747908490610909565b90915550506001600160a01b0385165f908152600660205260408120805486929061077390849061091c565b92505081905550846001600160a01b0316866001600160a01b03165f5160206109665f395f51905f52866040516107ac91815260200190565b60405180910390a35b50600195945050505050565b602081525f82518060208401528060208501604085015e5f604082850101526040601f19601f83011684010191505092915050565b80356001600160a01b038116811461080c575f5ffd5b919050565b5f5f60408385031215610822575f5ffd5b61082b836107f6565b946020939093013593505050565b5f5f5f6060848603121561084b575f5ffd5b610854846107f6565b9250610862602085016107f6565b929592945050506040919091013590565b5f60208284031215610883575f5ffd5b610388826107f6565b5f5f6040838503121561089d575f5ffd5b6108a6836107f6565b91506108b4602084016107f6565b90509250929050565b600181811c908216806108d157607f821691505b6020821081036108ef57634e487b7160e01b5f52602260045260245ffd5b50919050565b634e487b7160e01b5f52601160045260245ffd5b818103818111156102cc576102cc6108f5565b808201808211156102cc576102cc6108f5565b80820281158282048414176102cc576102cc6108f5565b5f8261096057634e487b7160e01b5f52601260045260245ffd5b50049056feddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa26469706673582212204ef5c4f3457ea0987d2141a17d2617eac4208df51ddfd0b19cef0934c16a79c264736f6c634300081e0033' as `0x${string}`

