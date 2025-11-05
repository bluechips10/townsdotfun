import * as solc from 'solc'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
    console.log('Compiling SimpleToken.sol...')
    
    const contractPath = path.join(__dirname, '../contracts/SimpleToken.sol')
    const source = fs.readFileSync(contractPath, 'utf-8')
    
    const input = {
        language: 'Solidity',
        sources: {
            'SimpleToken.sol': {
                content: source,
            },
        },
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            outputSelection: {
                '*': {
                    '*': ['abi', 'evm.bytecode'],
                },
            },
        },
    }
    
    const output = JSON.parse(solc.compile(JSON.stringify(input)))
    
    if (output.errors) {
        const errors = output.errors.filter((e: any) => e.severity === 'error')
        if (errors.length > 0) {
            console.error('Compilation errors:')
            errors.forEach((error: any) => {
                console.error(error.formattedMessage || error.message)
            })
            process.exit(1)
        }
    }
    
    const contract = output.contracts['SimpleToken.sol']['SimpleToken']
    const bytecode = '0x' + contract.evm.bytecode.object
    const abi = contract.abi
    
    // Update contract.ts
    const contractTsPath = path.join(__dirname, '../src/token/contract.ts')
    let contractTs = fs.readFileSync(contractTsPath, 'utf-8')
    
    // Replace bytecode
    contractTs = contractTs.replace(
        /export const TOKEN_CONTRACT_BYTECODE = '0x'.*/,
        `export const TOKEN_CONTRACT_BYTECODE = '${bytecode}' as \`0x\${string}\``
    )
    
    // Replace ABI
    const abiString = JSON.stringify(abi, null, 4)
    contractTs = contractTs.replace(
        /export const ERC20_ABI = \[[\s\S]*?\] as const/,
        `export const ERC20_ABI = ${abiString} as const`
    )
    
    fs.writeFileSync(contractTsPath, contractTs, 'utf-8')
    
    console.log('✅ Compilation successful!')
    console.log(`✅ Updated src/token/contract.ts`)
    console.log(`   Bytecode length: ${bytecode.length} characters`)
    console.log(`   ABI functions: ${abi.filter((item: any) => item.type === 'function').length}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })

