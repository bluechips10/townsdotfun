import type { PlainMessage, SlashCommand } from '@towns-protocol/proto'

const commands = [
    {
        name: 'help',
        description: 'Get help with bot commands',
    },
    {
        name: 'start',
        description: 'Deploy a custom ERC20 token on Base (1% transfer fee split between you and $TOWNS buyback/burn)',
    },
] as const satisfies PlainMessage<SlashCommand>[]

export default commands
