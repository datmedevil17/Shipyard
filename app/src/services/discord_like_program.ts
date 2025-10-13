/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/discord_like_program.json`.
 */
export type DiscordLikeProgram = {
  "address": "2QZ6YQeJmAfg6iWe76amzgfEHZsGBUXtC41a4reCiqPC",
  "metadata": {
    "name": "discordLikeProgram",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "createChannel",
      "discriminator": [
        37,
        105,
        253,
        99,
        87,
        46,
        223,
        20
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "channel",
          "writable": true
        },
        {
          "name": "membership",
          "writable": true
        },
        {
          "name": "nftMint",
          "docs": [
            "Mint will be created via CPI"
          ],
          "writable": true
        },
        {
          "name": "nftTokenAccount",
          "docs": [
            "Token account will be created via CPI"
          ],
          "writable": true
        },
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "cost",
          "type": "u64"
        },
        {
          "name": "isPrivate",
          "type": "bool"
        },
        {
          "name": "imgUrl",
          "type": "string"
        }
      ]
    },
    {
      "name": "createProfile",
      "discriminator": [
        225,
        205,
        234,
        143,
        17,
        186,
        50,
        220
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "displayName",
          "type": "string"
        },
        {
          "name": "bio",
          "type": "string"
        },
        {
          "name": "avatarUri",
          "type": "string"
        }
      ]
    },
    {
      "name": "deleteChannel",
      "discriminator": [
        145,
        225,
        187,
        221,
        157,
        142,
        114,
        133
      ],
      "accounts": [
        {
          "name": "channel",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  110,
                  110,
                  101,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "channelId"
              }
            ]
          }
        },
        {
          "name": "creator",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "channelId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "getProfile",
      "discriminator": [
        85,
        133,
        144,
        124,
        215,
        255,
        164,
        144
      ],
      "accounts": [
        {
          "name": "profile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "joinChannel",
      "discriminator": [
        124,
        39,
        115,
        89,
        217,
        26,
        38,
        29
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "channel",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  110,
                  110,
                  101,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "channelId"
              }
            ]
          }
        },
        {
          "name": "membership",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114,
                  115,
                  104,
                  105,
                  112
                ]
              },
              {
                "kind": "arg",
                "path": "channelId"
              },
              {
                "kind": "account",
                "path": "member"
              }
            ]
          }
        },
        {
          "name": "nftMint",
          "docs": [
            "Mint will be created via CPI"
          ],
          "writable": true
        },
        {
          "name": "nftTokenAccount",
          "docs": [
            "Token account will be created via CPI"
          ],
          "writable": true
        },
        {
          "name": "member",
          "writable": true,
          "signer": true
        },
        {
          "name": "creator",
          "writable": true
        },
        {
          "name": "feeRecipient",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "channelId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "leaveChannel",
      "discriminator": [
        104,
        0,
        75,
        134,
        95,
        80,
        68,
        186
      ],
      "accounts": [
        {
          "name": "channel",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  110,
                  110,
                  101,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "channelId"
              }
            ]
          }
        },
        {
          "name": "membership",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114,
                  115,
                  104,
                  105,
                  112
                ]
              },
              {
                "kind": "arg",
                "path": "channelId"
              },
              {
                "kind": "account",
                "path": "member"
              }
            ]
          }
        },
        {
          "name": "member",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "channelId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setFeeRecipient",
      "discriminator": [
        227,
        18,
        215,
        42,
        237,
        246,
        151,
        66
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "owner",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "newRecipient",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "setPlatformFee",
      "discriminator": [
        19,
        70,
        111,
        182,
        156,
        58,
        208,
        203
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "owner",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "newFee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateChannel",
      "discriminator": [
        75,
        204,
        94,
        165,
        60,
        180,
        193,
        217
      ],
      "accounts": [
        {
          "name": "channel",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  110,
                  110,
                  101,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "channelId"
              }
            ]
          }
        },
        {
          "name": "creator",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "channelId",
          "type": "u64"
        },
        {
          "name": "name",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "description",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "cost",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "isPrivate",
          "type": {
            "option": "bool"
          }
        }
      ]
    },
    {
      "name": "withdraw",
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "recipient",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "channel",
      "discriminator": [
        49,
        159,
        99,
        106,
        220,
        87,
        219,
        88
      ]
    },
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "membership",
      "discriminator": [
        231,
        141,
        180,
        98,
        109,
        168,
        175,
        166
      ]
    },
    {
      "name": "profile",
      "discriminator": [
        184,
        101,
        165,
        188,
        95,
        63,
        127,
        188
      ]
    }
  ],
  "events": [
    {
      "name": "channelCreated",
      "discriminator": [
        32,
        4,
        161,
        165,
        148,
        144,
        56,
        139
      ]
    },
    {
      "name": "channelDeleted",
      "discriminator": [
        218,
        16,
        90,
        154,
        84,
        209,
        182,
        75
      ]
    },
    {
      "name": "channelJoined",
      "discriminator": [
        125,
        243,
        249,
        151,
        9,
        21,
        57,
        117
      ]
    },
    {
      "name": "channelLeft",
      "discriminator": [
        151,
        18,
        183,
        105,
        104,
        244,
        83,
        6
      ]
    },
    {
      "name": "channelUpdated",
      "discriminator": [
        161,
        182,
        72,
        128,
        204,
        10,
        62,
        243
      ]
    },
    {
      "name": "configInitialized",
      "discriminator": [
        181,
        49,
        200,
        156,
        19,
        167,
        178,
        91
      ]
    },
    {
      "name": "feeRecipientUpdated",
      "discriminator": [
        24,
        150,
        233,
        92,
        169,
        221,
        233,
        244
      ]
    },
    {
      "name": "platformFeeUpdated",
      "discriminator": [
        210,
        134,
        201,
        4,
        92,
        228,
        80,
        26
      ]
    },
    {
      "name": "withdraw",
      "discriminator": [
        192,
        241,
        201,
        217,
        70,
        150,
        90,
        247
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "alreadyInitialized",
      "msg": "Program is already initialized"
    },
    {
      "code": 6001,
      "name": "channelNameTooLong",
      "msg": "Channel name is too long"
    },
    {
      "code": 6002,
      "name": "channelDescriptionTooLong",
      "msg": "Channel description is too long"
    },
    {
      "code": 6003,
      "name": "invalidChannelCost",
      "msg": "Invalid channel cost amount"
    },
    {
      "code": 6004,
      "name": "channelNotFound",
      "msg": "Channel not found"
    },
    {
      "code": 6005,
      "name": "alreadyJoined",
      "msg": "User has already joined this channel"
    },
    {
      "code": 6006,
      "name": "insufficientFunds",
      "msg": "Insufficient funds to join channel"
    },
    {
      "code": 6007,
      "name": "unauthorizedChannelUpdate",
      "msg": "Only channel creator can update channel"
    },
    {
      "code": 6008,
      "name": "unauthorizedOwner",
      "msg": "Only program owner can perform this action"
    },
    {
      "code": 6009,
      "name": "platformFeeExceedsMaximum",
      "msg": "Platform fee cannot exceed maximum allowed percentage"
    },
    {
      "code": 6010,
      "name": "invalidWithdrawalAmount",
      "msg": "Invalid withdrawal amount"
    },
    {
      "code": 6011,
      "name": "membershipNotFound",
      "msg": "Membership not found"
    },
    {
      "code": 6012,
      "name": "notChannelMember",
      "msg": "User is not a member of this channel"
    },
    {
      "code": 6013,
      "name": "privateChannel",
      "msg": "Channel is private"
    },
    {
      "code": 6014,
      "name": "arithmeticOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6015,
      "name": "transferFailed",
      "msg": "Transfer failed"
    }
  ],
  "types": [
    {
      "name": "channel",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "cost",
            "type": "u64"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "isPrivate",
            "type": "bool"
          },
          {
            "name": "memberCount",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          },
          {
            "name": "imgUrl",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "channelCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "channelId",
            "type": "u64"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "cost",
            "type": "u64"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "isPrivate",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "nftMint",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "channelDeleted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "channelId",
            "type": "u64"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "deletedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "channelJoined",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "channelId",
            "type": "u64"
          },
          {
            "name": "member",
            "type": "pubkey"
          },
          {
            "name": "cost",
            "type": "u64"
          },
          {
            "name": "platformFeeAmount",
            "type": "u64"
          },
          {
            "name": "creatorAmount",
            "type": "u64"
          },
          {
            "name": "nftMint",
            "type": "pubkey"
          },
          {
            "name": "joinedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "channelLeft",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "channelId",
            "type": "u64"
          },
          {
            "name": "member",
            "type": "pubkey"
          },
          {
            "name": "leftAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "channelUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "channelId",
            "type": "u64"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "updatedFields",
            "type": "string"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "initialized",
            "type": "bool"
          },
          {
            "name": "totalChannels",
            "type": "u64"
          },
          {
            "name": "platformFee",
            "type": "u64"
          },
          {
            "name": "feeRecipient",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "configInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "platformFee",
            "type": "u64"
          },
          {
            "name": "feeRecipient",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "feeRecipientUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "oldRecipient",
            "type": "pubkey"
          },
          {
            "name": "newRecipient",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "membership",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "channelId",
            "type": "u64"
          },
          {
            "name": "member",
            "type": "pubkey"
          },
          {
            "name": "joined",
            "type": "bool"
          },
          {
            "name": "joinedAt",
            "type": "i64"
          },
          {
            "name": "nftMint",
            "type": {
              "option": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "platformFeeUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "oldFee",
            "type": "u64"
          },
          {
            "name": "newFee",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "profile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "displayName",
            "type": "string"
          },
          {
            "name": "bio",
            "type": "string"
          },
          {
            "name": "avatarUri",
            "type": "string"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "withdraw",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
