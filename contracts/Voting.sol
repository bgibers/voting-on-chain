//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Voting is Ownable{
    bytes32 public currentProposal;
    uint public votedCount; // how many users have voted on the proposal
    uint public voterCount; // how many voters exist
    uint public timeToVote = 1 minutes;

    address [] public voters;
    mapping(address => bool) public votersVotedMap; // Map of all users allowed to vote and whether or not they voted
    mapping(bytes32 => Proposal) public proposals;

    struct Proposal {
        bytes32 proposalId; // unique id of proposal
        uint votesFor; // # of voters in favor
        uint vetoVotes; // # of voters against
        uint proposedTimestamp; // The timestamp when proposal was made
        string proposal; // The message the user sent.
        bool isFinished; 
    }

    constructor() {
        votedCount = 0;
        voterCount = 0;
        currentProposal = 0;
    }

    /*
        Create a new proposal if the previous has finished. 
    */
    function createProposal(bytes32 proposalUuid, string memory proposal, uint timeToVoteInMins) public onlyOwner {
        require(isCurrentProposalFinished(), "There is still a proposal underway");
        require(proposals[currentProposal].proposalId < 0, "The proposal id must be unique");

        proposals[currentProposal] = Proposal({
            proposalId: proposalUuid,
            votesFor: 0,
            vetoVotes: 0,
            proposedTimestamp: block.timestamp,
            proposal: proposal,
            isFinished: false
        });

        setProposalTime(timeToVoteInMins);
    }

    /*
       Change the duration that the vote is alive
    */
    function setProposalTime(uint timeInMinutes) public onlyOwner {
        timeToVote = (timeInMinutes * 1 minutes);
    }

    /*
        Give a user voting privledges
    */
    function addVoter(address voter) public onlyOwner {
        voters.push(voter);
        votersVotedMap[voter] = false;
        voterCount++;
    }

    function vote(bool voteToPassProposal) public {
        require(votersVotedMap[msg.sender] == false, "User has already voted on this proposal");
        require(!isCurrentProposalFinished(), "There currently isn't anything to vote on");

        if (voteToPassProposal) {
            proposals[currentProposal].votesFor++;
        } else {
            proposals[currentProposal].vetoVotes++;
        }

        votedCount++;
        votersVotedMap[msg.sender] = true;
    }
    
    /*
        Checks if the current proposal has ended.
        If it has then we reset voted count as well as the votedMapping
    */
    function isCurrentProposalFinished() public returns(bool) {
        // check if all voters have voted and that the proposal hasn't expired
        if (votedCount != voterCount && (proposals[currentProposal].proposedTimestamp  + timeToVote) < block.timestamp) {
            return false;
        } else if (!proposals[currentProposal].isFinished) {
            proposals[currentProposal].isFinished = true;
            votedCount = 0;

            // reset all voter to vote map to false
            for (uint i=0; i< voterCount ; i++){
                votersVotedMap[voters[i]] = false;
            }     

            return true;       
        } else {
            return true;
        }
    }

    function currentVotesFor() external view returns(uint) {
        return proposals[currentProposal].votesFor;
    }

    function currentVetosFor() external view returns(uint) {
        return proposals[currentProposal].vetoVotes;
    }

    function didProposalPass(bytes32 proposalName) external view returns(bool) {
        return proposals[proposalName].vetoVotes < proposals[proposalName].votesFor;
    }
}
