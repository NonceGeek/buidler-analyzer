// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CommunityVerifier {

    struct Vote {
        address[] agreeVoters;
        address[] denyVoters;
        address newMemberAddress;
        uint256 deadline;
        string aiSuggestion;
        uint256 agreeCount;
        uint256 denyCount;
    }

    mapping(uint256 => Vote) public votes;
    uint256 public voteCount;
    address[] public members;

    event VoteCreated(uint256 voteId, address newMemberAddress, uint256 deadline, string aiSuggestion);
    event VoteCast(uint256 voteId, address voter, bool agree);
    event NewMemberAdded(address newMember);

    constructor(address[] memory _initialMembers) {
        initializeMembers(_initialMembers);
    }

    function initializeMembers(address[] memory _initialMembers) private {
        require(members.length == 0, "Members already initialized");
        for (uint256 i = 0; i < _initialMembers.length; i++) {
            members.push(_initialMembers[i]);
        }
    }

    function createVote(address _newMemberAddress, string memory _aiSuggestion) public {
        require(isMember(msg.sender), "Only members can create votes");
        uint256 deadline = block.timestamp + 7 days;
        voteCount++;
        votes[voteCount] = Vote(new address[](0), new address[](0), _newMemberAddress, deadline, _aiSuggestion, 0, 0);
        emit VoteCreated(voteCount, _newMemberAddress, deadline, _aiSuggestion);
    }

    function castVote(uint256 _voteId, bool _agree) public {
        require(isMember(msg.sender), "Only members can vote");
        require(block.timestamp < votes[_voteId].deadline, "Voting period has ended");
        require(!hasVoted(_voteId, msg.sender), "Member has already voted");

        if (_agree) {
            votes[_voteId].agreeVoters.push(msg.sender);
            votes[_voteId].agreeCount++;
        } else {
            votes[_voteId].denyVoters.push(msg.sender);
            votes[_voteId].denyCount++;
        }

        emit VoteCast(_voteId, msg.sender, _agree);
    }

    function finalizeVote(uint256 _voteId) public {
        require(block.timestamp >= votes[_voteId].deadline, "Voting period has not ended");
        require(votes[_voteId].newMemberAddress != address(0), "Vote does not exist");

        if (votes[_voteId].agreeCount > votes[_voteId].denyCount) {
            members.push(votes[_voteId].newMemberAddress);
            emit NewMemberAdded(votes[_voteId].newMemberAddress);
        }

        delete votes[_voteId];
    }

    function isMember(address _address) public view returns (bool) {
        for (uint256 i = 0; i < members.length; i++) {
            if (members[i] == _address) {
                return true;
            }
        }
        return false;
    }

    function hasVoted(uint256 _voteId, address _voter) internal view returns (bool) {
        for (uint256 i = 0; i < votes[_voteId].agreeVoters.length; i++) {
            if (votes[_voteId].agreeVoters[i] == _voter) {
                return true;
            }
        }
        for (uint256 i = 0; i < votes[_voteId].denyVoters.length; i++) {
            if (votes[_voteId].denyVoters[i] == _voter) {
                return true;
            }
        }
        return false;
    }
}
