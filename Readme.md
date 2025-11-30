# Shipyard - Ephemeral Rollup-Powered Discord on Solana

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Solana](https://img.shields.io/badge/Built%20on-Solana-purple.svg)](https://solana.com/)
[![Anchor](https://img.shields.io/badge/Framework-Anchor-orange.svg)](https://www.anchor-lang.com/)
[![Ephemeral Rollups](https://img.shields.io/badge/Powered%20by-Ephemeral%20Rollups-green.svg)](https://magicblock.gg/)

A high-performance Discord-like platform leveraging Solana smart contracts with Ephemeral Rollup delegation for gasless voting, real-time Socket.io messaging, and on-chain governance.

## 🔧 Core Architecture

### Smart Contract Foundation (`cypher-it` Program)

**Program ID**: `2QZ6YQeJmAfg6iWe76amzgfEHZsGBUXtC41a4reCiqPC`

The core Solana program built with Anchor Framework v0.31.0 handles:
- Channel state management with token-gated access
- User profile and membership tracking
- Governance polls with ephemeral rollup delegation
- Fee collection and platform administration

### Ephemeral Rollup Integration

Utilizes **ephemeral-rollups-sdk v0.3.4** for high-frequency, gasless operations:

```rust
// Poll delegation for gasless voting
#[delegate]
pub struct DelegatePollCtx<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, del)]
    pub poll: AccountInfo<'info>,
}

// Automatic commit and undelegate
#[commit]
pub struct UndelegatePollCtx<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub poll: Account<'info, Poll>,
}
```

### Real-time Communication Layer

Socket.io server handling:
- WebSocket connections with wallet authentication
- Channel-based message routing
- Real-time typing indicators and presence
- Message persistence with JSON file storage

## 📋 Smart Contract Implementation

### Program Structure

```rust
// Main program entry points
#[program]
pub mod discord_like_program {
    // Channel Management
    pub fn create_channel(ctx: Context<CreateChannelCtx>, 
        name: String, description: String, cost: u64, 
        is_private: bool, img_url: String) -> Result<()>
    
    pub fn join_channel(ctx: Context<JoinChannelCtx>, channel_id: u64) -> Result<()>
    pub fn leave_channel(ctx: Context<LeaveChannelCtx>, channel_id: u64) -> Result<()>
    pub fn update_channel(ctx: Context<UpdateChannelCtx>, ...) -> Result<()>
    
    // User Profiles
    pub fn create_profile(ctx: Context<CreateProfileCtx>, 
        display_name: String, bio: String, avatar_uri: String) -> Result<()>
    
    // Governance & Polls
    pub fn create_poll(ctx: Context<CreatePollCtx>, 
        channel_id: u64, poll_type: u8, question: String, 
        options: Vec<String>, duration: i64) -> Result<()>
    
    pub fn vote_poll(ctx: Context<VotePollCtx>, 
        channel_id: u64, option_index: u64) -> Result<()>
    
    // Ephemeral Rollup Operations
    pub fn delegate_poll(ctx: Context<DelegatePollCtx>, 
        channel_id: u64, poll_index: u64) -> Result<()>
    
    pub fn undelegate_poll(ctx: Context<UndelegatePollCtx>) -> Result<()>
}
```

### State Accounts

#### Channel Account
```rust
#[account]
#[derive(InitSpace)]
pub struct Channel {
    pub id: u64,
    #[max_len(64)]
    pub name: String,
    #[max_len(512)]
    pub description: String,
    pub cost: u64,              // Entry cost in lamports
    pub creator: Pubkey,
    pub is_private: bool,
    pub member_count: u64,
    pub created_at: i64,
    pub updated_at: i64,
    #[max_len(256)]
    pub img_url: String,
    pub poll_count: u64,        // Tracks polls for PDA derivation
}
```

#### Poll Account with Governance
```rust
#[account]
#[derive(InitSpace)]
pub struct Poll {
    pub channel_id: u64,
    pub creator: Pubkey,
    #[max_len(200)]
    pub poll_question: String,
    pub poll_type: u8,          // 0=kick, 1=mute, 2=general
    #[max_len(10, 100)]
    pub options: Vec<String>,
    #[max_len(10)]
    pub votes: Vec<u64>,
    pub total_votes: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub required_votes: u64,    // For moderation polls
    pub target: Option<Pubkey>, // Target user for moderation
    #[max_len(100)]
    pub voted: Vec<Pubkey>,     // Prevents double voting
    pub ended: bool,
    pub bump: u8,
}
```

#### User Profile
```rust
#[account]
pub struct Profile {
    pub owner: Pubkey,          // Wallet address
    pub display_name: String,   // Max 50 chars
    pub bio: String,           // Max 200 chars
    pub avatar_uri: String,    // Max 200 chars
    pub created_at: i64,
}
```

## 🚀 Ephemeral Rollup Implementation

### Delegation Configuration

```rust
use ephemeral_rollups_sdk::anchor::delegate;
use ephemeral_rollups_sdk::cpi::DelegateConfig;

pub fn delegate_poll(
    ctx: Context<DelegatePollCtx>,
    channel_id: u64,
    poll_index: u64,
) -> Result<()> {
    ctx.accounts.delegate_poll(
        &ctx.accounts.payer,
        &[
            b"poll",
            channel_id.to_le_bytes().as_ref(),
            poll_index.to_le_bytes().as_ref(),
        ],
        DelegateConfig {
            commit_frequency_ms: 30_000,  // 30 second commits
            validator: Some(
                "MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57"
                    .parse::<Pubkey>()
                    .unwrap(),
            ),
            ..Default::default()
        },
    )?;
    Ok(())
}
```

### Commit and Undelegate Pattern

```rust
use ephemeral_rollups_sdk::anchor::commit;
use ephemeral_rollups_sdk::ephem::commit_and_undelegate_accounts;

impl<'info> UndelegatePollCtx<'info> {
    pub fn undelegate_poll(&self) -> Result<()> {
        commit_and_undelegate_accounts(
            &self.payer,
            vec![&self.poll.to_account_info()],
            &self.magic_context,
            &self.magic_program,
        )?;
        
        msg!("Poll undelegated and committed to L1");
        Ok(())
    }
}
```

### Benefits of Ephemeral Rollups
- **Gasless Voting**: Users vote without paying transaction fees
- **High Frequency Updates**: 30-second commit frequency for rapid governance
- **Automatic State Sync**: Seamless L1/L2 state management
- **Validator Delegation**: Specific validator handling rollup operations

## � Socket.io Real-time Architecture

### Server Implementation

#### Connection Handling with Wallet Auth
```javascript
io.on('connection', (socket) => {
  const pubKey = socket.handshake.auth.pubKey;
  
  if (!pubKey) {
    socket.disconnect();
    return;
  }

  userSessions[pubKey] = socket.id;
  socket.emit('channels-list', channels);
```

#### Channel Management Events
```javascript
// Join channel with message history
socket.on('join-channel', (channelId) => {
  socket.join(channelId);
  
  if (channelMessages[channelId]) {
    socket.emit('channel-messages', channelMessages[channelId]);
  }
  
  socket.to(channelId).emit('user-joined', {
    pubKey: pubKey,
    timestamp: new Date()
  });
});

// Real-time message broadcasting
socket.on('send-message', (data) => {
  const { channelId, message } = data;
  
  const messageWithUserInfo = {
    ...message,
    pubKey: pubKey,
    timestamp: new Date()
  };

  channelMessages[channelId].push(messageWithUserInfo);
  saveMessages();
  
  io.to(channelId).emit('receive-message', messageWithUserInfo);
});
```

#### Typing Indicators
```javascript
socket.on('typing', (data) => {
  socket.to(data.channelId).emit('user-typing', {
    pubKey: pubKey,
    username: data.username
  });
});

socket.on('stop-typing', (data) => {
  socket.to(data.channelId).emit('user-stop-typing', {
    pubKey: pubKey
  });
});
```

### Client-side Socket Integration

```typescript
// Socket context setup
const { socket } = useSocket();

useEffect(() => {
  if (!socket) return;
  
  socket.emit('join-channel', activeChannel);

  socket.on('channel-messages', (msgs) => {
    setMessages(prev => ({ ...prev, [activeChannel]: msgs }));
  });

  socket.on('receive-message', (message: Message) => {
    setMessages(prev => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), message]
    }));
  });

  return () => {
    socket.emit('leave-channel', activeChannel);
    socket.off('receive-message');
    socket.off('channel-messages');
  };
}, [socket, activeChannel]);
```

### Message Persistence
```javascript
// File-based persistence for development
const channelsFilePath = path.join(__dirname, 'data', 'channels.json');
const messagesFilePath = path.join(__dirname, 'data', 'messages.json');

const saveMessages = () => {
  fs.writeFileSync(messagesFilePath, 
    JSON.stringify(channelMessages, null, 2));
};

const loadMessages = () => {
  if (fs.existsSync(messagesFilePath)) {
    const data = fs.readFileSync(messagesFilePath, 'utf8');
    channelMessages = JSON.parse(data);
  }
};
```

## 🛠️ Technical Dependencies

### Smart Contract Stack
```toml
[dependencies]
anchor-lang = "0.31.0"
anchor-spl = "0.31.1"
ephemeral-rollups-sdk = { version = "0.3.4", features = ["anchor"] }
```

### Frontend & Backend
```json
{
  "core": {
    "next": "15.5.4",
    "react": "19.1.0",
    "typescript": "^5",
    "@solana/web3.js": "^1.95.1",
    "@coral-xyz/anchor": "^0.30.1"
  },
  "realtime": {
    "socket.io": "^4.8.1",
    "socket.io-client": "^4.8.1",
    "express": "^4.18.2"
  },
  "solana": {
    "@solana/wallet-adapter-react": "^0.15.35",
    "@solana/wallet-adapter-react-ui": "^0.9.35",
    "@solana/wallet-adapter-wallets": "^0.19.32",
    "@solana/spl-token": "^0.4.8"
  }
}
```

## 🚀 Quick Start

### Prerequisites
```bash
# Solana CLI
curl --proto '=https' --tlsv1.2 -sSf https://release.solana.com/v1.18.22/install | sh

# Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.31.0
avm use 0.31.0

# Node.js 18+
node --version  # v18.0.0+
```

### Installation

1. **Clone and Install**
```bash
git clone <repo-url> && cd shipyard
npm install
cd app && npm install
```

2. **Environment Setup**
```bash
# app/.env.local
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=2QZ6YQeJmAfg6iWe76amzgfEHZsGBUXtC41a4reCiqPC
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

3. **Smart Contract Deployment**
```bash
# Build program
anchor build

# Generate types
anchor build --idl target/idl/cypher_it.json

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Run tests
anchor test
```

4. **Start Development**
```bash
# Terminal 1: Start frontend & socket server
cd app
npm run dev:all

# Runs:
# - Next.js on http://localhost:3002
# - Socket.io server on http://localhost:3001
```

## 🧪 Testing Smart Contracts

### Basic Test Structure
```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CypherIt } from "../target/types/cypher_it";

describe("cypher-it", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.cypherIt as Program<CypherIt>;

  it("Initialize program", async () => {
    const tx = await program.methods.initialize().rpc();
    console.log("Transaction signature:", tx);
  });

  it("Create channel", async () => {
    const tx = await program.methods
      .createChannel("general", "General discussion", 0, false, "")
      .rpc();
  });

  it("Create and vote on poll with ephemeral rollups", async () => {
    // Create poll
    const pollTx = await program.methods
      .createPoll(1, 2, "Test poll?", ["Yes", "No"], 3600)
      .rpc();
    
    // Delegate to ephemeral rollup
    const delegateTx = await program.methods
      .delegatePoll(1, 0)
      .rpc();
    
    // Vote (gasless on rollup)
    const voteTx = await program.methods
      .votePoll(1, 0)
      .rpc();
    
    // Commit back to L1
    const commitTx = await program.methods
      .undelegatePoll()
      .rpc();
  });
});
```

### Test Execution
```bash
# Run all tests
anchor test

# Run specific test file
anchor test -- --grep "poll"

# Test with console logs
anchor test -- --verbose
```

## 📚 Smart Contract Reference

### Core Instructions

#### Channel Management
- `initialize()` - Initialize the program
- `create_channel()` - Create a new channel with token requirements
- `join_channel()` - Join a channel by paying required tokens
- `update_channel()` - Modify channel settings (creator only)
- `delete_channel()` - Remove a channel (creator only)
- `leave_channel()` - Leave a channel and forfeit membership

#### User Management
- `create_profile()` - Create user profile with display name and bio
- `get_profile()` - Retrieve user profile information

#### Governance
- `create_poll()` - Create governance polls for community decisions
- `vote_poll()` - Cast votes on active polls
- `end_poll()` - End voting period and execute results
- `delegate_poll()` - Delegate voting rights to another user

#### Administration
- `set_platform_fee()` - Update platform fee percentage (admin only)
- `set_fee_recipient()` - Set fee recipient address (admin only)
- `withdraw()` - Withdraw accumulated fees (admin only)

### Account Structures

#### Channel
```rust
pub struct Channel {
    pub id: u64,
    pub name: String,           // Max 64 chars
    pub description: String,    // Max 512 chars
    pub cost: u64,             // Entry price in lamports
    pub creator: Pubkey,       // Channel creator
    pub is_private: bool,      // Private/public flag
    pub member_count: u64,     // Current members
    pub created_at: i64,       // Creation timestamp
    pub updated_at: i64,       // Last update
    pub img_url: String,       // Channel image URL
    pub poll_count: u64,       // Number of polls created
}
```

#### Profile
```rust
pub struct Profile {
    pub owner: Pubkey,         // Wallet address
    pub display_name: String,  // User nickname
    pub bio: String,          // User description
    pub avatar_uri: String,   // Profile picture URL
    pub created_at: i64,      // Creation timestamp
}
```

#### Poll
```rust
pub struct Poll {
    pub channel_id: u64,      // Associated channel
    pub creator: Pubkey,      // Poll creator
    pub poll_question: String, // Question text
    pub poll_type: u8,        // 0=kick, 1=mute, 2=general
    pub options: Vec<String>, // Voting options
    pub votes: Vec<u64>,      // Vote counts
    pub total_votes: u64,     // Total votes cast
    pub start_time: i64,      // Voting start
    pub end_time: i64,        // Voting end
    pub target: Option<Pubkey>, // Target for moderation polls
    pub voted: Vec<Pubkey>,   // Users who voted
    pub ended: bool,          // Poll status
}
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and formatting
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)

## 🆘 Support

For support and questions:
- Open an issue on GitHub
- Join our Discord community
- Check the documentation wiki

---

Built with ❤️ on Solana by the Shipyard team.