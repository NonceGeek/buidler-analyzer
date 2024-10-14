// 10: [
//   {
//     chainId: "10",
//     name: "Optimism",
//     contracts: {
//       // Hint: config here.
//       CommunityVerifier: {
//         address: "0x505d9Ae884AC1A7f243152A24E0A1Cbd1d04Cc6C",
const contracts = {
  10: [
    {
      chainId: "10",
      name: "Optimism",
      contracts: {
        // Hint: config here.
        CommunityVerifier: {
          address: "0x13C47E3b65Ff6d945cb49AE335EE068b30854b10",

          abi: [
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "_voteId",
                  type: "uint256",
                },
                {
                  internalType: "bool",
                  name: "_agree",
                  type: "bool",
                },
              ],
              name: "castVote",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "address",
                  name: "_newMemberAddress",
                  type: "address",
                },
                {
                  internalType: "string",
                  name: "_aiSuggestion",
                  type: "string",
                },
              ],
              name: "createVote",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "_voteId",
                  type: "uint256",
                },
              ],
              name: "finalizeVote",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "address[]",
                  name: "_initialMembers",
                  type: "address[]",
                },
              ],
              stateMutability: "nonpayable",
              type: "constructor",
            },
            {
              anonymous: false,
              inputs: [
                {
                  indexed: false,
                  internalType: "address",
                  name: "newMember",
                  type: "address",
                },
              ],
              name: "NewMemberAdded",
              type: "event",
            },
            {
              anonymous: false,
              inputs: [
                {
                  indexed: false,
                  internalType: "uint256",
                  name: "voteId",
                  type: "uint256",
                },
                {
                  indexed: false,
                  internalType: "address",
                  name: "voter",
                  type: "address",
                },
                {
                  indexed: false,
                  internalType: "bool",
                  name: "agree",
                  type: "bool",
                },
              ],
              name: "VoteCast",
              type: "event",
            },
            {
              anonymous: false,
              inputs: [
                {
                  indexed: false,
                  internalType: "uint256",
                  name: "voteId",
                  type: "uint256",
                },
                {
                  indexed: false,
                  internalType: "address",
                  name: "newMemberAddress",
                  type: "address",
                },
                {
                  indexed: false,
                  internalType: "uint256",
                  name: "deadline",
                  type: "uint256",
                },
                {
                  indexed: false,
                  internalType: "string",
                  name: "aiSuggestion",
                  type: "string",
                },
              ],
              name: "VoteCreated",
              type: "event",
            },
            {
              inputs: [
                {
                  internalType: "address",
                  name: "_address",
                  type: "address",
                },
              ],
              name: "isMember",
              outputs: [
                {
                  internalType: "bool",
                  name: "",
                  type: "bool",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "",
                  type: "uint256",
                },
              ],
              name: "members",
              outputs: [
                {
                  internalType: "address",
                  name: "",
                  type: "address",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
            {
              inputs: [],
              name: "membersCount",
              outputs: [
                {
                  internalType: "uint256",
                  name: "",
                  type: "uint256",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
            {
              inputs: [],
              name: "voteCount",
              outputs: [
                {
                  internalType: "uint256",
                  name: "",
                  type: "uint256",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "",
                  type: "uint256",
                },
              ],
              name: "votes",
              outputs: [
                {
                  internalType: "address",
                  name: "newMemberAddress",
                  type: "address",
                },
                {
                  internalType: "uint256",
                  name: "deadline",
                  type: "uint256",
                },
                {
                  internalType: "string",
                  name: "aiSuggestion",
                  type: "string",
                },
                {
                  internalType: "uint256",
                  name: "agreeCount",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "denyCount",
                  type: "uint256",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
          ],
        },
      },
    },
  ],
} as const;

export default contracts;
