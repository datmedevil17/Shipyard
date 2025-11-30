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

## 🛠️ Technical Stack

### Blockchain
- **Solana**: High-performance blockchain platform
- **Anchor**: Rust framework for Solana programs
- **SPL Token**: Token standard for access control
- **Web3.js**: JavaScript SDK for Solana interaction

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component library
- **Solana Wallet Adapter**: Multi-wallet support

### Backend
- **Node.js**: Server runtime
- **Express**: Web framework
- **Socket.io**: Real-time bidirectional communication
- **CORS**: Cross-origin resource sharing

### Development Tools
- **Prettier**: Code formatting
- **Biome**: Fast JavaScript toolchain
- **Concurrently**: Run multiple scripts simultaneously
- **ts-mocha**: TypeScript testing framework

## 📦 Installation & Setup

### Prerequisites
- Node.js v18+ and npm/yarn
- Rust and Cargo
- Solana CLI tools
- Anchor CLI v0.31.0+

### 1. Clone the Repository
```bash
git clone <repository-url>
cd shipyard
```

### 2. Install Dependencies

**Root dependencies (Anchor/Testing):**
```bash
npm install
```

**Frontend dependencies:**
```bash
cd app
npm install
```

### 3. Environment Setup

Create `.env.local` in the `app/` directory:
```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=2QZ6YQeJmAfg6iWe76amzgfEHZsGBUXtC41a4reCiqPC
```

### 4. Build and Deploy Smart Contract
```bash
# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### 5. Start Development Environment
```bash
# Start both frontend and backend
cd app
npm run dev:all
```

This will start:
- Next.js frontend on `http://localhost:3002`
- Socket.io server on `http://localhost:3001`

## 🎮 Usage Guide

### Getting Started
1. **Connect Wallet**: Click "Connect Wallet" and choose your preferred Solana wallet
2. **Create Profile**: Set up your display name, bio, and avatar
3. **Browse Channels**: View available channels and their entry requirements
4. **Join Channels**: Pay the required tokens to access premium channels
5. **Start Chatting**: Participate in real-time conversations

### Creating Channels
1. Navigate to channel creation
2. Set channel name, description, and image
3. Configure access requirements (free or token-gated)
4. Set pricing in SOL or custom tokens
5. Deploy and start building your community

### Governance Participation
1. View active polls in channels you've joined
2. Vote on proposals using your tokens
3. Create new polls for community decisions
4. Delegate voting rights to trusted members

## 🧪 Testing

### Smart Contract Tests
```bash
# Run Anchor tests
anchor test
```

### Frontend Tests
```bash
cd app
npm run lint
npm run build
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